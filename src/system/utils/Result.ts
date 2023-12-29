export class Result<T, Err> {
    private readonly item: T | undefined;
    private readonly err: Err | undefined;

    private readonly ok: boolean;

    public get succeed() { return this.ok; }
    public get failed() { return !this.ok; }

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
        if (this.ok) return this.item!;
        else return undefined;
    }

    public unwrap_Error() {
        if (!this.ok) return this.err!;
        else return undefined;
    }

    public expect() {
        if (this.ok) return this.item!;
        throw this.err!;
    }

    public expect_Error() {
        if (!this.ok) return this.err!;
        throw new Error('<Result> expect_Error: fail to unwrap error');
    }
}