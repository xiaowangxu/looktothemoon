import { NodeNotification } from "../../Node";
import { Node3D } from "../../node3ds/Node3D";
import type { ClassReader, ClassWriter } from "../../../classes/saver_loader/ClassWriterReader";

export abstract class VisualInstance3D extends Node3D {
    public static readonly class_name: string = "VisualInstance3D";

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