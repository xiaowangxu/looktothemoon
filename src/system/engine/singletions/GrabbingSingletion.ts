import { SignalEmitter } from "@/system/utils/SignalEmitter";
import { Singletion } from "./Singletion";

export class GrabbingSingleton extends Singletion {
    public static readonly singleton_name: string = "GrabbingSingleton";

    // signals
    public readonly signal_grab_start: SignalEmitter<() => void> = new SignalEmitter();
    public readonly signal_grab_end: SignalEmitter<() => void> = new SignalEmitter();

    public on_GrabStart() {
        this.signal_grab_start.trigger();
        console.log(">>>>> start");
    }

    public on_GrabEnd() {
        this.signal_grab_end.trigger();
        console.log(">>>>> end");
    }

    public dispose(): void {
        this.signal_grab_start.clear();
        this.signal_grab_end.clear();
    }
}