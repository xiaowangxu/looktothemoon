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

export function unref<V>(item: Refed<V>): V {
    if (item instanceof Ref) return item.expect;
    return item as V;
}

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

export class RefArray<T extends RefCountedLike> {
    private refs: (T | undefined)[];

    public get length() { return this.refs.length; }
    public get is_empty() { return this.length <= 0; }

    [Symbol.iterator]() { return this.refs[Symbol.iterator](); }

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
    }
}

export class RefMap<K, T extends RefCountedLike> {
    private refs: Map<K, T> = new Map();

    private _is_empty: boolean = true;
    public get size() { return this.refs.size; }
    public get is_empty() { return this._is_empty; }

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