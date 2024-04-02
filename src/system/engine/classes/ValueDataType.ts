export enum ValueDataType {
    None = 0,
    ClassRef = 1,
    // base
    Map = 2, Number, Boolean, String,
    // typed array
    Uint8Array = 16, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array,
    // packed array
    PackedIndexArray, PackedVector2Array, PackedVector3Array, PackedVector4Array, PackedMatrix3Array, PackedMatrix4Array,
    PackedUintArray, PackedIntArray, PackedFloatArray,
    // math
    Vector2 = 64, Vector3, Vector4, Matrix3, Matrix4, Euler, Quaternion, Box3,

    // MAX = 127
}
