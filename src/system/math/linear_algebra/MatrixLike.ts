export interface MatrixLike {
    get row_dimension(): number;
    get col_dimension(): number;
    get determinant(): number;
    get array(): number[];
    get typed_array_f64(): Float64Array;
    get typed_array_f32(): Float32Array;
    get transposed_array(): number[];
    get typed_transposed_array_f64(): Float64Array;
    get typed_transposed_array_f32(): Float32Array;

    // get rank(): number;
    // get full_rank(): boolean;

    index(row: number, col: number): number;

    add(b: MatrixLike): MatrixLike;
    add_Number(b: number): MatrixLike;
    minus(b: MatrixLike): MatrixLike;
    minus_Number(b: number): MatrixLike;
    mult(b: MatrixLike): MatrixLike;
    mult_Number(b: number): MatrixLike;
    div(b: MatrixLike): MatrixLike;
    div_Number(b: number): MatrixLike;
    addScaled(num: number, b: MatrixLike): MatrixLike;

    transpose(): MatrixLike;
    inverse(): MatrixLike;
    compose(b: MatrixLike): MatrixLike;

    equal(b: MatrixLike): boolean;

    clone(): MatrixLike;
}