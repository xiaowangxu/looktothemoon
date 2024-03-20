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
        if (this.ok) return this.item! as T;
        throw this.err! as Err;
    }

    public expect_Error() {
        if (!this.ok) return this.err!;
        throw new Error('<Result> expect_Error: fail to unwrap error');
    }

    public get(default_val: T) {
        return this.unwrap() ?? default_val;
    }

    public do<Res>(succeed: (item: T) => Res, failed: (err: Err) => Res) {
        if (this.failed) return failed(this.expect_Error());
        return succeed(this.expect());
    }

    public static If<V, VE>(item: V, func: (item: V) => Result<V, VE>) {
        const result = func(item);
        if (result.succeed) return result.expect();
        return item;
    }

    public static All<V, VE>(items: Iterable<Result<V, VE>>) {
        for (const res of items) {
            if (res.failed) return Result.Error<V[], VE>(res.expect_Error());
        }
        return Result.Ok<V[], VE>(Array.from(items, i => i.expect()));
    }
}