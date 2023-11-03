import { type Camera, Clock, Vector3, Euler, Matrix4, Matrix3, Quaternion, Vector2, Color, Raycaster } from "three";
import { SignalEmitter } from "../utils/SignalEmitter";
import { Rid, type RID } from "./Rid";
import { Renderer3D } from "./Renderer";
import { PickingOrder, PickingSide, RayPickingOption, World3D } from "./World";
import { InputActionMap, InputEvent, InputManager, MouseEnterLeaveInputEvent, MouseInputEvent, MouseMotionInputEvent, ViewportActionInputEventManager, ViewportKeyInputEventManager, ViewportMouseInputEventManager } from "./InputEvent";
import type { TweenBase } from "./Tween";
import { ClassBase } from "./ClassBase";
import type { PickingArea3D } from "./nodes/physics_3ds/PickingArea3D";

export class SceneTree {
    private readonly input_action_map: InputActionMap = new InputActionMap();
    private readonly root: Node;
    private readonly clock: Clock = new Clock(false);
    private readonly physics_fps: number;
    private readonly physics_clock: Clock = new Clock(false);
    public frame_id: number = 0;
    private animation_requested: number | undefined = undefined;
    private physics_requested: number | undefined = undefined;
    public get looping() { return this.animation_requested !== undefined; }
    public time: number = 0;
    public delta: number = 0;
    public physics_time: number = 0;
    public physics_delta: number = 0;

    private tweens: Set<TweenBase> = new Set();

    private viewports: Set<Viewport> = new Set();

    private node_queued_free: Set<Node> = new Set();

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
        this.time = this.clock.elapsedTime;
        this.delta = this.clock.getDelta();
        this.frame_id++;
        // internal process process
        this.root.propagate_InternalBeforeProcess(this.delta);
        this.root.propagate_Process(this.delta);
        this.process_Tween(this.delta);
        this.root.propagate_InternalAfterProcess(this.delta);
        for (const viewport of this.viewports) {
            viewport.before_InternalBeforeRender();
        }
        this.root.propagate_InternalBeforeRender(this.delta);
        for (const viewport of this.viewports) {
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
        this.physics_time = this.physics_clock.elapsedTime;
        this.physics_delta = this.physics_clock.getDelta();
        // internal physics process process
        this.root.propagate_InternalBeforePhysicsProcess(this.physics_delta);
        this.root.propagate_PhysicsProcess(this.physics_delta);
        this.root.propagate_InternalAfterPhysicsProcess(this.physics_delta);
    }

    // apis

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

export enum NodeNotification {
    ExitingTree,
    EnteredTree,
    ExitedTree,
    EnteredReady,
    Ready,
    InternalBeforeProcess,
    Process,
    InternalAfterProcess,
    InternalBeforePhysicsProcess,
    PhysicsProcess,
    InternalAfterPhysicsProcess,
    SetupCamera,
    InternalBeforeRender,
    Parented,
    Unparented,
    ChildAdded,
    ChildRemoving,
    ChildrenChanged,
    Dispose,
}

export class Node extends ClassBase {
    public static readonly class_name: string = "Node";

    public readonly rid: RID;
    public name: string | undefined;
    public get readable_name() { return this.name ?? this.rid; }

    private scenetree: SceneTree | undefined = undefined;
    private inside_tree: boolean = false;
    public get is_inside_tree() { return this.inside_tree; }
    private viewport: Viewport | undefined;

    private parent: Node | undefined = undefined;
    public readonly children: Node[] = [];
    private is_ready: boolean = false;
    public get ready() { return this.is_ready; }
    private first_time_ready: boolean = true;

    public block_input: boolean = false;

    // signals
    public readonly signal_exiting_tree: SignalEmitter<() => void> = new SignalEmitter();
    public readonly signal_entered_tree: SignalEmitter<() => void> = new SignalEmitter();
    public readonly signal_exited_tree: SignalEmitter<() => void> = new SignalEmitter();

