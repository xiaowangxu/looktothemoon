import { Result } from "@/system/utils/Result";
import { ClassEncoder } from "./ClassEncoderDecoder";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { ClassRef } from "../ClassWriterReader";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Euler } from "@/system/fivepebble/linear_algebra/Euler";
import { Quaternion } from "@/system/fivepebble/linear_algebra/Quaternion";

// Lttm Bin format
//   |-------|-------|-------|-------|-------|-------|-------|-------|
//   |  I32  |  I32  |  I32  |  I32  |  I32  |  I32  |  I32  |  I32  |
//   |-------|-------|-------|-------|-------|-------|-------|-------| ----  0 Bytes -----+
//   |'LTTM' |'BIN ' | Flags | Ver 0 | Ver 1 | Ver 2 |       |       |                    |  32 Bytes
//   |-------|-------|-------|-------|-------|-------|-------|-------| ---- 32 Bytes -----+
//   | root  | count | inst  |       |       |       |       |       |                    |  32 Bytes
//   |-------|-------|-------|-------|-------|-------|-------|-------| ---- 64 Bytes -----+

const LittleEndian = false;
const Version0 = 1;
const Version1 = 2;
const Version2 = 3;

enum BinaryDataType {
    Byte, Uint16, Uint32, Uint64, Int8, Int16, Int32, Int64, Float32, Float64, Block,
}

const BinaryDataByteLength = new Uint8Array([
    1, 2, 4, 8, 1, 2, 4, 8, 4, 8
]);

enum ValueDataType {
    None = 0,
    ClassRef = 1,
    Map = 8,
    Number = 16, Boolean, String,
    Vector2 = 32, Vector3, Vector4, Matrix3, Matrix4, Euler, Quaternion,
}

export class ClassBinaryEncoder extends ClassEncoder<ArrayBuffer, undefined> {
    private datas: { type: BinaryDataType, value: any, length: number }[] = [];
    private byte_length: number = 0;

    private clear() {
        this.datas = [];
        this.byte_length = 0;
    }

    private get_Data() {
        const data = new ArrayBuffer(this.byte_length);
        const v = new DataView(data);
        const u = new Uint8Array(data);
        let i = 0;
        for (const { type, value, length } of this.datas) {
            switch (type) {
                case BinaryDataType.Byte: v.setUint8(i, value); break;
                case BinaryDataType.Uint16: v.setUint16(i, value, LittleEndian); break;
                case BinaryDataType.Uint32: v.setUint32(i, value, LittleEndian); break;
                case BinaryDataType.Uint64: v.setBigUint64(i, value, LittleEndian); break;
                case BinaryDataType.Int8: v.setInt8(i, value); break;
                case BinaryDataType.Int16: v.setInt16(i, value, LittleEndian); break;
                case BinaryDataType.Int32: v.setInt32(i, value, LittleEndian); break;
                case BinaryDataType.Int64: v.setBigInt64(i, value, LittleEndian); break;
                case BinaryDataType.Float32: v.setFloat32(i, value, LittleEndian); break;
                case BinaryDataType.Float64: v.setFloat64(i, value, LittleEndian); break;
                case BinaryDataType.Block: {
                    v.setUint32(i, length - 4);
                    u.set((value as Uint8Array), i + 4);
                    break;
                }
                default: {
                    const n: never = type;
                }
            }
            i += length;
        }
        return data;
    }

    // #region Base Api

    private append(type: BinaryDataType, value: any) {
        if (type === BinaryDataType.Block) {
            if (value instanceof Uint8Array) {
                const len = value.byteLength + 4;
                this.datas.push({ type, value, length: len });
                this.byte_length += len;
            }
            else {
                throw new Error('<ClassBinaryEncoder> append: block data\'s value is not Uint8Array');
            }
        }
        else {
            const len = BinaryDataByteLength[type];
            this.datas.push({ type, value, length: len });
            this.byte_length += len;
        }
        return this;
    }

    private append_Byte(value: number) {
        return this.append(BinaryDataType.Byte, value);
    }

