import { NodeNotification, Node } from "./Node";
import { Viewport } from "./Node";
import { Vector2 } from "../../fivepebble/linear_algebra/Vector2";

export class ViewportDomContainer extends Node {
    public static readonly class_name: string = "ViewportDomContainer";

    private viewport_node: Viewport | undefined = undefined;
    private resize_observer: ResizeObserver = new ResizeObserver((entries) => this.on_DomResize(entries[0]));

    private _size: Vector2 | undefined = undefined;
    private is_size_dirty: boolean = false;
    private set size(size: Vector2) {
        if (this._size === undefined || !this._size.equal(size)) {
            if (this._size === undefined) this._size = size;
            else this._size = size;
            this.is_size_dirty = true;
        }
    }

    private _dom: Element | undefined = undefined;
    public get dom() { return this._dom; }
    public set dom(dom: Element | undefined) {
        if (this._dom !== dom) {
            if (this._dom !== undefined) {
                if (this.viewport_node !== undefined) {
                    this._dom.removeChild(this.viewport_node.canvas);
                }
                this.resize_observer.unobserve(this._dom);
            }
            this._dom = dom;
            if (this._dom !== undefined) {
                if (this.viewport_node !== undefined) {
                    this._dom.appendChild(this.viewport_node.canvas);
                }
                this.resize_observer.observe(this._dom);
            }
        }
    }

    public scale: number = 1.0;

    constructor() {
        super();
        this.signal_child_added.connect(this.on_ChildAdded.bind(this));
        this.signal_child_removing.connect(this.on_ChildRemoving.bind(this));
    }

    private on_ChildAdded(node: Node) {
        if (this.viewport_node !== undefined) return;
        if (node instanceof Viewport) {
            this.viewport_node = node;
            if (this.dom !== undefined) {
                this.dom.appendChild(this.viewport_node.canvas);
                this.is_size_dirty = true;
            }
        }
    }

    private on_ChildRemoving(node: Node) {
        if (this.viewport_node === undefined || this.viewport_node !== node) return;
        if (this.dom !== undefined) {
            this.dom.removeChild(this.viewport_node.canvas);
        }
        this.viewport_node = undefined;
    }

    private on_DomResize(size: ResizeObserverEntry) {
        const { width, height } = size.contentRect;
        this.size = new Vector2(Math.ceil(width), Math.ceil(height));
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.InternalBeforeRender: {
                if (this.is_size_dirty && this._size !== undefined && this.viewport_node !== undefined) {
                    this.viewport_node.size = this._size;
                    this.viewport_node.pixel_ratio = window.devicePixelRatio * this.scale;
                    this.is_size_dirty = false;
                }
                return;
            }
        }
    }
}