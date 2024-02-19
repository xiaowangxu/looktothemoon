class LinkListNode<T> {
    public value: T;
    public prev?: LinkListNode<T>;
    public next?: LinkListNode<T>;

    constructor(value: T) {
        this.value = value;
    }
}

export class LinkList<T> implements Iterable<T> {
    private _head: LinkListNode<T> | undefined;
    private _tail: LinkListNode<T> | undefined;
    private _length: number = 0;

    public get length() { return this._length; }

    *[Symbol.iterator]() {
        let cnt = this._head;
        while (cnt !== undefined) {
            yield (cnt.value);
            cnt = cnt.next;
        }
    }

    constructor(iterable?: Iterable<T>) {
        if (iterable !== undefined) {
            for (const v of iterable) {
                this.push(v);
            }
        }
    }

    public push(value: T) {
        const node = new LinkListNode(value);
        if (this._head === undefined || this._tail === undefined) {
            this._head = this._tail = node;
        }
        else {
            this._tail.next = node;
            node.prev = this._tail;
            this._tail = node;
        }
        this._length++;
    }

    public pop() {
        if (this._head === undefined || this._tail === undefined) return undefined;
        else if (this._head === this._tail) {
            const node = this._head;
            this._head = this._tail = undefined;
            this._length--;
            return node.value;
        }
        else {
            const node = this._tail;
            this._tail = node.prev!;
            this._tail.next = undefined;
            this._length--;
            node.prev = undefined;
            return node.value;
        }
    }

    public unshift(value: T) {
        const node = new LinkListNode(value);
        if (this._head === undefined || this._tail === undefined) {
            this._head = this._tail = node;
        }
        else {
            this._head.prev = node;
            node.next = this._head;
            this._head = node;
        }
        this._length++;
    }

    public shift() {
        if (this._head === undefined || this._tail === undefined) return undefined;
        else if (this._head === this._tail) {
            const node = this._head;
            this._head = this._tail = undefined;
            this._length--;
            return node.value;
        }
        else {
            const node = this._head;
            this._head = node.next!;
            this._head.prev = undefined;
            this._length--;
            node.next = undefined;
            return node.value;
        }
    }

    public insert(value: T, index: number) {
        if (index < 0) return;
        let next = this._head;
        let cursor = 0;
        while (next !== undefined && cursor !== index) {
            next = next.next;
            cursor++;
        }
        if (next !== undefined) {
            const node = new LinkListNode(value);
            const prev = next.prev;
            // next is head
            if (prev === undefined) {
                this._head = node;
            }
            else {
                prev.next = node;
                node.prev = prev;
            }
            node.next = next;
            next.prev = node;
            this._length++;
        }
        else {
            this.push(value);
        }
    }

    private delete(node: LinkListNode<T>) {
        const prev = node.prev;
        const next = node.next;
        if (prev !== undefined) {
            prev.next = next;
        }
        else {
            this._head = next;
        }
        if (next !== undefined) {
            next.prev = prev;
        }
        else {
            this._tail = prev;
        }
        node.next = node.prev = undefined;
        this._length--;
    };

    public remove(index: number) {
        if (index < 0) return;
        let cnt = this._head;
        let cursor = 0;
        while (cnt !== undefined && cursor !== index) {
            cnt = cnt.next;
            cursor++;
        }
        if (cnt !== undefined) {
            this.delete(cnt);
            return cnt.value;
        }
    }

    public get(index: number) {
        if (index < 0) return;
        let cnt = this._head;
        let cursor = 0;
        while (cnt !== undefined && cursor !== index) {
            cnt = cnt.next;
            cursor++;
        }
        return cnt === undefined ? undefined : cnt.value;
    }

    public get_Index(value: T) {
        let cnt = this._head;
        let cursor = 0;
        while (cnt !== undefined) {
            if (cnt.value === value) {
                return cursor;
            }
            cnt = cnt.next;
            cursor++;
        }
    };

    public get_LastIndex(value: T) {
        let cnt = this._tail;
        let cursor = this._length;
        while (cnt !== undefined) {
            if (cnt.value === value) {
                return cursor;
            }
            cnt = cnt.prev;
            cursor--;
        }
    };

    public clone() {
        return new LinkList(this);
    }

    // public print() {
    //     console.log('length:', this.length);
    //     for (let i = this._head, j = this._tail; i !== undefined && j !== undefined; i = i.next, j = j.prev) {
    //         console.log(i.value, j.value);
    //     }
    // }
}