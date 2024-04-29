export interface RefCounted {
    get ref_count(): number;
    ref(): void;
    unref(): void;
}

export interface RefCountedLike {
    ref(): void;
    unref(): void;
}

export type Refed<T> = T extends Ref<infer V> ? Ref<V> : (T extends RefCounted ? Ref<T> : T);
export type Unrefed<T> = T extends Ref<infer V> ? V : T;

export class Ref<T extends RefCountedLike> {
    private ref: T | undefined = undefined;

    public get value() { return this.ref; }
    public set value(item: T | undefined) {
        if (this.ref === item) return;
        if (this.ref !== undefined) {
            this.ref.unref();
        }
        this.ref = item;
        if (this.ref !== undefined) {
            this.ref.ref();
        }
    }

    public set move(ref_item: Ref<T> | undefined) {
        if (ref_item === undefined) {
            this.value = undefined
        }
        else {
            this.value = ref_item.value;
            ref_item.clear();
        }
    }

    public get expect() {
        if (this.ref === undefined) throw new Error('<Ref> expect: failed to get ref counted object');
        return this.ref;
    }

    public get is_empty() { return this.ref === undefined; }

    constructor(item: T | undefined = undefined) {
        this.value = item;
    }

    public borrow() {
        return new Ref(this.ref);
    }

    public clear() {
        this.value = undefined;
    }
}

/**
 * once created can not change Ref<T>
 * 
 * this guarantees ref.value === ref.expect and can never be undefined 
 */
export class ReadonlyRef<T extends RefCountedLike> {
    private ref: T;

    public get value() { return this.ref; }
    public get expect() { return this.ref; }

    public get is_empty() { return this.ref === undefined; }

    constructor(item: T) {
        this.ref = item;
        this.ref.ref();
    }

    public clear() {
        this.ref.unref();
        this.ref = undefined!;
    }
}

export class RefArray<T extends RefCountedLike> {
    private refs: (T | undefined)[];

    public get length() { return this.refs.length; }
    public get is_empty() { return this.length <= 0; }

    [Symbol.iterator]() { return this.refs[Symbol.iterator](); }

    public entries() { return this.refs.entries(); }
    public keys() { return this.refs.keys(); }
    public values() { return this.refs.values(); }

    public map<V>(fn: (item: T | undefined, index: number) => V): V[] { return this.refs.map(fn); }

    public find(fn: (item: T | undefined, index: number) => boolean) {
        return this.refs.findIndex(fn);
    }

    private ref(index: number, value: T | undefined) {
        const item = this.refs[index];
        if (item === value) return;
        if (item !== undefined) {
            item.unref();
        }
        this.refs[index] = value;
        if (value !== undefined) {
            value.ref();
        }
    }

    constructor(items: (T | undefined)[] | undefined | number = undefined) {
        if (items !== undefined) {
            if (typeof items === 'number') {
                const arr = new Array(items).fill(undefined);
                this.refs = arr;
            }
            else {
                const length = items.length;
                const arr = new Array(length).fill(undefined);
                this.refs = arr;
                for (let i = 0; i < length; i++) {
                    const item = items[i];
                    if (item !== undefined) {
                        this.ref(i, item);
                    }
                }
            }
        }
        else {
            this.refs = [];
        }
    }

    public get(index: number, target?: Ref<T>): T | undefined {
        if (index < 0 || index >= this.length) undefined;
        const item = this.refs[index];
        if (target !== undefined) target.value = item;
        return item;
    }

    public has(index: number): boolean {
        if (index < 0 || index >= this.length) return false;
        return this.refs[index] !== undefined;
    }

    public set(index: number, value: T | undefined) {
        if (index < 0 || index >= this.length) return;
        this.ref(index, value);
    }

    public resize(length: number) {
        const current_length = this.length;
        if (current_length === length) return;
        else if (current_length < length) {
            for (let i = current_length; i < length; i++) {
                this.push(undefined);
            }
        }
        else {
            this.remove(length, current_length - length);
        }
    }

    public push(item: T | undefined) {
        const index = this.length;
        this.refs.push(undefined);
        if (item !== undefined) this.ref(index, item);
    }

    public pop(target: Ref<T>): T | undefined {
        const index = this.length - 1;
        if (index < 0) return undefined;
        const item: T | undefined = this.refs[index];
        target.value = item;
        this.ref(index, undefined);
        this.refs.pop();
        return item;
    }

    public slice(start?: number, end?: number): RefArray<T> {
        const slice_refs = this.refs.slice(start, end);
        return new RefArray<T>(slice_refs);
    }

    public remove(start: number, count: number = 1) {
        const end = start + count;
        for (let i = start; i < end; i++) {
            this.ref(i, undefined);
        }
        this.refs.splice(start, count);
    }

    public clear() {
        const length = this.length;
        for (let i = 0; i < length; i++) {
            this.ref(i, undefined);
        }
        this.refs = [];
    }
}

export class RefMap<K extends Exclude<any, RefCountedLike>, T extends RefCountedLike> {
    private readonly refs: Map<K, T> = new Map();

    private _is_empty: boolean = true;
    public get is_empty() { return this._is_empty; }
    public get size() { return this.refs.size; }

    [Symbol.iterator]() { return this.refs.entries(); }

    public entries() { return this.refs.entries(); }

    public keys() { return this.refs.keys(); }

    public values() { return this.refs.values(); }

    private ref(item: T | undefined, value: T | undefined) {
        if (item === value) return;
        if (item !== undefined) {
            item.unref();
        }
        if (value !== undefined) {
            value.ref();
        }
    }

