import { RenderDeviceObject } from "@/system/sliverofstraw/RenderDeviceObject";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { RenderStateUniformType, type RenderState, type RenderStateTextureUniformType, type RenderStateUniformSlotTypeMap, type RenderStateUniformTypeMap, type RenderStateUniformTypeSlotMap, type RenderStateUniformVectorType, type RenderStateValueUniformType } from "@/system/sliverofstraw/RenderState";
import type { WebGL2RenderStateProgram } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateProgram";
import { RenderServerDevice } from "./RenderServer";
import type { WebGL2RenderStateShader } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateShader";
import {
    type WebGL2RenderStateValueUniformSlot,
    WebGL2RenderStateUintUniformSlot,
    WebGL2RenderStateIntUniformSlot,
    WebGL2RenderStateFloatUniformSlot,
    WebGL2RenderStateVec2UniformSlot,
    WebGL2RenderStateVec3UniformSlot,
    WebGL2RenderStateVec4UniformSlot,
    WebGL2RenderStateMat3UniformSlot,
    WebGL2RenderStateMat4UniformSlot,
    WebGL2RenderStateTextureUniformSlot,
} from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateUniformSlot";
import type { WebGL2RenderStateTexture, WebGL2RenderStateTextureSampler } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { Ref, unref } from "@/system/utils/RefCounted";

type WebGL2RenderStateUniformSlots = WebGL2RenderStateUintUniformSlot | WebGL2RenderStateIntUniformSlot | WebGL2RenderStateFloatUniformSlot | WebGL2RenderStateVec2UniformSlot | WebGL2RenderStateVec3UniformSlot | WebGL2RenderStateVec4UniformSlot | WebGL2RenderStateMat3UniformSlot | WebGL2RenderStateMat4UniformSlot | WebGL2RenderStateTextureUniformSlot;

export class WebGL2RenderDeviceUniformSet {
    protected uniforms: Map<string, Ref<WebGL2RenderStateUniformSlots>> = new Map();

    public add_Uniform(name: string, uniform_slot: WebGL2RenderStateUniformSlots) {
        if (this.uniforms.has(name)) return;
        this.uniforms.set(name, new Ref(uniform_slot));
    }

    public get_Uniform<T extends RenderStateUniformType>(name: string) {
        return unref(this.uniforms.get(name)) as (RenderStateUniformSlotTypeMap<WebGL2RenderState, T> | undefined);
    }

    public commit_Uniform(name: string) {
        if (this.uniforms.has(name)) {
            this.uniforms.get(name)!.expect.commit();
        }
    }

    public commit_AllUniform() {
        for (const obj of this.uniforms.values()) {
            obj.expect.commit();
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

export const enum RenderServerShaderPass {
    PreZ = 'prez',
    Shade = 'shade',
    OiT = 'oit',
}

export class RenderServerShader extends RenderDeviceObject<WebGL2RenderState>
{
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
        const location = this.render_state.get_ProgramUniformBlockLocation(program, RenderServerDevice.WorldUniformsName);
        if (location >= 0) {
            this.render_state.set_ProgramUniformBuffer(program, location, RenderServerDevice.WorldUniformsUnit);
        }
        const uniform = new WebGL2RenderDeviceUniformSet();
        for (const name in uniforms) {
            const { type, default: default_value } = uniforms[name];
            const location = this.render_state.get_ProgramUniformLocation(program, name);
            if (location === null) continue;
            switch (type) {
                case RenderStateUniformType.Uint: {
                    uniform.add_Uniform(
                        name,
                        new WebGL2RenderStateUintUniformSlot(this.render_state, program, location, default_value)
                    );
                    break;
                }
                case RenderStateUniformType.Int: {
                    uniform.add_Uniform(
                        name,
                        new WebGL2RenderStateIntUniformSlot(this.render_state, program, location, default_value)
                    );
                    break;
                }
                case RenderStateUniformType.Float: {
                    uniform.add_Uniform(
                        name,
                        new WebGL2RenderStateFloatUniformSlot(this.render_state, program, location, default_value)
                    );
                    break;
                }
                case RenderStateUniformType.Vec2: {
                    uniform.add_Uniform(
                        name,
                        new WebGL2RenderStateVec2UniformSlot(this.render_state, program, location, default_value)
                    );
                    break;
                }
                case RenderStateUniformType.Vec3: {
                    uniform.add_Uniform(
                        name,
                        new WebGL2RenderStateVec3UniformSlot(this.render_state, program, location, default_value)
                    );
                    break;
                }
                case RenderStateUniformType.Vec4: {
                    uniform.add_Uniform(
                        name,
                        new WebGL2RenderStateVec4UniformSlot(this.render_state, program, location, default_value)
                    );
                    break;
                }
                case RenderStateUniformType.Mat3: {
                    uniform.add_Uniform(
                        name,
                        new WebGL2RenderStateMat3UniformSlot(this.render_state, program, location, default_value)
                    );
                    break;
                }
                case RenderStateUniformType.Mat4: {
                    uniform.add_Uniform(
                        name,
                        new WebGL2RenderStateMat4UniformSlot(this.render_state, program, location, default_value)
                    );
                    break;
                }
                case RenderStateUniformType.Tex2D:
                case RenderStateUniformType.Tex3D:
                case RenderStateUniformType.Tex2DArray: {
                    uniform.add_Uniform(
                        name,
                        new WebGL2RenderStateTextureUniformSlot(this.render_state, program, type, location, default_value.texture as WebGL2RenderStateTexture, default_value.sampler as WebGL2RenderStateTextureSampler)
                    );
                    break;
                }
                default: {
                    const n: never = type;
                    break;
                }
            }
        }
        return uniform;
    }

    public set_Shaders(vertex: WebGL2RenderStateShader, vert_uniforms: UniformInitSet<WebGL2RenderState>, fragments_set: { [K in RenderServerShaderPass]?: { shader: WebGL2RenderStateShader, uniforms: UniformInitSet<WebGL2RenderState> } }) {
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

    public get_Uniform<Val extends RenderStateUniformType>(name: RenderServerShaderPass, uniform: string): RenderStateUniformSlotTypeMap<WebGL2RenderState, Val> | undefined {
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
        const uniform_slot = this.get_Uniform<VT>(name, uniform) as WebGL2RenderStateValueUniformSlot<VT, RenderStateUniformTypeMap<WebGL2RenderState, VT>, RenderStateUniformVectorType> | undefined;
        if (uniform_slot !== undefined) {
            uniform_slot.value = value;
        }
    }

    public set_TextureUniform<VT extends RenderStateTextureUniformType>(name: RenderServerShaderPass, uniform: string, texture: WebGL2RenderStateTexture | undefined) {
        const uniform_slot = this.get_Uniform<VT>(name, uniform) as WebGL2RenderStateTextureUniformSlot | undefined;
        if (uniform_slot !== undefined) {
            uniform_slot.texture = texture;
        }
    }

    public set_TextureSamplerUniform<VT extends RenderStateTextureUniformType>(name: RenderServerShaderPass, uniform: string, sampler: WebGL2RenderStateTextureSampler | undefined) {
        const uniform_slot = this.get_Uniform<VT>(name, uniform) as WebGL2RenderStateTextureUniformSlot | undefined;
        if (uniform_slot !== undefined) {
            uniform_slot.sampler = sampler;
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