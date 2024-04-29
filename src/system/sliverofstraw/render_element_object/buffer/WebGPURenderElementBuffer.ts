import { ReadonlyRef } from "@/system/utils/RefCounted";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderStateBuffer, WebGPURenderStateBufferData } from "../../render_state_object/buffer/WebGPURenderStateBuffer";

export abstract class WebGPURenderElementBuffer<T> extends WebGPURenderObjectRefCounted {

    public abstract readonly buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;
    public get buffer(): WebGPURenderStateBuffer { return this.buffer_ref.expect; }

    public abstract get data(): WebGPURenderStateBufferData;

    public abstract get element_count(): number;
    public abstract get bytes_count(): number;

    public abstract set_Data(data: T | T[], element_offset: number): void;
    
    public abstract get_Data(element_index: number, target?: T): T;

    public abstract commit(): void;

    public dispose(): void {
        this.buffer_ref.clear();
    }
}