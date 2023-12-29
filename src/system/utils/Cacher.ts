export class Cacher<Arg, Type> {
    private cache_map: Map<Arg, Type> = new Map();
    private readonly getter: (arg: Arg) => Type;

    constructor(getter: (arg: Arg) => Type) {
        this.getter = getter;
    }

    public get(arg: Arg): Type {
        if (this.cache_map.has(arg)) return this.cache_map.get(arg)!;
        const t = this.getter(arg);
        this.cache_map.set(arg, t);
        return t;
    }
}