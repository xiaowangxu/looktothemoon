import type { RenderState } from "../RenderState";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderStateBuffer } from "../buffer/RenderStateBuffer";
import type { RenderStateTextureSampler } from "../texture/RenderStateTextureSampler";
import type { RenderStateTextureView } from "../texture/RenderStateTextureView";

export abstract class RenderStateUniformGroup<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public abstract set_Storage(name: string, buffer: RenderStateBuffer<T>): void;

    public abstract set_BufferUniform(name: string, buffer: RenderStateBuffer<T>): void;

    public abstract set_Uniform(name: string, value: any): void;

    public abstract set_Texture(name: string, texture_view: RenderStateTextureView<T>): void;

    public abstract set_Sampler(name: string, sampler: RenderStateTextureSampler<T>): void;

    public dispose(): void {
        this.render_state.delete_UniformGroup(this);
    }
}