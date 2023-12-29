import type { ClassReader, ClassWriter } from "../../../../classes/ClassWriterReader";
import { VisualInstance3D } from "../VisualInstance3D";

export abstract class GeometryInstance3D extends VisualInstance3D {
    public static readonly class_name: string = "GeometryInstance3D";

    private _cast_shadow: boolean = false;
    public get cast_shadow() { return this._cast_shadow; }
    public set cast_shadow(cast: boolean) {
        if (this._cast_shadow !== cast) {
            this._cast_shadow = cast;
            this.on_CastShadowChanged();
        }
    }

    private _receive_shadow: boolean = false;
    public get receive_shadow() { return this._receive_shadow; }
    public set receive_shadow(receive: boolean) {
        if (this._receive_shadow !== receive) {
            this._receive_shadow = receive;
            this.on_ReceiveShadowChanged();
        }
    }

    protected on_CastShadowChanged() {
        throw new Error('abstract method');
    }

    protected on_ReceiveShadowChanged() {
        throw new Error('abstract method');
    }

    // save / load

    public dump(writer: ClassWriter): void {
        super.dump(writer);
        writer.property('cast_shadow', this.cast_shadow);
        writer.property('receive_shadow', this.receive_shadow);
    }

    public load(reader: ClassReader): void {
        super.load(reader);
        this.cast_shadow = reader.get<boolean>('cast_shadow') ?? false;
        this.receive_shadow = reader.get<boolean>('receive_shadow') ?? false;
    }
}