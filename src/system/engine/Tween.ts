import { clamp, is_ApproxEqual, is_ApproxZero } from "../fivepebble/Scalar";
import { Matrix3 } from "../fivepebble/linear_algebra/Matrix3"; // for import Euler
import { Euler } from "../fivepebble/linear_algebra/Euler";
import { Quaternion } from "../fivepebble/linear_algebra/Quaternion";
import { Vector2 } from "../fivepebble/linear_algebra/Vector2";
import { Vector3 } from "../fivepebble/linear_algebra/Vector3";
import { Vector4 } from "../fivepebble/linear_algebra/Vector4";
import { SignalEmitter } from "../utils/SignalEmitter";

export class TweenManager {

    private readonly tweens: Set<Tween> = new Set();
    public get tween_processing_count() { return this.tweens.size; }

    public process_Tweens(delta: number) {
        for (const tween of this.tweens) {
            tween.process(delta);
            if (tween.finished) {
                this.tweens.delete(tween);
            }
        }
    }

    public start_Tween(tween: Tween) {
        console.warn("start");
        tween.start();
        if (!tween.finished) {
            this.tweens.add(tween);
            return tween;
        }
        return undefined;
    }

    public stop_Tween(tween: Tween) {
        if (this.tweens.has(tween)) {
            tween.stop();
            this.tweens.delete(tween);
        }
    }

    public clear_Tweens() {
        this.tweens.clear();
    }
}

//#region tween interfaces

export interface Tween {
    get started(): boolean;
    get finished(): boolean;
    get running(): boolean;

    signal_finished: SignalEmitter<() => void>;

    start(): void;
    process(delta: number): void;
    stop(): void;
}

export interface ResverseableTween extends Tween {
    get reversed(): boolean;
    set reversed(reversed: boolean);
}

export interface InterpolatableTween extends ResverseableTween {
    /**
     * value in range [ 0, 1 ]
     */
    get value(): number;
}

//#endregion

//#region tweens

export abstract class TweenBase implements Tween {

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

    protected trigger_Finished() {
        this.signal_finished.trigger();
    }

    public abstract start(): void;

    public abstract process(delta: number): void;

    public stop() {
        this.finished = true;
    }
}

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

    public process(delta: number): void {
        return;
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
            this._current = clamp(this._current + delta, 0, this.duration);
            this.finished = this._current >= this.duration;
        }
    }
}

export enum InterpolateTweenTransitionType {
    Linear, Sine, Quad, Cubic, Quart, Quint, Expo, Back, Elastic, Circle, Bounce, Jump
}

export enum InterpolateTweenEasingType {
    In, Out, InOut
}

export class InterpolateTween extends TweenBase implements InterpolatableTween {
    private readonly duration: number;
    private readonly transition: InterpolateTweenTransitionType;
    private readonly easing: InterpolateTweenEasingType;
    public reversed: boolean = false;

    private _current: number = 0;
    public get current() { return this._current; }
    private _value: number = 0;
    public get value() { return this.reversed ? (1 - this._value) : this._value; }

