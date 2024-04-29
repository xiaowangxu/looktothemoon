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