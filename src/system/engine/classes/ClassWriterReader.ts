import { ClassBase } from "./ClassBase";
import type { ClassLoader, ClassSaverScope, RefId } from "./ClassSaverLoader";

export class ClassRef {
    public readonly refid: RefId;

    constructor(refid: RefId) {
        this.refid = refid;
    }
}

export class ClassWriter {
    private readonly scope: ClassSaverScope;
    private readonly base: ClassBase;

    constructor(scope: ClassSaverScope, base: ClassBase) {
        this.scope = scope;
        this.base = base;
    }

    public initialization(key: string, value: any) {
        if (value === undefined) return this;
        if (value instanceof ClassBase) {
            const refid = this.scope.create_Ref(this.base, value);
            this.scope.add_Initialization(this.base, key, new ClassRef(refid));
        }
        else {
            this.scope.add_Initialization(this.base, key, value);
        }
        return this;
    }

    public property(key: string, value: any) {
        if (value === undefined) return this;
        if (value instanceof ClassBase) {
            const refid = this.scope.add_Ref(value);
            this.scope.add_Property(this.base, key, new ClassRef(refid));
        }
        else {
            this.scope.add_Property(this.base, key, value);
        }
        return this;
    }
}

export class ClassReader {
    private readonly loader: ClassLoader;
    private readonly property: { [key: string]: any };

    constructor(loader: ClassLoader, property: { [key: string]: any }) {
        this.loader = loader;
        this.property = property;
    }

    public get<T>(key: string | ClassRef): any | undefined {
        if (key instanceof ClassRef) return this.loader.get_Instance(key.refid) as T;
        const data = this.property[key];
        if (data === undefined) return undefined;
        if (data instanceof ClassRef) return this.loader.get_Instance(data.refid) as T;
        return data as T;
    }
}