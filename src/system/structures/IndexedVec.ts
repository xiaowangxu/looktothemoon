import type { Indexed } from "../utils/Type";
import { Vec } from "./Vec";

export class IndexedVec<T extends Indexed> extends Vec<T> {

    public set(index: number, item: T): boolean {
        if (index < 0 || index >= this._length) return false;
        this.array[index] = item;
        item.index = index;
        return true;
    }

    public push(item: T): void {
        this.insure(this._length + 1);
        this.array[this._length++] = item;
        item.index = this.length - 1;
    }

    public swap(from: number, to: number): void {
        if (from === to) return;
        if (from < 0 || from >= this._length || to < 0 || to >= this._length) return;
        this.array[from]!.index = to;
        this.array[to]!.index = from;
        const tmp = this.array[from];
        this.array[from] = this.array[to];
        this.array[to] = tmp;
    }
}