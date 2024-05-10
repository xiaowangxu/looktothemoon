import { type RefCounted } from "../utils/RefCounted";
import type { WebGPURenderState } from "./WebGPURenderState";

let id = 1;

let ObjectMap = new Map<number, { object: WebGPURenderObject, stack: string | undefined }>();
(window as any).ObjectMap = () => {
    let i = 0;
    for (const [id, { object, stack }] of ObjectMap) {
        console.group(`[${(++i).toString().padStart(3, ' ')} /${ObjectMap.size.toString().padStart(3, ' ')}]`, id, object.constructor.name);
        console.log(stack);
        console.groupEnd();
    }
};

export abstract class WebGPURenderObject {

    public readonly id: number = id++;
    public readonly render_state: WebGPURenderState;

    constructor(render_state: WebGPURenderState) {
        this.render_state = render_state;
        ObjectMap.set(this.id, { object: this, stack: new Error().stack });
    }
}

export abstract class WebGPURenderObjectRefCounted extends WebGPURenderObject implements RefCounted {

    private _ref_count: number = 0;

    public get ref_count() { return this._ref_count; }

    public ref() {
        this._ref_count++;
    }

    public unref() {
        if (this._ref_count === 0) return;
        this._ref_count--;
        if (this._ref_count === 0) {
            ObjectMap.delete(this.id);
            console.log(`>>> dispose(${this.id}): ${this.constructor.name}`);
            this.dispose();
        }
    }

    public release() {
        if (this._ref_count === 0) {
            ObjectMap.delete(this.id);
            this.dispose();
        }
    }

    public abstract dispose(): void;
}