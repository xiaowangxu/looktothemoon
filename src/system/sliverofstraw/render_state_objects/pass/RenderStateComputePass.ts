import type { RenderState } from "../../RenderState";
import { RenderStateObject } from "../RenderStateObject";
import type { RenderStateComputePipeline } from "../pipeline/RenderStateComputePipeline";
import type { RenderStateUniformGroup } from "../uniform/RenderStateUniformGroup";

export abstract class RenderStateComputePass<T extends RenderState<T>> extends RenderStateObject<T> {

    constructor(render_state: T) {
        super(render_state);
    }

    public abstract copy_Textures(): void;

    public abstract compute(pipeline: RenderStateComputePipeline<T>, uniforms: Iterable<RenderStateUniformGroup<T>>, workgroup_x_count: number, workgroup_y_count?: number, workgroup_z_count?: number): void;

    public abstract finish(): void;
}