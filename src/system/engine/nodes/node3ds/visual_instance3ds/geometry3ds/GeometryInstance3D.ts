import type { Box3 } from "@/system/fivepebble/geometries/Box3";
import type { ClassReader, ClassWriter } from "../../../../classes/saver_loader/ClassWriterReader";
import { VisualInstance3D } from "../VisualInstance3D";

export abstract class GeometryInstance3D extends VisualInstance3D {
    public static readonly class_name: string = "GeometryInstance3D";

    protected _cast_shadow: boolean = true;
    public get cast_shadow() { return this._cast_shadow; }
    public set cast_shadow(cast: boolean) {
        if (this._cast_shadow !== cast) {
            this._cast_shadow = cast;
            this.on_CastShadowChanged();
        }
    }

    protected abstract on_CastShadowChanged(): void;

    protected _bbox_override: Box3 | undefined = undefined;
    public get bbox_override() { return this._bbox_override; }
    public set bbox_override(bbox: Box3 | undefined) {
        if (bbox === undefined) {
            if (this._bbox_override === undefined) return;
            this._bbox_override = undefined;
        }
        else {
            if (this._bbox_override === undefined) this._bbox_override = bbox.clone();
            else {
                if (this._bbox_override.equal(bbox)) return;
                else this._bbox_override.copy(bbox);
            }
        }
        this.on_BBoxOverrideChanged();
    }

    protected abstract on_BBoxOverrideChanged(): void;

    // save / load

    public dump(writer: ClassWriter): void {
        super.dump(writer);
        writer.property('cast_shadow', this.cast_shadow);
    }

    public load(reader: ClassReader): void {
        super.load(reader);
        this.cast_shadow = reader.get<boolean>('cast_shadow') ?? false;
    }
}