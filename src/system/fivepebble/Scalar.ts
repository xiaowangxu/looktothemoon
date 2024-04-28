export const Epsilon = 1e-10;
export const Pi = Math.PI;
export const Tau = Math.PI * 2;
export const Deg2Rad = Math.PI / 180;
export const Rad2Ded = 180 / Math.PI;

export function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, weight: number) {
    return a + (b - a) * weight;
}

export function is_ApproxEqual(a: number, b: number, epsilon = Epsilon) {
    return Math.abs(a - b) <= epsilon;
}

export function is_ApproxZero(value: number, epsilon = Epsilon) {
    return -epsilon <= value && value <= epsilon;
}

export function align(value: number, alignment: number) {
    const remainder = value % alignment;
    if (remainder === 0) {
        return value;
    }
    else {
        return value + alignment - remainder;
    }
}