import { SignalEmitter } from '../utils/SignalEmitter';
import { ClassBase } from './ClassBase';

export class Resource extends ClassBase {
    public static readonly class_name: string = "Resource";

    public signal_changed: SignalEmitter<() => void> = new SignalEmitter();

    protected trigger_Changed() {
        this.signal_changed.trigger();
    }
}