import type { RenderStateShaderType } from "../../render_state/pipeline/RenderStateShader";
import { RenderStateSamplerUniformType, RenderStateTextureUniformSampleType, RenderStateTextureUniformType, RenderStateUniformBindingType, RenderStateUniformLayout } from "../../render_state/uniform/RenderStateUniformLayout";
import { WebGPURenderState } from "../WebGPURenderState";

interface WebGPURenderStateUniformLayoutEntry extends GPUBindGroupLayoutEntry {
    type: RenderStateUniformBindingType
}

export class WebGPURenderStateUniformLayout extends RenderStateUniformLayout<WebGPURenderState> {

    public readonly entries: WebGPURenderStateUniformLayoutEntry[] = [];

    protected _layout: GPUBindGroupLayout | undefined = undefined;
    public get layout() { return this.flush(); }

    public add_Storage(readonly: boolean, visibility: RenderStateShaderType, binding: number): void {
        if (this._layout !== undefined) throw new Error('<WebGPURenderStateUniformLayout> add_Storage: can not mutate built layout');
        this.entries.push({
            type: RenderStateUniformBindingType.StorageBuffer,
            binding: binding,
            visibility: visibility,
            buffer: {
                type: readonly ? 'read-only-storage' : 'storage',
            }
        });
    }

    public add_BufferUniform(visibility: RenderStateShaderType, binding: number): void {
        if (this._layout !== undefined) throw new Error('<WebGPURenderStateUniformLayout> add_BufferUniform: can not mutate built layout');
        this.entries.push({
            type: RenderStateUniformBindingType.Buffer,
            binding: binding,
            visibility: visibility,
            buffer: {
                type: 'uniform',
            }
        });
        this._layout = undefined;
    }

    public add_Texture(type: RenderStateTextureUniformType, sample: RenderStateTextureUniformSampleType, visibility: RenderStateShaderType, binding: number): void {
        if (this._layout !== undefined) throw new Error('<WebGPURenderStateUniformLayout> add_Texture: can not mutate built layout');
        this.entries.push({
            type: RenderStateUniformBindingType.Texture,
            binding: binding,
            visibility: visibility,
            texture: {
                viewDimension: WebGPURenderState.RenderStateTextureUniformType(type),
                sampleType: WebGPURenderState.RenderStateTextureUniformSampleType(sample),
            }
        });
        this._layout = undefined;
    }

    public add_MultiSampleTexture(sample: RenderStateTextureUniformSampleType, visibility: RenderStateShaderType, binding: number): void {
        if (this._layout !== undefined) throw new Error('<WebGPURenderStateUniformLayout> add_MultiSampleTexture: can not mutate built layout');
        this.entries.push({
            type: RenderStateUniformBindingType.Texture,
            binding: binding,
            visibility: visibility,
            texture: {
                multisampled: true,
                viewDimension: '2d',
                sampleType: WebGPURenderState.RenderStateTextureUniformSampleType(sample),
            }
        });
        this._layout = undefined;
    }

    public add_Sampler(type: RenderStateSamplerUniformType, visibility: RenderStateShaderType, binding: number): void {
        if (this._layout !== undefined) throw new Error('<WebGPURenderStateUniformLayout> add_Sampler: can not mutate built layout');
        this.entries.push({
            type: RenderStateUniformBindingType.Sampler,
            binding: binding,
            visibility: visibility,
            sampler: {
                type: WebGPURenderState.RenderStateSamplerUniformType(type),
            }
        });
        this._layout = undefined;
    }

    public flush() {
        if (this._layout === undefined) {
            this._layout = this.render_state.device.createBindGroupLayout({ entries: this.entries });
        }
        return this._layout;
    }
}