    public readonly signal_child_added: SignalEmitter<(node: Node) => void> = new SignalEmitter();
    public readonly signal_child_removing: SignalEmitter<(node: Node) => void> = new SignalEmitter();

    public readonly signal_notification: SignalEmitter<(what: NodeNotification) => void> = new SignalEmitter();
    public readonly signal_ready: SignalEmitter<() => void> = new SignalEmitter();
    public readonly signal_input: SignalEmitter<(event: InputEvent, propagate: boolean) => void> = new SignalEmitter();
    public readonly signal_process: SignalEmitter<(delta: number) => void> = new SignalEmitter();
    public readonly signal_physics_process: SignalEmitter<(delta: number) => void> = new SignalEmitter();

    constructor() {
        super();
        this.rid = Rid();
    };

    // scene tree

    protected nofity(what: NodeNotification) {
        this._notification(what);
        this.signal_notification.trigger(what);
    }

    private propagate_SceneTreeExiting() {
        for (const child of this.children) {
            child.propagate_SceneTreeExiting();
        }
        // before exit tree
        this.nofity(NodeNotification.ExitingTree);
        this.signal_exiting_tree.trigger();
        this.viewport = undefined;
        this.inside_tree = false;
        this.is_ready = false;
        this.scenetree = undefined;
    }

    private propagate_SceneTreeEntering() {
        if (this.parent !== undefined) {
            this.scenetree = this.parent.scenetree;
        }
        if (this instanceof Viewport) {
            this.viewport = this;
        }
        if (this.viewport === undefined && this.parent !== undefined) {
            this.viewport = this.parent.viewport;
        }
        this.inside_tree = true;
        // entered tree
        this.nofity(NodeNotification.EnteredTree);
        this.signal_entered_tree.trigger();
        for (const child of this.children) {
            if (!child.inside_tree) {
                child.propagate_SceneTreeEntering();
            }
        }
    }

    private propagate_SceneTreeExited() {
        for (const child of this.children) {
            child.propagate_SceneTreeExited();
        }
        // exited tree
        this.nofity(NodeNotification.ExitedTree);
        this.signal_exited_tree.trigger();
    }

    public propagate_Ready() {
        this.is_ready = true;
        for (const child of this.children) {
            child.propagate_Ready();
        }
        this.nofity(NodeNotification.EnteredReady);
        if (this.first_time_ready) {
            this.first_time_ready = false;
            // ready
            this.nofity(NodeNotification.Ready);
            this._ready();
            this.signal_ready.trigger();
        }
    }

    public propagate_InternalBeforeProcess(delta: number) {
        for (const child of this.children) {
            child.propagate_InternalBeforeProcess(delta);
        }
        // internal before process
        this.nofity(NodeNotification.InternalBeforeProcess);
    }

    public propagate_Process(delta: number) {
        for (const child of this.children) {
            child.propagate_Process(delta);
        }
        // process
        this.nofity(NodeNotification.Process);
        this._process(delta);
        this.signal_process.trigger(delta);
    }

    public propagate_InternalAfterProcess(delta: number) {
        for (const child of this.children) {
            child.propagate_InternalAfterProcess(delta);
        }
        // internal before process
        this.nofity(NodeNotification.InternalAfterProcess);
    }

    public propagate_InternalBeforePhysicsProcess(delta: number) {
        for (const child of this.children) {
            child.propagate_InternalBeforePhysicsProcess(delta);
        }
        // internal before process
        this.nofity(NodeNotification.InternalBeforePhysicsProcess);
    }

    public propagate_PhysicsProcess(delta: number) {
        for (const child of this.children) {
            child.propagate_PhysicsProcess(delta);
        }
        // process
        this.nofity(NodeNotification.PhysicsProcess);
        this._physics_process(delta);
        this.signal_physics_process.trigger(delta);
    }

    public propagate_InternalAfterPhysicsProcess(delta: number) {
        for (const child of this.children) {
            child.propagate_InternalAfterPhysicsProcess(delta);
        }
        // internal before process
        this.nofity(NodeNotification.InternalAfterPhysicsProcess);
    }

