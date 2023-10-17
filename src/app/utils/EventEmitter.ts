export interface SignalBindOption {
    once?: boolean,
}

export class SignalEmitter<T extends (...args: any[]) => void> {

    private readonly callbacks: Map<symbol, T> = new Map();

    constructor() { }

    public bind(callback: T, option: SignalBindOption) {
        const sym = Symbol();
        const { once = false } = option;
        let f: T = callback;
        if (once) {
            f = ((...args: Parameters<T>) => {
                this.unbind(sym);
                callback(...args);
            }) as T;
        }
        this.callbacks.set(sym, f);
        return sym;
    }

    public unbind(sym: symbol) {
        this.callbacks.delete(sym);
    }

    public trigger(...args: Parameters<T>) {
        for (const callback of this.callbacks.values()) {
            callback(...args);
        }
    }

    public wait(): Promise<Parameters<T>> {
        return new Promise((resolve, reject) => {
            this.bind(((...args: Parameters<T>) => {
                resolve(args);
            }) as T, { once: true });
        });
    }
}