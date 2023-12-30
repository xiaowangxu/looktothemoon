import { Node3D } from "../Node3D";
import type { ClassReader, ClassWriter } from "../../../classes/saver_loader/ClassWriterReader";

export class PhysicsInstance3D extends Node3D {
    public static readonly class_name: string = "PhysicsInstance3D";

    private _enabled: boolean = true;
    public get enabled() { return this._enabled; }
    public set enabled(enabled: boolean) {
        if (this._enabled !== enabled) {
            this._enabled = enabled;
            this.on_EnabledChanged();
        }
    }

    private _layer: number = 0xffffffff;
    public get layer() { return this._layer; }
    public set layer(layer: number) {
        layer = layer & 0xffffffff;
        if (this._layer !== layer) {
            this._layer = layer;
            this.on_LayerChanged();
        }
    }

    private _detect_layer: number = 0xffffffff;
    public get detect_layer() { return this._detect_layer; }
    public set detect_layer(detect_layer: number) {
        detect_layer = detect_layer & 0xffffffff;
        if (this._detect_layer !== detect_layer) {
            this._detect_layer = detect_layer;
            this.on_DetectLayerChanged();
        }
    }

    protected on_EnabledChanged() {
        throw new Error('abstract method');
    }

    protected on_LayerChanged() {
        throw new Error('abstract method');
    }

    protected on_DetectLayerChanged() {
        throw new Error('abstract method');
    }

    // save / load

    public dump(writer: ClassWriter): void {
        super.dump(writer);
        writer.property('enabled', this.enabled);
        writer.property('layer', this.layer);
        writer.property('detect_layer', this.detect_layer);
    }

    public load(reader: ClassReader): void {
        super.load(reader);
        this.enabled = reader.get<boolean>('enabled') ?? true;
        this.layer = reader.get<number>('layer') ?? 0xffffffff;
        this.detect_layer = reader.get<number>('detect_layer') ?? 0xffffffff;
    }
}