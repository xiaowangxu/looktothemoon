export interface MatrixLike<Mat extends MatrixLike<Mat>> {
    get row_dimension(): number;
    get col_dimension(): number;
    get determinant(): number;
    get array(): number[];
    get transposed_array(): number[];

    index(row: number, col: number): number;

    add(a: Mat, b: Mat): Mat;
    add_Number(a: Mat, b: number): Mat;
    sub(a: Mat, b: Mat): Mat;
    sub_Number(a: Mat, b: number): Mat;
    mult(a: Mat, b: Mat): Mat;
    mult_Number(a: Mat, b: number): Mat;
    div(a: Mat, b: Mat): Mat;
    div_Number(a: Mat, b: number): Mat;
    add_Scaled(a: Mat, num: number, b: Mat): Mat;
    lerp(a: Mat, b: Mat, weight: number): Mat;
    transpose(a: Mat): Mat;
    inverse(a: Mat): Mat;
    compose(a: Mat, b: Mat): Mat;

    equal(b: Mat): boolean;
    set(...args: number[]): Mat;
    copy(b: Mat): Mat;
    clone(): Mat;
}