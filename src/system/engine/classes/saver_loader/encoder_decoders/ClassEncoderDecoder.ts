import { Result } from "@/system/utils/Result";
import type { ClassExchangeData } from "../ClassSaverLoader";
import type { ValueDatabase } from "../../databases/ValueDatabase";

export class ClassEncoder<T, O> {
    protected readonly value_db: ValueDatabase;
    protected readonly data: ClassExchangeData;
    protected readonly option: O | undefined;

    constructor(value_db: ValueDatabase, data: ClassExchangeData, option?: O) {
        this.value_db = value_db;
        this.data = data;
        this.option = option;
    }

    public encode(): Result<T, Error> {
        return Result.Error(new Error('<ClassEncoder> encode: can not use this empty class encoder'))
    }
}

export class ClassDecoder<T, O> {
    protected readonly value_db: ValueDatabase;
    protected readonly data: T;
    protected readonly option: O | undefined;

    constructor(value_db: ValueDatabase, data: T, option?: O) {
        this.value_db = value_db;
        this.data = data;
        this.option = option;
    }

    public decode(): Result<ClassExchangeData, Error> {
        return Result.Error(new Error('<ClassDecoder> decode: can not use this empty class decoder'))
    }
}