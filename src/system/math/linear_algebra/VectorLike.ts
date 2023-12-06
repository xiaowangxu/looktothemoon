import type { MatrixLike } from "./MatrixLike";

export interface VectorLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    get dimension(): number;
    get array(): number[];
    get typed_array_f64(): Float64Array;
    get typed_array_f32(): Float32Array;

    get length(): number;
    get squared_length(): number;
    get sum(): number;
    get product(): number;
    get min_component(): number;
    get max_component(): number;

    index(index: number): number;

    add(b: Vec): Vec;
    add_Number(b: number): Vec;
    minus(b: Vec): Vec;
    minus_Number(b: number): Vec;
    mult(b: Vec): Vec;
    mult_Number(b: number): Vec;
    div(b: Vec): Vec;
    div_Number(b: number): Vec;
    add_Scaled(num: number, b: Vec): Vec;

    lerp(b: Vec, weight: number): Vec;
    dot(b: Vec): number;
    transform(matrix: Mat): Vec;
    min(b: Vec): Vec;
    max(b: Vec): Vec;
    abs(): Vec;
    normalize(): Vec;
    negate(): Vec;
    distance_to(b: Vec): number;
    squared_distance_to(b: Vec): number;
    direction_to(b: Vec): Vec;

    equal(b: Vec): boolean;

    clone(): Vec;
}