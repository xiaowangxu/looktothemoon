import { clamp } from "../fivepebble/Scalar";
import { Euler } from "../fivepebble/linear_algebra/Euler";
import { Vector2 } from "../fivepebble/linear_algebra/Vector2";
import { Vector3 } from "../fivepebble/linear_algebra/Vector3";
import { Quaternion } from "../fivepebble/linear_algebra/Quaternion";
import { SignalEmitter } from "../utils/SignalEmitter";
import { Vector4 } from "../fivepebble/linear_algebra/Vector4";

export class TweenBase {
    protected _started: boolean = false;
    public get started() { return this._started; }
    protected set started(started: boolean) { this._started = started; }
    protected _finished: boolean = false;
    public get finished() { return this._finished; }
    protected set finished(finished: boolean) {
        this._finished = finished;
        if (this._finished) {
            this.trigger_Finished();
        }
    }
    public get running() { return this.started && !this.finished; }

    // signals
    public readonly signal_finished: SignalEmitter<() => void> = new SignalEmitter();

    constructor() {

    }

    protected trigger_Finished() {
        this.signal_finished.trigger();
    }

    public start() { }

    public process(delta: number) { }

    public stop() {
        this.finished = true;
    }
}

// structure tweens

export class TweenSequence extends TweenBase {
    private readonly tweens: TweenBase[] = [];
    private current_tween_idx: number = 0;
    private current_tween: TweenBase | undefined = undefined;

    constructor(tweens: TweenBase[]) {
        super();
        this.tweens = tweens;
    }

    public start() {
        if (this.tweens.length === 0) {
            this.started = true;
            this.finished = true;
        }
        else {
            this.current_tween_idx = 0;
            this.current_tween = this.tweens[this.current_tween_idx];
            this.started = true;
            this.finished = this.start_Tween();
        }
    }

    private start_Tween(): boolean {
        if (this.current_tween !== undefined) {
            this.current_tween.start();
            if (this.current_tween.finished) {
                this.current_tween_idx++;
                if (this.current_tween_idx >= this.tweens.length) {
                    return true;
                }
                else {
                    this.current_tween = this.tweens[this.current_tween_idx];
                    return this.start_Tween();
                }
            }
            else {
                return false;
            }
        }
        return true;
    }

    public process(delta: number): void {
        if (this.running) {
            this.current_tween!.process(delta);
            if (this.current_tween!.finished) {
                this.current_tween_idx++;
                if (this.current_tween_idx >= this.tweens.length) {
                    this.finished = true;
                }
                else {
                    this.current_tween = this.tweens[this.current_tween_idx];
                    this.finished = this.start_Tween();
                }
            }
        }
    }
}

export class TweenParallel extends TweenBase {
    private readonly tweens: TweenBase[] = [];
    private running_tweens: Set<TweenBase> = new Set();

    constructor(tweens: TweenBase[]) {
        super();
        this.tweens = tweens;
    }

    public start() {
        if (this.tweens.length === 0) {
            this.started = true;
            this.finished = true;
        }
        else {
            this.running_tweens.clear();
            this.running_tweens = new Set(this.tweens);
            this.started = true;
            this.finished = this.start_Tween();
        }
    }

    private start_Tween(): boolean {
        if (this.running_tweens.size > 0) {
            for (const tween of [...this.running_tweens]) {
                tween.start();
                if (tween.finished) {
                    this.running_tweens.delete(tween);
                }
            }
            return this.running_tweens.size <= 0;
        }
        return true;
    }

    private process_Tween(delta: number): boolean {
        if (this.running_tweens.size > 0) {
            for (const tween of [...this.running_tweens]) {
                tween.process(delta);
                if (tween.finished) {
                    this.running_tweens.delete(tween);
                }
            }
            return this.running_tweens.size <= 0;
        }
        return true;
    }

    public process(delta: number): void {
        if (this.running) {
            this.finished = this.process_Tween(delta);
        }
    }
}

export class TweenLoop extends TweenBase {
    private readonly tween: TweenBase;
    private readonly loop_times: number;
    private current_loop_idx: number = 0;

    public readonly signal_looped: SignalEmitter<(loop: number, total: number) => void> = new SignalEmitter();

    constructor(tween: TweenBase, loop_times: number) {
        super();
        this.tween = tween;
        this.loop_times = loop_times;
    }

