import { Result } from "@/system/utils/Result";
import type { ClassExchangeData } from "../ClassSaverLoader";

export class ClassEncoder<T, O> {
    protected readonly data: ClassExchangeData;

    constructor(data: ClassExchangeData, option?: O) {
        this.data = data;
    }

    public encode(): Result<T, Error> {
        return Result.Error(new Error('<ClassEncoder> encode: can not use this empty class encoder'))
    }
}

export class ClassDecoder<T, O> {
    protected readonly data: T;

    constructor(data: T, option?: O) {
        this.data = data;
    }

    public decode(): Result<ClassExchangeData, Error> {
        return Result.Error(new Error('<ClassDecoder> decode: can not use this empty class decoder'))
    }
}