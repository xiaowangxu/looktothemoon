export type Required<Type, Key extends keyof Type> = Type & { [Property in Key]-?: Type[Property]; };

export type Self<T> = T;

export type New<T> = T;

export type NotNull = Exclude<any, null | undefined>;

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