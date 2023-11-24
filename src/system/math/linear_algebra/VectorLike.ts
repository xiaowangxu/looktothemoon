import type { MatrixLike } from "./MatrixLike";

export interface VectorLike {
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

    add(b: VectorLike): VectorLike;
    add_Number(b: number): VectorLike;
    minus(b: VectorLike): VectorLike;
    minus_Number(b: number): VectorLike;
    mult(b: VectorLike): VectorLike;
    mult_Number(b: number): VectorLike;
    div(b: VectorLike): VectorLike;
    div_Number(b: number): VectorLike;
    add_Scaled(num: number, b: VectorLike): VectorLike;
    
    lerp(b: VectorLike, weight: number): VectorLike;
    dot(b: VectorLike): number;
    transform(matrix: MatrixLike): VectorLike;
    min(b: VectorLike): VectorLike;
    max(b: VectorLike): VectorLike;
    abs(): VectorLike;
    normalize(): VectorLike;
    negate(): VectorLike;

    equal(b: VectorLike): boolean;

    clone(): VectorLike;
}