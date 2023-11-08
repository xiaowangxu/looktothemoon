import { SignalEmitter } from '../utils/SignalEmitter';
import { ClassBase } from './classes/ClassBase';

export class Resource extends ClassBase {
    public static readonly class_name: string = "Resource";

    protected _unique: boolean = false;
    public get unique() { return this._unique; }
    public set unique(unique: boolean) { this._unique = unique; }

    public path: string | undefined = undefined;
    public get is_external() { return this.path !== undefined; }

    public signal_changed: SignalEmitter<() => void> = new SignalEmitter();

    protected trigger_Changed() {
        this.signal_changed.trigger();
    }
}

export class ResourceInstanceCache {
    private readonly instance_map: Map<string, Resource> = new Map();

    public get paths() { return [...this.instance_map.keys()]; }

    constructor() {

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

export const DefaultResourceInstanceCache = new ResourceInstanceCache();