    public start() {
        if (this.loop_times <= 0) {
            this.started = true;
            this.finished = true;
        }
        else {
            this.current_loop_idx = 0;
            this.started = true;
            this.finished = this.start_Tween();
        }
    }

    private start_Tween(): boolean {
        if (this.current_loop_idx < this.loop_times) {
            this.tween.start();
            if (this.tween.finished) {
                this.signal_looped.trigger(this.current_loop_idx + 1, this.loop_times);
                this.current_loop_idx++;
                if (this.current_loop_idx >= this.loop_times) {
                    return true;
                }
                else {
                    return this.start_Tween();
                }
            }
            else {
                return false;
            }
        }
        return true;
    }

    public process(delta: number): void {
        if (this.running) {
            this.tween.process(delta);
            if (this.tween.finished) {
                this.signal_looped.trigger(this.current_loop_idx + 1, this.loop_times);
                this.current_loop_idx++;
                if (this.current_loop_idx >= this.loop_times) {
                    this.finished = true;
                }
                else {
                    this.finished = this.start_Tween();
                }
            }
        }
    }
}

// interpolate tweens

export enum TransitionType {
    Linear, Sine, Quad, Cubic, Quart, Quint, Expo, Back, Elastic, Circle, Bounce
}

export enum EasingType {
    In, Out, InOut
}

export class InterpolateTween extends TweenBase {
    private readonly duration: number;
    private readonly transition: TransitionType;
    private readonly easing: EasingType;
    public reversed: boolean = false;

    private _current: number = 0;
    public get current() { return this._current; }
    private _value: number = 0;
    public get value() { return this.reversed ? (1 - this._value) : this._value; }

    constructor(duration: number, transition: TransitionType, easing: EasingType, reversed: boolean = false) {
        super();
        this.duration = Math.max(0, duration);
        this.transition = transition;
        this.easing = easing;
        this.reversed = reversed;
    }

    public start() {
        if (this.duration === 0) {
            this._current = 1;
            this._value = 1;
            this.started = true;
            this.finished = true;
        }
        else {
            this._current = 0;
            this._value = 0;
            this.started = true;
            this.finished = false;
        }
    }

    public process(delta: number) {
        if (this.running) {
            const finished = this._current >= this.duration;
            if (finished) {
                this.finished = true;
            }
            else {
                const c = this._current + delta;
                this._current = clamp(c, 0, this.duration);
                this._value = InterpolateTween.calculate_TransitionEasing(this._current / this.duration, this.transition, this.easing);
            }
        }
    }

