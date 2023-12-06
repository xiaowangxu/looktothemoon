export interface MatrixLike<Mat extends MatrixLike<Mat>> {
    get row_dimension(): number;
    get col_dimension(): number;
    get determinant(): number;
    get array(): number[];
    get typed_array_f64(): Float64Array;
    get typed_array_f32(): Float32Array;
    get transposed_array(): number[];
    get typed_transposed_array_f64(): Float64Array;
    get typed_transposed_array_f32(): Float32Array;

    index(row: number, col: number): number;

    add(b: Mat): Mat;
    add_Number(b: number): Mat;
    minus(b: Mat): Mat;
    minus_Number(b: number): Mat;
    mult(b: Mat): Mat;
    mult_Number(b: number): Mat;
    div(b: Mat): Mat;
    div_Number(b: number): Mat;
    addScaled(num: number, b: Mat): Mat;

    transpose(): Mat;
    inverse(): Mat;
    compose(b: Mat): Mat;

    equal(b: Mat): boolean;

    clone(): Mat;
}