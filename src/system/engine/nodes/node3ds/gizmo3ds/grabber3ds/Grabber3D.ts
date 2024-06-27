import { SignalEmitter } from "@/system/utils/SignalEmitter";
import type { Viewport, ViewportCursorStyle } from "../../../Node";
import { FixSizeNode3D } from "../FixSizeNode3D";
import { Node3D } from "../../Node3D";

export class GrabberElement3D<T> extends FixSizeNode3D {
    // signals
    public readonly signal_grab_start: SignalEmitter<(value: T, target: GrabberElement3D<T>) => void> = new SignalEmitter();
    public readonly signal_grabbing: SignalEmitter<(value: T, target: GrabberElement3D<T>) => void> = new SignalEmitter();
    public readonly signal_grab_end: SignalEmitter<(value: T, target: GrabberElement3D<T>) => void> = new SignalEmitter();

    private _enabled: boolean = true;
    public get enabled() { return this._enabled; }
    public set enabled(enabled: boolean) {
        if (this._enabled !== enabled) {
            this._enabled = enabled;
            this.on_EnabledChanged();
        }
    }

    protected on_EnabledChanged() {
        throw new Error('abstract method');
    }

    private _visible: boolean = true;
    public get visible() { return this._visible; }
    public set visible(visible: boolean) {
        if (this._visible !== visible) {
            this._visible = visible;
            this.on_VisibleChanged();
        }
    }

    protected on_VisibleChanged() {
        throw new Error('abstract method');
    }

    protected _layer: number = 0xffffffff;
    public get layer() { return this._layer; }
    public set layer(layer: number) {
        layer = layer & 0xffffffff;
        if (this._layer !== layer) {
            this._layer = layer;
            this.on_LayerChanged();
        }
    }

    protected on_LayerChanged() {
        throw new Error('abstract method');
    }

    protected _render_queue: number = 1;
    public get render_queue() { return this._render_queue; }
    public set render_queue(render_queue: number) {
        if (this._render_queue !== render_queue) {
            this._render_queue = render_queue;
            this.on_RenderQueueChanged();
        }
    }

    protected on_RenderQueueChanged() {
        throw new Error('abstract method');
    }

    protected set_ViewportCursorStyle(viewport: Viewport, cursor_style: ViewportCursorStyle) {
        viewport.set_CursorStyle(this.rid, cursor_style);
    }

    constructor() {
        super();
        this.top_level = true;
    }
}

export class Grabber3D<T> extends Node3D {
    public readonly signal_grab_start: SignalEmitter<(value: T) => void> = new SignalEmitter();
    public readonly signal_grabbing: SignalEmitter<(value: T) => void> = new SignalEmitter();
    public readonly signal_grab_end: SignalEmitter<(value: T) => void> = new SignalEmitter();

    private _enabled: boolean = true;
    public get enabled() { return this._enabled; }
    public set enabled(enabled: boolean) {
        if (this._enabled !== enabled) {
            this._enabled = enabled;
            this.on_EnabledChanged();
        }
    }

    protected on_EnabledChanged() {
        throw new Error('abstract method');
    }

    private _visible: boolean = true;
    public get visible() { return this._visible; }
    public set visible(visible: boolean) {
        if (this._visible !== visible) {
            this._visible = visible;
            this.on_VisibleChanged();
        }
    }

    protected on_VisibleChanged() {
        throw new Error('abstract method');
    }

    protected _layer: number = 0xffffffff;
    public get layer() { return this._layer; }
    public set layer(layer: number) {
        layer = layer & 0xffffffff;
        if (this._layer !== layer) {
            this._layer = layer;
            this.on_LayerChanged();
        }
    }

    protected on_LayerChanged() {
        throw new Error('abstract method');
    }

    protected _render_queue: number = 1;
    public get render_queue() { return this._render_queue; }
    public set render_queue(render_queue: number) {
        if (this._render_queue !== render_queue) {
            this._render_queue = render_queue;
            this.on_RenderQueueChanged();
        }
    }

    protected on_RenderQueueChanged() {
        throw new Error('abstract method');
    }

    constructor() {
        super();
        this.top_level = true;
    }
}