    constructor(duration: number, transition: InterpolateTweenTransitionType, easing: InterpolateTweenEasingType, reversed: boolean = false) {
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
            this._current = clamp(this._current + delta, 0, this.duration);
            this._value = InterpolateTween.calculate_TransitionEasing(this._current / this.duration, this.transition, this.easing);
            this.finished = this._current >= this.duration;
        }
    }

    static calculate_TransitionEasing(value: number, transition: InterpolateTweenTransitionType, easing: InterpolateTweenEasingType): number {
        const x = clamp(value, 0, 1);
        switch (transition) {
            case InterpolateTweenTransitionType.Linear: {
                return x;
            }
            case InterpolateTweenTransitionType.Sine: {
                switch (easing) {
                    case InterpolateTweenEasingType.In: return 1 - Math.cos((x * Math.PI) / 2);
                    case InterpolateTweenEasingType.Out: return Math.sin((x * Math.PI) / 2);
                    case InterpolateTweenEasingType.InOut: return -(Math.cos(Math.PI * x) - 1) / 2;
                }
            }
            case InterpolateTweenTransitionType.Quad: {
                switch (easing) {
                    case InterpolateTweenEasingType.In: return x * x
                    case InterpolateTweenEasingType.Out: return 1 - (1 - x) * (1 - x);
                    case InterpolateTweenEasingType.InOut: return (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
                }
            }
            case InterpolateTweenTransitionType.Cubic: {
                switch (easing) {
                    case InterpolateTweenEasingType.In: return x * x * x;
                    case InterpolateTweenEasingType.Out: return 1 - Math.pow(1 - x, 3);
                    case InterpolateTweenEasingType.InOut: return (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
                }
            }
            case InterpolateTweenTransitionType.Quart: {
                switch (easing) {
                    case InterpolateTweenEasingType.In: return x * x * x * x;
                    case InterpolateTweenEasingType.Out: return 1 - Math.pow(1 - x, 4);
                    case InterpolateTweenEasingType.InOut: return (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2);
                }
            }
            case InterpolateTweenTransitionType.Quint: {
                switch (easing) {
                    case InterpolateTweenEasingType.In: return x * x * x * x * x;
                    case InterpolateTweenEasingType.Out: return 1 - Math.pow(1 - x, 5);
                    case InterpolateTweenEasingType.InOut: return (x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2);
                }
            }
            case InterpolateTweenTransitionType.Expo: {
                switch (easing) {
                    case InterpolateTweenEasingType.In: return (x === 0 ? 0 : Math.pow(2, 10 * x - 10));
                    case InterpolateTweenEasingType.Out: return (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));
                    case InterpolateTweenEasingType.InOut: return (x === 0
                        ? 0
                        : x === 1
                            ? 1
                            : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2
                                : (2 - Math.pow(2, -20 * x + 10)) / 2);
                }
            }
            case InterpolateTweenTransitionType.Circle: {
                switch (easing) {
                    case InterpolateTweenEasingType.In: return 1 - Math.sqrt(1 - Math.pow(x, 2));
                    case InterpolateTweenEasingType.Out: return Math.sqrt(1 - Math.pow(x - 1, 2));
                    case InterpolateTweenEasingType.InOut: return (x < 0.5
                        ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
                        : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2);
                }
            }
            case InterpolateTweenTransitionType.Back: {
                const c1 = 1.70158;
                const c2 = c1 * 1.525;
                const c3 = c1 + 1;
                switch (easing) {
                    case InterpolateTweenEasingType.In: return c3 * x * x * x - c1 * x * x;
                    case InterpolateTweenEasingType.Out: return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
                    case InterpolateTweenEasingType.InOut: return (x < 0.5
                        ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
                        : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2);
                }
            }
            case InterpolateTweenTransitionType.Elastic: {
                const c4 = (2 * Math.PI) / 3;
                const c5 = (2 * Math.PI) / 4.5;
                switch (easing) {
                    case InterpolateTweenEasingType.In: return (x === 0
                        ? 0
                        : x === 1
                            ? 1
                            : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4));
                    case InterpolateTweenEasingType.Out: return (x === 0
                        ? 0
                        : x === 1
                            ? 1
                            : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1);
                    case InterpolateTweenEasingType.InOut: return (x === 0
                        ? 0
                        : x === 1
                            ? 1
                            : x < 0.5
                                ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
                                : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1);
                }
            }
            case InterpolateTweenTransitionType.Bounce: {
                switch (easing) {
                    case InterpolateTweenEasingType.In: return 1 - InterpolateTween.calculate_TransitionEasing(x, InterpolateTweenTransitionType.Bounce, InterpolateTweenEasingType.Out);
                    case InterpolateTweenEasingType.Out: {
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
                    case InterpolateTweenEasingType.InOut: return (x < 0.5
                        ? (1 - InterpolateTween.calculate_TransitionEasing(1 - 2 * x, InterpolateTweenTransitionType.Bounce, InterpolateTweenEasingType.Out)) / 2
                        : (1 + InterpolateTween.calculate_TransitionEasing(2 * x - 1, InterpolateTweenTransitionType.Bounce, InterpolateTweenEasingType.Out)) / 2);
                }
            }
            case InterpolateTweenTransitionType.Jump: {
                switch (easing) {
                    case InterpolateTweenEasingType.In: return is_ApproxZero(value) ? 0 : 1;
                    case InterpolateTweenEasingType.Out: return is_ApproxEqual(value, 1.0) ? 1 : 0;
                    case InterpolateTweenEasingType.InOut: return is_ApproxEqual(value, 1.0) ? 1 : 0;
                }
            }
        }
    }
}

export class ExponentialSmoothingInterpolateTween extends TweenBase implements InterpolatableTween {
    private readonly speed: number;

    public reversed: boolean = false;

    private _value: number = 0;
    public get value() { return this.reversed ? (1 - this._value) : this._value; }

    constructor(speed: number, initial: number = 0.0, reversed: boolean = false) {
        super();
        this._value = clamp(initial, 0.0, 1.0);
        this.speed = Math.max(0, speed);
        this.reversed = reversed;
    }

    public start() {
        this._value = 0;
        this.started = true;
        this.finished = false;
    }

    public process(delta: number) {
        if (this.running) {
            this._value += (this._value - 1.0) * Math.expm1(-this.speed * delta);
            this._value = clamp(this._value, 0, 1);
            const finished = is_ApproxEqual(this._value, 1);
            if (finished) this._value = 1.0;
            this.finished = finished;
        }
    }
}

//#endregion

//#region structure

export class TweenSequence extends TweenBase {

    private readonly tweens: Tween[] = [];

    private current_tween_idx: number = 0;
    private current_tween: Tween | undefined = undefined;

