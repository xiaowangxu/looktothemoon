import { Ref, unref, type RefCounted, type Refed } from '../../utils/RefCounted';
import { SignalEmitter } from '../../utils/SignalEmitter';
import { ConfiguredObject, type Config } from '../ConfiguredObject';
import { ClassBase } from "../classes/class_database/ClassBase";

export abstract class ResourceBase extends ClassBase {
    public static readonly class_name: string = "ResourceBase";

    protected _unique: boolean = false;
    public get unique() { return this._unique; }
    public set unique(unique: boolean) { this._unique = unique; }

    public path: string | undefined = undefined;
    public get is_external() { return this.path !== undefined; }

    protected abstract dispose(): void;
}

export abstract class ResourceRefCounted extends ResourceBase implements RefCounted {
    public static readonly class_name: string = "ResourceRefCounted";

    private _ref_count: number = 0;
    public get ref_count(): number { return this._ref_count; }

    public ref(): void { this._ref_count++; }

    public unref(): void {
        this._ref_count--;
        if (this._ref_count <= 0) {
            this._ref_count = 0;
            this.dispose();
        }
    }
}

export abstract class Resource extends ResourceRefCounted {
    public static readonly class_name: string = "Resource";

    public signal_changed: SignalEmitter<() => void> = new SignalEmitter();

    protected trigger_Changed() {
        this.signal_changed.trigger();
    }
}

export class ResourceInstanceCache extends ConfiguredObject {
    private readonly instance_map: Map<string, Refed<ResourceBase | ResourceRefCounted>> = new Map();

    constructor(config: Config) {
        super(config);
    }

    public add(path: string, resource: ResourceBase | ResourceRefCounted) {
        if (this.instance_map.has(path)) return;
        else this.instance_map.set(path, resource instanceof ResourceRefCounted ? new Ref(resource) : resource);
    }

    public get<T extends ResourceBase>(path: string): T | undefined {
        const res = this.instance_map.get(path);
        if (res === undefined) return undefined;
        return (res instanceof Ref ? res.expect : res) as T;
    }

    public has(path: string): boolean {
        return this.get(path) !== undefined;
    }

    public clear() {
        for (const ref of this.instance_map.values()) {
            if (ref instanceof Ref) ref.clear();
        }
        this.instance_map.clear();
    }
}