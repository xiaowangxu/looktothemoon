import { NodeNotification, Node } from "./Node";
import { Viewport } from "./Node";
import { Vector2 } from "../../fivepebble/linear_algebra/Vector2";
import { timer, type TimerCanceller } from "@/system/utils/Clock";

export class ViewportDomContainer extends Node {
    public static readonly class_name: string = "ViewportDomContainer";

    private viewport_node: Viewport | undefined = undefined;

    private _size: Vector2 = Vector2.create(0, 0);

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
                this.viewport_node.canvas.style.backgroundColor = 'tomato';
                this.viewport_node.canvas.style.width = '100%';
                this.viewport_node.canvas.style.height = '100%';
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

    private should_update: boolean = true;
    private update_timer_cancller: TimerCanceller | undefined;
    private update = () => { this.should_update = true; this.update_timer_cancller = undefined; }

    private update_DomSize(immediate: boolean = false) {
        if (this.dom !== undefined) {
            const width = this.dom.offsetWidth;
            const height = this.dom.offsetHeight;
            if (this._size.x === width && this._size.y === height) return;
            this._size.set(width, height);
            this.update_timer_cancller?.();
            this.update_timer_cancller = undefined;
            if (immediate) {
                this.should_update = true;
            }
            else {
                this.should_update = false;
                this.update_timer_cancller = timer(this.update, 10);
            }
        }
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.InternalBeforeRender: {
                this.update_DomSize();
                if (this.should_update && this.viewport_node !== undefined) {
                    this.should_update = false;
                    this.viewport_node.size = this._size;
                }
                break;
            }
            case NodeNotification.Dispose: {
                this.update_timer_cancller?.();
                this.update_timer_cancller = undefined;
                this.should_update = false;
                if (this.viewport_node !== undefined && this.dom !== undefined) {
                    this.dom.removeChild(this.viewport_node.canvas);
                }
                this.viewport_node = undefined;
                this.dom = undefined;
                break;
            }
        }
        super._notification(what);
    }
}