    public propagate_InternalBeforeRender(delta: number) {
        // internal after process
        this.nofity(NodeNotification.InternalBeforeRender);
        for (const child of this.children) {
            child.propagate_InternalBeforeRender(delta);
        }
    }

    public set_SceneTree(scenetree: SceneTree | undefined) {
        if (this.scenetree === scenetree) return;
        const last_scenetree: SceneTree | undefined = this.scenetree;
        if (last_scenetree !== undefined) {
            // exit tree
            this.propagate_SceneTreeExiting();
        }
        this.scenetree = scenetree;
        if (this.scenetree !== undefined) {
            // enter tree
            this.propagate_SceneTreeEntering();
            if (this.parent === undefined || this.parent.is_ready) {
                // ready
                this.propagate_Ready();
            }
        }
        if (last_scenetree !== undefined) last_scenetree.notify_TreeChange();
        if (this.scenetree !== undefined) this.scenetree.notify_TreeChange();
    }

    private add_ChildInternal(node: Node) {
        if (node.parent === this) return;
        if (node === this) throw new Error("cannot add child to itself");
        if (node.parent !== undefined) throw new Error("cannot add child to node because it already has a parent");
        // check cyclic dependency
        this.children.unshift(node);
        node.parent = this;
        // node parent
        node.nofity(NodeNotification.Parented);
        this.nofity(NodeNotification.ChildAdded);
        this.signal_child_added.trigger(node);
        if (this.scenetree !== undefined) {
            node.set_SceneTree(this.scenetree);
        }
        // children changed
        this.nofity(NodeNotification.ChildrenChanged);
    }

    private remove_ChildInternal(node: Node) {
        const idx = this.get_ChildIndex(node);
        if (idx < 0) return;
        node.set_SceneTree(undefined);
        this.children.splice(idx, 1);
        this.nofity(NodeNotification.ChildRemoving);
        this.signal_child_removing.trigger(node);
        node.parent = undefined;
        // node unparent
        node.nofity(NodeNotification.Unparented);
        if (this.inside_tree) {
            node.propagate_SceneTreeExited();
        }
        // children changed siganl
        this.nofity(NodeNotification.ChildrenChanged);
    }

    private propagate_Dispose() {
        for (const child of this.children) {
            child.propagate_Dispose();
        }
        // dispose
        this.nofity(NodeNotification.Dispose);
        this._dispose();
    }

    private free_Internal() {
        if (this.is_inside_tree) throw new Error('cannot free a node when it is inside the scenetree');
        this.propagate_Dispose();
    }

    // node public apis

    public add_Child(node: Node) {
        this.add_ChildInternal(node);
    }

    public remove_Child(node: Node) {
        this.remove_ChildInternal(node);
    }

    public move_Child(node: Node, to: number) {
        const idx = this.get_ChildIndex(node);
        if (idx < 0) return;
        this.children.splice(idx, 1);
        this.children.splice(to, 0, node);
        this.nofity(NodeNotification.ChildrenChanged);
    }

    public has_Child(node: Node): boolean {
        return this.children.includes(node);
    }

    public get_ChildIndex(node: Node): number {
        return this.children.indexOf(node);
    }

    public get_Parent() {
        return this.parent;
    }

    public get_Index() {
        if (this.parent === undefined) return -1;
        return this.parent.get_ChildIndex(this);
    }

    public get_Viewport() {
        return this.viewport;
    }

    public get_SceneTree() {
        return this.scenetree;
    }

    public free() {
        this.free_Internal();
    }

    public queue_Free() {
        const scenetree = this.get_SceneTree();
        if (scenetree === undefined) throw new Error('can not queue free node since it is not inside tree');
        scenetree.queue_Free(this);
    }

    // scriptable

    public _dispose() {

    }

