export enum ValueDataType {
    None = 0,
    ClassRef = 1,
    // base
    Map = 8,
    Number = 16, Boolean, String,
    // typed array
    Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array,
    // packed array
    // PackedVector2Array, PackedVector3Array, PackedVector4Array, PackedMatrix3Array, PackedMatrix4Array,
    // math
    Vector2 = 32, Vector3, Vector4, Matrix3, Matrix4, Euler, Quaternion,
}
