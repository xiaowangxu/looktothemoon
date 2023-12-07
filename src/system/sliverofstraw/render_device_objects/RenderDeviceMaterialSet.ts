import { Ref, unref } from "@/system/utils/RefCounted";
import { RenderDeviceObject } from "../RenderDeviceObject";
import { RenderStateUniformType, type RenderState, type RenderStateUniformSlotTypeMap, type RenderStateValueUniformType, type RenderStateUniformVectorType, type RenderStateTextureUniformType, type RenderStateUniformTypeSlotMap, type RenderStateUniformTypeMap } from "../RenderState";
import type { RenderStateProgram } from "../render_state_objects/RenderStateProgram";
import type { RenderDevice } from "../RenderDevice";
import type { RenderStateShader } from "../render_state_objects/RenderStateShader";
import { RenderStateTextureUniformSlot, RenderStateUniformSlot, RenderStateValueUniformSlot } from "../render_state_objects/RenderStateUniformSlot";
import type { RenderStateTexture, RenderStateTextureSampler } from "../render_state_objects/RenderStateTexture";

type ProgramMap<T extends RenderState<T>, Program extends RenderStateProgram<T>> = Map<string, { program: Ref<Program>, uniforms: RenderDeviceUniformSet<T> }>;

export type UniformValueTypeByTypeName<RS extends RenderState<RS>> = {
    [K in (keyof (typeof RenderStateUniformType))]: {
        type: (typeof RenderStateUniformType)[K],
        default: RenderStateUniformTypeSlotMap<RS>[K][0],
    }
};
export type UniformInitSet<RS extends RenderState<RS>> = { [name: string]: UniformValueTypeByTypeName<RS>[keyof typeof RenderStateUniformType] };

export class RenderDeviceUniformSet<RS extends RenderState<RS>> {
    protected uniforms: Map<string, Ref<RenderStateUniformSlot<RS, RenderStateUniformType>>> = new Map();

    public add_Uniform(name: string, uniform_slot: RenderStateUniformSlot<RS, RenderStateUniformType>) {
        if (this.uniforms.has(name)) return;
        this.uniforms.set(name, new Ref(uniform_slot));
    }

    public get_Uniform<T extends RenderStateUniformType>(name: string) {
        return unref(this.uniforms.get(name)) as (RenderStateUniformSlotTypeMap<RS, T> | undefined);
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
        console.log(">>> dispose <RenderDeviceUniformSet>");
        for (const obj of this.uniforms.values()) {
            obj.clear();
        }
        this.uniforms.clear();
    }
}

export abstract class RenderDeviceMaterialSet<
    T extends RenderState<T>,
    Program extends RenderStateProgram<T> = RenderStateProgram<T>,
    Shader extends RenderStateShader<T> = RenderStateShader<T>,
