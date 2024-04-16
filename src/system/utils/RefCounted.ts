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
    private refs: Ref<T>[] = [];

    public get length() { return this.refs.length; }
    public get is_empty() { return this.length <= 0; }

    *[Symbol.iterator]() {
        for (const ref of this.refs) {
            yield ref.value;
        }
    }

    public get(index: number, as_ref: true): Ref<T> | undefined
    public get(index: number, as_ref: false): T | undefined
    public get(index: number, as_ref: true | false = true): Ref<T> | T | undefined {
        const ref: Ref<T> | undefined = this.refs[index];
        if (as_ref) return ref;
        if (ref === undefined) return undefined;
        else {
            return ref.value;
        }
    }

    public has(index: number): boolean {
        const ref: Ref<T> | undefined = this.refs[index];
        return (ref !== undefined) && (!ref.is_empty);
    }

    public set(index: number, value: T | undefined) {
        if (index < 0 || index >= this.length) return;
        this.refs[index].value = value;
    }

    constructor(items: (T | undefined)[] | undefined = undefined) {
        if (items !== undefined) {
            this.refs = items.map(i => new Ref(i));
        }
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
        this.refs.push(new Ref(item));
    }

    public pop(as_ref: true): Ref<T> | undefined
    public pop(as_ref: false): T | undefined
    public pop(as_ref: true | false = true): Ref<T> | T | undefined {
        const ref = this.refs.pop();
        if (as_ref) return ref;
        if (ref === undefined) return undefined;
        else {
            const item = ref.value;
            ref.value = undefined;
            return item;
        }
    }

    public slice(start?: number, end?: number): RefArray<T> {
        const slice_refs = this.refs.slice(start, end);
        return new RefArray<T>(slice_refs.map(i => i.expect));
    }

    public remove(start: number, count: number = 1) {
        const item_ref = this.refs.splice(start, count);
        for (const ref of item_ref) {
            ref.clear();
        }
    }

    private unref() {
        for (const ref of this.refs) {
            ref.clear();
        }
    }

    public clear() {
        this.unref();
        this.refs = [];
    }
}

export class RefMap<K, T extends RefCountedLike> {
    private refs: Map<K, Ref<T>> = new Map();

    private _is_empty: boolean = true;
    public get size() { return this.refs.size; }
    public get is_empty() { return this._is_empty; }

    *[Symbol.iterator]() {
        for (const [index, ref] of this.refs.entries()) {
            yield [index, ref.expect] as [K, T];
        }
    }

    public *entries() {
        for (const [index, ref] of this.refs.entries()) {
            yield [index, ref.expect] as [K, T];
        }
    }

    public keys() {
        return this.refs.keys();
    }

    public *values() {
        for (const ref of this.refs.values()) {
            yield ref.expect;
        }
    }

    public set(key: K, value: T | undefined): boolean {
        if (this.refs.has(key)) {
            const old_ref = this.refs.get(key)!;
            if (value === undefined) {
                old_ref.clear();
                this.refs.delete(key);
                this._is_empty = this.refs.size <= 0;
                return true;
            }
            else if (old_ref.value !== value) {
                old_ref.value = value;
                return true;
            }
        }
        else if (value !== undefined) {
            this.refs.set(key, new Ref(value));
            this._is_empty = false;
            return true;
        }
        return false;
    }

    public get(key: K) {
        return this.refs.get(key)?.value;
    }

    public has(key: K) {
        return this.refs.has(key);
    }

    public delete(key: K): boolean {
        if (this.refs.has(key)) {
            const old_ref = this.refs.get(key)!;
            old_ref.clear();
            this.refs.delete(key);
            this._is_empty = this.refs.size <= 0;
            return true;
        }
        return false;
    }

    public clear() {
        for (const ref of this.refs.values()) {
            ref.clear();
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