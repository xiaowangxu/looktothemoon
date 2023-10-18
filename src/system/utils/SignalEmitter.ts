export interface SignalBindOption {
    once?: boolean,
}

export class SignalEmitter<T extends (...args: any[]) => void> {

    private readonly callbacks: Map<symbol, T> = new Map();
    private readonly callbacks_once: Map<symbol, T> = new Map();

    constructor() { }

    public connect(callback: T, option?: SignalBindOption) {
        const sym = Symbol();
        const { once = false } = option ?? {};
        let f: T = callback;
        if (once) {
            this.callbacks_once.set(sym, f);
        }
        else {
            this.callbacks.set(sym, f);
        }
        return sym;
    }

    public disconnect(sym: symbol) {
        this.callbacks.delete(sym);
        this.callbacks_once.delete(sym);
    }

    public trigger(...args: Parameters<T>) {
        for (const callback of this.callbacks.values()) {
            callback(...args);
        }
        for (const callback of this.callbacks_once.values()) {
            callback(...args);
        }
        this.callbacks_once.clear();
    }

    public wait(): Promise<Parameters<T>> {
        return new Promise((resolve, reject) => {
            this.connect(((...args: Parameters<T>) => {
                resolve(args);
            }) as T, { once: true });
        });
    }
}