    constructor(tweens: Tween[]) {
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

    public process(delta: number) {
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

    private readonly tweens: Tween[] = [];
    private running_tweens: Set<Tween> = new Set();

    constructor(tweens: Tween[]) {
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

    private readonly tween: Tween;
    private readonly loop_times: number;
    private current_loop_idx: number = 0;

    public readonly signal_looped: SignalEmitter<(loop: number, total: number) => void> = new SignalEmitter();

    constructor(tween: Tween, loop_times: number) {
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

//#endregion

//#region adaptor

export class MethodTweenAdaptor implements ResverseableTween {

    get reversed(): boolean { return this.tween.reversed; }
    set reversed(reversed: boolean) { this.tween.reversed = reversed; }
    get started(): boolean { return this.tween.started; }
    get finished(): boolean { return this.tween.finished; }
    get running(): boolean { return this.tween.running; }

    get signal_finished() { return this.tween.signal_finished; }

    private readonly tween: InterpolatableTween;
    private readonly method: (value: number) => void;

    constructor(tween: InterpolatableTween, method: (value: number) => void) {
        this.tween = tween;
        this.method = method;
    }

    public start(): void {
        this.tween.start();
        this.method(this.tween.value);
    }

    public process(delta: number): void {
        this.tween.process(delta);
        this.method(this.tween.value);
    }

    public stop(): void {
        this.tween.stop();
    }
}

export class PropertyTweenAdaptor<Obj extends Object, Key extends keyof Obj, Val extends Obj[Key]> implements ResverseableTween {

    get reversed(): boolean { return this.tween.reversed; }
    set reversed(reversed: boolean) { this.tween.reversed = reversed; }
    get started(): boolean { return this.tween.started; }
    get finished(): boolean { return this.tween.finished; }
    get running(): boolean { return this.tween.running; }

    get signal_finished() { return this.tween.signal_finished; }

    private readonly tween: InterpolatableTween;
    public readonly object: Obj;
    public readonly key: Key;
    public readonly initial: Val;
    public readonly target: Val;
    private readonly lerp: (a: any, b: any, v: number) => any;

    constructor(tween: InterpolatableTween, object: Obj, key: Key, target: Val, initial: Val | undefined = undefined, lerp: ((a: Val, b: Val, v: number) => Val) | undefined = undefined) {
        this.tween = tween;
        this.object = object;
        this.key = key;
        this.initial = initial ?? (this.object[this.key] as Val);
        this.target = target;
        // set lerp function
        if (lerp !== undefined) {
            this.lerp = lerp;
        }
        else {
            if (typeof (this.target) === 'number') {
                this.lerp = PropertyTweenAdaptor.LerpFuncs.Number;
            }
            else if (typeof (this.target) === 'boolean') {
                this.lerp = PropertyTweenAdaptor.LerpFuncs.Boolean;
            }
            else if (this.target instanceof Euler) {
                this.lerp = PropertyTweenAdaptor.LerpFuncs.Euler;
            }
            else if (this.target instanceof Quaternion) {
                this.lerp = PropertyTweenAdaptor.LerpFuncs.Quaternion;
            }
            else if (this.target instanceof Vector2) {
                this.lerp = PropertyTweenAdaptor.LerpFuncs.Vector2;
            }
            else if (this.target instanceof Vector3) {
                this.lerp = PropertyTweenAdaptor.LerpFuncs.Vector3;
            }
            else if (this.target instanceof Vector4) {
                this.lerp = PropertyTweenAdaptor.LerpFuncs.Vector4;
            }
            else {
                throw new Error(`<PropertyTweenAdaptor> constructor: property '${String(this.key)}' is not lerpable`);
            }
        }
    }

    public start(): void {
        this.tween.start();
        const v = this.lerp(this.initial, this.target, this.tween.value);
        this.object[this.key] = v as Val;
    }

    public process(delta: number): void {
        this.tween.process(delta);
        const v = this.lerp(this.initial, this.target, this.tween.value);
        this.object[this.key] = v as Val;
    }

    public stop(): void {
        this.tween.stop();
    }

    public static LerpFuncs = {
        Number: (a: number, b: number, v: number) => a + (b - a) * v,
        Boolean: (a: boolean, b: boolean, v: number) => v < 1 ? a : b,
        Quaternion: (a: Quaternion, b: Quaternion, v: number) => Quaternion.new.slerp(a, b, v),
        Euler: (a: Euler, b: Euler, v: number) => {
            const quat_a = Quaternion.new.set_Euler(a);
            const quat_b = Quaternion.new.set_Euler(b);
            return Euler.new.set_Quaternion(Quaternion.new.slerp(quat_a, quat_b, v), a.order);
        },
        Vector2: (a: Vector2, b: Vector2, v: number) => Vector2.new.lerp(a, b, v),
        Vector3: (a: Vector3, b: Vector3, v: number) => Vector3.new.lerp(a, b, v),
        Vector4: (a: Vector4, b: Vector4, v: number) => Vector4.new.lerp(a, b, v),
    }
}

export class PingPongTweenAdaptor extends TweenBase {

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
        this.tween.process(delta);
        this.finished = this.tween.finished;
    }
}

//#endregion