import { WebGPURenderState } from "../../WebGPURenderState";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderStateShaderType } from "../pipeline/WebGPURenderStateShader";

export enum WebGPURenderStateBufferUniformType {
    Bool, Uint, Int, Float,
    Vector2, Vector3, Vector4,
    Matrix2, Matrix3, Matrix4,
    IVector2, IVector3, IVector4,
    UVector2, UVector3, UVector4,
}

export enum WebGPURenderStateTextureUniformType {
    Tex1D = '1d',
    Tex2D = '2d',
    Tex2DArray = '2d-array',
    Tex3D = '3d',
    TexCubeMap = 'cube',
    TexCubeMapArray = 'cube-array',
}

export enum WebGPURenderStateTextureUniformSampleType {
    Depth = 'depth',
    Float = 'float',
    Int = 'sint',
    Uint = 'uint',
    NonFilterFloat = 'unfilterable-float',
}

export enum WebGPURenderStateSamplerUniformType {
    Compare = 'comparison',
    Filter = 'filtering',
    NonFilter = 'non-filtering',
}

export type WebGPURenderStateUniformType = WebGPURenderStateBufferUniformType | WebGPURenderStateTextureUniformType;

export enum WebGPURenderStateUniformBindingType {
    StorageBuffer, Buffer, Texture, Sampler,
}

interface WebGPURenderStateUniformLayoutEntry extends GPUBindGroupLayoutEntry {
    type: WebGPURenderStateUniformBindingType
}

export class WebGPURenderStateUniformLayout extends WebGPURenderObjectRefCounted {

    public readonly entries: WebGPURenderStateUniformLayoutEntry[] = [];

    protected _layout: GPUBindGroupLayout | undefined = undefined;
    public get layout() { return this.flush(); }

    public add_Storage(readonly: boolean, visibility: WebGPURenderStateShaderType, binding: number, dynamic_offset: boolean = false): void {
        if (this._layout !== undefined) throw new Error('<WebGPURenderStateUniformLayout> add_Storage: can not mutate built layout');
        this.entries.push({
            type: WebGPURenderStateUniformBindingType.StorageBuffer,
            binding: binding,
            visibility: visibility,
            buffer: {
                type: readonly ? 'read-only-storage' : 'storage',
                hasDynamicOffset: dynamic_offset,
            }
        });
    }

    public add_BufferUniform(visibility: WebGPURenderStateShaderType, binding: number, dynamic_offset: boolean = false): void {
        if (this._layout !== undefined) throw new Error('<WebGPURenderStateUniformLayout> add_BufferUniform: can not mutate built layout');
        this.entries.push({
            type: WebGPURenderStateUniformBindingType.Buffer,
            binding: binding,
            visibility: visibility,
            buffer: {
                type: 'uniform',
                hasDynamicOffset: dynamic_offset,
            }
        });
        this._layout = undefined;
    }

    public add_Texture(type: WebGPURenderStateTextureUniformType, sample: WebGPURenderStateTextureUniformSampleType, visibility: WebGPURenderStateShaderType, binding: number): void {
        if (this._layout !== undefined) throw new Error('<WebGPURenderStateUniformLayout> add_Texture: can not mutate built layout');
        this.entries.push({
            type: WebGPURenderStateUniformBindingType.Texture,
            binding: binding,
            visibility: visibility,
            texture: {
                viewDimension: type,
                sampleType: sample,
            }
        });
        this._layout = undefined;
    }

    public add_MultiSampleTexture(sample: WebGPURenderStateTextureUniformSampleType, visibility: WebGPURenderStateShaderType, binding: number): void {
        if (this._layout !== undefined) throw new Error('<WebGPURenderStateUniformLayout> add_MultiSampleTexture: can not mutate built layout');
        this.entries.push({
            type: WebGPURenderStateUniformBindingType.Texture,
            binding: binding,
            visibility: visibility,
            texture: {
                multisampled: true,
                viewDimension: '2d',
                sampleType: sample,
            }
        });
        this._layout = undefined;
    }

    public add_Sampler(type: WebGPURenderStateSamplerUniformType, visibility: WebGPURenderStateShaderType, binding: number): void {
        if (this._layout !== undefined) throw new Error('<WebGPURenderStateUniformLayout> add_Sampler: can not mutate built layout');
        this.entries.push({
            type: WebGPURenderStateUniformBindingType.Sampler,
            binding: binding,
            visibility: visibility,
            sampler: {
                type: type,
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

    public dispose(): void {
        this.render_state.delete_UniformLayout(this);
    }
}