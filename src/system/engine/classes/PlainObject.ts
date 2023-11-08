export class PlainObject<T = any> {
    public readonly value: T;

    constructor(value: T) {
        this.value = value;
    }

    public static save<V = any>(v: PlainObject<V>) {
        return JSON.stringify(v.value);
    }

    public static load<V = any>(v: string): PlainObject<V> {
        return new PlainObject<V>(JSON.parse(v));
    }
}