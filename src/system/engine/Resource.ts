import { SignalEmitter } from '../utils/SignalEmitter';
import { ClassBase } from './ClassBase';
import { Rid } from './Rid';

export class Resource extends ClassBase {
    public static readonly class_name: string = "Resource";

    public readonly rid: string = Rid();
    public signal_changed: SignalEmitter<() => void> = new SignalEmitter();

    protected trigger_Changed() {
        this.signal_changed.trigger();
    }
}