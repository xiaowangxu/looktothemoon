import { NodeNotification } from "../../Node";
import { Node3D } from "../../node3ds/Node3D";
import type { ClassReader, ClassWriter } from "../../../classes/saver_loader/ClassWriterReader";

export abstract class VisualInstance3D extends Node3D {
    public static readonly class_name: string = "VisualInstance3D";

    protected _local_visible: boolean = true;
    public get local_visible() { return this._local_visible; }
    public set local_visible(visible: boolean) {
        if (this._local_visible !== visible) {
            this._local_visible = visible;
            this.propagate_VisibilityChanged();
            this.is_global_visible_dirty = true;
        }
    }

    private _global_visible: boolean = true;
    private is_global_visible_dirty: boolean = false;
    protected is_global_visible_changed: boolean = false;
    public get global_visible(): boolean {
        if (this.is_global_visible_dirty) {
            const parent = this.get_Parent();
            if (parent !== undefined && parent instanceof VisualInstance3D) {
                const parent_global_visible = parent.global_visible;
                this._global_visible = parent_global_visible && this.local_visible;
                this.is_global_visible_dirty = false;
            }
            else {
                this._global_visible = this.local_visible;
                this.is_global_visible_dirty = false;
            }
        }
        return this._global_visible;
    }

    protected _render_queue: number = 0;
    public get render_queue() { return this._render_queue; }
    public set render_queue(render_queue: number) {
        if (this._render_queue !== render_queue) {
            this._render_queue = render_queue;
            this.on_RenderQueueChanged();
        }
    }

    protected abstract on_RenderQueueChanged(): void;

    protected _layer: number = 0xffffffff;
    public get layer() { return this._layer; }
    public set layer(layer: number) {
        layer = layer & 0xffffffff;
        if (this._layer !== layer) {
            this._layer = layer;
            this.on_LayerChanged();
        }
    }

    protected abstract on_LayerChanged(): void;

    protected _editor_highlighted: boolean = false;
    public get editor_highlighted() { return this._editor_highlighted; }
    public set editor_highlighted(editor_highlighted: boolean) {
        if (this._editor_highlighted !== editor_highlighted) {
            this._editor_highlighted = editor_highlighted;
            this.on_EditorHighlightedChanged();
        }
    }

    protected abstract on_EditorHighlightedChanged(): void;

    private propagate_VisibilityChanged() {
        if (this.is_global_visible_dirty) return;
        for (const child of this.children) {
            if (child instanceof VisualInstance3D) {
                child.propagate_VisibilityChanged();
            }
        }
        this.is_global_visible_dirty = true;
        this.is_global_visible_changed = true;
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.Parented: {
                const parent = this.get_Parent();
                if (parent !== undefined && parent instanceof VisualInstance3D) {
                    this.propagate_VisibilityChanged();
                }
                break;
            }
            case NodeNotification.Unparented: {
                this.propagate_VisibilityChanged();
                break;
            }
            case NodeNotification.InternalBeforeRender: {
                this.is_global_visible_changed = false;
                break;
            }
        }
        super._notification(what);
    }

    // save / load

    public dump(writer: ClassWriter): void {
        super.dump(writer);
        writer.property('local_visible', this.local_visible);
        writer.property('visual_layer', this.layer);
    }

    public load(reader: ClassReader): void {
        super.load(reader);
        this.local_visible = reader.get<boolean>('local_visible') ?? true;
        this.layer = reader.get<number>('visual_layer') ?? 0xffffffff;
    }
}