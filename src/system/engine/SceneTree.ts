import type { TweenBase } from "./Tween";
import { Clock } from "../utils/Clock";
import { ShortCutActionMap } from "./inputs/InputActionMap";
import { Singletion } from "./singletions/Singletion";
import { Node, Viewport } from "./nodes/Node";
import type { World3D } from "./worlds/world3ds/World3D";
import { RenderServer3D } from "./render_server/RenderServer";

const arr = new Array(10000);

export class SceneTree {
    private readonly input_action_map: ShortCutActionMap = new ShortCutActionMap();
    private readonly root: Node;
    private readonly clock: Clock = new Clock();
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

    private readonly node_queued_free: Set<Node> = new Set();

    constructor(root: Node, physics_fps: number = 60) {
        if (root.get_Parent() !== undefined || root.ready) throw new Error('root is invalid');
        this.root = root;
        this.root.set_SceneTree(this);
        this.physics_fps = physics_fps;
    }

    public notify_TreeChange() {
    }

    private _loop_func = this.loop.bind(this);
    private loop() {
        this.clock.tick();
        this.time = this.clock.duration;
        this.delta = this.clock.delta;
        this.frame_id++;
        // internal process process
        this.root.propagate_Process(this.delta);
        this.process_Tween(this.delta);
        this.root.propagate_InternalAfterProcess(this.delta);
        for (const viewport of this.viewports) {
            viewport.before_InternalBeforeRender();
        }
        this.root.propagate_InternalBeforeRender(this.delta);
        // render server resize
        RenderServer3D.set_PixelRatio(window.devicePixelRatio);
        RenderServer3D.set_Size(window.innerWidth, window.innerHeight);
        const worlds = new Set<World3D>();
        for (const viewport of this.viewports) {
            const world = viewport.get_World3D();
            if (world !== undefined) worlds.add(world);
        }
        for (const world of worlds) {
            world.trigger_BeforeRender(this);
        }
        for (const viewport of [...this.viewports].sort((a, b) => a.render_priority - b.render_priority)) {
            viewport.render();
        }
        // queue free
        for (const node of this.node_queued_free) {
            const parent = node.get_Parent();
            if (parent !== this.root) {
                parent?.remove_Child(node);
                node.free();
            }
        }
        this.node_queued_free.clear();
        // next frame
        this.animation_requested = requestAnimationFrame(this._loop_func);
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
        this.physics_time = this.physics_clock.duration;
        this.physics_delta = this.physics_clock.delta;
        // internal physics process process
        this.root.propagate_PhysicsProcess(this.physics_delta);
        this.root.propagate_InternalAfterPhysicsProcess(this.physics_delta);
    }

    // apis

    public register_Singleton(singletion: typeof Singletion) {
        const name = singletion.singleton_name;
        if (this.singletions.has(name)) throw new Error(`singleton ${name} already existed`);
        this.singletions.set(name, new singletion());
    }

    public unregister_Singleton(singletion: typeof Singletion) {
        const name = singletion.singleton_name;
        if (this.singletions.has(name)) this.singletions.delete(name);
    }

    public get_Singleton<T extends typeof Singletion>(singletion: T): InstanceType<T> | undefined {
        return this.singletions.get(singletion.singleton_name) as InstanceType<T> | undefined;
    }

    public queue_Free(node: Node) {
        if (!node.is_inside_tree) throw new Error('can not queue free node which is not inside scene tree');
        this.node_queued_free.add(node);
    }

    public is_QueuedFreed(node: Node) {
        return this.node_queued_free.has(node);
    }

    public get_InputActionMap() {
        return this.input_action_map;
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
        this.physics_requested = setInterval(this._physics_loop_func, 1000 / this.physics_fps);
        requestAnimationFrame(this._loop_func);
    }

    public stop_Loop() {
        if (this.looping) {
            cancelAnimationFrame(this.animation_requested!);
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
        }
    }

    public stop_Tween(tween: TweenBase) {
        if (this.tweens.has(tween)) {
            tween.stop();
            this.tweens.delete(tween);
        }
    }
}