    private append_Char(value: string) {
        return this.append(BinaryDataType.Byte, value.codePointAt(0));
    }

    private append_Int8(value: number) {
        return this.append(BinaryDataType.Int8, value);
    }

    private append_Uint16(value: number) {
        return this.append(BinaryDataType.Uint16, value);
    }

    private append_Int16(value: number) {
        return this.append(BinaryDataType.Int16, value);
    }

    private append_Uint32(value: number) {
        return this.append(BinaryDataType.Uint32, value);
    }

    private append_Int32(value: number) {
        return this.append(BinaryDataType.Int32, value);
    }

    private append_Uint64(value: bigint) {
        return this.append(BinaryDataType.Uint64, value);
    }

    private append_Int64(value: bigint) {
        return this.append(BinaryDataType.Int64, value);
    }

    private append_Float32(value: number) {
        return this.append(BinaryDataType.Float32, value);
    }

    private append_Float64(value: number) {
        return this.append(BinaryDataType.Float64, value);
    }

    // #endregion

    private append_String(value: string) {
        const array = new TextEncoder().encode(value);
        return this.append(BinaryDataType.Block, array);
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
            this.append_Uint16(type);
            this.append_ValueInternal(value, type);
        }
        else if (value.length === 0) {
            this.append_Uint16(0b1000000000000000); // empty array 
        }
        else {
            const type = this.get_ValueType(value[0]);
            this.append_Uint16(0b1000000000000000 | type);
            this.append_Uint32(value.length);
            // array instance
            for (let i = 0; i < value.length; i++) {
                this.append_ValueInternal(value[i], type);
            }
        }
    }

    private get_ValueType(value: any): ValueDataType {
        if (typeof value === 'number') return ValueDataType.Number;
        if (typeof value === 'boolean') return ValueDataType.Boolean;
        if (typeof value === 'string') return ValueDataType.String;
        if (value instanceof ClassRef) return ValueDataType.ClassRef;
        if (value instanceof Map) return ValueDataType.Map;
        if (value instanceof Vector2) return ValueDataType.Vector2;
        if (value instanceof Vector3) return ValueDataType.Vector3;
        if (value instanceof Vector4) return ValueDataType.Vector4;
        if (value instanceof Matrix3) return ValueDataType.Matrix3;
        if (value instanceof Matrix4) return ValueDataType.Matrix4;
        if (value instanceof Euler) return ValueDataType.Euler;
        if (value instanceof Quaternion) return ValueDataType.Quaternion;
        throw new Error('<ClassBinaryEncoder> get_ValueType: unkown value type');
    }

    public encode(): Result<ArrayBuffer, Error> {
        this.clear();
        // header
        this.append_Char('L').append_Char('T').append_Char('T').append_Char('M');
        this.append_Char(' ').append_Char('B').append_Char('I').append_Char('N'); // LTTM BIN
        this.append_Byte(0).append_Byte(0).append_Byte(0).append_Byte(LittleEndian ? 1 : 0); // flags 0000|0000|0001 --- for little_endian
        this.append_Uint32(Version0).append_Uint32(Version1).append_Uint32(Version2); // verions xxx.xxx.xxx --- 3 * uint32 eg: 0.0.1
        const date = Date.now();
        this.append_Uint64(BigInt(date)); // date
        // root
        this.append_Uint32(this.data.root); // root refid
        // count
        this.append_Uint32(this.data.instances.length); // instances' count
        // instances may throw Error
        try {
            for (const instance of this.data.instances) {
                this.append_String(instance.type); // type
                this.append_Uint32(instance.refid); // refid
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
                    this.append_String(key);
                    // type - value
                    this.append_Value(value);
                }
            }
        }
        catch (err) {
            return Result.Error(err as Error);
        }
        const data = this.get_Data();
        // console.group('decode');
        // decode_test(data);
        // console.groupEnd();
        return Result.Ok(data);
    }
}

// Decoder

function decode_Block(buffer: DataView, i: number, little_endian: boolean = false) {
    const count = buffer.getUint32(i, little_endian);
    return { block: buffer.buffer.slice(i + 4, i + 4 + count), count: count + 4 };
}