>
    extends RenderDeviceObject<T>
{
    protected programs_ref: ProgramMap<T, Program> = new Map();

    protected abstract bind_ProgramUniforms(program: Program, uniforms: UniformInitSet<T>): RenderDeviceUniformSet<T>;

    protected set_Shaders(vertex: Shader, vert_uniforms: UniformInitSet<T>, fragments_set: { [name: string]: { shader: Shader, uniforms: UniformInitSet<T> } }) {
        const map: ProgramMap<T, Program> = new Map();
        for (const [name, fragment] of Object.entries(fragments_set)) {
            const { shader, uniforms: frag_uniforms } = fragment;
            const program = this.render_state.create_Program(vertex, shader).expect() as Program;
            const uniforms = this.bind_ProgramUniforms(program, { ...vert_uniforms, ...frag_uniforms });
            map.set(name, {
                program: new Ref(program),
                uniforms: uniforms,
            });
        }
        this.clear_Programs();
        this.programs_ref = map;
    }

    constructor(render_device: RenderDevice<T>, vertex: Shader, uniforms: UniformInitSet<T>, fragments_set: { [name: string]: { shader: Shader, uniforms: UniformInitSet<T> } }) {
        super(render_device);
        this.set_Shaders(vertex, uniforms, fragments_set);
    }

    public has_Program(name: string) {
        return this.programs_ref.has(name);
    }

    public get_Program(name: string) {
        return this.programs_ref.get(name)?.program?.value;
    }

    public use_Program(name: string) {
        const obj = this.programs_ref.get(name);
        if (obj === undefined) return;
        const { program, uniforms: uniformset } = obj;
        uniformset.commit_AllUniform();
        return program.value;
    }

    public get_Uniform<Val extends RenderStateUniformType>(name: undefined, uniform: string): RenderStateUniformSlotTypeMap<T, Val>[];
    public get_Uniform<Val extends RenderStateUniformType>(name: string, uniform: string): RenderStateUniformSlotTypeMap<T, Val> | undefined;
    public get_Uniform<Val extends RenderStateUniformType>(name: string | undefined, uniform: string): RenderStateUniformSlotTypeMap<T, Val>[] | RenderStateUniformSlotTypeMap<T, Val> | undefined {
        if (name === undefined) {
            const results = [];
            for (const { uniforms } of this.programs_ref.values()) {
                const uniform_slot = uniforms.get_Uniform(uniform);
                if (uniform_slot !== undefined) {
                    results.push(uniform_slot);
                }
            }
            return results;
        }
        else {
            const uniforms = this.programs_ref.get(name)?.uniforms;
            if (uniforms === undefined) return undefined;
            return uniforms.get_Uniform(uniform);
        }
    }

    public set_ValueUniform<VT extends RenderStateValueUniformType>(name: string | undefined, uniform: string, value: RenderStateUniformTypeMap<T, VT>) {
        if (name === undefined) {
            const uniform_slots = this.get_Uniform<VT>(name, uniform) as RenderStateValueUniformSlot<T, VT, RenderStateUniformTypeMap<T, VT>, RenderStateUniformVectorType>[];
            for (const uniform_slot of uniform_slots) {
                uniform_slot.value = value;
            }
        }
        else {
            const uniform_slot = this.get_Uniform<VT>(name, uniform) as RenderStateValueUniformSlot<T, VT, RenderStateUniformTypeMap<T, VT>, RenderStateUniformVectorType> | undefined;
            if (uniform_slot !== undefined) {
                uniform_slot.value = value;
            }
        }
    }

    public set_TextureUniform<VT extends RenderStateTextureUniformType>(name: string | undefined, uniform: string, texture?: RenderStateTexture<T>) {
        if (name === undefined) {
            const uniform_slots = this.get_Uniform<VT>(name, uniform) as RenderStateTextureUniformSlot<T, VT, RenderStateTexture<T>, RenderStateTextureSampler<T>>[];
            for (const uniform_slot of uniform_slots) {
                uniform_slot.texture = texture;
            }
        }
        else {
            const uniform_slot = this.get_Uniform<VT>(name, uniform) as RenderStateTextureUniformSlot<T, VT, RenderStateTexture<T>, RenderStateTextureSampler<T>> | undefined;
            if (uniform_slot !== undefined) {
                uniform_slot.texture = texture;
            }
        }
    }

    public set_TextureSamplerUniform<VT extends RenderStateTextureUniformType>(name: string | undefined, uniform: string, sampler?: RenderStateTextureSampler<T>) {
        if (name === undefined) {
            const uniform_slots = this.get_Uniform<VT>(name, uniform) as RenderStateTextureUniformSlot<T, VT, RenderStateTexture<T>, RenderStateTextureSampler<T>>[];
            for (const uniform_slot of uniform_slots) {
                uniform_slot.sampler = sampler;
            }
        }
        else {
            const uniform_slot = this.get_Uniform<VT>(name, uniform) as RenderStateTextureUniformSlot<T, VT, RenderStateTexture<T>, RenderStateTextureSampler<T>> | undefined;
            if (uniform_slot !== undefined) {
                uniform_slot.sampler = sampler;
            }
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

    private clear_Programs() {
        for (const { program, uniforms } of this.programs_ref.values()) {
            uniforms.dispose();
            program.clear();
        }
        this.programs_ref.clear();
    }

    public dispose(): void {
        console.log(">>> dispose <RenderDeviceMaterialSet>");
        this.clear_Programs();
    }
}