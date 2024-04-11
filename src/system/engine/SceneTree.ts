import type { TweenBase } from "./Tween";
import { Clock } from "../utils/Clock";
import { ShortCutActionMap } from "./inputs/InputActionMap";
import { Singletion } from "./singletions/Singletion";
import { Node, Viewport } from "./nodes/Node";
import type { World3D } from "./worlds/world3ds/World3D";
import { ConfiguredObject, type Config } from "./ConfiguredObject";
import { Ref } from "../utils/RefCounted";
import { clearAnimationInterval, setAnimationInterval } from "../utils/AnimationInterval";

export class SceneTree extends ConfiguredObject {
    private readonly input_action_map: Ref<ShortCutActionMap> = new Ref(new ShortCutActionMap(this.config));
    private readonly root: Node;
    private readonly clock: Clock = new Clock();
    private readonly fps: number;
    private readonly physics_fps: number;
    private readonly physics_clock: Clock = new Clock();
    public frame_id: number = 0;
    private animation_requested: number | undefined = undefined;
    private physics_requested: number | undefined = undefined;
    public get looping() { return this.animation_requested !== undefined; }
    public time: number = 0;
    public delta: number = 0;
    public physics_time: number = 0;
    public physics_delta: number = 0;

    private readonly singletions: Map<string, Singletion> = new Map();

    private readonly tweens: Set<TweenBase> = new Set();
    public get tween_processing_count() { return this.tweens.size; }

    private readonly viewports: Set<Viewport> = new Set();

    private readonly linked_trees: Set<SceneTree> = new Set();

    private readonly node_queued_free: Set<Node> = new Set();

    constructor(config: Config, root: Node) {
        super(config);
        if (root.get_Parent() !== undefined || root.ready) throw new Error('<SceneTree> constructor: root is invalid');
        this.root = root;
        this.root.set_SceneTree(this);
        this.fps = this.config.fps;
        this.physics_fps = this.config.physics_fps;
    }

    public notify_TreeChange() { }

    private _loop_func = this.loop.bind(this);
    private loop() {
        this.clock.tick();
        this.process_Loop(this.clock.duration, this.clock.delta, this.frame_id + 1);
    }

    private current_viewport: Viewport | undefined = undefined;
    private process_Loop(time: number, delta: number, frame_id: number) {
        this.time = time;
        this.delta = delta;
        this.frame_id = frame_id;
        // console.log("fps: ", (1 / this.delta).toFixed(2));
        // render server resize
        this.config.render_server.set_PixelRatio(this.config.render_server_pixel_ratio, this.config.render_server_scale);
        if (this.config.render_server_size) {
            this.config.render_server.set_Size(this.config.render_server_size.x, this.config.render_server_size.y);
        }
        else {
            this.config.render_server.set_Size(window.innerWidth, window.innerHeight);
        }
        // internal process process
        this.root.propagate_Process(this.delta);
        this.process_Tween(this.delta);
        this.root.propagate_InternalAfterProcess(this.delta);
        for (const viewport of this.viewports) {
            viewport.trigger_BeforeRender();
            const world = viewport.world_3d;
            if (world !== undefined) world.trigger_BeforeRender(this);
        }
        let redundant_before_render = false;
        for (const viewport of [...this.viewports].sort((a, b) => {
            const a_p = a.render_priority, b_p = b.render_priority;
            if (a_p < b_p) return -1;
            if (a_p > b_p) return 1;
            const a_m = a.get_Input().is_mouse_inside, b_m = b.get_Input().is_mouse_inside;
            if (a_m) return 1;
            if (b_m) return -1;
            return 0;
        })) {
            this.current_viewport = viewport;
            this.root.propagate_InternalBeforeRender(this.delta, redundant_before_render);
            viewport.render();
            this.current_viewport = undefined;
            redundant_before_render = true;
        }
        // queue free
        for (const node of this.node_queued_free) {
            if (node !== this.root) {
                node.get_Parent()?.remove_Child(node);
                node.free();
            }
        }
        this.node_queued_free.clear();
        // loop linked trees
        for (const tree of this.linked_trees) {
            tree.process_Loop(time, delta, frame_id);
        }
    }

    private process_Tween(delta: number) {
        for (const tween of [...this.tweens]) {
            tween.process(delta);
            if (tween.finished) {
                this.tweens.delete(tween);
            }
        }
    }

