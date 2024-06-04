class VecIterator<T> implements Iterator<T> {

    protected array: T[];

    protected length: number;
    protected current: number = 0;

    constructor(array: T[], length: number, base: number = 0) {
        this.array = array;
        this.length = length;
        this.current = base;
    }

    next(): IteratorResult<T, T> {
        const value = this.array[this.current];
        const done = this.current >= this.length;
        this.current++;
        return { value, done };
    }
}

export class Vec<T> {

    protected array: (T | undefined)[];

    protected _length: number = 0;
    public get length() { return this._length; }

    protected _capacity: number;
    public get capacity() { return this._capacity; }

    public get is_empty() { return this._length <= 0; }


    [Symbol.iterator]() { return new VecIterator<T>(this.array as T[], this.length); }

    constructor(capacity: number) {
        this._capacity = capacity;
        this.array = new Array(capacity).fill(undefined);
    }

    public insure(size: number) {
        if (this._capacity < size) {
            this._capacity *= 1.5;
            const array = new Array(this._capacity);
            for (let i = 0; i < this._length; i++) {
                array[i] = this.array[i];
            }
            // for (let i = this._length; i < this.capacity; i++) {
            //     array[i] = undefined;
            // }
            this.array = array;
        }
    }

    public get(index: number) {
        if (index < 0 || index >= this._length) return undefined;
        return this.array[index];
    }

    public set(index: number, item: T): boolean {
        if (index < 0 || index >= this._length) return false;
        this.array[index] = item;
        return true;
    }

    public push(item: T) {
        this.insure(this._length + 1);
        this.array[this._length++] = item;
    }

    public pop(): T | undefined {
        if (this._length <= 0) return undefined;
        const item = this.array[this._length - 1];
        this.array[this._length--] = undefined;
        return item;
    }

    public swap(from: number, to: number) {
        if (from === to) return;
        if (from < 0 || from >= this._length || to < 0 || to >= this._length) return;
        const tmp = this.array[from];
        this.array[from] = this.array[to];
        this.array[to] = tmp;
    }

    public swap_remove(index: number) {
        if (index < 0 || index >= this._length) return;
        this.swap(index, this._length - 1);
        return this.pop();
    }

    public clear(capacity: number = 0) {
        this._capacity = capacity;
        this.array = new Array(capacity).fill(undefined);
    }
}