function decode_string(buffer: DataView, i: number, little_endian: boolean = false) {
    const { block, count } = decode_Block(buffer, i, little_endian);
    const str = new TextDecoder().decode(block);
    return { string: str, count };
}

function decode_Map(buffer: DataView, i: number, little_endian: boolean = false) {
    let count = 0;
    const value: Map<any, any> = new Map();
    const map_size = buffer.getUint32(i, little_endian); i += 4; count += 4;
    for (let j = 0; j < map_size; j++) {
        const { value: _key, count: _c } = decode_Value(buffer, i, little_endian);
        i += _c; count += _c;
        const { value: _val, count: __c } = decode_Value(buffer, i, little_endian);
        i += __c; count += __c;
        value.set(_key, _val);
    }
    return { value, count };
}

function decode_ValueInternal(buffer: DataView, i: number, little_endian: boolean = false, type: ValueDataType) {
    let count = 0;
    let value;
    switch (type) {
        case ValueDataType.None: {
            break;
        }
        case ValueDataType.ClassRef: {
            value = new ClassRef(buffer.getUint32(i, little_endian));
            i += 4;
            count += 4;
            break;
        }
        case ValueDataType.Map: {
            const { value: _v, count: _c } = decode_Map(buffer, i, little_endian);
            i += _c;
            count += _c;
            value = _v;
            break;
        }
        case ValueDataType.Number: {
            value = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            break;
        }
        case ValueDataType.Boolean: {
            value = buffer.getUint8(i) !== 0;
            i += 1;
            count += 1;
            break;
        }
        case ValueDataType.String: {
            const { string: key, count: _c } = decode_string(buffer, i, little_endian);
            value = key;
            i += _c;
            count += _c;
            break;
        }
        case ValueDataType.Vector2: {
            const x = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            const y = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            value = new Vector2(x, y);
            break;
        }
        case ValueDataType.Vector3: {
            const x = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            const y = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            const z = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            value = new Vector3(x, y, z);
            break;
        }
        case ValueDataType.Vector4: {
            const x = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            const y = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            const z = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            const w = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            value = new Vector4(x, y, z, w);
            break;
        }
        case ValueDataType.Matrix3: {
            const n11 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n12 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n13 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n21 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n22 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n23 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n31 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n32 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n33 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            value = new Matrix3(
                n11, n12, n13,
                n21, n22, n23,
                n31, n32, n33
            );
            break;
        }
        case ValueDataType.Matrix4: {
            const n11 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n12 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n13 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n14 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n21 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n22 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n23 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n24 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n31 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n32 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n33 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n34 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n41 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n42 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n43 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            const n44 = buffer.getFloat64(i, little_endian); i += 8; count += 8;
            value = new Matrix4(
                n11, n12, n13, n14,
                n21, n22, n23, n24,
                n31, n32, n33, n34,
                n41, n42, n43, n44
            );
            break;
        }
        case ValueDataType.Euler: {
            const x = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            const y = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            const z = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            const w = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            value = new Euler(x, y, z, w);
            break;
        }
        case ValueDataType.Quaternion: {
            const x = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            const y = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            const z = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            const w = buffer.getFloat64(i, little_endian);
            i += 8;
            count += 8;
            value = new Quaternion(x, y, z, w);
            break;
        }
    }
    return { value, count };
}

function decode_Value(buffer: DataView, i: number, little_endian: boolean = false) {
    let count = 0;
    let t;
    let value;
    // type
    const type = buffer.getUint16(i, little_endian); i += 2; count += 2;
    const _type = (type & 0b0111111111111111);
    const is_array = (type & 0b1000000000000000) !== 0;
    if (is_array) {
        if (_type === 0) {
            t = `[]`; // empty array
            value = [];
        }
        else {
            const length = buffer.getUint32(i, little_endian); i += 4; count += 4;
            t = `${ValueDataType[_type]}[${length}]`; // typed array
            const array = [];
            for (let j = 0; j < length; j++) {
                const { value, count: _c } = decode_ValueInternal(buffer, i, little_endian, _type);
                array.push(value);
                i += _c;
                count += _c;
            }
            value = array;
        }
    }
    else {
        t = `${ValueDataType[_type]}`;
        const { value: _v, count: _c } = decode_ValueInternal(buffer, i, little_endian, _type);
        value = _v;
        i += _c;
        count += _c;
    }
    return { type: t, value, count };
}

