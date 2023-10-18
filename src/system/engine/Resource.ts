import { SignalEmitter } from '../utils/SignalEmitter';
import { Rid } from './Rid';

export class Resource {
    public readonly rid: string = Rid();
    public signal_changed: SignalEmitter<() => void> = new SignalEmitter();

    protected trigger_Changed() {
        this.signal_changed.trigger();
    }

    public save(): any {

    }

    public load(data: any) {

    }
}