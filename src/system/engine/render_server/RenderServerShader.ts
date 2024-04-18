import { RenderDeviceObject } from "@/system/sliverofstraw/render_device_objects/RenderDeviceObject";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { RenderStateUniformType, type RenderState } from "@/system/sliverofstraw/RenderState";
import type { WebGL2RenderStateProgram } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateProgram";
import { RenderServerDevice } from "./RenderServer";
import type { WebGL2RenderStateShader } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateShader";
import { type WebGL2RenderStateUniform } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateUniformSlot";
import type { WebGL2RenderStateTexture, WebGL2RenderStateTextureSampler } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { Ref } from "@/system/utils/RefCounted";
import type { RenderStateUniformTypeSlotMap, RenderStateValueUniformType, RenderStateUniformTypeMap, RenderStateTextureUniformType, RenderStateUniform } from "@/system/sliverofstraw/render_state_objects/RenderStateUniformSlot";

export class WebGL2RenderDeviceUniformSet {
    protected uniforms: Map<string, Ref<WebGL2RenderStateUniform>> = new Map();

    public add_Uniform(name: string, uniform_slot: WebGL2RenderStateUniform) {
        if (this.uniforms.has(name)) return;
        this.uniforms.set(name, new Ref(uniform_slot));
    }

    public get_Uniform<VT extends RenderStateUniformType>(name: string) {
        return this.uniforms.get(name)?.expect as (WebGL2RenderStateUniform<VT> | undefined);
    }

    public commit_Uniform(name: string) {
        if (this.uniforms.has(name)) {
            const uniform = this.uniforms.get(name)!.expect;
            uniform.render_state.set_ProgramUniform(uniform);
        }
    }

    public commit_AllUniform() {
        for (const obj of this.uniforms.values()) {
            obj.expect.render_state.set_ProgramUniform(obj.expect);
        }
    }

    public dispose() {
        console.log(">>> dispose <WebGL2RenderDeviceUniformSet>");
        for (const obj of this.uniforms.values()) {
            obj.clear();
        }
        this.uniforms.clear();
    }
}

export type UniformValueTypeByTypeName<RS extends RenderState<RS>> = {
    [K in (keyof (typeof RenderStateUniformType))]: {
        type: (typeof RenderStateUniformType)[K],
        default: RenderStateUniformTypeSlotMap<RS>[K][0],
    }
};
export type UniformInitSet<RS extends RenderState<RS>> = { [name: string]: UniformValueTypeByTypeName<RS>[keyof typeof RenderStateUniformType] };

export enum RenderServerShaderPass {
    PreZ = 'prez',
    Shade = 'shade',
    OiT = 'oit',
}

export type FragmentShaderSetInitSet<Val = { shader: WebGL2RenderStateShader, uniforms: UniformInitSet<WebGL2RenderState> }> = { [K in RenderServerShaderPass]?: Val };

export class RenderServerShader extends RenderDeviceObject<WebGL2RenderState> {
    protected program_prez_ref: Ref<WebGL2RenderStateProgram> = new Ref();
    protected uniform_prez: WebGL2RenderDeviceUniformSet | undefined;
    protected program_shade_ref: Ref<WebGL2RenderStateProgram> = new Ref();
    protected uniform_shade: WebGL2RenderDeviceUniformSet | undefined;
    protected program_oit_ref: Ref<WebGL2RenderStateProgram> = new Ref();
    protected uniform_oit: WebGL2RenderDeviceUniformSet | undefined;

    constructor(render_device: RenderServerDevice) {
        super(render_device);
    }

    private clear_Programs() {
        this.program_prez_ref.clear();
        this.uniform_prez?.dispose();
        this.uniform_prez = undefined;
        this.program_shade_ref.clear();
        this.uniform_shade?.dispose();
        this.uniform_shade = undefined;
        this.program_oit_ref.clear();
        this.uniform_oit?.dispose();
        this.uniform_oit = undefined;
    }

    protected setup_ProgramUniforms(program: WebGL2RenderStateProgram, uniforms: UniformInitSet<WebGL2RenderState>): WebGL2RenderDeviceUniformSet {
        // WorldUniforms
        const world_location = this.render_state.get_ProgramUniformBlockLocation(program, RenderServerDevice.WorldUniformsName);
        if (world_location >= 0) {
            this.render_state.set_ProgramUniformBuffer(program, world_location, RenderServerDevice.WorldUniformsUnit);
        }
        // EnvironmentUniforms
        const env_location = this.render_state.get_ProgramUniformBlockLocation(program, RenderServerDevice.EnvironmentUniformsName);
        if (env_location >= 0) {
            this.render_state.set_ProgramUniformBuffer(program, env_location, RenderServerDevice.EnvironmentUniformsUnit);
        }
        const uniform = new WebGL2RenderDeviceUniformSet();
        for (const [name, val] of Object.entries(uniforms)) {
            const { type, default: default_value } = val;
            const uniform_slot = this.render_state.create_ProgramUniform(program, name, type, default_value).unwrap();
            if (uniform_slot) {
                uniform.add_Uniform(name, uniform_slot);
            }
        }
        return uniform;
    }

