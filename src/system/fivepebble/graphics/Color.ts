import { Vector4 } from "../linear_algebra/Vector4";

export type Color = Vector4;

export function color(r: number = 0, g: number = 0, b: number = 0, a: number = 1) {
    return new Vector4(r, g, b, a);
}