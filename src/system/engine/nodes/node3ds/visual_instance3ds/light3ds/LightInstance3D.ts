import type { PlainColor } from "@/system/fivepebble/graphics/Color";
import type { ClassReader, ClassWriter } from "../../../../classes/saver_loader/ClassWriterReader";
import { VisualInstance3D } from "../VisualInstance3D";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";

export abstract class LightInstance3D extends VisualInstance3D {
    public static readonly class_name: string = "LightInstance3D";

    protected readonly _color: PlainColor = new Vector3(1, 1, 1);
    public get color() { return this._color.clone(); }
    public get_Color(target: PlainColor) { return target.copy(this._color); }
    public set color(color: PlainColor) {
        if (!this._color.equal(color)) {
            this._color.copy(color);
            this.on_ColorChanged();
        }
    }

    protected _intensity: number = 1.0;
    public get intensity() { return this._intensity; }
    public set intensity(intensity: number) {
        if (this._intensity !== intensity) {
            this._intensity = intensity;
            this.on_IntensityChanged();
        }
    }

    protected _attenuation: number = 2.0;
    public get attenuation() { return this._attenuation; }
    public set attenuation(attenuation: number) {
        if (this._attenuation !== attenuation) {
            this._attenuation = attenuation;
            this.on_AttenuationChanged();
        }
    }

    protected _cast_shadow: boolean = false;
    public get cast_shadow() { return this._cast_shadow; }
    public set cast_shadow(cast: boolean) {
        if (this._cast_shadow !== cast) {
            this._cast_shadow = cast;
            this.on_CastShadowChanged();
        }
    }

    protected _shadow_bias: number = 0.0001;
    public get shadow_bias() { return this._shadow_bias; }
    public set shadow_bias(shadow_bias: number) {
        if (this._shadow_bias !== shadow_bias) {
            this._shadow_bias = shadow_bias;
            this.on_ShadowBiasChanged();
        }
    }

    protected _shadow_normal_bias: number = 0.0001;
    public get shadow_normal_bias() { return this._shadow_normal_bias; }
    public set shadow_normal_bias(shadow_normal_bias: number) {
        if (this._shadow_normal_bias !== shadow_normal_bias) {
            this._shadow_normal_bias = shadow_normal_bias;
            this.on_ShadowNormalBiasChanged();
        }
    }

    protected _shadow_opacity: number = 0.0;
    public get shadow_opacity() { return this._shadow_opacity; }
    public set shadow_opacity(shadow_opacity: number) {
        if (this._shadow_opacity !== shadow_opacity) {
            this._shadow_opacity = shadow_opacity;
            this.on_ShadowOpacityChanged();
        }
    }

    protected on_ColorChanged() {
        throw new Error('abstract method');
    }

    protected on_IntensityChanged() {
        throw new Error('abstract method');
    }

    protected on_AttenuationChanged() {
        throw new Error('abstract method');
    }

    protected on_CastShadowChanged() {
        throw new Error('abstract method');
    }

    protected on_ShadowBiasChanged() {
        throw new Error('abstract method');
    }

    protected on_ShadowNormalBiasChanged() {
        throw new Error('abstract method');
    }

    protected on_ShadowOpacityChanged() {
        throw new Error('abstract method');
    }
}