export interface ValueBase<T> {
    dump_String(): string;
    load_String(str: string): T;
}