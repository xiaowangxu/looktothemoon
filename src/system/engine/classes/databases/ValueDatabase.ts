import { type ValueBase } from "./ValueBase";
import { PlainObject } from "../PlainObject";
import { ValueObject } from "../ValueObject";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Euler } from "@/system/fivepebble/linear_algebra/Euler";
import { Quaternion } from "@/system/fivepebble/linear_algebra/Quaternion";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";

export class ValueDatabase {
    private readonly saver: Map<Function, (v: any, value_db: ValueDatabase) => string> = new Map();
    private readonly loader: Map<string, (v: string, value_db: ValueDatabase) => any> = new Map();

    public register_Value(name: string, type: Function, saver: (v: any, value_db: ValueDatabase) => string, loader: (v: string, value_db: ValueDatabase) => any) {
        this.saver.set(type, (v, vdb) => `${name}(${saver(v, vdb)})`);
        this.loader.set(name, loader);
    }

    public has_ValueSaver(value: any) {
        if (value === undefined || value === null) return false;
        const cons = value.constructor;
        if (cons === undefined) return false;
        return this.saver.has(cons);
    }

    public has_ValueLoader(type: string) {
        return this.loader.has(type);
    }

    public save_Value(value: any) {
        if (value === undefined) throw new Error('can not save undefined');
        if (value === null) return 'null';
        const cons = value.constructor;
        if (cons === undefined) throw new Error('can not save value');
        const saver = this.saver.get(cons);
        if (saver === undefined) throw new Error(`can not save value of ${cons.name}`);
        return saver(value, this);
    }

    public load_Value(value: string): any {
        if (value === 'null') return null;
        const first_idx_of_lcir = value.indexOf('(', 0);
        if (first_idx_of_lcir < 0) throw new Error(`error format of value '${value}'`);
        const type = value.substring(0, first_idx_of_lcir);
        if (!this.has_ValueLoader(type)) throw new Error(`can not load value of type ${type}`);
        const v = value.substring(first_idx_of_lcir + 1, value.length - 1);
        return this.loader.get(type)!(v, this);
    }
}

export const ValueDB = new ValueDatabase();

ValueDB.register_Value('number', Number, v => v.toString(), v => parseFloat(v));
ValueDB.register_Value('string', String, v => JSON.stringify(v), v => JSON.parse(v));
ValueDB.register_Value('boolean', Boolean, v => v ? 'true' : 'false', v => v === 'true');
ValueDB.register_Value('vector2', Vector2, v => `${v.x},${v.y}`, v => {
    const nums = v.split(',');
    const x = parseFloat(nums[0]), y = parseFloat(nums[1]);
    return new Vector2(x, y);
});
ValueDB.register_Value('vector3', Vector3, v => `${v.x},${v.y},${v.z}`, v => {
    const nums = v.split(',');
    const x = parseFloat(nums[0]), y = parseFloat(nums[1]), z = parseFloat(nums[2]);
    return new Vector3(x, y, z);
});
ValueDB.register_Value('vector4', Vector4, v => `${v.x},${v.y},${v.z},${v.w}`, v => {
    const nums = v.split(',');
    const x = parseFloat(nums[0]), y = parseFloat(nums[1]), z = parseFloat(nums[2]), w = parseFloat(nums[3]);
    return new Vector4(x, y, z, w);
});
ValueDB.register_Value('euler', Euler, v => `${v.x},${v.y},${v.z},${v.order}`, v => {
    const nums = v.split(',');
    const x = parseFloat(nums[0]), y = parseFloat(nums[1]), z = parseFloat(nums[2]), order = parseInt(nums[3]);
    return new Euler(x, y, z, order);
});
ValueDB.register_Value('quaternion', Quaternion, v => `${v.x},${v.y},${v.z},${v.w}`, v => {
    const nums = v.split(',');
    const x = parseFloat(nums[0]), y = parseFloat(nums[1]), z = parseFloat(nums[2]), w = parseFloat(nums[3]);
    return new Quaternion(x, y, z, w);
});
ValueDB.register_Value('matrix3', Matrix3, v => v.array.join(','), v => {
    const nums = v.split(',');
    const v0 = parseFloat(nums[0]), v1 = parseFloat(nums[1]), v2 = parseFloat(nums[2]), v3 = parseFloat(nums[3]), v4 = parseFloat(nums[4]), v5 = parseFloat(nums[5]), v6 = parseFloat(nums[6]), v7 = parseFloat(nums[7]), v8 = parseFloat(nums[8]);
    return new Matrix3(v0, v3, v6, v1, v4, v7, v2, v5, v8);
});
ValueDB.register_Value('matrix4', Matrix4, v => v.array.join(','), v => {
    const nums = v.split(',');
    const v0 = parseFloat(nums[0]), v1 = parseFloat(nums[1]), v2 = parseFloat(nums[2]), v3 = parseFloat(nums[3]), v4 = parseFloat(nums[4]), v5 = parseFloat(nums[5]), v6 = parseFloat(nums[6]), v7 = parseFloat(nums[7]), v8 = parseFloat(nums[8]), v9 = parseFloat(nums[9]), v10 = parseFloat(nums[10]), v11 = parseFloat(nums[11]), v12 = parseFloat(nums[12]), v13 = parseFloat(nums[13]), v14 = parseFloat(nums[14]), v15 = parseFloat(nums[15]);
    return new Matrix4(v0, v1, v2, v3,
        v4, v5, v6, v7,
        v8, v8, v10, v11,
        v12, v13, v14, v15);
});
ValueDB.register_Value('plainobject', PlainObject, v => PlainObject.save(v), v => PlainObject.load(v));
ValueDB.register_Value('valueobject', ValueObject, (v, vdb) => ValueObject.save(v, vdb), (v, vdb) => ValueObject.load(v, vdb));
