import { Vector3, type Line3, type Ray } from "three";

export const EPSILON = 1e-10;
export const TAU = Math.PI * 2;

export function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, weight: number) {
    return a + (b - a) * weight;
}

export function is_ApproxEqual(a: number, b: number, epsilon = EPSILON) {
    return Math.abs(a - b) <= epsilon;
}

export function is_ApproxZero(value: number, epsilon = EPSILON) {
    return -epsilon <= value && value <= epsilon;
}

export function get_ClosestPointsOnLineSegmentsParameters(l0: Line3, l1: Line3): [p0: number, p1: number] {
    const p = l0.end.clone().sub(l0.start);
    const q = l1.end.clone().sub(l1.start);
    const r = l0.start.clone().sub(l1.start);

    const a = p.dot(p);
    const b = p.dot(q);
    const c = q.dot(q);
    const d = p.dot(r);
    const e = q.dot(r);

    let s = 0.0;
    let t = 0.0;

    const det = a * c - b * b;
    if (det > EPSILON) {
        // Non-parallel segments
        const bte = b * e;
        const ctd = c * d;

        if (bte <= ctd) {
            // s <= 0.0
            if (e <= 0.0) {
                // t <= 0.0
                s = (-d >= a ? 1 : (-d > 0.0 ? -d / a : 0.0));
                t = 0.0;
            } else if (e < c) {
                // 0.0 < t < 1
                s = 0.0;
                t = e / c;
            } else {
                // t >= 1
                s = (b - d >= a ? 1 : (b - d > 0.0 ? (b - d) / a : 0.0));
                t = 1;
            }
        } else {
            // s > 0.0
            s = bte - ctd;
            if (s >= det) {
                // s >= 1
                if (b + e <= 0.0) {
                    // t <= 0.0
                    s = (-d <= 0.0 ? 0.0 : (-d < a ? -d / a : 1));
                    t = 0.0;
                } else if (b + e < c) {
                    // 0.0 < t < 1
                    s = 1;
                    t = (b + e) / c;
                } else {
                    // t >= 1
                    s = (b - d <= 0.0 ? 0.0 : (b - d < a ? (b - d) / a : 1));
                    t = 1;
                }
            } else {
                // 0.0 < s < 1
                const ate = a * e;
                const btd = b * d;

                if (ate <= btd) {
                    // t <= 0.0
                    s = (-d <= 0.0 ? 0.0 : (-d >= a ? 1 : -d / a));
                    t = 0.0;
                } else {
                    // t > 0.0
                    t = ate - btd;
                    if (t >= det) {
                        // t >= 1
                        s = (b - d <= 0.0 ? 0.0 : (b - d >= a ? 1 : (b - d) / a));
                        t = 1;
                    } else {
                        // 0.0 < t < 1
                        s /= det;
                        t /= det;
                    }
                }
            }
        }
    } else {
        // Parallel segments
        if (e <= 0.0) {
            s = (-d <= 0.0 ? 0.0 : (-d >= a ? 1 : -d / a));
            t = 0.0;
        } else if (e >= c) {
            s = (b - d <= 0.0 ? 0.0 : (b - d >= a ? 1 : (b - d) / a));
            t = 1;
        } else {
            s = 0.0;
            t = e / c;
        }
    }

    return [s, t];
}

