export interface RefCounted {
    get ref_count(): number;
    ref(): void;
    unref(): void;
}