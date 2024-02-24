import type { Camera3D } from "./node3ds/camera3ds/Camera3D";
import type { ClassReader, ClassWriter } from "../classes/saver_loader/ClassWriterReader";
import type { PickingArea3D } from "./node3ds/physics3ds/PickingArea3D";
import { SceneTree } from "../SceneTree";
import { Vector2, vec2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { SignalEmitter } from "../../utils/SignalEmitter";
import { EditorRenderer3D } from "../renderer/renderer_3d/EditorRenderer3D";
import { World3D } from "../worlds/world3ds/World3D";
import { PickingOrder, PickingSide, RayPickingOption } from "../worlds/world3ds/PickingWorld3D";
import { MouseEnterLeaveInputEvent } from "../inputs/events/mouse_events/MouseEnterLeaveInputEvent";
import { MouseInputEvent } from "../inputs/events/mouse_events/MouseInputEvent";
import { InputEvent } from "../inputs/InputEvent";
import { ViewportKeyInputEventManager } from "../inputs/managers/ViewportKeyInputEventManager";
import { ViewportMouseInputEventManager } from "../inputs/managers/ViewportMouseInputEventManager";
import { ViewportActionInputEventManager } from "../inputs/managers/ViewportActionInputEventManager";
import { ViewportInputManager } from "../inputs/managers/ViewportInputManager";
import { ClassBase } from "../classes/class_database/ClassBase";
import type { Config } from "../ConfiguredObject";
import { Ref } from "@/system/utils/RefCounted";
import type { Renderer3D } from "../renderer/renderer_3d/Renderer3D";

export enum NodeNotification {
    ExitingTree,
    EnteredTree,
    ExitedTree,
    EnteredReady,
    Ready,
    Process,
    InternalAfterProcess,
    PhysicsProcess,
    InternalAfterPhysicsProcess,
    SetupCamera,
    InternalBeforeRender,
    Parented,
    Unparented,
    ChildAdded,
    ChildRemoving,
    ChildrenChanged,
    Dispose
}

export class Node extends ClassBase {
    public static readonly class_name: string = "Node";

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
    public block_process: boolean = false;
    public block_physics_process: boolean = false;

    // signals
    public readonly signal_child_added: SignalEmitter<(node: Node) => void> = new SignalEmitter();
    public readonly signal_child_removing: SignalEmitter<(node: Node) => void> = new SignalEmitter();

    public readonly signal_ready: SignalEmitter<() => void> = new SignalEmitter();
    public readonly signal_input: SignalEmitter<(event: InputEvent, propagate: boolean) => void> = new SignalEmitter();
    public readonly signal_process: SignalEmitter<(delta: number) => void> = new SignalEmitter();
    public readonly signal_physics_process: SignalEmitter<(delta: number) => void> = new SignalEmitter();

    constructor(config: Config) {
        super(config);
    };

    // scene tree
    private propagate_SceneTreeExiting() {
        for (const child of this.children) {
            child.propagate_SceneTreeExiting();
        }
        // before exit tree
        this._notification(NodeNotification.ExitingTree);
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
        this._notification(NodeNotification.EnteredTree);
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
        this._notification(NodeNotification.ExitedTree);
    }

    public propagate_Ready() {
        this.is_ready = true;
        for (const child of this.children) {
            child.propagate_Ready();
        }
        this._notification(NodeNotification.EnteredReady);
        if (this.first_time_ready) {
            this.first_time_ready = false;
            // ready
            this._notification(NodeNotification.Ready);
            this._ready();
            this.signal_ready.trigger();
        }
    }

    public propagate_Process(delta: number) {
        for (const child of this.children) {
            child.propagate_Process(delta);
        }
        // process
        this._notification(NodeNotification.Process);
        if (!this.block_process) {
            this._process(delta);
            this.signal_process.trigger(delta);
        }
    }

    public propagate_InternalAfterProcess(delta: number) {
        for (const child of this.children) {
            child.propagate_InternalAfterProcess(delta);
        }
        // internal before process
        this._notification(NodeNotification.InternalAfterProcess);
    }

    public propagate_PhysicsProcess(delta: number) {
        for (const child of this.children) {
            child.propagate_PhysicsProcess(delta);
        }
        // physics process
        this._notification(NodeNotification.PhysicsProcess);
        if (!this.block_physics_process) {
            this._physics_process(delta);
            this.signal_physics_process.trigger(delta);
        }
    }

    public propagate_InternalAfterPhysicsProcess(delta: number) {
        for (const child of this.children) {
            child.propagate_InternalAfterPhysicsProcess(delta);
        }
        // internal before process
        this._notification(NodeNotification.InternalAfterPhysicsProcess);
    }

    public propagate_InternalBeforeRender(delta: number) {
        // internal after process
        this._notification(NodeNotification.InternalBeforeRender);
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
        if (node === this) throw new Error("<Node> add_ChildInternal: cannot add child to itself");
        if (node.parent !== undefined) throw new Error("<Node> add_ChildInternal: cannot add child to node because it already has a parent");
        // check cyclic dependency
        this.children.unshift(node);
        node.parent = this;
        // node parent
        node._notification(NodeNotification.Parented);
        this._notification(NodeNotification.ChildAdded);
        this.signal_child_added.trigger(node);
        if (this.scenetree !== undefined) {
            node.set_SceneTree(this.scenetree);
        }
        // children changed
        this._notification(NodeNotification.ChildrenChanged);
    }

    private remove_ChildInternal(node: Node) {
        const idx = this.get_ChildIndex(node);
        if (idx < 0) return;
        node.set_SceneTree(undefined);
        this.children.splice(idx, 1);
        this._notification(NodeNotification.ChildRemoving);
        this.signal_child_removing.trigger(node);
        node.parent = undefined;
        // node unparent
        node._notification(NodeNotification.Unparented);
        if (this.inside_tree) {
            node.propagate_SceneTreeExited();
        }
        // children changed siganl
        this._notification(NodeNotification.ChildrenChanged);
    }

    private propagate_Dispose() {
        for (const child of this.children) {
            child.propagate_Dispose();
        }
        // dispose
        this._notification(NodeNotification.Dispose);
        this._dispose();
    }

    private free_Internal() {
        if (this.is_inside_tree) throw new Error('<Node> free_Internal: cannot free a node when it is inside the scenetree');
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
        this._notification(NodeNotification.ChildrenChanged);
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
        if (scenetree === undefined) throw new Error('<Node> queue_Free: can not queue free node since it is not inside tree');
        scenetree.queue_Free(this);
    }

    // scriptable
    public _dispose() {
    }

    public _notification(what: NodeNotification) {
        switch (what) {
            case NodeNotification.Dispose: {
                this.signal_child_added.clear();
                this.signal_child_removing.clear();
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

    // save / load

    public dump(writer: ClassWriter): void {
        writer.property('name', this.name);
        writer.property('block_input', this.block_input);
        writer.property('block_process', this.block_process);
        writer.property('block_physics_process', this.block_physics_process);
    }

    public load(reader: ClassReader): void {
        this.name = reader.get<string>('name');
        this.block_input = reader.get<boolean>('block_input') ?? false;
        this.block_process = reader.get<boolean>('block_process') ?? false;
        this.block_physics_process = reader.get<boolean>('block_physics_process') ?? false;
    }
}

export enum ViewportUpdateMode {
    Always, Never, Once, OnceNever,
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
    private readonly input_manager: ViewportInputManager;

    // canvas
    public readonly canvas: HTMLElement;

    // render
    public render_priority: number = 0;

    private _world_3d: Ref<World3D> = new Ref();
    public get world_3d() { return this._world_3d.value; }
    public set world_3d(world_3d: World3D | undefined) {
        if (this._world_3d.value !== world_3d) {
            this._world_3d.value = world_3d;
        }
    }

    private camera_3d: Camera3D | undefined;

    private readonly _renderer_3d: Ref<Renderer3D> = new Ref();
    public get renderer_3d() { return this._renderer_3d.value; }
    public set renderer_3d(renderer: Renderer3D | undefined) {
        if (this._renderer_3d.value !== renderer) {
            this._renderer_3d.value = renderer;
            if (renderer !== undefined) {
                renderer.set_Position(this.position);
                renderer.set_Size(this.size);
            }
        }
    }

    private readonly _size: Vector2 = vec2(0, 0);
    private is_size_dirty: boolean = false;
    public get size(): Vector2 {
        return this._size.clone();
    }
    public set size(size: Vector2) {
        if (!this._size.equal(size)) {
            this._size.copy(size);
            if (!this._renderer_3d.is_empty) this._renderer_3d.expect.set_Size(this._size);
            this.signal_resized.trigger(this.size);
            this.is_size_dirty = true;
        }
    }

    private readonly _position: Vector2 = vec2(0, 0);
    private is_position_changed: boolean = false;
    public get position(): Vector2 {
        return this._position.clone();
    }
    public set position(position: Vector2) {
        if (!this._position.equal(position)) {
            this._position.copy(position);
            if (!this._renderer_3d.is_empty) this._renderer_3d.expect.set_Position(this._position);
            this.is_position_changed = true;
        }
    }

    public transparent: boolean = false;

    public color_map: boolean = true;

    public debug: boolean = false;

    public update_mode: ViewportUpdateMode = ViewportUpdateMode.Always;

    // input and physics picking
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
                this._physics_picking_area.on_MouseExited(new MouseInputEvent(this.config).set_Viewport(this).set_Compose(false, false, false, false).set_Position(this.input_manager.mouse_position, this.input_manager.mouse_position_normalized));
            }
            this._physics_picking_area = area;
            if (this._physics_picking_area !== undefined) {
                this._physics_picking_area.on_MouseEntered(new MouseInputEvent(this.config).set_Viewport(this).set_Compose(false, false, false, false).set_Position(this.input_manager.mouse_position, this.input_manager.mouse_position_normalized));
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

    constructor(config: Config) {
        super(config);
        this.canvas = document.createElement('div');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.mouse_event_manager = new ViewportMouseInputEventManager(this);
        this.key_event_manager = new ViewportKeyInputEventManager(this);
        this.action_event_manager = new ViewportActionInputEventManager(this);
        this.input_manager = new ViewportInputManager(this);
    }

    private mouse_event_canceled: boolean = false;

    public on_InputEvent(event: InputEvent) {
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
        if (event.canceled) return;
        if (node instanceof Viewport) {
            if (node === target) {
                node.push_InputEvent(event, undefined);
            }
            return;
        }
        if (!node.block_input) {
            node._input(event, true);
            if (event.canceled) return;
            node.signal_input.trigger(event, true);
            if (event.canceled) return;
        }
        for (const child of node.children) {
            this.propagate_InputEventInternal(child, event, target);
            if (event.canceled) return;
        }
        if (!node.block_input) {
            node._input(event, false);
            if (event.canceled) return;
            node.signal_input.trigger(event, false);
        }
    }

    private propagate_InputEvent(event: InputEvent, target: Viewport | undefined) {
        if (event.canceled) return;
        if (!this.block_input) {
            this._input(event, true);
            if (event.canceled) return;
            this.signal_input.trigger(event, true);
            if (event.canceled) return;
        }
        for (const child of this.children) {
            this.propagate_InputEventInternal(child, event, target);
            if (event.canceled) return;
        }
        if (!this.block_input) {
            this._input(event, false);
            if (event.canceled) return;
            this.signal_input.trigger(event, false);
        }
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

    public get_Input() {
        return this.input_manager;
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

    public get_RenderableWorld3D(): World3D | undefined {
        if (this.world_3d !== undefined) return this.world_3d;
        const parent = this.get_Parent();
        if (parent !== undefined) {
            return parent.get_Viewport()?.get_RenderableWorld3D();
        }
        return undefined;
    }

    private is_size_changed: boolean = true;

    public before_InternalBeforeRender(): void {
        const camera_3d = this.get_Camera3D();
        if (camera_3d !== undefined) {
            camera_3d._notification(NodeNotification.SetupCamera);
            if (this.is_size_dirty) {
                camera_3d.update_ViewportSize(this.size);
                this.is_size_dirty = false;
                this.is_size_changed = true;
            }
        }
    }

    public render(): void {
        if (this._renderer_3d.is_empty) return;
        const resized = this.is_size_changed;
        const moved = this.is_position_changed;
        this.is_size_changed = false;
        this.is_position_changed = false;
        if (this.update_mode === ViewportUpdateMode.Never) return;
        if (this.update_mode === ViewportUpdateMode.OnceNever) {
            if (!this.config.render_server.flushed && !resized && !moved) return;
            else this.update_mode = ViewportUpdateMode.Once;
        }
        const once = this.update_mode === ViewportUpdateMode.Once;
        if (once) {
            this.update_mode = ViewportUpdateMode.OnceNever;
        }
        this.signal_before_render.trigger();
        const world_3d = this.get_RenderableWorld3D();
        const camera_3d = this.get_Camera3D();
        if (camera_3d !== undefined && world_3d !== undefined) {
            this._renderer_3d.expect.render(world_3d, this, once);
        }
        this.signal_after_render.trigger();
    }

    public process_PhysicsPicking(): void {
        if (this.physics_picking && this.input_manager.is_mouse_inside) {
            const picking_world = this.get_RenderableWorld3D()?.picking_world;
            const camera_3d = this.get_Camera3D();
            if (picking_world === undefined ||
                camera_3d === undefined ||
                (this.physics_picking_when_mouse_event_not_canceled === true && this.mouse_event_canceled)) {
                this.physics_picking_area = undefined;
                return;
            };
            this.input_manager.mouse_position_normalized;
            const ray = camera_3d.get_Camera().project_Ray(this.input_manager.mouse_position_normalized);
            const ray_picking_option = new RayPickingOption(
                ray.origin,
                ray.get_Point(10000),
                this.physics_picking_mask,
                camera_3d,
                this,
                PickingOrder.OffsetOrdered,
                PickingSide.Front
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
                this._renderer_3d.clear();
                this._world_3d.clear();
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
}