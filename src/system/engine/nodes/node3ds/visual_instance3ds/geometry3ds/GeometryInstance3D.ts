import type { ClassReader, ClassWriter } from "../../../../classes/saver_loader/ClassWriterReader";
import { VisualInstance3D } from "../VisualInstance3D";
import type { Cullable } from "@/system/engine/worlds/world3ds/VisualWorld3D";

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

    protected _cullable_override: Cullable | undefined = undefined;
    public get cullable_override() { return this._cullable_override?.clone(); }
    public set cullable_override(cullable: Cullable | undefined) {
        if (cullable === undefined) {
            if (this._cullable_override === undefined) return;
            this._cullable_override = undefined;
        }
        else {
            this._cullable_override = cullable.clone();
        }
        this.on_CullableOverrideChanged();
    }

    protected abstract on_CullableOverrideChanged(): void;

    protected _cullable_enlargement: number = 0;
    public get cullable_enlargement() { return this._cullable_enlargement; }
    public set cullable_enlargement(enlargement: number) {
        enlargement = Math.max(0, enlargement);
        if (this._cullable_enlargement !== enlargement) {
            this._cullable_enlargement = enlargement;
            this.on_CullableEnlargementChanged();
        }
    }

    protected abstract on_CullableEnlargementChanged(): void;

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