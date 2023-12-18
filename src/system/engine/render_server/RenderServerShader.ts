import { RenderDeviceObject } from "@/system/sliverofstraw/RenderDeviceObject";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { RenderStateUniformType, type RenderState, type RenderStateTextureUniformType, type RenderStateUniformSlotTypeMap, type RenderStateUniformTypeMap, type RenderStateUniformTypeSlotMap, type RenderStateUniformVectorType, type RenderStateValueUniformType } from "@/system/sliverofstraw/RenderState";
import type { WebGL2RenderStateProgram } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateProgram";
import type { RenderServerDevice } from "./RenderServer";
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

type WebGL2RenderStateUniformSlots = WebGL2RenderStateUintUniformSlot | WebGL2RenderStateIntUniformSlot | WebGL2RenderStateFloatUniformSlot |
    WebGL2RenderStateVec2UniformSlot | WebGL2RenderStateVec3UniformSlot | WebGL2RenderStateVec4UniformSlot |
    WebGL2RenderStateMat3UniformSlot | WebGL2RenderStateMat4UniformSlot |
    WebGL2RenderStateTextureUniformSlot;

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

type ProgramMap = Map<string, { program: Ref<WebGL2RenderStateProgram>, uniforms: WebGL2RenderDeviceUniformSet }>;

export type UniformValueTypeByTypeName<RS extends RenderState<RS>> = {
    [K in (keyof (typeof RenderStateUniformType))]: {
        type: (typeof RenderStateUniformType)[K],
        default: RenderStateUniformTypeSlotMap<RS>[K][0],
    }
};
export type UniformInitSet<RS extends RenderState<RS>> = { [name: string]: UniformValueTypeByTypeName<RS>[keyof typeof RenderStateUniformType] };

export class RenderServerShader extends RenderDeviceObject<WebGL2RenderState>
{
    protected programs_ref: ProgramMap = new Map();

    constructor(render_device: RenderServerDevice) {
        super(render_device);
    }

    private clear_Programs() {
        for (const { program, uniforms } of this.programs_ref.values()) {
            uniforms.dispose();
            program.clear();
        }
        this.programs_ref.clear();
    }

    protected setup_ProgramUniforms(program: WebGL2RenderStateProgram, uniforms: UniformInitSet<WebGL2RenderState>): WebGL2RenderDeviceUniformSet {
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

    public set_Shaders(vertex: WebGL2RenderStateShader, vert_uniforms: UniformInitSet<WebGL2RenderState>, fragments_set: { [name: string]: { shader: WebGL2RenderStateShader, uniforms: UniformInitSet<WebGL2RenderState> } }) {
        const map: ProgramMap = new Map();
        for (const [name, fragment] of Object.entries(fragments_set)) {
            const { shader, uniforms: frag_uniforms } = fragment;
            const program = this.render_state.create_Program(vertex, shader).expect();
            const uniforms = this.setup_ProgramUniforms(program, { ...vert_uniforms, ...frag_uniforms });
            map.set(name, {
                program: new Ref(program),
                uniforms: uniforms,
            });
        }
        this.clear_Programs();
        this.programs_ref = map;
    }

    public has_Program(name: string) {
        return this.programs_ref.has(name);
    }

    public get_Program(name: string) {
        return this.programs_ref.get(name)?.program?.value;
    }

    public get_Uniform<Val extends RenderStateUniformType>(name: string, uniform: string): RenderStateUniformSlotTypeMap<WebGL2RenderState, Val> | undefined {
        const uniforms = this.programs_ref.get(name)?.uniforms;
        if (uniforms === undefined) return undefined;
        return uniforms.get_Uniform(uniform);
    }

    public set_ValueUniform<VT extends RenderStateValueUniformType>(name: string, uniform: string, value: RenderStateUniformTypeMap<WebGL2RenderState, VT> | undefined) {
        const uniform_slot = this.get_Uniform<VT>(name, uniform) as WebGL2RenderStateValueUniformSlot<VT, RenderStateUniformTypeMap<WebGL2RenderState, VT>, RenderStateUniformVectorType> | undefined;
        if (uniform_slot !== undefined) {
            uniform_slot.value = value;
        }
    }

    public set_TextureUniform<VT extends RenderStateTextureUniformType>(name: string, uniform: string, texture: WebGL2RenderStateTexture | undefined) {
        const uniform_slot = this.get_Uniform<VT>(name, uniform) as WebGL2RenderStateTextureUniformSlot | undefined;
        if (uniform_slot !== undefined) {
            uniform_slot.texture = texture;
        }
    }

    public set_TextureSamplerUniform<VT extends RenderStateTextureUniformType>(name: string, uniform: string, sampler: WebGL2RenderStateTextureSampler | undefined) {
        const uniform_slot = this.get_Uniform<VT>(name, uniform) as WebGL2RenderStateTextureUniformSlot | undefined;
        if (uniform_slot !== undefined) {
            uniform_slot.sampler = sampler;
        }
    }

    public commit_Uniform(name: string, uniform: string) {
        const obj = this.programs_ref.get(name);
        if (obj === undefined) return;
        const { uniforms: uniformset } = obj;
        uniformset.commit_Uniform(uniform);
    }

    public commit_AllUniform(name: string) {
        const obj = this.programs_ref.get(name);
        if (obj === undefined) return;
        const { uniforms: uniformset } = obj;
        uniformset.commit_AllUniform();
    }

    public dispose(): void {
        console.log(">>> dispose <RenderServerShader>");
        this.clear_Programs();
    }
}