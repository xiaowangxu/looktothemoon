import type { ValueDatabase } from "./databases/ValueDatabase";

export class ValueObject<T = any> {
    public readonly value: T;

    constructor(value: T) {
        this.value = value;
    }

    private static stringify(obj: any, value_db: ValueDatabase): string | undefined {
        if (obj === undefined) return undefined;
        if (obj === null) return 'null';
        if (value_db.has_ValueSaver(obj)) return JSON.stringify(value_db.save_Value(obj));
        if (obj instanceof Array) {
            const items = [];
            for (const o of obj) {
                const str = ValueObject.stringify(o, value_db);
                if (str !== undefined) {
                    items.push(str);
                }
            }
            return `[${items.join(',')}]`
        }
        if (obj instanceof Object) {
            const items = [];
            for (const [key, o] of Object.entries(obj)) {
                const str = ValueObject.stringify(o, value_db);
                if (str !== undefined) {
                    items.push(`"${key}":${str}`);
                }
            }
            return `{${items.join(',')}}`
        }
        throw new Error(`can not stringify object`);
    }

    private static parse(value: string | any[] | Object, value_db: ValueDatabase): any {
        if (value instanceof Array || value instanceof Object) {
            return value;
        }
        return value_db.load_Value(value as string);
    }

    public static save<V = any>(v: ValueObject<V>, value_db: ValueDatabase) {
        const str = ValueObject.stringify(v.value, value_db);
        if (str === undefined) throw new Error(`can not stringify object`);
        return str;
    }

    public static load<V = any>(v: string, value_db: ValueDatabase): ValueObject<V> {
        return new ValueObject<V>(JSON.parse(v, (key, value) => ValueObject.parse(value, value_db)));
    }
}