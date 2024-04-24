import type { RenderState } from "../RenderState";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderStateBuffer } from "../buffer/RenderStateBuffer";
import type { RenderStateTextureSampler } from "../texture/RenderStateTextureSampler";
import type { RenderStateTextureView } from "../texture/RenderStateTextureView";
import type { RenderStateUniformBindingType } from "./RenderStateUniformLayout";

export abstract class RenderStateUniformGroup<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public abstract set_Storage(binding: number, buffer: RenderStateBuffer<T>): void;

    public abstract set_BufferUniform(binding: number, buffer: RenderStateBuffer<T>): void;

    public abstract set_Texture(binding: number, texture_view: RenderStateTextureView<T>): void;

    public abstract set_Sampler(binding: number, sampler: RenderStateTextureSampler<T>): void;

    public dispose(): void {
        this.render_state.delete_UniformGroup(this);
    }
}