function decode_Property(buffer: DataView, i: number, little_endian: boolean = false) {
    let count = 0;
    // key
    const { string: key, count: _c } = decode_string(buffer, i, little_endian); i += _c; count += _c;
    console.log("key\t\t\t", `"${key}"`);
    // value
    const { type, value, count: __c } = decode_Value(buffer, i, little_endian);
    console.log("type\t\t", type);
    console.log("value\t\t", value);
    i += __c;
    count += __c;
    return count;
}

function decode_Instance(buffer: DataView, i: number, little_endian: boolean = false) {
    let count = 0;
    // type
    const { string: type, count: _c } = decode_string(buffer, i, little_endian); i += _c; count += _c;
    console.log("type\t\t\t", `"${type}"`);
    // refid
    const refid = buffer.getUint32(i, little_endian); i += 4; count += 4;
    console.log("refid\t\t\t", refid);
    // unique
    const unique = buffer.getUint8(i++); count++;
    console.log("unique\t\t\t", unique !== 0);
    // external
    const external_flag = buffer.getUint8(i++); count++;
    if (external_flag !== 0) {
        const { string: external, count: _c } = decode_string(buffer, i, little_endian); i += _c; count += _c;
        console.log("external\t\t", `"${external}"`);
    }
    else {
        console.log("external\t\t", false);
    }
    // property
    const property_count = buffer.getUint32(i, little_endian); i += 4; count += 4;
    if (property_count > 0) {
        console.group("properties");
        for (let j = 0; j < property_count; j++) {
            console.group("property", j);
            const c = decode_Property(buffer, i, little_endian);
            i += c;
            count += c;
            console.groupEnd();
        }
        console.groupEnd();
    }
    return count;
}

function decode_test(buffer: ArrayBuffer) {
    const v = new DataView(buffer);
    let i = 0;
    // header
    const header0 = String.fromCodePoint(v.getUint8(i++));
    const header1 = String.fromCodePoint(v.getUint8(i++));
    const header2 = String.fromCodePoint(v.getUint8(i++));
    const header3 = String.fromCodePoint(v.getUint8(i++));
    const header4 = String.fromCodePoint(v.getUint8(i++));
    const header5 = String.fromCodePoint(v.getUint8(i++));
    const header6 = String.fromCodePoint(v.getUint8(i++));
    const header7 = String.fromCodePoint(v.getUint8(i++));
    console.log("header\t\t\t", header0, header1, header2, header3, header4, header5, header6, header7);
    const flags0 = v.getUint8(i++);
    const flags1 = v.getUint8(i++);
    const flags2 = v.getUint8(i++);
    const flags3 = v.getUint8(i++);
    console.log("flags\t\t\t", flags0, flags1, flags2, flags3);
    const little_endian = (flags3 & 0x1) > 0;
    console.log("little_endian\t", little_endian);
    const version0 = v.getUint32(i, little_endian); i += 4;
    const version1 = v.getUint32(i, little_endian); i += 4;
    const version2 = v.getUint32(i, little_endian); i += 4;
    console.log("version\t\t\t", `${version0}.${version1}.${version2}`);
    const date = v.getBigUint64(i, little_endian); i += 8;
    const d = new Date(Number(date));
    console.log("date\t\t\t", d.toLocaleDateString(), d.toLocaleTimeString());
    // root
    const root = v.getUint32(i, little_endian); i += 4;
    console.log("root\t\t\t", root);
    // count
    const count = v.getUint32(i, little_endian); i += 4;
    // instances
    for (let j = 0; j < count; j++) {
        console.group("instance", j);
        const c = decode_Instance(v, i, little_endian);
        console.groupEnd();
        i += c;
    }
    // end
}