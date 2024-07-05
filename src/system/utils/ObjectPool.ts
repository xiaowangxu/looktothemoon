import { IndexedVec } from "../structures/IndexedVec";
import type { Indexed } from "./Type";

export class ObjectPool<T extends Indexed> {

    protected readonly objects: IndexedVec<T>;
    protected _active_count: number = 0;
    protected getter: () => T;
    public readonly allow_grow: boolean;

    public get active_count() { return this._active_count; }
    public get inactive_count() { return this.objects.length - this._active_count; }
    public get length() { return this.objects.length; }

    constructor(getter: () => T, initial_capacity: number, allow_grow: boolean = false) {
        this.getter = getter;
        this.allow_grow = allow_grow;
        this.objects = new IndexedVec<T>(initial_capacity);
    }

    public get() {
        if (this.objects.length - this._active_count === 0) {
            if (this.objects.capacity > this.objects.length || this.allow_grow) {
                const obj = this.getter();
                this.objects.push(obj);
            }
        }
        // get one
        if (this.objects.length - this._active_count === 0) return undefined;
        return this.objects.get(this._active_count++);
    }

    public give_back(obj: T) {
        if (this.active_count === 0) return;
        this.objects.swap(obj.index, --this._active_count);
    }
}