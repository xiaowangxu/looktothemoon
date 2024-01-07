import { Ref, type RefCounted } from '../../utils/RefCounted';
import { SignalEmitter } from '../../utils/SignalEmitter';
import { ConfiguredObject, type Config } from '../ConfiguredObject';
import { ClassBase } from "../classes/class_database/ClassBase";

export abstract class ResourceBase extends ClassBase implements RefCounted {
    public static readonly class_name: string = "ResourceBase";

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

    protected _unique: boolean = false;
    public get unique() { return this._unique; }
    public set unique(unique: boolean) { this._unique = unique; }

    public path: string | undefined = undefined;
    public get is_external() { return this.path !== undefined; }

    protected abstract dispose(): void;
}

export abstract class Resource extends ResourceBase {
    public static readonly class_name: string = "Resource";

    public signal_changed: SignalEmitter<() => void> = new SignalEmitter();

    protected trigger_Changed() {
        this.signal_changed.trigger();
    }
}

export class ResourceInstanceCache extends ConfiguredObject {
    private readonly instance_map: Map<string, Ref<ResourceBase>> = new Map();

    constructor(config: Config) {
        super(config);
    }

    public add(path: string, resource: ResourceBase) {
        if (this.instance_map.has(path)) {
            this.instance_map.get(path)!.value = resource;
        }
        else {
            this.instance_map.set(path, new Ref(resource));
        }
    }

    public get<T extends ResourceBase>(path: string): T | undefined {
        return this.instance_map.get(path)?.expect as T | undefined;
    }

    public clear() {
        for (const ref of this.instance_map.values()) {
            ref.clear();
        }
        this.instance_map.clear();
    }
}