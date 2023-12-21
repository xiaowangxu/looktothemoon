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
    adds(a: Vec, b: Vec): Vec;

    add_Number(b: number): Vec;
    adds_Number(a: Vec, b: number): Vec;

    sub(b: Vec): Vec;
    subs(a: Vec, b: Vec): Vec;

    sub_Number(b: number): Vec;
    subs_Number(a: Vec, b: number): Vec;

    mult(b: Vec): Vec;
    mults(a: Vec, b: Vec): Vec;

    mult_Number(b: number): Vec;
    mults_Number(a: Vec, b: number): Vec;

    div(b: Vec): Vec;
    divs(a: Vec, b: Vec): Vec;

    div_Number(b: number): Vec;
    divs_Number(a: Vec, b: number): Vec;

    add_Scaled(num: number, b: Vec): Vec;
    adds_Scaled(a: Vec, num: number, b: Vec): Vec;

    lerp(b: Vec, weight: number): Vec;
    lerps(a: Vec, b: Vec, weight: number): Vec;

    transform(matrix: Mat): Vec;
    transforms(a: Vec, matrix: Mat): Vec;

    normalize(): Vec;
    normalizes(a: Vec): Vec;
    
    negate(): Vec;
    negates(a: Vec): Vec;

    dot(b: Vec): number;
    min(b: Vec): Vec;
    max(b: Vec): Vec;
    abs(): Vec;
    distance_to(b: Vec): number;
    squared_distance_to(b: Vec): number;
    direction_to(b: Vec): Vec;

    equal(b: Vec): boolean;
    set(...args: number[]): Vec;
    copy(b: Vec): Vec;
    clone(): Vec;
}