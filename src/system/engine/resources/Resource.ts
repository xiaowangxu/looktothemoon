import type { RefCounted } from '../../utils/RefCounted';
import { SignalEmitter } from '../../utils/SignalEmitter';
import { ConfiguredObject, type Config } from '../ConfiguredObject';
import { ClassBase } from '../classes/ClassBase';

export abstract class ResourceBase extends ClassBase implements RefCounted {
    public static readonly class_name: string = "ResourceBase";

    private _ref_count: number = 0;
    public ref_count(): number { return this._ref_count; }
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
    private readonly instance_map: Map<string, Resource> = new Map();

    public get paths() { return [...this.instance_map.keys()]; }

    constructor(config: Config) {
        super(config);
    }

    public add(path: string, instance: Resource) {
        this.instance_map.set(path, instance);
    }

    public get<T extends Resource>(path: string) {
        return this.instance_map.get(path);
    }

    public clear() {
        this.instance_map.clear();
    }
}