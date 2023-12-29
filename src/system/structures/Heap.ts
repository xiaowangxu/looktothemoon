export class Heap<T> implements Iterable<T> {
    private heap_arr: T[] = [];
    private readonly comparator: (a: T, b: T) => number;

    public get length(): number { return this.heap_arr.length; };
    public get is_empty(): boolean { return this.length === 0; }

    *[Symbol.iterator](): Iterator<T> {
        while (this.length) {
            yield this.pop() as T;
        }
    }

    constructor(compare: (a: T, b: T) => number) {
        this.comparator = compare;
    }

    private init(): void {
        for (let i = Math.floor(this.heap_arr.length); i >= 0; --i) {
            this.sort_Down(i);
        }
    }

    public push(item: T): boolean {
        this.sort_Up(this.heap_arr.push(item) - 1);
        return true;
    }

    public clear(): void {
        this.heap_arr = [];
    }

    public clone(): Heap<T> {
        const cloned = new Heap<T>(this.comparator);
        cloned.heap_arr = [...this.heap_arr];
        return cloned;
    }

    public get_Leaves(): Array<T> {
        if (this.heap_arr.length === 0) {
            return [];
        }
        const pi = Heap.get_ParentIndex(this.heap_arr.length - 1);
        return this.heap_arr.slice(pi + 1);
    }

    public get_Top(): T | undefined {
        return this.heap_arr[0];
    }

    public pop(): T | undefined {
        const last = this.heap_arr.pop();
        if (this.length > 0 && last !== undefined) {
            return this.replace(last);
        }
        return last;
    }

    public pushpop(item: T): T {
        if (this.comparator(this.heap_arr[0], item) < 0) {
            [item, this.heap_arr[0]] = [this.heap_arr[0], item];
            this.sort_Down(0);
        }
        return item;
    }

    private replace(item: T): T {
        const peek = this.heap_arr[0];
        this.heap_arr[0] = item;
        this.sort_Down(0);
        return peek;
    }

    private move_Node(a: number, b: number): void {
        [this.heap_arr[a], this.heap_arr[b]] = [this.heap_arr[b], this.heap_arr[a]];
    }

    private sort_Down(i: number): void {
        let moveIt = i < this.heap_arr.length - 1;
        const self = this.heap_arr[i];

        const getPotentialParent = (best: number, j: number) => {
            if (this.heap_arr.length > j && this.comparator(this.heap_arr[j], this.heap_arr[best]) < 0) {
                best = j;
            }
            return best;
        };

        while (moveIt) {
            const childrenIdx = Heap.get_ChildrenIndices(i);
            const bestChildIndex = childrenIdx.reduce(getPotentialParent, childrenIdx[0]);
            const bestChild = this.heap_arr[bestChildIndex];
            if (typeof bestChild !== 'undefined' && this.comparator(self, bestChild) > 0) {
                this.move_Node(i, bestChildIndex);
                i = bestChildIndex;
            } else {
                moveIt = false;
            }
        }
    }

    private sort_Up(i: number): void {
        let moveIt = i > 0;
        while (moveIt) {
            const pi = Heap.get_ParentIndex(i);
            if (pi >= 0 && this.comparator(this.heap_arr[pi], this.heap_arr[i]) > 0) {
                this.move_Node(i, pi);
                i = pi;
            } else {
                moveIt = false;
            }
        }
    }

    protected static get_ChildrenIndices(idx: number): [left: number, right: number] {
        return [idx * 2 + 1, idx * 2 + 2];
    }

    protected static get_ParentIndex(idx: number): number {
        if (idx <= 0) return -1;
        const child = idx % 2 ? 1 : 2;
        return Math.floor((idx - child) / 2);
    }

    protected static get_SiblingIndex(idx: number): number {
        if (idx <= 0) return -1;
        const child = idx % 2 ? 1 : -1;
        return idx + child;
    }

    protected static print<N>(heap: Heap<N>): string {
        function deep(i: number) {
            const pi = Heap.get_ParentIndex(i);
            return Math.floor(Math.log2(pi + 1));
        }

        function repeat(str: string, times: number) {
            let out = '';
            for (; times > 0; --times) {
                out += str;
            }
            return out;
        }

        let node = 0;
        const lines: Array<Array<string>> = [];
        const maxLines = deep(heap.length - 1) + 2;
        let maxLength = 0;

        while (node < heap.length) {
            let i = deep(node) + 1;
            if (node === 0) {
                i = 0;
            }
            // Text representation
            const nodeText = String(heap.heap_arr[node]);
            if (nodeText.length > maxLength) {
                maxLength = nodeText.length;
            }
            // Add to line
            lines[i] = lines[i] || [];
            lines[i].push(nodeText);
            node += 1;
        }

        return lines
            .map((line, i) => {
                const times = Math.pow(2, maxLines - i) - 1;
                return (
                    repeat(' ', Math.floor(times / 2) * maxLength) +
                    line
                        .map((el) => {
                            // centered
                            const half = (maxLength - el.length) / 2;
                            return repeat(' ', Math.ceil(half)) + el + repeat(' ', Math.floor(half));
                        })
                        .join(repeat(' ', times * maxLength))
                );
            })
            .join('\n');
    }

    protected static heapify<N>(arr: N[], compare: (a: N, b: N) => number): Heap<N> {
        const heap = new Heap(compare);
        heap.heap_arr = arr;
        heap.init();
        return heap;
    }
}