import type { RenderState } from "../../RenderState";
import { RenderStateObject } from "../RenderStateObject";
import type { RenderStateFrameBuffer } from "../frame_buffer/RenderStateFrameBuffer";
import type { RenderStatePipeline } from "../pipeline/RenderStatePipeline";
import type { RenderStateVertexArray } from "../vertex_array/RenderStateVertexArray";
import type { RenderStateVertexArrayView } from "../vertex_array/RenderStateVertexArrayView";

export abstract class RenderStateRenderPass<T extends RenderState<T>> extends RenderStateObject<T> {

    constructor(render_state: T, frame_buffer: RenderStateFrameBuffer<T>) {
        super(render_state);
    }

    public abstract set_Viewport(x: number, y: number, width: number, height: number, min_depth?: number, max_depth?: number): void;

    public abstract set_Scissor(x: number, y: number, width: number, height: number): void;

    public abstract set_BlendConstant(r: number, g: number, b: number, a: number): void;

    public abstract draw(pipeline: RenderStatePipeline<T>, vertex_array: RenderStateVertexArray<T> | RenderStateVertexArrayView<T>, uniforms: any, instance_count: number): void;

    public abstract finish(): void;
}