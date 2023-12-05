import { Color } from 'three';
import type { ClassReader, ClassWriter } from "../../../classes/ClassWriterReader";
import { VisualInstance3D } from "../VisualInstance3D";

export abstract class Light3D extends VisualInstance3D {
    public static readonly class_name: string = "Light3D";

    private _color: Color = new Color(1, 1, 1);
    public get color() { return this._color.clone(); }
    public set color(color: Color) {
        this._color.copy(color);
        this.on_ColorChanged();
    }

    private _intensity: number = 1;
    public get intensity() { return this._intensity; }
    public set intensity(intensity: number) {
        if (this._intensity !== intensity) {
            this._intensity = intensity;
            this.on_IntensityChanged();
        }
    }

    constructor() {
        super();
    }

    protected on_ColorChanged() {
        throw new Error('abstract method');
    }

    protected on_IntensityChanged() {
        throw new Error('abstract method');
    }

    // save / load

    public dump(writer: ClassWriter): void {
        super.dump(writer);
        writer.property('color', this.color);
        writer.property('intensity', this.intensity);
    }

    public load(reader: ClassReader): void {
        super.load(reader);
        this.color = reader.get<Color>('color') ?? new Color(1, 1, 1);
        this.intensity = reader.get<number>('intensity') ?? 1;
    }
}