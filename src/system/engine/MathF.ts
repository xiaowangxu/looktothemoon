export const EPSILON = 1e-10;
export const TAU = Math.PI * 2;

export function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export function is_ApproxEqual(a: number, b: number, epsilon = EPSILON) {
    return Math.abs(a - b) <= epsilon;
}

export function is_ApproxZero(value: number, epsilon = EPSILON) {
    return -epsilon <= value && value <= epsilon;
}