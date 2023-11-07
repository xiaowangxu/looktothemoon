export class PlainObject {
    public readonly value: any[] | any;

    constructor(value: any[] | Object) {
        this.value = value;
    }

    public static save(v: PlainObject) {
        return JSON.stringify(v.value);
    }

    public static load(v: string): PlainObject {
        return new PlainObject(JSON.parse(v));
    }
}