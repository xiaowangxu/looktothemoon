import { Ref } from "@/system/utils/RefCounted";
import type { RenderState } from "../../RenderState";
import { RenderStateObject } from "../RenderStateObject";
import type { RenderStateFrameBuffer } from "../frame_buffer/RenderStateFrameBuffer";
import type { RenderStatePipeline } from "../pipeline/RenderStatePipeline";
import type { RenderStateVertexArray } from "../vertex_array/RenderStateVertexArray";
import type { RenderStateVertexArrayView } from "../vertex_array/RenderStateVertexArrayView";

export abstract class RenderStateComputePass<T extends RenderState<T>> extends RenderStateObject<T> {

    constructor(render_state: T) {
        super(render_state);
    }

    public abstract compute(pipeline: RenderStatePipeline<T>, uniforms: any, workgroup_x_count: number, workgroup_y_count?: number, workgroup_z_count?: number): void;

    public abstract finish(): void;
}