    private _physics_loop_func = this.physics_loop.bind(this);
    private physics_loop() {
        this.physics_clock.tick();
        this.process_PhysicsLoop(this.physics_clock.duration, this.physics_clock.delta);
    }

    private process_PhysicsLoop(time: number, delta: number) {
        this.physics_time = time;
        this.physics_delta = delta;
        // internal physics process process
        this.root.propagate_PhysicsProcess(this.physics_delta);
        this.root.propagate_InternalAfterPhysicsProcess(this.physics_delta);
        // loop linked trees
        for (const tree of this.linked_trees) {
            tree.process_PhysicsLoop(time, delta);
        }
    }

    // apis

    public register_Singleton(singletion: new (config: Config, scene_tree: SceneTree) => Singletion) {
        const name = (singletion as typeof Singletion).singleton_name;
        if (this.singletions.has(name)) return;
        this.singletions.set(name, new singletion(this.config, this));
    }

    public unregister_Singleton(singletion: typeof Singletion) {
        const name = singletion.singleton_name;
        if (this.singletions.has(name)) {
            this.singletions.get(name)!.dispose();
            this.singletions.delete(name);
        }
    }

    public get_Singleton<T extends typeof Singletion>(singletion: T): InstanceType<T> | undefined {
        return this.singletions.get(singletion.singleton_name) as InstanceType<T> | undefined;
    }

    public clear_Singletons() {
        for (const [name, singletion] of [...this.singletions.entries()]) {
            singletion.dispose();
            this.singletions.delete(name);
        }
    }

    public add_LinkedTree(tree: SceneTree) {
        this.linked_trees.add(tree);
    }

    public remove_LinkedTree(tree: SceneTree) {
        this.linked_trees.delete(tree);
    }

    public clear_LinkedTree() {
        this.linked_trees.clear();
    }

    public queue_Free(node: Node) {
        if (!node.is_inside_tree) throw new Error('<SceneTree> queue_Free: can not queue free node which is not inside scene tree');
        if (node === this.root) throw new Error('<SceneTree> queue_Free: root not can not be freeed');
        this.node_queued_free.add(node);
    }

    public is_QueuedFreed(node: Node) {
        return this.node_queued_free.has(node);
    }

    public get_InputActionMap() {
        return this.input_action_map.expect;
    }

    public get_RenderingViewport() {
        return this.current_viewport;
    }

    public get_ActiveViewports(): Viewport[] {
        return [...this.viewports].filter(v => v.get_Input().is_mouse_inside);
    }

    public add_Viewport(viewport: Viewport) {
        this.viewports.add(viewport);
    }

    public remove_Viewport(viewport: Viewport) {
        this.viewports.delete(viewport);
    }

    public start_Loop() {
        if (this.looping) return;
        this.clock.start();
        this.physics_clock.start();
        setAnimationInterval(this._loop_func, Math.floor(1000 / this.fps));
        if (this.physics_fps > 0) {
            this.physics_requested = setInterval(this._physics_loop_func, 1000 / this.physics_fps);
        }
    }

    public stop_Loop() {
        if (this.looping) {
            clearAnimationInterval(this.animation_requested);
            clearInterval(this.physics_requested);
            this.animation_requested = undefined;
            this.physics_requested = undefined;
            this.clock.stop();
            this.time = 0;
            this.delta = 0;
            this.physics_clock.stop();
            this.physics_time = 0;
            this.physics_delta = 0;
        }
    }

    public get_Root() {
        return this.root;
    }

    public start_Tween(tween: TweenBase) {
        tween.start();
        if (!tween.finished) {
            this.tweens.add(tween);
            return tween;
        }
        return undefined;
    }

    public stop_Tween(tween: TweenBase) {
        if (this.tweens.has(tween)) {
            tween.stop();
            this.tweens.delete(tween);
        }
    }

    public clear_Tweens() {
        this.tweens.clear();
    }

    public dispose() {
        this.stop_Loop();
        this.clear_Tweens();
        this.node_queued_free.clear();
        for (const child of [...this.root.children]) {
            this.root.remove_Child(child);
            child.free();
        }
        this.root.set_SceneTree(undefined);
        this.root.free();
        this.clear_Singletons();
        this.clear_LinkedTree();
        this.input_action_map.clear();
    }
}