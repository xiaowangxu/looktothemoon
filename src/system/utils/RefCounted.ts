export interface RefCounted {
    ref_count(): number;
    ref(): void;
    unref(): void;
}

export class Ref<T extends RefCounted> {
    private ref: T | undefined = undefined;

    public get value() { return this.ref; }
    public set value(item: T | undefined) {
        if (this.ref !== undefined) {
            this.ref.unref();
        }
        this.ref = item;
        if (this.ref !== undefined) {
            this.ref.ref();
        }
    }

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
        this.unref_All();
        this.refs = items.map(i => new Ref(i));
    }

    public get length() { return this.refs.length; }

    constructor(items: (T | undefined)[] | undefined = undefined) {
        if (items !== undefined) {
            this.value = items;
        }
    }

    private unref_All() {
        this.refs.forEach(r => r.clear());
    }

    public clear() {
        this.unref_All();
        this.refs = [];
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