import type { MatrixLike } from "./MatrixLike";

export interface VectorLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    get dimension(): number;
    get array(): number[];

    get length(): number;
    get squared_length(): number;
    get sum(): number;
    get product(): number;
    get min_component(): number;
    get max_component(): number;

    index(index: number): number;

    _add(a: Vec, b: Vec): Vec;

    _add_Number(a: Vec, b: number): Vec;

    _sub(a: Vec, b: Vec): Vec;

    _sub_Number(a: Vec, b: number): Vec;

    _mult(a: Vec, b: Vec): Vec;

    _mult_Number(a: Vec, b: number): Vec;

    _div(a: Vec, b: Vec): Vec;

    _div_Number(a: Vec, b: number): Vec;

    _add_Scaled(a: Vec, num: number, b: Vec): Vec;

    _lerp(a: Vec, b: Vec, weight: number): Vec;

    _transform(a: Vec, matrix: Mat): Vec;

    _normalize(a: Vec): Vec;

    _negate(a: Vec): Vec;

    dot(b: Vec): number;

    _min(a: Vec, b: Vec): Vec;

    _max(a: Vec, b: Vec): Vec;

    _abs(a: Vec): Vec;

    distance_to(b: Vec): number;
    squared_distance_to(b: Vec): number;

    _direction_to(a: Vec, b: Vec): Vec;

    equal(b: Vec): boolean;
    set(...args: number[]): Vec;
    copy(b: Vec): Vec;
    clone(): Vec;
}