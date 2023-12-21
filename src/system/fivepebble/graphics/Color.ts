import { Vector4 } from "../linear_algebra/Vector4";

export class Color extends Vector4 {
    public get r() { return this.x; }
    public get g() { return this.y; }
    public get b() { return this.z; }
    public get a() { return this.w; }

    constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 0) {
        super(r, g, b, a);
    }

    public clone(): Color {
        return new Color(this.x, this.y, this.z, this.w);
    }
}

export function color(r: number = 0, g: number = 0, b: number = 0, a: number = 1) {
    return new Color(r, g, b, a);
}