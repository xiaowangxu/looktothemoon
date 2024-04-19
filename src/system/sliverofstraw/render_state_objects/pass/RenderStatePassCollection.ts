import type { RenderState } from "../../RenderState";
import { RenderStateObject } from "../RenderStateObject";
import type { RenderStateFrameBuffer } from "../frame_buffer/RenderStateFrameBuffer";
import type { RenderStateComputePass } from "./RenderStateComputePass";
import type { RenderStateRenderPass } from "./RenderStateRenderPass";

export abstract class RenderStatePassCollection<T extends RenderState<T>> extends RenderStateObject<T> {

    constructor(render_state: T) {
        super(render_state);
    }

    public abstract create_RenderPass(frame_buffer: RenderStateFrameBuffer<T>): RenderStateRenderPass<T>;

    public abstract create_ComputePass(): RenderStateComputePass<T>;

    public abstract finish(): void;
}