    public _notification(what: NodeNotification) {
        switch (what) {
            case NodeNotification.Dispose: {
                this.signal_exiting_tree.clear();
                this.signal_entered_tree.clear();
                this.signal_exited_tree.clear();
                this.signal_child_added.clear();
                this.signal_child_removing.clear();
                this.signal_notification.clear();
                this.signal_ready.clear();
                this.signal_input.clear();
                this.signal_process.clear();
                this.signal_physics_process.clear();
                break;
            }
        }
    }

    public _ready() {

    }

    public _input(event: InputEvent, propagate: boolean) {

    }

    public _process(delta: number) {

    }

    public _physics_process(delta: number) {

    }
}

export class Node3D extends Node {

    // local
    private readonly _local_position: Vector3 = new Vector3();
    private readonly _local_rotation: Euler = new Euler();
    private readonly _local_scale: Vector3 = new Vector3(1, 1, 1);

    public get local_position() {
        return this._local_position.clone();
    }
    public set local_position(position: Vector3) {
        this._local_position.copy(position);
        this.is_local_transform_dirty = true;
        this.propagate_TransformChanged();
    }
    public get local_rotation() {
        return this._local_rotation.clone();
    }
    public set local_rotation(rotation: Euler) {
        this._local_rotation.copy(rotation);
        this.is_local_transform_dirty = true;
        this.propagate_TransformChanged();
    }
    public get local_scale() {
        return this._local_scale.clone();
    }
    public set local_scale(scale: Vector3) {
        this._local_scale.copy(scale);
        this.is_local_transform_dirty = true;
        this.propagate_TransformChanged();
    }

    private _top_level: boolean = false;
    public get top_level(){return this._top_level;}
    public set top_level(top_level: boolean) {
        if (this._top_level !== top_level) {
            this._top_level = top_level;
            this.propagate_TransformChanged();
        }
    }

    private readonly _local_transform: Matrix4 = new Matrix4();
    private is_local_transform_dirty: boolean = false;
    public get local_transform(): Matrix4 {
        if (this.is_local_transform_dirty) {
            const scale = new Matrix4().makeScale(this._local_scale.x, this._local_scale.y, this._local_scale.z);
            const rotation = new Matrix4().makeRotationFromEuler(this._local_rotation);
            const translate = new Matrix4().makeTranslation(this._local_position);
            this._local_transform.multiplyMatrices(translate, rotation.multiply(scale));
            this.is_local_transform_dirty = false;
        }
        return this._local_transform.clone();
    }
    public set local_transform(transform: Matrix4) {
        this._local_transform.copy(transform);
        const position = new Vector3();
        const rotation = new Quaternion();
        const scale = new Vector3();
        this._local_transform.decompose(position, rotation, scale);
        this._local_position.copy(position);
        this._local_rotation.setFromQuaternion(rotation);
        this._local_scale.copy(scale);
        this.is_local_transform_dirty = false;
        this.propagate_TransformChanged();
    }

    // global
    private readonly _global_transform: Matrix4 = new Matrix4();
    private is_global_transform_dirty: boolean = false;
    protected is_global_transform_changed: boolean = false;

    public get global_transform(): Matrix4 {
        if (this.is_global_transform_dirty) {
            const parent = this.get_Parent();
            if (!this.top_level && parent !== undefined && parent instanceof Node3D) {
                const parent_global_transform = parent.global_transform!;
                const self_local_transform = this.local_transform;
                this._global_transform.multiplyMatrices(parent_global_transform, self_local_transform);
                // setup global position / rotation
                const position = new Vector3();
                const rotation = new Quaternion();
                const _ = new Vector3();
                this._global_transform.decompose(position, rotation, _);
                this._global_position.copy(position);
                this._global_rotation.setFromQuaternion(rotation);
                this.is_global_transform_dirty = false;
            }
            else {
                this._global_transform.copy(this.local_transform);
                this._global_position.copy(this.local_position);
                this._global_rotation.copy(this.local_rotation);
                this.is_global_transform_dirty = false;
            }
        }
        return this._global_transform.clone();
    }
    public set global_transform(transform: Matrix4) {
        const parent = this.get_Parent();
        if (!this.top_level && parent !== undefined && parent instanceof Node3D) {
            const parent_inverse = parent.global_transform.invert();
            this.local_transform = parent_inverse.multiply(transform);
        }
        else {
            this.local_transform = transform;
        }
    }

