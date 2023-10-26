export class Cacher<T> {
    private cache: T | undefined = undefined;
    private readonly getter: ()=>T;

    public get value(): T {
        if (this.cache === undefined) {
            this.cache = this.getter();
        }
        return this.cache;
    }

    constructor(getter: ()=>T) {
        this.getter = getter;
    }
}