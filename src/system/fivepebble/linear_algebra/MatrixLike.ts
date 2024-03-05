export interface MatrixLike<Mat extends MatrixLike<Mat>> {
    get row_dimension(): number;
    get col_dimension(): number;
    get determinant(): number;
    get array(): number[];
    get transposed_array(): number[];

    index(row: number, col: number): number;

    _add(a: Mat, b: Mat): Mat;
    _add_Number(a: Mat, b: number): Mat;
    _sub(a: Mat, b: Mat): Mat;
    _sub_Number(a: Mat, b: number): Mat;
    _mult(a: Mat, b: Mat): Mat;
    _mult_Number(a: Mat, b: number): Mat;
    _div(a: Mat, b: Mat): Mat;
    _div_Number(a: Mat, b: number): Mat;
    _add_Scaled(a: Mat, num: number, b: Mat): Mat;
    _lerp(a: Mat, b: Mat, weight: number): Mat;
    _transpose(a: Mat): Mat;
    _inverse(a: Mat): Mat;
    _compose(a: Mat, b: Mat): Mat;

    equal(b: Mat): boolean;
    set(...args: number[]): Mat;
    copy(b: Mat): Mat;
    clone(): Mat;
}