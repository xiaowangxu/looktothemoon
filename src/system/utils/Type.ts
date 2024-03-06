export type Required<Type, Key extends keyof Type> = Type & { [Property in Key]-?: Type[Property]; };

export type Self<T> = T;

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