    private readonly _global_position: Vector3 = new Vector3();
    private readonly _global_rotation: Euler = new Euler();

    public get global_position(): Vector3 {
        if (this.is_global_transform_dirty) {
            const _ = this.global_transform;
        }
        return this._global_position.clone();
    }
    public set global_position(position: Vector3) {
        const global_transform = this.global_transform;
        global_transform.setPosition(position);
        this.global_transform = global_transform;
    }
    public get global_rotation(): Euler {
        if (this.is_global_transform_dirty) {
            const _ = this.global_transform;
        }
        return this._global_rotation.clone();
    }
    public set global_rotation(rotation: Euler) {
        const global_transform = this.global_transform;
        global_transform.setFromMatrix3(new Matrix3().setFromMatrix4(new Matrix4().makeRotationFromEuler(rotation)));
        this.global_transform = global_transform;
    }

    protected propagate_TransformChanged() {
        if (this.is_global_transform_dirty) return;
        for (const child of this.children) {
            if (child instanceof Node3D && !child.top_level) {
                child.propagate_TransformChanged();
            }
        }
        this.is_global_transform_dirty = true;
        this.is_global_transform_changed = true;
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.Parented: {
                const parent = this.get_Parent();
                if (parent !== undefined && parent instanceof Node3D) {
                    this.propagate_TransformChanged();
                }
                return;
            }
            case NodeNotification.Unparented: {
                this.propagate_TransformChanged();
                return;
            }
            case NodeNotification.InternalBeforeRender: {
                this.is_global_transform_changed = false;
            }
        }
        super._notification(what);
    }

    protected _notification_IgnoreTransformChange(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.Parented: {
                const parent = this.get_Parent();
                if (parent !== undefined && parent instanceof Node3D) {
                    this.propagate_TransformChanged();
                }
                return;
            }
            case NodeNotification.Unparented: {
                this.propagate_TransformChanged();
                return;
            }
        }
    }

    // apis

    public to_Global(local_position: Vector3) {
        return local_position.clone().applyMatrix4(this.global_transform);
    }

    public to_Local(global_position: Vector3) {
        return global_position.clone().applyMatrix4(this.global_transform.invert());
    }
}

export class Camera3D extends Node3D {
    public static readonly class_name: string = "Camera3D";

    public _current: boolean = true;
    public get current() { return this._current; }
    public set current(current: boolean) {
        if (this._current !== current) {
            if (current) {
                this.get_Viewport()?.set_ActiveCamera3D(this);
            }
            else {
                this.get_Viewport()?.clear_Camera3D(this);
            }
        }
    }

    private _visual_mask: number = 0xffffffff;
    public get visual_mask() { return this._visual_mask; }
    public set visual_mask(mask: number) {
        mask = mask & 0xffffffff;
        if (this._visual_mask !== mask) {
            this._visual_mask = mask;
            this.on_VisualMaskChanged();
        }
    }

    protected on_VisualMaskChanged() {
        throw new Error('abstract method');
    }

    public get_Camera(): Camera {
        throw new Error('abstract method');
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree: {
                if (this.current) {
                    this.get_Viewport()?.set_ActiveCamera3D(this);
                }
                break;
            }
            case NodeNotification.ExitingTree: {
                if (this.current) {
                    this.get_Viewport()?.clear_Camera3D(this);
                }
                break;
            }
        }
        super._notification(what);
    }

    public update_ViewportSize(size: Vector2) {
        throw new Error('abstract method');
    }

}

export enum ViewportUpdateMode {
    Always, Never, Once,
}

