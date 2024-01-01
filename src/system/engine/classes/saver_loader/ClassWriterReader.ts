import { ClassBase } from "../databases/ClassBase";
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

    public ref(obj: ClassBase) {
        return this.scope.add_InstanceRef(obj);
    }

    public property(key: string, value: any) {
        if (value === undefined) return this;
        if (value instanceof ClassBase) {
            const refid = this.scope.add_InstanceRef(value);
            this.scope.add_InstanceProperty(this.base, key, refid);
        }
        else {
            this.scope.add_InstanceProperty(this.base, key, value);
        }
        return this;
    }
}

export class ClassReader {
    private readonly loader: ClassLoader;
    private readonly property: Map<string, any>;

    constructor(loader: ClassLoader, property: Map<string, any>) {
        this.loader = loader;
        this.property = property;
    }

    public get<T>(key: string | ClassRef): T | undefined {
        if (key instanceof ClassRef) return this.loader.get_Instance(key.refid) as T;
        const data = this.property.get(key);
        if (data === undefined) return undefined;
        if (data instanceof ClassRef) return this.loader.get_Instance(data.refid) as T;
        return data as T;
    }
}