    static calculate_TransitionEasing(value: number, transition: TransitionType, easing: EasingType): number {
        const x = clamp(value, 0, 1);
        switch (transition) {
            case TransitionType.Linear: {
                return x;
            }
            case TransitionType.Sine: {
                switch (easing) {
                    case EasingType.In: return 1 - Math.cos((x * Math.PI) / 2);
                    case EasingType.Out: return Math.sin((x * Math.PI) / 2);
                    case EasingType.InOut: return -(Math.cos(Math.PI * x) - 1) / 2;
                }
            }
            case TransitionType.Quad: {
                switch (easing) {
                    case EasingType.In: return x * x
                    case EasingType.Out: return 1 - (1 - x) * (1 - x);
                    case EasingType.InOut: return (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
                }
            }
            case TransitionType.Cubic: {
                switch (easing) {
                    case EasingType.In: return x * x * x;
                    case EasingType.Out: return 1 - Math.pow(1 - x, 3);
                    case EasingType.InOut: return (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
                }
            }
            case TransitionType.Quart: {
                switch (easing) {
                    case EasingType.In: return x * x * x * x;
                    case EasingType.Out: return 1 - Math.pow(1 - x, 4);
                    case EasingType.InOut: return (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2);
                }
            }
            case TransitionType.Quint: {
                switch (easing) {
                    case EasingType.In: return x * x * x * x * x;
                    case EasingType.Out: return 1 - Math.pow(1 - x, 5);
                    case EasingType.InOut: return (x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2);
                }
            }
            case TransitionType.Expo: {
                switch (easing) {
                    case EasingType.In: return (x === 0 ? 0 : Math.pow(2, 10 * x - 10));
                    case EasingType.Out: return (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));
                    case EasingType.InOut: return (x === 0
                        ? 0
                        : x === 1
                            ? 1
                            : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2
                                : (2 - Math.pow(2, -20 * x + 10)) / 2);
                }
            }
            case TransitionType.Circle: {
                switch (easing) {
                    case EasingType.In: return 1 - Math.sqrt(1 - Math.pow(x, 2));
                    case EasingType.Out: return Math.sqrt(1 - Math.pow(x - 1, 2));
                    case EasingType.InOut: return (x < 0.5
                        ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
                        : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2);
                }
            }
            case TransitionType.Back: {
                const c1 = 1.70158;
                const c2 = c1 * 1.525;
                const c3 = c1 + 1;
                switch (easing) {
                    case EasingType.In: return c3 * x * x * x - c1 * x * x;
                    case EasingType.Out: return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
                    case EasingType.InOut: return (x < 0.5
                        ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
                        : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2);
                }
            }
            case TransitionType.Elastic: {
                const c4 = (2 * Math.PI) / 3;
                const c5 = (2 * Math.PI) / 4.5;
                switch (easing) {
                    case EasingType.In: return (x === 0
                        ? 0
                        : x === 1
                            ? 1
                            : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4));
                    case EasingType.Out: return (x === 0
                        ? 0
                        : x === 1
                            ? 1
                            : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1);
                    case EasingType.InOut: return (x === 0
                        ? 0
                        : x === 1
                            ? 1
                            : x < 0.5
                                ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
                                : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1);
                }
            }
            case TransitionType.Bounce: {
                switch (easing) {
                    case EasingType.In: return 1 - InterpolateTween.calculate_TransitionEasing(x, TransitionType.Bounce, EasingType.Out);
                    case EasingType.Out: {
                        const n1 = 7.5625;
                        const d1 = 2.75;
                        let _x = x;
                        if (_x < 1 / d1) {
                            return n1 * _x * _x;
                        } else if (_x < 2 / d1) {
                            return n1 * (_x -= 1.5 / d1) * _x + 0.75;
                        } else if (_x < 2.5 / d1) {
                            return n1 * (_x -= 2.25 / d1) * _x + 0.9375;
                        } else {
                            return n1 * (_x -= 2.625 / d1) * _x + 0.984375;
                        }
                    }
                    case EasingType.InOut: return (x < 0.5
                        ? (1 - InterpolateTween.calculate_TransitionEasing(1 - 2 * x, TransitionType.Bounce, EasingType.Out)) / 2
                        : (1 + InterpolateTween.calculate_TransitionEasing(2 * x - 1, TransitionType.Bounce, EasingType.Out)) / 2);
                }
            }
        }
    }
}

export class MethodTween extends InterpolateTween {
    private readonly method: (value: number) => void;

    constructor(method: (value: number) => void, duration: number, transition: TransitionType, easing: EasingType, reversed: boolean = false) {
        super(duration, transition, easing, reversed);
        this.method = method;
    }

    public start(): void {
        super.start();
        if (this.finished) {
            this.method(this.value);
        }
    }

    public process(delta: number): void {
        if (this.running) {
            this.method(this.value);
        }
        super.process(delta);
    }
}

export class PropertyTween<Obj extends Object, Key extends keyof Obj, Val extends Obj[Key]> extends InterpolateTween {
    public readonly object: Obj;
    public readonly key: Key;
    public readonly initial: Val;
    public readonly target: Val;
    private readonly lerp: (a: any, b: any, v: number) => any;

    constructor(object: Obj, key: Key, target: Val, duration: number, transition: TransitionType, easing: EasingType, reversed: boolean = false, lerp: ((a: Val, b: Val, v: number) => Val) | undefined = undefined) {
        super(duration, transition, easing, reversed);
        this.object = object;
        this.key = key;
        this.initial = this.object[this.key] as Val;
        this.target = target;
        // set lerp function
        if (lerp !== undefined) {
            this.lerp = lerp;
        }
        else {
            if (typeof (this.target) === 'number') {
                this.lerp = PropertyTween.LerpFuncs.Number;
            }
            else if (typeof (this.target) === 'boolean') {
                this.lerp = PropertyTween.LerpFuncs.Boolean;
            }
            else if (this.target instanceof Euler) {
                this.lerp = PropertyTween.LerpFuncs.Euler;
            }
            else if (this.target instanceof Quaternion) {
                this.lerp = PropertyTween.LerpFuncs.Quaternion;
            }
            else if (this.target instanceof Vector2) {
                this.lerp = PropertyTween.LerpFuncs.Vector2;
            }
            else if (this.target instanceof Vector3) {
                this.lerp = PropertyTween.LerpFuncs.Vector3;
            }
            else if (this.target instanceof Vector4) {
                this.lerp = PropertyTween.LerpFuncs.Vector4;
            }
            else {
                throw new Error(`property '${String(this.key)}' is not lerpable`);
            }
        }
    }

