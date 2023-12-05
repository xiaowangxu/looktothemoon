import { Vector4 } from "../linear_algebra/Vector4";

export class Color extends Vector4 {
    constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 0) {
        super(r, g, b, a);
    }
}