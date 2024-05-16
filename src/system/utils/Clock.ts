const NowClass = typeof performance === 'undefined' ? Date : performance;

function now() {
    return NowClass.now();
}

export class Clock {
    private _running: boolean = false;
    public get running() { return this._running; }
    private set running(running: boolean) {
        this._running = running;
    }

    private last_time: number = 0;

    private _delta: number = 0;
    private _duration: number = 0;
    public get delta() { return this._delta; }
    public get duration() { return this._duration; }

    constructor() { }

    public start() {
        this.last_time = now();
        this._delta = 0;
        this._duration = 0;
        this.running = true;
    }

    public stop() {
        this.running = false;
    }

    public resume() {
        this.running = true;
    }

    public tick(delta?: number) {
        const new_time = now();
        if (this.running) {
            if (delta === undefined) {
                this._delta = (new_time - this.last_time) / 1000;
            }
            else {
                this._delta = delta;
            }
            this._duration += this._delta;
        }
        this.last_time = new_time;
        return this._delta;
    }
}

function clear_TimeoutId(id: number | undefined) {
    clearTimeout(id);
}

export type TimerCanceller = () => void;
export function timer(func: () => void, time_ms: number): TimerCanceller {
    const timeout_id = setTimeout(func, time_ms);
    return clear_TimeoutId.bind(undefined, timeout_id);
}

export function debounce(func: () => void, time_ms: number): () => void {
    let timer_canceller: TimerCanceller | undefined = undefined;
    const _func = () => { func(); timer_canceller = undefined; }
    return () => {
        if (timer_canceller === undefined) {
            timer_canceller = timer(_func, time_ms);
        }
        else {
            timer_canceller();
            timer_canceller = timer(_func, time_ms);
        }
    };
}