export type CursorStyle = 'default' | 'none' | 'context-menu' | 'help' | 'pointer' | 'progress' | 'wait' |
    'cell' | 'crosshair' | 'text' | 'vertical-text' | 'alias' | 'copy' | 'move' | 'no-drop' | 'not-allowed' | 'grab' |
    'grabbing' | 'e-resize' | 'n-resize' | 'ne-resize' | 'nw-resize' | 's-resize' | 'se-resize' | 'sw-resize' |
    'w-resize' | 'ew-resize' | 'ns-resize' | 'nesw-resize' | 'nwse-resize' | 'col-resize' | 'row-resize' | 'all-scroll' |
    'zoom-in' | 'zoom-out';

export class Viewport extends Node {
    public static readonly class_name: string = "Viewport";

    // input manager
    public readonly mouse_event_manager: ViewportMouseInputEventManager;
    public readonly key_event_manager: ViewportKeyInputEventManager;
    public readonly action_event_manager: ViewportActionInputEventManager;

    private readonly input_manager: InputManager;

    public world_3d: World3D | undefined = undefined;
    private readonly renderer_3d: Renderer3D;
    private camera_3d: Camera3D | undefined;
    public get canvas(): HTMLCanvasElement {
        return this.renderer_3d.canvas;
    }

    private readonly _size: Vector2 = new Vector2(0, 0);
    private is_size_dirty: boolean = false;
    public get size(): Vector2 {
        return this._size.clone();
    }
    public set size(size: Vector2) {
        if (!this._size.equals(size)) {
            this._size.copy(size);
            this.renderer_3d.resize(this._size.x, this._size.y);
            this.signal_resized.trigger(this.size);
            this.is_size_dirty = true;
        }
    }

    private _pixel_ratio: number = window.devicePixelRatio;
    public get pixel_ratio(): number {
        return this._pixel_ratio;
    }
    public set pixel_ratio(pixel_ratio: number) {
        if (this._pixel_ratio !== pixel_ratio) {
            this._pixel_ratio = pixel_ratio;
            this.renderer_3d.set_PixelRatio(this._pixel_ratio);
        }
    }

    private _transparent: boolean = false;
    public get transparent() { return this._transparent; }
    public set transparent(transparent: boolean) {
        if (this._transparent !== transparent) {
            this._transparent = transparent;
            this.renderer_3d.set_ClearAlpha(this._transparent ? 0 : 1);
        }
    }

    private _clear_color: Color = new Color(0xeeeeee);
    public get clear_color() { return this._clear_color; }
    public set clear_color(clear_color: Color) {
        this._clear_color = clear_color;
        this.renderer_3d.set_ClearColor(this._clear_color, this._transparent ? 0 : 1);
    }

    public update_mode: ViewportUpdateMode = ViewportUpdateMode.Always;

    public redirect_input_event: boolean = true;

    public physics_picking_when_mouse_event_not_canceled: boolean = true;
    public physics_picking: boolean = true;
    private _physics_picking_mask: number = 0xffffffff;
    public get physics_picking_mask() { return this._physics_picking_mask; }
    public set physics_picking_mask(mask: number) {
        mask = mask & 0xffffffff;
        if (this._physics_picking_mask !== mask) {
            this._physics_picking_mask = mask;
            if (this._physics_picking_area !== undefined && (this._physics_picking_area.layer & this.physics_picking_mask) === 0) {
                this.physics_picking_area = undefined;
            }
        }
    }
    private _physics_picking_area: PickingArea3D | undefined = undefined;
    private set physics_picking_area(area: PickingArea3D | undefined) {
        if (this._physics_picking_area !== area) {
            if (this._physics_picking_area !== undefined) {
                this._physics_picking_area.on_MouseExited(new MouseInputEvent(this, this.input_manager.mouse_position, this.input_manager.mouse_position_normalized, false, false, false, false));
            }
            this._physics_picking_area = area;
            if (this._physics_picking_area !== undefined) {
                this._physics_picking_area.on_MouseEntered(new MouseInputEvent(this, this.input_manager.mouse_position, this.input_manager.mouse_position_normalized, false, false, false, false));
            }
        }
    }