export function get_ClosestPointsOnLineSegments(l0: Line3, l1: Line3): [p0: Vector3, p1: Vector3] {
    const p = l0.end.clone().sub(l0.start);
    const q = l1.end.clone().sub(l1.start);
    const r = l0.start.clone().sub(l1.start);

    const a = p.dot(p);
    const b = p.dot(q);
    const c = q.dot(q);
    const d = p.dot(r);
    const e = q.dot(r);

    let s = 0.0;
    let t = 0.0;

    const det = a * c - b * b;
    if (det > EPSILON) {
        // Non-parallel segments
        const bte = b * e;
        const ctd = c * d;

        if (bte <= ctd) {
            // s <= 0.0
            if (e <= 0.0) {
                // t <= 0.0
                s = (-d >= a ? 1 : (-d > 0.0 ? -d / a : 0.0));
                t = 0.0;
            } else if (e < c) {
                // 0.0 < t < 1
                s = 0.0;
                t = e / c;
            } else {
                // t >= 1
                s = (b - d >= a ? 1 : (b - d > 0.0 ? (b - d) / a : 0.0));
                t = 1;
            }
        } else {
            // s > 0.0
            s = bte - ctd;
            if (s >= det) {
                // s >= 1
                if (b + e <= 0.0) {
                    // t <= 0.0
                    s = (-d <= 0.0 ? 0.0 : (-d < a ? -d / a : 1));
                    t = 0.0;
                } else if (b + e < c) {
                    // 0.0 < t < 1
                    s = 1;
                    t = (b + e) / c;
                } else {
                    // t >= 1
                    s = (b - d <= 0.0 ? 0.0 : (b - d < a ? (b - d) / a : 1));
                    t = 1;
                }
            } else {
                // 0.0 < s < 1
                const ate = a * e;
                const btd = b * d;

                if (ate <= btd) {
                    // t <= 0.0
                    s = (-d <= 0.0 ? 0.0 : (-d >= a ? 1 : -d / a));
                    t = 0.0;
                } else {
                    // t > 0.0
                    t = ate - btd;
                    if (t >= det) {
                        // t >= 1
                        s = (b - d <= 0.0 ? 0.0 : (b - d >= a ? 1 : (b - d) / a));
                        t = 1;
                    } else {
                        // 0.0 < t < 1
                        s /= det;
                        t /= det;
                    }
                }
            }
        }
    } else {
        // Parallel segments
        if (e <= 0.0) {
            s = (-d <= 0.0 ? 0.0 : (-d >= a ? 1 : -d / a));
            t = 0.0;
        } else if (e >= c) {
            s = (b - d <= 0.0 ? 0.0 : (b - d >= a ? 1 : (b - d) / a));
            t = 1;
        } else {
            s = 0.0;
            t = e / c;
        }
    }

    const p0 = new Vector3().lerpVectors(l0.start, l0.end, s);
    const p1 = new Vector3().lerpVectors(l1.start, l1.end, t);

    return [p0, p1];
}

export function get_ClosestPointsOnLineParameter(l: Ray, p: Vector3): number {
    const _p = p.clone().sub(l.origin)
    const n = l.direction;
    const l2 = n.lengthSq();
    if (l2 < EPSILON) {
        return 0; // Both points are the same, just give any.
    }
    const d = n.dot(_p) / l2;
    return d;
}

export function get_ClosestPointsOnLine(l: Ray, p: Vector3): Vector3 {
    const _p = p.clone().sub(l.origin)
    const n = l.direction;
    const l2 = n.lengthSq();
    if (l2 < EPSILON) {
        return l.origin.clone(); // Both points are the same, just give any.
    }
    const d = n.dot(_p) / l2;
    return l.origin.clone().addScaledVector(n, d); // Inside.
}

export function get_ClosestPointsOnLinesParameters(l0: Ray, l1: Ray): [p0: number, p1: number] {
    const r1 = l0.origin.clone();
    const r2 = l1.origin.clone();
    const e1 = l0.direction.clone();
    const e2 = l1.direction.clone();

    const n = new Vector3().crossVectors(e1, e2);

    if (n.length() < EPSILON) {
        return [0, get_ClosestPointsOnLineParameter(l1, r1)];
    }

    const n_length_sq = n.lengthSq();
    const r = r2.clone().sub(r1);

    const t1 = new Vector3().crossVectors(e2, n).dot(r) / (n_length_sq);
    const t2 = new Vector3().crossVectors(e1, n).dot(r) / (n_length_sq);

    return [t1, t2];
}

export function get_ClosestPointsOnLines(l0: Ray, l1: Ray): [p0: Vector3, p1: Vector3] {
    const r1 = l0.origin.clone();
    const r2 = l1.origin.clone();
    const e1 = l0.direction.clone();
    const e2 = l1.direction.clone();

    const n = new Vector3().crossVectors(e1, e2);

    if (n.length() < EPSILON) {
        return [r1, get_ClosestPointsOnLine(l1, r1)];
    }

    const n_length_sq = n.lengthSq();
    const r = r2.clone().sub(r1);

    const t1 = new Vector3().crossVectors(e2, n).dot(r) / (n_length_sq);
    const t2 = new Vector3().crossVectors(e1, n).dot(r) / (n_length_sq);

    return [r1.clone().addScaledVector(e1, t1), r2.clone().addScaledVector(e2, t2)];
}