    public start(): void {
        super.start();
        if (this.finished) {
            const v = this.lerp(this.initial, this.target, this.value);
            this.object[this.key] = v as Val;
        }
    }

    public process(delta: number): void {
        if (this.running) {
            const v = this.lerp(this.initial, this.target, this.value);
            this.object[this.key] = v as Val;
        }
        super.process(delta);
    }

    public static LerpFuncs = {
        Number: (a: number, b: number, v: number) => a + (b - a) * v,
        Boolean: (a: boolean, b: boolean, v: number) => v < 1 ? a : b,
        Quaternion: (a: Quaternion, b: Quaternion, v: number) => a.slerp(b, v),
        Euler: (a: Euler, b: Euler, v: number) => {
            const quat_a = Quaternion.from_Euler(a);
            const quat_b = Quaternion.from_Euler(b);
            return Euler.from_Quaternion(quat_a.slerp(quat_b, v), a.order);
        },
        Vector2: (a: Vector2, b: Vector2, v: number) => a.lerp(b, v),
        Vector3: (a: Vector3, b: Vector3, v: number) => a.lerp(b, v),
        Vector4: (a: Vector4, b: Vector4, v: number) => a.lerp(b, v),
    }
}

export class PropertyMethodTween<T> extends TweenBase {
    private _property_tween: PropertyTween<PropertyMethodTween<T>, 'tween_value', T>;
    private _initial_value: T;
    
    public get tween_value(): T { return this._initial_value; };
    public set tween_value(value: T) {
        this.method(value);    
    }

    private readonly method: (value: T) => void;

    constructor(method: (value: T) => void, start: T, end: T, duration: number, transition: TransitionType, easing: EasingType, reversed: boolean = false, lerp: ((a: T, b: T, v: number) => T) | undefined = undefined) {
        super();
        this.method = method;
        this._initial_value = start;
        this._property_tween = new PropertyTween(this, 'tween_value', end, duration, transition, easing, reversed, lerp);
    }

    public start(): void {
        this._property_tween.start();
        this.started = true;
        if (this._property_tween.finished) {
            this.finished = true;
        }
    }

    public process(delta: number): void {
        this._property_tween.process(delta);
        if (this._property_tween.finished) {
            this.finished = true;
        }
    }
}

// trigger tweens

export class CallbackTween extends TweenBase {
    private readonly callback: () => void;

    constructor(callback: () => void) {
        super();
        this.callback = callback;
    }

    public start(): void {
        this.callback();
        this.finished = true;
    }
}

export class TimerTween extends TweenBase {
    private readonly duration: number;

    private _current: number = 0;
    public get current() { return this._current; }

    constructor(duration: number) {
        super();
        this.duration = Math.max(0, duration);
    }

    public start() {
        if (this.duration === 0) {
            this._current = 1;
            this.started = true;
            this.finished = true;
        }
        else {
            this._current = 0;
            this.started = true;
            this.finished = false;
        }
    }

    public process(delta: number) {
        if (this.running) {
            const finished = this._current >= this.duration;
            if (finished) {
                this.finished = true;
            }
            else {
                const c = this._current + delta;
                this._current = clamp(c, 0, this.duration);
            }
        }
    }
}

// adaptor tweens

type ResverseableTween = TweenBase & { reversed: boolean };

export class TweenPingPong extends TweenBase {
    private readonly tween: ResverseableTween;

    private ping: boolean = true;

    constructor(tween: ResverseableTween) {
        super();
        this.tween = tween;
        this.ping = !this.tween.reversed;
    }

    public start() {
        this.started = true;
        this.finished = this.start_Tween();
    }

    private start_Tween(): boolean {
        this.tween.reversed = !this.ping;
        this.tween.start();
        this.ping = !this.ping;
        return this.tween.finished;
    }

    public process(delta: number): void {
        if (this.running) {
            this.tween.process(delta);
            this.finished = this.tween.finished;
        }
    }
}