export interface RefCounted {
    ref_count(): number;
    ref(): void;
    unref(): void;
}

export abstract class RefCountedBase implements RefCounted {
    private _ref_count: number = 0;
    public ref_count() { return this._ref_count; }
    public ref() { this._ref_count++; }
    public unref() {
        if (this._ref_count === 0) return;
        this._ref_count--;
        if (this._ref_count === 0) {
            this.dispose();
        }
    }

    public abstract dispose(): void;
}

export type ToRefed<T> = T extends RefCounted ? Ref<T> : T;

export function unref<V, T extends RefCounted>(item: V | Ref<T>) {
    if (item instanceof Ref) return item.expect;
    return item;
}

export class Ref<T extends RefCounted> {
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
        if (this.ref === undefined) throw new Error('failed to get ref counted object');
        return this.ref;
    }

    public get is_empty() { return this.ref === undefined; }

    constructor(item: T | undefined = undefined) {
        this.value = item;
    }

    public clear() {
        this.value = undefined;
    }
}

export class RefArray<T extends RefCounted> {
    private refs: Ref<T>[] = [];

    public get value(): (T | undefined)[] { return this.refs.map(r => r.value); }
    public set value(items: (T | undefined)[]) {
        const refs = items.map(i => new Ref(i));
        this.unref_All();
        this.refs = refs;
    }

    public get length() { return this.refs.length; }

    public get(index: number, as_ref: true): Ref<T> | undefined
    public get(index: number, as_ref: false): T | undefined
    public get(index: number, as_ref: true | false = true): Ref<T> | T | undefined {
        const ref : Ref<T> | undefined = this.refs[index];
        if (as_ref) return ref;
        if (ref === undefined) return undefined;
        else {
            return ref.value;
        }
    }

    public set(index: number, value: T | undefined) {
        if (index < 0 || index >= this.length) return;
        this.refs[index].value = value;
    }

    constructor(items: (T | undefined)[] | undefined = undefined) {
        if (items !== undefined) {
            this.value = items;
        }
    }

    private unref_All() {
        for (const ref of this.refs) {
            ref.clear();
        }
    }

    public clear() {
        this.unref_All();
        this.refs = [];
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
}

export class WeakRef<T extends RefCounted> {
    private ref: T | undefined = undefined;

    public get value() {
        if (this.ref !== undefined) {
            if (this.ref.ref_count() <= 0) {
                this.ref = undefined;
            }
        }
        return this.ref;
    }
    public set value(item: T | undefined) {
        this.ref = item;
        if (this.ref !== undefined) {
            if (this.ref.ref_count() <= 0) {
                this.ref = undefined;
            }
        }
    }

    constructor(item: T | undefined = undefined) {
        this.value = item;
    }
}