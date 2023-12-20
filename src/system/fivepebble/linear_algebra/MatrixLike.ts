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
    adds(a: Mat, b: Mat): Mat;

    add_Number(b: number): Mat;
    adds_Number(a: Mat, b: number): Mat;
    
    sub(b: Mat): Mat;
    subs(a: Mat, b: Mat): Mat;
    
    sub_Number(b: number): Mat;
    subs_Number(a: Mat, b: number): Mat;
    
    mult(b: Mat): Mat;
    mults(a: Mat, b: Mat): Mat;
    
    mult_Number(b: number): Mat;
    mults_Number(a: Mat, b: number): Mat;
    
    div(b: Mat): Mat;
    divs(a: Mat, b: Mat): Mat;
    
    div_Number(b: number): Mat;
    divs_Number(a: Mat, b: number): Mat;
    
    add_Scaled(num: number, b: Mat): Mat;
    adds_Scaled(a: Mat, num: number, b: Mat): Mat;

    lerp(b: Mat, weight: number): Mat;
    lerps(a: Mat, b: Mat, weight: number): Mat;

    transpose(): Mat;
    transposes(a: Mat): Mat;
    
    inverse(): Mat;
    inverses(a: Mat): Mat;
    
    compose(b: Mat): Mat;
    composes(a: Mat, b: Mat): Mat;

    equal(b: Mat): boolean;
    set(...args: number[]): Mat;
    copy(b: Mat): Mat;
}