    public set(key: K, value: T | undefined): boolean {
        if (this.refs.has(key)) {
            const old_item = this.refs.get(key)!;
            if (value === undefined) {
                this.ref(old_item, undefined);
                this.refs.delete(key);
                this._is_empty = this.refs.size <= 0;
                return true;
            }
            else if (old_item !== value) {
                this.ref(old_item, value);
                return true;
            }
        }
        else if (value !== undefined) {
            this.refs.set(key, value);
            this.ref(undefined, value);
            this._is_empty = false;
            return true;
        }
        return false;
    }

    public get(key: K, target?: Ref<T>): T | undefined {
        const value = this.refs.get(key);
        if (target !== undefined) target.value = value;
        return value;
    }

    public has(key: K) {
        return this.refs.has(key);
    }

    public delete(key: K): boolean {
        if (this.refs.has(key)) {
            const old_item = this.refs.get(key)!;
            this.ref(old_item, undefined);
            this.refs.delete(key);
            this._is_empty = this.refs.size <= 0;
            return true;
        }
        return false;
    }

    public clear() {
        for (const item of this.refs.values()) {
            this.ref(item, undefined);
        }
        this._is_empty = true;
        this.refs.clear();
    }

    public static groupby<V extends RefCountedLike, U extends Exclude<any, RefCountedLike>>(items: Iterable<V>, fn: (element: V, index: number) => U): Map<U, RefArray<V>> {
        const result = new Map<U, RefArray<V>>();
        let i = 0;
        for (const item of items) {
            const key = fn(item, i++);
            if (result.has(key)) {
                result.get(key)!.push(item);
            }
            else {
                result.set(key, new RefArray([item]));
            }
        }
        return result;
    }
}

export class RefSet<T extends RefCountedLike> {
    private readonly refs: Set<T> = new Set();

    private _is_empty: boolean = true;
    public get is_empty() { return this._is_empty; }
    public get size() { return this.refs.size; }

    [Symbol.iterator]() { return this.refs[Symbol.iterator](); }

    public entries() { return this.refs.entries(); }

    public keys() { return this.refs.keys(); }

    public values() { return this.refs.values(); }

    private ref(item: T | undefined, value: T | undefined) {
        if (item === value) return;
        if (item !== undefined) {
            item.unref();
        }
        if (value !== undefined) {
            value.ref();
        }
    }

    constructor(items?: Iterable<T> | null) {
        if (items !== null && items !== undefined) {
            for (const item of items) {
                if (this.refs.has(item)) continue;
                this.refs.add(item);
                this.ref(undefined, item);
                this._is_empty = false;
            }
        }
    }

    public has(item: T) {
        return this.refs.has(item);
    }

    public add(item: T) {
        if (this.refs.has(item)) return;
        this.refs.add(item);
        this.ref(undefined, item);
        this._is_empty = false;
    }

    public delete(item: T) {
        if (!this.refs.has(item)) return;
        this.refs.delete(item);
        this.ref(item, undefined);
        this._is_empty = this.refs.size <= 0;
    }

    public clear() {
        for (const item of this.refs) {
            this.ref(item, undefined);
        }
        this.refs.clear();
        this._is_empty = true;
    }

    public difference(other: RefSet<T> | Set<T>) {
        const result = new RefSet<T>();
        for (const item of this.refs) {
            if (other.has(item)) continue;
            result.add(item);
        }
        return result;
    }

    public union(other: RefSet<T> | Set<T>) {
        const result = new RefSet<T>();
        for (const item of this.refs) {
            result.add(item);
        }
        for (const item of other) {
            result.add(item);
        }
        return result;
    }

    public intersection(other: RefSet<T> | Set<T>) {
        const result = new RefSet<T>();
        for (const item of this.refs) {
            if (!other.has(item)) continue;
            result.add(item);
        }
        return result;
    }

    public symmetric_difference(other: RefSet<T> | Set<T>) {
        const result = new RefSet<T>();
        for (const item of this.refs) {
            if (other.has(item)) continue;
            result.add(item);
        }
        for (const item of other) {
            if (this.has(item)) continue;
            result.add(item);
        }
        return result;
    }

    public is_Disjoint(other: RefSet<T> | Set<T>) {
        for (const item of this.refs) {
            if (other.has(item)) return false;
        }
        return true;
    }

    public is_Subset(other: RefSet<T> | Set<T>) {
        for (const item of this.refs) {
            if (!other.has(item)) return false;
        }
        return true;
    }

    public is_Superset(other: RefSet<T> | Set<T>) {
        for (const item of other) {
            if (!this.has(item)) return false;
        }
        return true;
    }
}

export class WeakRef<T extends RefCounted> {
    private ref: T | undefined = undefined;

    public get value() {
        if (this.ref !== undefined) {
            if (this.ref.ref_count <= 0) {
                this.ref = undefined;
            }
        }
        return this.ref;
    }
    public set value(item: T | undefined) {
        this.ref = item;
        if (this.ref !== undefined) {
            if (this.ref.ref_count <= 0) {
                this.ref = undefined;
            }
        }
    }

    constructor(item: T | undefined = undefined) {
        this.value = item;
    }
}

/*
class RefTest implements RefCounted {
    static i = 0;
    public readonly idx = RefTest.i++;
    private _ref_count: number = 0;
    public get ref_count() { return this._ref_count; }
    public ref() {
        if (this._disposed) throw new Error('${this.idx} already disposed');
        this._ref_count++;
        console.log('ref', this.idx, `(${this._ref_count})`);
    }
    public unref() {
        if (this._ref_count === 0) return;
        this._ref_count--;
        console.log('unref', this.idx, `(${this._ref_count})`);
        if (this._ref_count === 0) {
            this.dispose();
        }
    }
    private _disposed: boolean = false;
    public dispose() {
        this._disposed = true;
        console.log('dispose', this.idx);
    }
}
*/