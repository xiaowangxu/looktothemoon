import { ClassBase } from "../class_database/ClassBase";
import type { RefId } from "./ClassSaverLoader";

export class ClassRef {
    public readonly refid: RefId;

    constructor(refid: RefId) {
        this.refid = refid;
    }
}

export interface ClassWriterScope {
    create_InstanceRef(obj: ClassBase): ClassRef;
    add_InstanceProperty(base: ClassBase, key: string, value: any): void;
}

export class ClassWriter {
    private readonly scope: ClassWriterScope;
    private readonly base: ClassBase;

    constructor(scope: ClassWriterScope, base: ClassBase) {
        this.scope = scope;
        this.base = base;
    }

    public ref(obj: ClassBase) {
        return this.scope.create_InstanceRef(obj);
    }

    public property(key: string, value: any) {
        if (value instanceof ClassBase) {
            const refid = this.scope.create_InstanceRef(value);
            this.scope.add_InstanceProperty(this.base, key, refid);
        }
        else {
            this.scope.add_InstanceProperty(this.base, key, value);
        }
        return this;
    }
}

export interface ClassReaderScope {
    get_Instance(refid: RefId): ClassBase | undefined;
}

export class ClassReader {
    private readonly scope: ClassReaderScope;
    private readonly property: Map<string, any>;

    constructor(scope: ClassReaderScope, property: Map<string, any>) {
        this.scope = scope;
        this.property = property;
    }

    public get<T>(key: string | ClassRef): T | undefined {
        if (key instanceof ClassRef) return this.scope.get_Instance(key.refid) as T;
        const data = this.property.get(key);
        if (data === undefined) return undefined;
        if (data instanceof ClassRef) return this.scope.get_Instance(data.refid) as T;
        return data as T;
    }
}