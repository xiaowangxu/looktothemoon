import type { Cloneable, Copyable, Equality } from "@/system/utils/Type";
import type { MatrixLike } from "./MatrixLike";

export interface VectorLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>>
    extends Cloneable<Vec>, Copyable<Vec>, Equality<Vec> {
    get dimension(): number;
    get array(): number[];

    get length(): number;
    get squared_length(): number;
    get sum(): number;
    get product(): number;
    get min_component(): number;
    get max_component(): number;

    index(index: number): number;

    add(a: Vec, b: Vec): Vec;
    add_Number(a: Vec, b: number): Vec;
    sub(a: Vec, b: Vec): Vec;
    sub_Number(a: Vec, b: number): Vec;
    mult(a: Vec, b: Vec): Vec;
    mult_Number(a: Vec, b: number): Vec;
    div(a: Vec, b: Vec): Vec;
    div_Number(a: Vec, b: number): Vec;
    add_Scaled(a: Vec, num: number, b: Vec): Vec;
    lerp(a: Vec, b: Vec, weight: number): Vec;
    transform(a: Vec, matrix: Mat): Vec;
    normalize(a: Vec): Vec;
    negate(a: Vec): Vec;
    snap(a: Vec, b: Vec): Vec;
    dot(b: Vec): number;
    min(a: Vec, b: Vec): Vec;
    max(a: Vec, b: Vec): Vec;
    abs(a: Vec): Vec;
    distance_to(b: Vec): number;
    squared_distance_to(b: Vec): number;
    direction_to(a: Vec, b: Vec): Vec;

    set(...args: number[]): Vec;
}

export interface Transformable<T, Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    affine_transform(a: T, mat: Mat): T;
}