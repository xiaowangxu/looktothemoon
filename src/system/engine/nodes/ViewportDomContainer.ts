import { NodeNotification, Node, ViewportUpdateMode } from "./Node";
import { Viewport } from "./Node";
import { Vector2 } from "../../fivepebble/linear_algebra/Vector2";
import type { Config } from "../ConfiguredObject";

export class ViewportDomContainer extends Node {
    public static readonly class_name: string = "ViewportDomContainer";

    private viewport_node: Viewport | undefined = undefined;

    private _size: Vector2 | undefined = undefined;
    private set size(size: Vector2) {
        if (this._size === undefined || !this._size.equal(size)) {
            if (this._size === undefined) this._size = size;
            else this._size = size;
        }
    }

    private _position: Vector2 | undefined = undefined;
    private set position(position: Vector2) {
        if (this._position === undefined || !this._position.equal(position)) {
            if (this._position === undefined) this._position = position;
            else this._position = position;
        }
    }

    private _dom: HTMLElement | undefined = undefined;
    public get dom() { return this._dom; }
    public set dom(dom: HTMLElement | undefined) {
        if (this._dom !== dom) {
            if (this._dom !== undefined) {
                if (this.viewport_node !== undefined) {
                    this._dom.removeChild(this.viewport_node.canvas);
                }
            }
            this._dom = dom;
            if (this._dom !== undefined) {
                if (this.viewport_node !== undefined) {
                    this._dom.appendChild(this.viewport_node.canvas);
                }
            }
        }
    }

    private _visible: boolean = true;
    public get visible() { return this._visible; }
    public set visible(visible: boolean) {
        if (this._visible !== visible) {
            this._visible = visible;
            if (this.viewport_node !== undefined && !this._visible) {
                this.viewport_node.update_mode = ViewportUpdateMode.Never
            }
        }
    }

    constructor(config: Config) {
        super(config);
        this.signal_child_added.connect(this.on_ChildAdded.bind(this));
        this.signal_child_removing.connect(this.on_ChildRemoving.bind(this));
    }

    private on_ChildAdded(node: Node) {
        if (this.viewport_node !== undefined) return;
        if (node instanceof Viewport) {
            this.viewport_node = node;
            if (this.dom !== undefined) {
                this.dom.appendChild(this.viewport_node.canvas);
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

    private update_DomPositionSize() {
        if (this.dom !== undefined) {
            const width = this.dom.offsetWidth;
            const height = this.dom.offsetHeight;
            const left = this.dom.offsetLeft;
            const top = this.dom.offsetTop;
            // const { left, top, width, height } = this.dom.getBoundingClientRect();
            this.position = new Vector2(left, top);
            this.size = new Vector2(width, height);
        }
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.InternalBeforeRender: {
                this.update_DomPositionSize();
                if (this._size !== undefined && this._position !== undefined && this.viewport_node !== undefined) {
                    this.viewport_node.size = this._size;
                    this.viewport_node.position = this._position;
                }
                return;
            }
        }
    }
}