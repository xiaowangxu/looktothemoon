import type { MatrixLike } from "./MatrixLike";

export class Matrix3 implements MatrixLike {
    // [ n11 n12 n13 ]
    // [ n21 n22 n23 ]
    // [ n31 n32 n33 ]
    public readonly elements: number[] = new Array(9);

    get row_dimension(): number { return 3; }
    get col_dimension(): number { return 3; }
    get determinant(): number {
        throw new Error("Method not implemented.");
    }
    get array(): number[] {
        const arr = new Array(9);
        arr[0] = this.elements[0];
        arr[1] = this.elements[1];
        arr[2] = this.elements[2];
        arr[3] = this.elements[3];
        arr[4] = this.elements[4];
        arr[5] = this.elements[5];
        arr[6] = this.elements[6];
        arr[7] = this.elements[7];
        arr[8] = this.elements[8];
        return arr;
    }
    get typed_array_f64(): Float64Array { return new Float64Array(this.elements); }
    get typed_array_f32(): Float32Array { return new Float32Array(this.elements); }
    get rank(): number {
        throw new Error("Method not implemented.");
    }
    get full_rank(): boolean {
        throw new Error("Method not implemented.");
    }

    constructor(n11: number, n12: number, n13: number, n21: number, n22: number, n23: number, n31: number, n32: number, n33: number) {
        this.elements[0] = n11; this.elements[1] = n12; this.elements[2] = n13;
        this.elements[3] = n21; this.elements[4] = n22; this.elements[5] = n23;
        this.elements[6] = n31; this.elements[7] = n32; this.elements[8] = n33;
    }

    index(row: number, col: number): number {
        throw new Error("Method not implemented.");
    }
    add(b: MatrixLike): MatrixLike {
        throw new Error("Method not implemented.");
    }
    add_Number(b: number): MatrixLike {
        throw new Error("Method not implemented.");
    }
    minus(b: MatrixLike): MatrixLike {
        throw new Error("Method not implemented.");
    }
    minus_Number(b: number): MatrixLike {
        throw new Error("Method not implemented.");
    }
    mult(b: MatrixLike): MatrixLike {
        throw new Error("Method not implemented.");
    }
    mult_Number(b: number): MatrixLike {
        throw new Error("Method not implemented.");
    }
    div(b: MatrixLike): MatrixLike {
        throw new Error("Method not implemented.");
    }
    div_Number(b: number): MatrixLike {
        throw new Error("Method not implemented.");
    }
    addScaled(num: number, b: MatrixLike): MatrixLike {
        throw new Error("Method not implemented.");
    }
    transpose(): MatrixLike {
        throw new Error("Method not implemented.");
    }
    inverse(): MatrixLike | undefined {
        throw new Error("Method not implemented.");
    }
    compose(b: MatrixLike): MatrixLike {
        throw new Error("Method not implemented.");
    }
    identity(): MatrixLike {
        throw new Error("Method not implemented.");
    }
    clone(): MatrixLike {
        throw new Error("Method not implemented.");
    }
}