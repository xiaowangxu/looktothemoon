export class Result<T, Err> {
    private readonly item: T | undefined;
    private readonly err: Err | undefined;

    private readonly ok: boolean;

    public get succeed() { return this.ok; }
    public get failed() { return !this.ok; }
    public get value() { return this.item!; }
    public get error() { return this.err!; }

    constructor(ok: boolean, item: T | undefined, err: Err | undefined) {
        this.ok = ok;
        this.item = item;
        this.err = err;
    }

    public static Ok<T, Err>(item: T) {
        return new Result<T, Err>(true, item, undefined);
    }

    public static Error<T, Err>(err: Err) {
        return new Result<T, Err>(false, undefined, err);
    }

    public unwrap() {
        if (this.ok) return this.value;
        else throw new Error('failed to unwrap from Result.Error');
    }

    public unwrap_Error() {
        if (!this.ok) return this.error;
        else throw new Error('failed to unwrap error from Result.Ok');
    }
}