    private _cursor_style: CursorStyle = 'default';
    public get cursor_style(): CursorStyle { return this._cursor_style; }
    public set cursor_style(cursor_style: CursorStyle) {
        if (this._cursor_style !== cursor_style) {
            this._cursor_style = cursor_style;
            this.canvas.style.cursor = this._cursor_style;
        }
    }

    // signals
    public readonly signal_before_render: SignalEmitter<() => void> = new SignalEmitter();
    public readonly signal_after_render: SignalEmitter<() => void> = new SignalEmitter();
    public readonly signal_resized: SignalEmitter<(size: Vector2) => void> = new SignalEmitter();

    constructor() {
        super();
        this.renderer_3d = new Renderer3D(document.createElement('canvas'), { antialias: true });
        this.renderer_3d.set_PixelRatio(this.pixel_ratio);
        this.renderer_3d.set_ClearColor(this.clear_color, this.transparent ? 0 : 1);
        this.mouse_event_manager = new ViewportMouseInputEventManager(this);
        this.key_event_manager = new ViewportKeyInputEventManager(this);
        this.action_event_manager = new ViewportActionInputEventManager(this);
        this.mouse_event_manager.signal_mouse_event.connect(this._on_InputEvent);
        this.key_event_manager.signal_key_event.connect(this._on_InputEvent);
        this.input_manager = new InputManager(this);
    }

    private mouse_event_canceled: boolean = false;

    private _on_InputEvent = this.on_InputEvent.bind(this);
    private on_InputEvent(event: InputEvent) {
        const action_input_event = this.action_event_manager.parse_ActionInputEvent(event);
        if (action_input_event !== undefined) {
            if (this.redirect_input_event) {
                this.redirect_InputEvent(action_input_event);
            }
            else {
                this.propagate_InputEvent(action_input_event, this);
            }
        }
        if (this.redirect_input_event) {
            this.redirect_InputEvent(event);
        }
        else {
            this.propagate_InputEvent(event, this);
        }
        // check mouse event cancel for physics picking
        if (event instanceof MouseInputEvent || event instanceof MouseEnterLeaveInputEvent) {
            this.mouse_event_canceled = event.canceled;
        }
    }

    private redirect_InputEvent(event: InputEvent) {
        if (event.canceled) return;
        const redirect_target = this.get_OwnWorld3DViewport();
        if (redirect_target !== undefined) {
            redirect_target.push_InputEvent(event, this);
        }
    }

    private propagate_InputEventInternal(node: Node, event: InputEvent, target: Viewport | undefined) {
        if (node.block_input) return;
        if (node instanceof Viewport) {
            if (node === target) {
                node.push_InputEvent(event, undefined);
            }
            return;
        }
        node._input(event, true);
        if (event.canceled) return;
        node.signal_input.trigger(event, true);
        if (event.canceled) return;
        for (const child of node.children) {
            this.propagate_InputEventInternal(child, event, target);
            if (event.canceled) return;
        }
        node._input(event, false);
        if (event.canceled) return;
        node.signal_input.trigger(event, false);
        return;
    }

    private propagate_InputEvent(event: InputEvent, target: Viewport | undefined) {
        if (event.canceled) return;
        this._input(event, true);
        if (event.canceled) return;
        this.signal_input.trigger(event, true);
        for (const child of this.children) {
            this.propagate_InputEventInternal(child, event, target);
            if (event.canceled) return;
        }
        this._input(event, false);
        if (event.canceled) return;
        this.signal_input.trigger(event, false);
        return;
    }

    public emulate_InputEvent(event: InputEvent) {
        this.on_InputEvent(event);
    }

    public push_InputEvent(event: InputEvent, target: Viewport | undefined = undefined) {
        this.propagate_InputEvent(event, target);
    }

    public set_ActiveCamera3D(camera: Camera3D) {
        if (this.camera_3d !== camera) {
            if (this.camera_3d !== undefined) {
                this.camera_3d._current = false;
            }
            this.camera_3d = camera;
            this.camera_3d._current = true;
            this.is_size_dirty = true;
        }
    }

