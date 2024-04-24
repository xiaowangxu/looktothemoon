export enum RenderStateAttributeRowType {
    Bool, Int, Uint, Float,
    Vec2, Vec3, Vec4,
    Mat2Row, Mat3Row, Mat4Row,
    IVec2, IVec3, IVec4,
    UVec2, UVec3, UVec4,
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