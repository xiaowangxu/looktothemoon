import type { NotNull } from "../utils/Type";

export interface ArenaLike<T extends NotNull, Arr> {
    get length(): number;

    grow(to_size: number): void;

    get(index: number): T | undefined;
    set(index: number, value: T): void;

    /**
     * @returns the item moved to this index
     */
    delete(index: number): number | undefined;

    slice(start: number, end: number): Arr;
}