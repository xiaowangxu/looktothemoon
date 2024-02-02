import { Result } from "@/system/utils/Result";
import { ClassDecoder, ClassEncoder } from "./ClassEncoderDecoder";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { ClassRef } from "../ClassWriterReader";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Euler } from "@/system/fivepebble/linear_algebra/Euler";
import { Quaternion } from "@/system/fivepebble/linear_algebra/Quaternion";
import { ArrayBuffer as MD5 } from 'spark-md5';
import type { ClassExchangeData, ClassInstanceData } from "../ClassSaverLoader";
import { ValueDataType } from "../../ValueDataType";
import { PackedIndexArray, PackedMatrix3Array, PackedMatrix4Array, PackedVector2Array, PackedVector3Array, PackedVector4Array } from "../../value_wrappers/PackedArray";
import { Box3 } from "@/system/fivepebble/geometries/Box3";

// Lttm Bin format
// |-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|
// |  I32  |  I32  |   I8  |  I32  |  I32  |  I32  |  I32  |  I32  |  I32  |  I32  |  I32  |  I32  |  I32  |  I32  |
// |-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------| --------------+
// |  'LTTM BIN'   | Flags | Ver 0 |      uid      |        128bit md5 hash        |   preserved   | root  | count |               |------ header region
// |-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------| --------------+
// |    meta len   |                                 ...meta map                                                   |               |------ meta region
// |-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------| --------------+
// |                                                ...instances                                                   |               |------ body region
// |-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------| --------------+

const InitialFileByteLength = 512;
const Version0 = 0;

const MD5HashOffset = 21;
const BodyOffset = MD5HashOffset + 16 + 16;

type TypedArrayBufferView = Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array;
type TypedArrayBufferViewConstructor = typeof Uint8Array | typeof Uint16Array | typeof Uint32Array | typeof Int8Array | typeof Int16Array | typeof Int32Array | typeof Float32Array | typeof Float64Array;

export type ClassBinaryEncoderOption = { little_endian?: boolean };

export class ClassBinaryEncoder extends ClassEncoder<ArrayBuffer, ClassBinaryEncoderOption> {

    static #ascii_ragex: RegExp = /^[\x00-\x7F]*$/;