    public clear_Camera3D(camera: Camera3D) {
        if (this.camera_3d === camera) {
            this.camera_3d._current = false;
            this.camera_3d = undefined;
            this.is_size_dirty = true;
        }
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree: {
                const scenetree = this.get_SceneTree();
                if (scenetree !== undefined) {
                    scenetree.add_Viewport(this);
                }
                return;
            }
            case NodeNotification.ExitingTree: {
                const scenetree = this.get_SceneTree();
                if (scenetree !== undefined) {
                    scenetree.remove_Viewport(this);
                }
                return;
            }
            case NodeNotification.Dispose: {
                this.renderer_3d.dispose();
                this.world_3d?.dispose();
                this.mouse_event_manager.dispose();
                this.key_event_manager.dispose();
                return;
            }
            case NodeNotification.InternalAfterPhysicsProcess: {
                this.process_PhysicsPicking();
                break;
            }
        }
    }

    public get_Input() {
        return this.input_manager;
    }

    public get_World3D(): World3D | undefined {
        return this.world_3d;
    }

    public get_Camera3D(): Camera3D | undefined {
        return this.camera_3d;
    }

    private get_OwnWorld3DViewport(): Viewport | undefined {
        if (this.world_3d !== undefined) return this;
        const parent = this.get_Parent();
        if (parent !== undefined) {
            return parent.get_Viewport()?.get_OwnWorld3DViewport();
        }
        return undefined;
    }

    private get_RenderableWorld3D(): World3D | undefined {
        if (this.world_3d !== undefined) return this.world_3d;
        const parent = this.get_Parent();
        if (parent !== undefined) {
            return parent.get_Viewport()?.get_RenderableWorld3D();
        }
        return undefined;
    }

    public before_InternalBeforeRender(): void {
        const camera_3d = this.get_Camera3D();
        if (camera_3d !== undefined) {
            camera_3d._notification(NodeNotification.SetupCamera);
            if (this.is_size_dirty) {
                camera_3d.update_ViewportSize(this.size);
                this.is_size_dirty = false;
            }
        }
    }

    public render(): void {
        if (this.update_mode === ViewportUpdateMode.Never) return;
        if (this.update_mode === ViewportUpdateMode.Once) {
            this.update_mode = ViewportUpdateMode.Never;
        }
        this.signal_before_render.trigger();
        const world_3d = this.get_RenderableWorld3D();
        const camera_3d = this.get_Camera3D();
        if (camera_3d !== undefined && world_3d !== undefined) {
            this.renderer_3d.render(world_3d, this, camera_3d);
        }
        this.signal_after_render.trigger();
    }

    public process_PhysicsPicking(): void {
        if (this.physics_picking && this.input_manager.is_mouse_inside) {
            const picking_world = this.get_RenderableWorld3D()?.get_PickingWorld();
            const camera_3d = this.get_Camera3D();
            if (picking_world === undefined ||
                camera_3d === undefined ||
                (this.physics_picking_when_mouse_event_not_canceled === true && this.mouse_event_canceled)
            ) {
                this.physics_picking_area = undefined;
                return;
            };
            this.input_manager.mouse_position_normalized
            const raycast = new Raycaster();
            raycast.setFromCamera(this.input_manager.mouse_position_normalized, camera_3d.get_Camera());
            const ray_picking_option = new RayPickingOption(
                raycast.ray.origin,
                raycast.ray.origin.clone().addScaledVector(raycast.ray.direction, 100000),
                this.physics_picking_mask,
                camera_3d,
                PickingOrder.Ordered,
                PickingSide.Front,
            );
            const ray_picking_results = picking_world.perform_RayPicking(ray_picking_option);
            if (ray_picking_results.length > 0) {
                this.physics_picking_area = ray_picking_results[0].area;
            }
            else {
                this.physics_picking_area = undefined;
            }
        }
        else {
            this.physics_picking_area = undefined;
        }
    }

}