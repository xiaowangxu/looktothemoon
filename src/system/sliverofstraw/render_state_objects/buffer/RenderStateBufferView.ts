import { Ref } from "@/system/utils/RefCounted";
import { RenderStateObject } from "../RenderStateObject";
import type { RenderState } from "../../RenderState";
import { RenderStateBuffer } from "./RenderStateBuffer";

export abstract class RenderStateBufferView<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>> extends RenderStateObject<T> {
    public readonly buffer_ref: Ref<Buffer> = new Ref();

    public get type() { return this.buffer_ref.expect.type; }
    public get usage() { return this.buffer_ref.expect.type; }
    public get data_type() { return this.buffer_ref.expect.data_type; }
    public get data_normalize() { return this.buffer_ref.expect.data_normalize; }
    public readonly data_size: number;
    public readonly data_stride: number;
    public readonly data_offset: number;
    public readonly divisor: number;

    constructor(render_state: T, buffer: Buffer, data_size: number, data_stride: number, data_offset: number, divisor: number | undefined) {
        super(render_state);
        this.buffer_ref.value = buffer;
        this.data_size = data_size;
        this.data_stride = data_stride;
        this.data_offset = data_offset;
        this.divisor = divisor ?? this.buffer_ref.expect.divisor;
    }

    public dispose() {
        console.log(">>> dispsoe <RenderStateBufferView>", this.id);
        this.buffer_ref.clear();
    }
}