    static #header_title = new Uint8Array([76, 84, 84, 77, 32, 66, 73, 78]);
    static #md5_array_buffer = new Uint8Array(16);
    static #md5_hex_byte_map: Record<string, number> = {
        '00': 0, '01': 1, '02': 2, '03': 3, '04': 4, '05': 5, '06': 6, '07': 7, '08': 8, '09': 9, '0a': 10, '0b': 11, '0c': 12, '0d': 13, '0e': 14, '0f': 15, '10': 16, '11': 17, '12': 18, '13': 19, '14': 20, '15': 21, '16': 22, '17': 23, '18': 24, '19': 25, '1a': 26, '1b': 27, '1c': 28, '1d': 29, '1e': 30, '1f': 31, '20': 32, '21': 33, '22': 34, '23': 35, '24': 36, '25': 37, '26': 38, '27': 39, '28': 40, '29': 41, '2a': 42, '2b': 43, '2c': 44, '2d': 45, '2e': 46, '2f': 47, '30': 48, '31': 49, '32': 50, '33': 51, '34': 52, '35': 53, '36': 54, '37': 55, '38': 56, '39': 57, '3a': 58, '3b': 59, '3c': 60, '3d': 61, '3e': 62, '3f': 63, '40': 64, '41': 65, '42': 66, '43': 67, '44': 68, '45': 69, '46': 70, '47': 71, '48': 72, '49': 73, '4a': 74, '4b': 75, '4c': 76, '4d': 77, '4e': 78, '4f': 79, '50': 80, '51': 81, '52': 82, '53': 83, '54': 84, '55': 85, '56': 86, '57': 87, '58': 88, '59': 89, '5a': 90, '5b': 91, '5c': 92, '5d': 93, '5e': 94, '5f': 95, '60': 96, '61': 97, '62': 98, '63': 99, '64': 100, '65': 101, '66': 102, '67': 103, '68': 104, '69': 105, '6a': 106, '6b': 107, '6c': 108, '6d': 109, '6e': 110, '6f': 111, '70': 112, '71': 113, '72': 114, '73': 115, '74': 116, '75': 117, '76': 118, '77': 119, '78': 120, '79': 121, '7a': 122, '7b': 123, '7c': 124, '7d': 125, '7e': 126, '7f': 127, '80': 128, '81': 129, '82': 130, '83': 131, '84': 132, '85': 133, '86': 134, '87': 135, '88': 136, '89': 137, '8a': 138, '8b': 139, '8c': 140, '8d': 141, '8e': 142, '8f': 143, '90': 144, '91': 145, '92': 146, '93': 147, '94': 148, '95': 149, '96': 150, '97': 151, '98': 152, '99': 153, '9a': 154, '9b': 155, '9c': 156, '9d': 157, '9e': 158, '9f': 159, 'a0': 160, 'a1': 161, 'a2': 162, 'a3': 163, 'a4': 164, 'a5': 165, 'a6': 166, 'a7': 167, 'a8': 168, 'a9': 169, 'aa': 170, 'ab': 171, 'ac': 172, 'ad': 173, 'ae': 174, 'af': 175, 'b0': 176, 'b1': 177, 'b2': 178, 'b3': 179, 'b4': 180, 'b5': 181, 'b6': 182, 'b7': 183, 'b8': 184, 'b9': 185, 'ba': 186, 'bb': 187, 'bc': 188, 'bd': 189, 'be': 190, 'bf': 191, 'c0': 192, 'c1': 193, 'c2': 194, 'c3': 195, 'c4': 196, 'c5': 197, 'c6': 198, 'c7': 199, 'c8': 200, 'c9': 201, 'ca': 202, 'cb': 203, 'cc': 204, 'cd': 205, 'ce': 206, 'cf': 207, 'd0': 208, 'd1': 209, 'd2': 210, 'd3': 211, 'd4': 212, 'd5': 213, 'd6': 214, 'd7': 215, 'd8': 216, 'd9': 217, 'da': 218, 'db': 219, 'dc': 220, 'dd': 221, 'de': 222, 'df': 223, 'e0': 224, 'e1': 225, 'e2': 226, 'e3': 227, 'e4': 228, 'e5': 229, 'e6': 230, 'e7': 231, 'e8': 232, 'e9': 233, 'ea': 234, 'eb': 235, 'ec': 236, 'ed': 237, 'ee': 238, 'ef': 239, 'f0': 240, 'f1': 241, 'f2': 242, 'f3': 243, 'f4': 244, 'f5': 245, 'f6': 246, 'f7': 247, 'f8': 248, 'f9': 249, 'fa': 250, 'fb': 251, 'fc': 252, 'fd': 253, 'fe': 254, 'ff': 255
    }

    private static is_Ascii(str: string) { return ClassBinaryEncoder.#ascii_ragex.test(str); }

    private static get_MD5ArrayBuffer(md5: string) {
        for (let i = 0; i < 16; i++) {
            const number = ClassBinaryEncoder.#md5_hex_byte_map[md5.slice(i * 2, (i + 1) * 2)];
            ClassBinaryEncoder.#md5_array_buffer[i] = number;
        }
        return ClassBinaryEncoder.#md5_array_buffer;
    }

    private array_buffer;
    private data_view;
    private uint8array;

    private byte_pointer: number = 0;

    // options

    private little_endian: boolean = false;

    constructor(data: ClassExchangeData, option?: ClassBinaryEncoderOption) {
        super(data);
        this.array_buffer = new ArrayBuffer(InitialFileByteLength);
        this.data_view = new DataView(this.array_buffer);
        this.uint8array = new Uint8Array(this.array_buffer);
        // options
        this.little_endian = option?.little_endian ?? false;
    }

    private init() {
        this.byte_pointer = 0;
    }

    private get_Data() {
        return this.uint8array.buffer.slice(0, this.byte_pointer);
    }

    // #region Base Api

    private ensure_AppendSize(size: number) {
        const byte_length = this.array_buffer.byteLength;
        if (this.byte_pointer + size > byte_length) {
            const appened_size = this.byte_pointer + size;
            const new_size = appened_size < 1024 ? 1024 : (appened_size * 2);
            const uint_array = this.uint8array;
            this.array_buffer = new ArrayBuffer(new_size);
            this.data_view = new DataView(this.array_buffer);
            this.uint8array = new Uint8Array(this.array_buffer);
            this.uint8array.set(uint_array, 0);
        }
    }

    private skip_Bytes(count: number) {
        this.ensure_AppendSize(count);
        this.byte_pointer += count;
    }

    private append_RawArrayBuffer(value: Uint8Array) {
        this.ensure_AppendSize(value.byteLength);
        this.uint8array.set(value, this.byte_pointer);
        this.byte_pointer += value.byteLength;
    }

    private append_SizedArrayBuffer(value: Uint8Array) {
        this.append_Uint32(value.byteLength);
        this.ensure_AppendSize(value.byteLength);
        this.uint8array.set(value, this.byte_pointer);
        this.byte_pointer += value.byteLength;
    }

    private append_TypedArray(value: TypedArrayBufferView) {
        this.append_Uint32(value.byteLength);
        const uint8array = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
        this.ensure_AppendSize(value.byteLength);
        this.uint8array.set(uint8array, this.byte_pointer);
        this.byte_pointer += value.byteLength;
    }

    private append_Byte(value: number) {
        this.ensure_AppendSize(1);
        this.data_view.setUint8(this.byte_pointer, value);
        this.byte_pointer += 1;
    }

    private append_Uint32(value: number) {
        this.ensure_AppendSize(4);
        this.data_view.setUint32(this.byte_pointer, value, this.little_endian);
        this.byte_pointer += 4;
    }

    private append_Uint64(value: bigint) {
        this.ensure_AppendSize(8);
        this.data_view.setBigUint64(this.byte_pointer, value, this.little_endian);
        this.byte_pointer += 8;
    }

    private append_Float64(value: number) {
        this.ensure_AppendSize(8);
        this.data_view.setFloat64(this.byte_pointer, value, this.little_endian);
        this.byte_pointer += 8;
    }

    // #endregion

    private append_String(value: string) {
        const uint8array = new TextEncoder().encode(value);
        this.append_Uint32(uint8array.byteLength);
        this.ensure_AppendSize(uint8array.byteLength);
        this.uint8array.set(uint8array, this.byte_pointer);
        this.byte_pointer += uint8array.byteLength;
    }

    private append_AsciiString(value: string) {
        if (!ClassBinaryEncoder.is_Ascii(value)) throw new Error(`<ClassBinaryEncoder> append_AsciiString: string "${value}" is not valid ascii string`);
        const ascii = `${value}\0`;
        const uint8array = new TextEncoder().encode(ascii);
        this.ensure_AppendSize(uint8array.byteLength);
        this.uint8array.set(uint8array, this.byte_pointer);
        this.byte_pointer += uint8array.byteLength;
    }

    private append_Map(value: Map<any, any>) {
        const length = value.size;
        this.append_Uint32(length);
        for (const [key, val] of value) {
            this.append_Value(key);
            this.append_Value(val);
        }
    }

    private append_ValueInternal(value: any, type: ValueDataType) {
        switch (type) {
            case ValueDataType.None: { return; }
            case ValueDataType.Number: { this.append_Float64(value); return; }
            case ValueDataType.Boolean: { this.append_Byte(value ? 1 : 0); return; }
            case ValueDataType.String: { this.append_String(value); return; }
            case ValueDataType.ClassRef: { this.append_Uint32(value.refid); return; }
            case ValueDataType.Map: { this.append_Map(value); return; }
            case ValueDataType.Vector2: { this.append_Float64(value.x); this.append_Float64(value.y); return; }
            case ValueDataType.Vector3: { this.append_Float64(value.x); this.append_Float64(value.y); this.append_Float64(value.z); return; }
            case ValueDataType.Vector4: { this.append_Float64(value.x); this.append_Float64(value.y); this.append_Float64(value.z); this.append_Float64(value.w); return; }
            case ValueDataType.Matrix3: {
                this.append_Float64(value.n11); this.append_Float64(value.n12); this.append_Float64(value.n13);
                this.append_Float64(value.n21); this.append_Float64(value.n22); this.append_Float64(value.n23);
                this.append_Float64(value.n31); this.append_Float64(value.n32); this.append_Float64(value.n33);
                return;
            }
            case ValueDataType.Matrix4: {
                this.append_Float64(value.n11); this.append_Float64(value.n12); this.append_Float64(value.n13); this.append_Float64(value.n14);
                this.append_Float64(value.n21); this.append_Float64(value.n22); this.append_Float64(value.n23); this.append_Float64(value.n24);
                this.append_Float64(value.n31); this.append_Float64(value.n32); this.append_Float64(value.n33); this.append_Float64(value.n34);
                this.append_Float64(value.n41); this.append_Float64(value.n42); this.append_Float64(value.n43); this.append_Float64(value.n44);
                return;
            }
            case ValueDataType.Euler: { this.append_Float64(value.x); this.append_Float64(value.y); this.append_Float64(value.z); this.append_Float64(value.order); return; }
            case ValueDataType.Quaternion: { this.append_Float64(value.x); this.append_Float64(value.y); this.append_Float64(value.z); this.append_Float64(value.w); return; }
            case ValueDataType.Box3: {
                this.append_Float64(value.min.x); this.append_Float64(value.min.y); this.append_Float64(value.min.z);
                this.append_Float64(value.max.x); this.append_Float64(value.max.y); this.append_Float64(value.max.z);
                return;
            }
            // typed array
            case ValueDataType.Uint8Array: { this.append_TypedArray(value); return; }
            case ValueDataType.Uint16Array: { this.append_TypedArray(value); return; }
            case ValueDataType.Uint32Array: { this.append_TypedArray(value); return; }
            case ValueDataType.Int8Array: { this.append_TypedArray(value); return; }
            case ValueDataType.Int16Array: { this.append_TypedArray(value); return; }
            case ValueDataType.Int32Array: { this.append_TypedArray(value); return; }
            case ValueDataType.Float32Array: { this.append_TypedArray(value); return; }
            case ValueDataType.Float64Array: { this.append_TypedArray(value); return; }
            case ValueDataType.PackedIndexArray: {
                const data: PackedIndexArray = value;
                this.append_TypedArray(data.data);
                return;
            }
            case ValueDataType.PackedVector2Array:
            case ValueDataType.PackedVector3Array:
            case ValueDataType.PackedVector4Array:
            case ValueDataType.PackedMatrix3Array:
            case ValueDataType.PackedMatrix4Array: {
                const data: PackedVector2Array | PackedVector3Array | PackedVector4Array | PackedMatrix4Array = value;
                this.append_TypedArray(data.data);
                return;
            }
            default: {
                const n: never = type;
                throw new Error('<ClassBinaryEncoder> append_ValueInternal: unkown value type');
            }
        }
    }

    private append_Value(value: any) {
        const is_array = value instanceof Array;
        if (!is_array) {
            const type = this.get_ValueType(value);
            this.append_Byte(type);
            this.append_ValueInternal(value, type);
        }
        else if (value.length === 0) {
            this.append_Byte(0b10000000); // empty array 
        }
        else {
            const type = this.get_ValueType(value[0]);
            this.append_Byte(0b10000000 | type);
            this.append_Uint32(value.length);
            // array instance
            for (let i = 0; i < value.length; i++) {
                const t = this.get_ValueType(value[i]);
                if (t !== type) throw new Error(`<ClassBinaryEncoder> append_Value@array: array items have different types, can not append type ${ValueDataType[t]} into ${ValueDataType[type]}[] array`);
                this.append_ValueInternal(value[i], type);
            }
        }
    }

    private get_ValueType(value: any): ValueDataType {
        // base
        if (typeof value === 'number') return ValueDataType.Number;
        if (typeof value === 'boolean') return ValueDataType.Boolean;
        if (typeof value === 'string') return ValueDataType.String;
        if (value instanceof ClassRef) return ValueDataType.ClassRef;
        if (value instanceof Map) return ValueDataType.Map;
        // typed array
        if (value instanceof Uint8Array || value instanceof Uint8ClampedArray) return ValueDataType.Uint8Array;
        if (value instanceof Uint16Array) return ValueDataType.Uint16Array;
        if (value instanceof Uint32Array) return ValueDataType.Uint32Array;
        if (value instanceof Int8Array) return ValueDataType.Int8Array;
        if (value instanceof Int16Array) return ValueDataType.Int16Array;
        if (value instanceof Int32Array) return ValueDataType.Int32Array;
        if (value instanceof Float32Array) return ValueDataType.Float32Array;
        // packed array
        if (value instanceof PackedIndexArray) return ValueDataType.PackedIndexArray;
        if (value instanceof PackedVector2Array) return ValueDataType.PackedVector2Array;
        if (value instanceof PackedVector3Array) return ValueDataType.PackedVector3Array;
        if (value instanceof PackedVector4Array) return ValueDataType.PackedVector4Array;
        if (value instanceof PackedMatrix3Array) return ValueDataType.PackedMatrix3Array;
        if (value instanceof PackedMatrix4Array) return ValueDataType.PackedMatrix4Array;
        // math
        if (value instanceof Vector2) return ValueDataType.Vector2;
        if (value instanceof Vector3) return ValueDataType.Vector3;
        if (value instanceof Vector4) return ValueDataType.Vector4;
        if (value instanceof Matrix3) return ValueDataType.Matrix3;
        if (value instanceof Matrix4) return ValueDataType.Matrix4;
        if (value instanceof Euler) return ValueDataType.Euler;
        if (value instanceof Quaternion) return ValueDataType.Quaternion;
        if (value instanceof Box3) return ValueDataType.Box3;
        throw new Error('<ClassBinaryEncoder> get_ValueType: unkown value type');
    }

    public encode(): Result<ArrayBuffer, Error> {
        this.init();
        // header
        this.append_RawArrayBuffer(ClassBinaryEncoder.#header_title); // LTTM BIN [8B]
        this.append_Byte(this.little_endian ? 1 : 0); // flags 0001 --- for little_endian [1B]
        this.append_Uint32(Version0); // verions xxx --- uint32 [4B]
        this.append_Uint64(this.data.uid); // uid [8B]
        this.skip_Bytes(16); // hash [16B]
        this.skip_Bytes(8) // preserved [8B]
        // root
        this.append_Uint32(this.data.root); // root refid [4B]
        // count
        this.append_Uint32(this.data.instances.length); // instances' count [4B]
        // meta
        if (this.data.meta === undefined || this.data.meta.size <= 0) {
            this.append_Uint32(0); // no meta
        }
        else {
            const cnt_pnt = this.byte_pointer;
            this.skip_Bytes(4); // skip meta len
            this.append_Map(this.data.meta); // meta map
            const length = this.byte_pointer - cnt_pnt - 4;
            this.data_view.setUint32(cnt_pnt, length); // set meta len
        }
        // instances may throw Error
        try {
            for (const instance of this.data.instances) {
                this.append_AsciiString(instance.type); // type
                this.append_Uint32(instance.refid); // refid
                this.append_Uint64(instance.uid); // uid
                this.append_Byte((instance.unique ?? false) ? 1 : 0); //unique
                this.append_Byte(instance.external !== undefined ? 1 : 0); // external
                if (instance.external !== undefined) {
                    this.append_String(instance.external);
                }
                if (instance.property === undefined) {
                    this.append_Uint32(0); // no property
                    continue;
                }
                const property = [...instance.property.entries()];
                this.append_Uint32(property.length);
                for (const [key, value] of property) {
                    // key
                    this.append_AsciiString(key);
                    // type - value
                    this.append_Value(value);
                }
            }
        }
        catch (err) {
            return Result.Error(err as Error);
        }

        const data = this.get_Data();

        // set md5
        const md5_array_buffer = ClassBinaryEncoder.get_MD5ArrayBuffer(MD5.hash(data, false));
        new Uint8Array(data).set(md5_array_buffer, MD5HashOffset);

        return Result.Ok(data);
    }
}

export type ClassBinaryDecoderOption = { validate?: boolean, ignore_meta?: boolean };

export class ClassBinaryDecoder extends ClassDecoder<ArrayBuffer, ClassBinaryDecoderOption> {
    static #md5_byte_hex_map = [
        '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0a', '0b', '0c', '0d', '0e', '0f', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '1a', '1b', '1c', '1d', '1e', '1f', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '2a', '2b', '2c', '2d', '2e', '2f', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '3a', '3b', '3c', '3d', '3e', '3f', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '4a', '4b', '4c', '4d', '4e', '4f', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '5a', '5b', '5c', '5d', '5e', '5f', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '6a', '6b', '6c', '6d', '6e', '6f', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '7a', '7b', '7c', '7d', '7e', '7f', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '8a', '8b', '8c', '8d', '8e', '8f', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '9a', '9b', '9c', '9d', '9e', '9f', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'aa', 'ab', 'ac', 'ad', 'ae', 'af', 'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'ba', 'bb', 'bc', 'bd', 'be', 'bf', 'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'ca', 'cb', 'cc', 'cd', 'ce', 'cf', 'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'da', 'db', 'dc', 'dd', 'de', 'df', 'e0', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'ea', 'eb', 'ec', 'ed', 'ee', 'ef', 'f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'fa', 'fb', 'fc', 'fd', 'fe', 'ff'
    ];

    private readonly data_view: DataView;
    private readonly uint8array: Uint8Array;

    private byte_pointer: number = 0;

    // options

    private validate: boolean = true;
    private ignore_meta: boolean = false;

    private little_endian: boolean = false;
    private version: number = 0;

    constructor(data: ArrayBuffer, option?: ClassBinaryDecoderOption) {
        super(data);
        this.data_view = new DataView(this.data);
        this.uint8array = new Uint8Array(this.data);
        // options
        this.validate = option?.validate ?? true;
        this.ignore_meta = option?.ignore_meta ?? false;
    }

    private init() {
        this.byte_pointer = 0;
    }

    // #region Base Apis

    private skip_Bytes(count: number) {
        this.byte_pointer += count;
    }

    private get_SizedBlock() {
        const count = this.get_Uint32();
        const buffer = this.data.slice(this.byte_pointer, this.byte_pointer + count);
        this.skip_Bytes(count);
        return buffer;
    }

    private get_TypedArray<T extends TypedArrayBufferViewConstructor>(type: T): InstanceType<T> {
        const length = this.get_Uint32();
        const buffer = this.data_view.buffer.slice(this.byte_pointer, this.byte_pointer + length);
        this.byte_pointer += length;
        return new (type)(buffer) as InstanceType<T>;
    }

    private get_Byte() {
        const value = this.data_view.getUint8(this.byte_pointer);
        this.byte_pointer += 1;
        return value;
    }

    private get_Uint32() {
        const value = this.data_view.getUint32(this.byte_pointer, this.little_endian);
        this.byte_pointer += 4;
        return value;
    }

    private get_Uint64() {
        const value = this.data_view.getBigUint64(this.byte_pointer, this.little_endian);
        this.byte_pointer += 8;
        return value;
    }

    private get_Float64() {
        const value = this.data_view.getFloat64(this.byte_pointer, this.little_endian);
        this.byte_pointer += 8;
        return value;
    }

    // #endregion

    private get_String() {
        const buffer = this.get_SizedBlock();
        const str = new TextDecoder().decode(new Uint8Array(buffer));
        return str;
    }

    private get_AsciiString() {
        let count = 0;
        let char = this.data_view.getUint8(this.byte_pointer + count);
        while (char !== 0) {
            count++;
            char = this.data_view.getUint8(this.byte_pointer + count);
        }
        const uint8array = new Uint8Array(this.data, this.byte_pointer, count);
        const str = new TextDecoder().decode(uint8array);
        this.skip_Bytes(count + 1);
        return str;
    }

    private get_Map() {
        const map: Map<any, any> = new Map();
        const map_size = this.get_Uint32();
        for (let j = 0; j < map_size; j++) {
            const key = this.get_Value();
            const val = this.get_Value();
            map.set(key, val);
        }
        return map;
    }

    private get_ValueInternal(type: ValueDataType) {
        switch (type) {
            case ValueDataType.None: {
                return undefined;
            }
            case ValueDataType.ClassRef: {
                return new ClassRef(this.get_Uint32());
            }
            case ValueDataType.Map: {
                return this.get_Map();
            }
            case ValueDataType.Number: {
                return this.get_Float64();
            }
            case ValueDataType.Boolean: {
                return this.get_Byte() !== 0;
            }
            case ValueDataType.String: {
                return this.get_String();
            }
            case ValueDataType.Vector2: {
                const x = this.get_Float64();
                const y = this.get_Float64();
                return new Vector2(x, y);
            }
            case ValueDataType.Vector3: {
                const x = this.get_Float64();
                const y = this.get_Float64();
                const z = this.get_Float64();
                return new Vector3(x, y, z);
            }
            case ValueDataType.Vector4: {
                const x = this.get_Float64();
                const y = this.get_Float64();
                const z = this.get_Float64();
                const w = this.get_Float64();
                return new Vector4(x, y, z, w);
            }
            case ValueDataType.Matrix3: {
                const n11 = this.get_Float64();
                const n12 = this.get_Float64();
                const n13 = this.get_Float64();
                const n21 = this.get_Float64();
                const n22 = this.get_Float64();
                const n23 = this.get_Float64();
                const n31 = this.get_Float64();
                const n32 = this.get_Float64();
                const n33 = this.get_Float64();
                return new Matrix3(
                    n11, n12, n13,
                    n21, n22, n23,
                    n31, n32, n33
                );
            }
            case ValueDataType.Matrix4: {
                const n11 = this.get_Float64();
                const n12 = this.get_Float64();
                const n13 = this.get_Float64();
                const n14 = this.get_Float64();
                const n21 = this.get_Float64();
                const n22 = this.get_Float64();
                const n23 = this.get_Float64();
                const n24 = this.get_Float64();
                const n31 = this.get_Float64();
                const n32 = this.get_Float64();
                const n33 = this.get_Float64();
                const n34 = this.get_Float64();
                const n41 = this.get_Float64();
                const n42 = this.get_Float64();
                const n43 = this.get_Float64();
                const n44 = this.get_Float64();
                return new Matrix4(
                    n11, n12, n13, n14,
                    n21, n22, n23, n24,
                    n31, n32, n33, n34,
                    n41, n42, n43, n44
                );
            }
            case ValueDataType.Euler: {
                const x = this.get_Float64();
                const y = this.get_Float64();
                const z = this.get_Float64();
                const w = this.get_Float64();
                return new Euler(x, y, z, w);
            }
            case ValueDataType.Quaternion: {
                const x = this.get_Float64();
                const y = this.get_Float64();
                const z = this.get_Float64();
                const w = this.get_Float64();
                return new Quaternion(x, y, z, w);
            }
            case ValueDataType.Box3: {
                const min_x = this.get_Float64();
                const min_y = this.get_Float64();
                const min_z = this.get_Float64();
                const max_x = this.get_Float64();
                const max_y = this.get_Float64();
                const max_z = this.get_Float64();
                return new Box3(new Vector3(min_x, min_y, min_z), new Vector3(max_x, max_y, max_z));
            }
            // typed array
            case ValueDataType.Uint8Array: { return new Uint8Array(this.get_SizedBlock()); }
            case ValueDataType.Uint16Array: { return new Uint16Array(this.get_SizedBlock()); }
            case ValueDataType.Uint32Array: { return new Uint32Array(this.get_SizedBlock()); }
            case ValueDataType.Int8Array: { return new Int8Array(this.get_SizedBlock()); }
            case ValueDataType.Int16Array: { return new Int16Array(this.get_SizedBlock()); }
            case ValueDataType.Int32Array: { return new Int32Array(this.get_SizedBlock()); }
            case ValueDataType.Float32Array: { return new Float32Array(this.get_SizedBlock()); }
            case ValueDataType.Float64Array: { return new Float64Array(this.get_SizedBlock()); }
            case ValueDataType.PackedIndexArray: {
                return new PackedIndexArray(this.get_TypedArray(Uint32Array));
            }
            case ValueDataType.PackedVector2Array: {
                return new PackedVector2Array(this.get_TypedArray(Float32Array));
            }
            case ValueDataType.PackedVector3Array: {
                return new PackedVector3Array(this.get_TypedArray(Float32Array));
            }
            case ValueDataType.PackedVector4Array: {
                return new PackedVector4Array(this.get_TypedArray(Float32Array));
            }
            case ValueDataType.PackedMatrix3Array: {
                return new PackedMatrix3Array(this.get_TypedArray(Float32Array));
            }
            case ValueDataType.PackedMatrix4Array: {
                return new PackedMatrix4Array(this.get_TypedArray(Float32Array));
            }
            default: {
                const n: never = type;
                throw new Error('<ClassBinaryDecoder> append_ValueInternal: unkown value type');
            }
        }
    }

    private get_Value() {
        // type
        const arr_and_type = this.get_Byte();
        const type = arr_and_type & 0b01111111;
        const is_array = (arr_and_type & 0b10000000) !== 0;
        // value
        if (is_array) {
            if (type === 0) {
                return [];
            }
            else {
                const length = this.get_Uint32();
                const array = new Array(length);
                for (let i = 0; i < length; i++) {
                    const value = this.get_ValueInternal(type);
                    array[i] = value;
                }
                return array;
            }
        }
        else {
            return this.get_ValueInternal(type);
        }
    }

    private decode_Instance(): ClassInstanceData {
        // type
        const type = this.get_AsciiString();
        // refid
        const refid = this.get_Uint32();
        // uid
        const uid = this.get_Uint64();
        // unique
        const unique = this.get_Byte() !== 0;
        // external
        const external_flag = this.get_Byte();
        let external: string | undefined = undefined;
        if (external_flag !== 0) {
            external = this.get_String();
        }
        const instance: ClassInstanceData = {
            type,
            refid,
            uid,
            unique,
            external,
            property: undefined
        }
        // property
        const property_count = this.get_Uint32();
        if (property_count > 0) {
            instance.property = new Map();
            for (let i = 0; i < property_count; i++) {
                // key
                const key = this.get_AsciiString();
                // value
                const value = this.get_Value();
                instance.property.set(key, value);
            }
        }
        return instance;
    }

    private validate_MD5(): Result<undefined, Error> {
        const md50 = this.get_Byte();
        const md51 = this.get_Byte();
        const md52 = this.get_Byte();
        const md53 = this.get_Byte();
        const md54 = this.get_Byte();
        const md55 = this.get_Byte();
        const md56 = this.get_Byte();
        const md57 = this.get_Byte();
        const md58 = this.get_Byte();
        const md59 = this.get_Byte();
        const md510 = this.get_Byte();
        const md511 = this.get_Byte();
        const md512 = this.get_Byte();
        const md513 = this.get_Byte();
        const md514 = this.get_Byte();
        const md515 = this.get_Byte();
        const m = ClassBinaryDecoder.#md5_byte_hex_map;
        const data_md5 = `${m[md50]}${m[md51]}${m[md52]}${m[md53]}${m[md54]}${m[md55]}${m[md56]}${m[md57]}${m[md58]}${m[md59]}${m[md510]}${m[md511]}${m[md512]}${m[md513]}${m[md514]}${m[md515]}`;
        this.uint8array.fill(0, MD5HashOffset, MD5HashOffset + 16);
        const calc_md5 = MD5.hash(this.data);
        this.uint8array.set([md50, md51, md52, md53, md54, md55, md56, md57, md58, md59, md510, md511, md512, md513, md514, md515], MD5HashOffset);
        if (data_md5 !== calc_md5) return Result.Error(new Error('<ClassBinaryDecoder> validate_MD5: data is incomplete'));
        return Result.Ok(undefined);
    }

    private decode_Header(): Result<bigint, Error> {
        if (this.data.byteLength < BodyOffset) return Result.Error(new Error('<ClassBinaryDecoder> decode_Header: header invalid'));
        // header
        const header0 = this.get_Byte();
        const header1 = this.get_Byte();
        const header2 = this.get_Byte();
        const header3 = this.get_Byte();
        const header4 = this.get_Byte();
        const header5 = this.get_Byte();
        const header6 = this.get_Byte();
        const header7 = this.get_Byte();
        if (header0 !== 76 || header1 !== 84 || header2 !== 84 || header3 !== 77 ||
            header4 !== 32 || header5 !== 66 || header6 !== 73 || header7 !== 78) return Result.Error(new Error('<ClassBinaryDecoder> decode_Header: header invalid'));
        const flags = this.get_Byte();
        // set little_endian
        this.little_endian = (flags & 0x1) > 0;
        this.version = this.get_Uint32();
        const uid = this.get_Uint64();
        return Result.Ok(uid);
    }

    public decode(): Result<ClassExchangeData, Error> {
        this.init();
        // header
        const uid = this.decode_Header()
        if (uid.failed) return Result.Error(uid.expect_Error());
        // hash
        if (this.validate) {
            const md5_validate = this.validate_MD5();
            if (md5_validate.failed) return Result.Error(md5_validate.expect_Error());
        }
        else this.skip_Bytes(16);
        // preserved
        const preserved = this.get_Uint64();
        // root
        const root = this.get_Uint32();
        // count
        const count = this.get_Uint32();
        // meta
        const meta_length = this.get_Uint32();
        let meta: Map<any, any> | undefined = undefined;
        if (meta_length > 0) {
            if (this.ignore_meta) {
                this.skip_Bytes(meta_length);
            }
            else {
                meta = this.get_Map();
            }
        }
        const exchange_data: ClassExchangeData = {
            root,
            uid: uid.expect(),
            meta,
            instances: new Array<ClassInstanceData>(count),
        };
        // instances
        try {
            for (let i = 0; i < count; i++) {
                const instance = this.decode_Instance();
                exchange_data.instances[i] = instance;
            }
        }
        catch (err) {
            return Result.Error(err as Error);
        }

        return Result.Ok(exchange_data);
    }
}