    public set_Shaders(vertex: WebGL2RenderStateShader, vert_uniforms: UniformInitSet<WebGL2RenderState>, fragments_set: FragmentShaderSetInitSet) {
        for (const [name, { shader, uniforms: frag_uniforms }] of Object.entries(fragments_set)) {
            const _name = name as RenderServerShaderPass;
            switch (_name) {
                case RenderServerShaderPass.PreZ: {
                    const program = this.render_state.create_Program(vertex, shader).expect();
                    const uniforms = this.setup_ProgramUniforms(program, { ...vert_uniforms, ...frag_uniforms });
                    this.program_prez_ref.value = program;
                    this.uniform_prez?.dispose();
                    this.uniform_prez = uniforms;
                    break;
                }
                case RenderServerShaderPass.Shade: {
                    const program = this.render_state.create_Program(vertex, shader).expect();
                    const uniforms = this.setup_ProgramUniforms(program, { ...vert_uniforms, ...frag_uniforms });
                    this.program_shade_ref.value = program;
                    this.uniform_shade?.dispose();
                    this.uniform_shade = uniforms;
                    break;
                }
                case RenderServerShaderPass.OiT: {
                    const program = this.render_state.create_Program(vertex, shader).expect();
                    const uniforms = this.setup_ProgramUniforms(program, { ...vert_uniforms, ...frag_uniforms });
                    this.program_oit_ref.value = program;
                    this.uniform_oit?.dispose();
                    this.uniform_oit = uniforms;
                    break;
                }
                default: {
                    const n: never = _name;
                    break;
                }
            }
        }
    }

    public has_Program(name: RenderServerShaderPass) {
        switch (name) {
            case RenderServerShaderPass.PreZ: {
                return !this.program_prez_ref.is_empty;
            }
            case RenderServerShaderPass.Shade: {
                return !this.program_shade_ref.is_empty;
            }
            case RenderServerShaderPass.OiT: {
                return !this.program_oit_ref.is_empty;
            }
            default: {
                const n: never = name;
            }
        }
    }

    public get_Program(name: RenderServerShaderPass) {
        switch (name) {
            case RenderServerShaderPass.PreZ: {
                return this.program_prez_ref.value;
            }
            case RenderServerShaderPass.Shade: {
                return this.program_shade_ref.value;
            }
            case RenderServerShaderPass.OiT: {
                return this.program_oit_ref.value;
            }
            default: {
                const n: never = name;
            }
        }
    }

    public get_Uniform<VT extends RenderStateUniformType>(name: RenderServerShaderPass, uniform: string): WebGL2RenderStateUniform<VT> | undefined {
        let uniforms: WebGL2RenderDeviceUniformSet | undefined = undefined;
        switch (name) {
            case RenderServerShaderPass.PreZ: {
                uniforms = this.uniform_prez;
                break;
            }
            case RenderServerShaderPass.Shade: {
                uniforms = this.uniform_shade;
                break;
            }
            case RenderServerShaderPass.OiT: {
                uniforms = this.uniform_oit;
                break;
            }
            default: {
                const n: never = name;
            }
        }
        if (uniforms === undefined) return undefined;
        return uniforms.get_Uniform(uniform);
    }

    public set_ValueUniform<VT extends RenderStateValueUniformType>(name: RenderServerShaderPass, uniform: string, value: RenderStateUniformTypeMap<WebGL2RenderState, VT> | undefined) {
        const uniform_slot = this.get_Uniform<VT>(name, uniform);
        if (uniform_slot !== undefined) {
            uniform_slot.set_Value(value, true);
        }
    }

    public set_TextureUniform<VT extends RenderStateTextureUniformType>(name: RenderServerShaderPass, uniform: string, texture: WebGL2RenderStateTexture | undefined) {
        const uniform_slot = this.get_Uniform<VT>(name, uniform);
        if (uniform_slot !== undefined) {
            uniform_slot.set_Texture(texture, true);
        }
    }

    public set_TextureSamplerUniform<VT extends RenderStateTextureUniformType>(name: RenderServerShaderPass, uniform: string, sampler: WebGL2RenderStateTextureSampler | undefined) {
        const uniform_slot = this.get_Uniform<VT>(name, uniform);
        if (uniform_slot !== undefined) {
            uniform_slot.set_Sampler(sampler, true);
        }
    }

    public commit_Uniform(name: RenderServerShaderPass, uniform: string) {
        switch (name) {
            case RenderServerShaderPass.PreZ: {
                this.uniform_prez?.commit_Uniform(uniform);
                break;
            }
            case RenderServerShaderPass.Shade: {
                this.uniform_shade?.commit_Uniform(uniform);
                break;
            }
            case RenderServerShaderPass.OiT: {
                this.uniform_oit?.commit_Uniform(uniform);
                break;
            }
            default: {
                const n: never = name;
            }
        }
    }

    public commit_AllUniform(name: RenderServerShaderPass) {
        switch (name) {
            case RenderServerShaderPass.PreZ: {
                this.uniform_prez?.commit_AllUniform();
                break;
            }
            case RenderServerShaderPass.Shade: {
                this.uniform_shade?.commit_AllUniform();
                break;
            }
            case RenderServerShaderPass.OiT: {
                this.uniform_oit?.commit_AllUniform();
                break;
            }
            default: {
                const n: never = name;
            }
        }
    }

    public dispose(): void {
        console.log(">>> dispose <RenderServerShader>");
        this.clear_Programs();
    }
}