import { Heap } from "./Heap";

export class PriorityQueue<T> {
    private readonly heap: Heap<T>;

    public get length() { return this.heap.length; }
    public get empty() { return this.heap.empty; }

    *[Symbol.iterator]() {
        for(const item of this.heap) {
            yield item;
        }
    }

    constructor(compare: (a: T, b: T) => number) {
        this.heap = new Heap(compare);
    }

    public get_Top() {
        return this.heap.get_Top();
    }

    public enqueue(item: T) {
        return this.heap.push(item);
    }

    public dequeue() {
        return this.heap.pop();
    }

    public clear() {
        this.heap.clear();
    }
}