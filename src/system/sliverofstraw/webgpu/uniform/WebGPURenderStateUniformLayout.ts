import type { Result } from "@/system/utils/Result";
import type { RenderStateShaderType } from "../../render_state_objects/pipeline/RenderStateShader";
import type { RenderStateUniformGroup } from "../../render_state_objects/uniform/RenderStateUniformGroup";
import { RenderStateBufferUniformType, RenderStateSamplerUniformType, RenderStateTextureUniformSampleType, RenderStateTextureUniformType, RenderStateUniformLayout } from "../../render_state_objects/uniform/RenderStateUniformLayout";
import { WebGPURenderState } from "../WebGPURenderState";

export class WebGPURenderStateUniformLayout extends RenderStateUniformLayout<WebGPURenderState> {

    public readonly entries: GPUBindGroupLayoutEntry[] = [];

    protected _layout: GPUBindGroupLayout | undefined = undefined;
    public get layout() { return this._layout; }

    public add_Storage(name: string, readonly: boolean, visibility: RenderStateShaderType, location: number): void {
        this.entries.push({
            binding: location,
            visibility: visibility,
            buffer: {
                type: readonly ? 'read-only-storage' : 'storage',
            }
        });
    }

    public add_BufferUniform(name: string, visibility: RenderStateShaderType, location: number): void {
        this.entries.push({
            binding: location,
            visibility: visibility,
            buffer: {
                type: 'uniform',
            }
        });
    }

    public add_Uniform(name: string, type: RenderStateBufferUniformType, visibility: RenderStateShaderType, location: number): void {
        this.entries.push({
            binding: location,
            visibility: visibility,
            buffer: {
                type: 'uniform',
            }
        });
    }

    public add_Texture(name: string, type: RenderStateTextureUniformType, sample: RenderStateTextureUniformSampleType, visibility: RenderStateShaderType, location: number): void {
        this.entries.push({
            binding: location,
            visibility: visibility,
            texture: {
                viewDimension: WebGPURenderState.RenderStateTextureUniformType(type),
                sampleType: WebGPURenderState.RenderStateTextureUniformSampleType(sample),
            }
        });
    }

    public add_MultiSampleTexture(name: string, sample: RenderStateTextureUniformSampleType, visibility: RenderStateShaderType, location: number): void {
        this.entries.push({
            binding: location,
            visibility: visibility,
            texture: {
                multisampled: true,
                viewDimension: '2d',
                sampleType: WebGPURenderState.RenderStateTextureUniformSampleType(sample),
            }
        });
    }

    public add_Sampler(name: string, type: RenderStateSamplerUniformType, visibility: RenderStateShaderType, location: number): void {
        this.entries.push({
            binding: location,
            visibility: visibility,
            sampler: {
                type: WebGPURenderState.RenderStateSamplerUniformType(type),
            }
        });
    }

    public finish() {
        this._layout = this.render_state.device.createBindGroupLayout({ entries: this.entries });
    }

    public create_Group(): RenderStateUniformGroup<WebGPURenderState> {
        throw new Error("Method not implemented.");
    }

}