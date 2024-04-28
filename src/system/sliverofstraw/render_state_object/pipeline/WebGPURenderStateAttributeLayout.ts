export enum WebGPURenderStateAttributeRowType {
    Bool = 'uint32',
    Int = 'sint32',
    Uint = 'uint32',
    Float = 'float32',
    Vector2 = 'float32x2',
    Vector3 = 'float32x3',
    Vector4 = 'float32x4',
    Matrix2Row = 'float32x2',
    Matrix3Row = 'float32x3',
    Matrix4Row = 'float32x4',
    IVector2 = 'sint32x2',
    IVector3 = 'sint32x3',
    IVector4 = 'sint32x4',
    UVector2 = 'uint32x2',
    UVector3 = 'uint32x3',
    UVector4 = 'uint32x4',
}

export interface WebGPURenderStateAttributeLayout {
    stride: number,
    per_instance: boolean,
    rows: {
        location: number,
        offset: number,
        type: WebGPURenderStateAttributeRowType,
    }[]
}