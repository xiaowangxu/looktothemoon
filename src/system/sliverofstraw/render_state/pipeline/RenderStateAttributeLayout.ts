export enum RenderStateAttributeRowType {
    Bool, Int, Uint, Float,
    Vector2, Vector3, Vector4,
    Matrix2Row, Matrix3Row, Matrix4Row,
    IVector2, IVector3, IVector4,
    UVector2, UVector3, UVector4,
}

export interface RenderStateAttributeLayout {
    stride: number,
    per_instance: boolean,
    rows: {
        location: number,
        offset: number,
        type: RenderStateAttributeRowType,
    }[]
}