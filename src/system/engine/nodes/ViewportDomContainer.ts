import { Vector2 } from "three";
import { NodeNotification, Node, Viewport } from "../SceneTree";


export class ViewportDomContainer extends Node {
    private viewport_node: Viewport | undefined = undefined;
    private resize_observer: ResizeObserver = new ResizeObserver((entries) => this.on_DomResize(entries[0]));

    private _size: Vector2 | undefined = undefined;
    private is_size_dirty: boolean = false;
    private set size(size: Vector2) {
        if (this._size === undefined || !this._size.equals(size)) {
            if (this._size === undefined) this._size = size.clone();
            else this._size.copy(size);
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
                    this.viewport_node.pixel_ratio = window.devicePixelRatio;
                    this.is_size_dirty = false;
                }
                return;
            }
        }
    }
}