export type Required<Type, Key extends keyof Type> = Type & { [Property in Key]-?: Type[Property]; };

export type Self<T> = T;

export type New<T> = T;

/**
 * the result is only a temp object, you can use the internal property, but should not keep the object itself, since it may be reused in another return value
 */
export type Temp<T extends object> = T;

export type NotNull<T = any> = Exclude<T, null | undefined>;

export class Out<T> {

    //#region init

    static new<T>() {
        return new Out<T>();
    }

    //#endregion

    public value!: T;
}

export function out<T>() {
    return new Out<T>();
}

export interface Cloneable<T> {
    clone(): New<T>;
}

export interface Copyable<T> {
    copy(from: T): Self<T>;
}

export interface Equality<T> {
    equal(other: T): boolean;
}

export interface Indexed {
    get index(): number;
    set index(index: number);
}

enum Ordering {
    Less = -1, Equal = 0, Greater = 1
}

export interface PartialEquailty<T> {
    compare(other: T): Ordering;
}

export interface Disposable {
    dispose(): void;
}

export interface Validated<T> {
    get validation(): T;
    get is_valid(): boolean;
}