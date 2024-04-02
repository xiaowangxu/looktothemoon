import type { Vector3 } from "../linear_algebra/Vector3";
import { Vector4 } from "../linear_algebra/Vector4";

export type Color = Vector4;
export type PlainColor = Vector3;

function hsv2rgb_k(n: number, h: number) {
    return (n + h / 60) % 6;
}

function hsv2rgb_f(n: number, h: number, s: number, b: number): number {
    return b * (1 - s * Math.max(0, Math.min(hsv2rgb_k(n, h), 4 - hsv2rgb_k(n, h), 1)));
}

export const Color = {
    get new() { return new Vector4(1, 1, 1, 1); },

    create(r: number = 0, g: number = 0, b: number = 0, a: number = 1) {
        return new Vector4(r, g, b, a);
    },

    color8(r: number = 0, g: number = 0, b: number = 0, a: number = 255) {
        return new Vector4(r / 255, g / 255, b / 255, a / 255);
    },

    color8code(code: number = 0xffffffff) {
        const r = code >>> 24 & 0xff;
        const g = code >>> 16 & 0xff;
        const b = code >>> 8 & 0xff;
        const a = code & 0xff;
        return new Vector4(r / 255, g / 255, b / 255, a / 255);
    },

    /**
     * @param h 0-1 map onto [0deg - 360deg]
     * @param s 0-1
     * @param b 0-1
     */
    hsv(h: number, s: number, b: number, a: number = 1) {
        h *= 360;
        return new Vector4(hsv2rgb_f(5, h, s, b), hsv2rgb_f(3, h, s, b), hsv2rgb_f(1, h, s, b), a);
    },

    /**
     * @param h 0-1 map onto [0deg - 360deg]
     * @param s 0-1
     * @param b 0-1
     */
    hsl(h: number, s: number, l: number, a: number = 1) {
        const _b = (l + s * Math.min(l, 1 - l));
        return Color.hsv(h, l === 0 ? 0 : 2 - 2 * l / _b, 1 - _b, a);
    }
};