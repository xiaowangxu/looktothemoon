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
                this.objects.push(this.getter());
            }
        }
        // get one
        if (this.objects.length - this._active_count === 0) return undefined;
        return this.objects.get(this._active_count++);
    }

    public warm_up(count: number) {
        const length = this.objects.length;
        const inactive_count = length - this._active_count;
        const remain_count = this.allow_grow ? count - inactive_count : Math.min(this.objects.capacity - length, count - inactive_count);
        if (remain_count > 0) {
            for (let i = 0; i < remain_count; i++) {
                this.objects.push(this.getter());
            }
        }
    }

    public give_back(obj: T) {
        if (this.active_count === 0) return;
        this.objects.swap(obj.index, --this._active_count);
    }
}

//#region Example
// class PooledObject implements Indexed {

//     static id: number = 0;

//     protected _index: number = 0;

//     get index(): number {
//         return this._index;
//     }
//     set index(index: number) {
//         this._index = index;
//     }

//     public id = PooledObject.id++;
// }

// const pool = new ObjectPool(() => new PooledObject(), 5, true);
// pool.warm_up(3);
// pool.warm_up(50);
// console.log(pool);
// const obj_0 = pool.get()!;
// console.log(obj_0);
// const obj_1 = pool.get()!;
// console.log(obj_1);
// const obj_2 = pool.get()!;
// console.log(obj_2);
// const obj_3 = pool.get()!;
// console.log(obj_3);
// const obj_4 = pool.get()!;
// console.log(obj_4);

// const obj_5 = pool.get()!;
// console.log(obj_5);

// pool.give_back(obj_1);
// pool.give_back(obj_2);
// pool.give_back(obj_3);
// pool.give_back(obj_4);
// pool.give_back(obj_5);
// pool.give_back(obj_0);

// const obj_6 = pool.get()!;
// console.log(obj_6);
//#endregion