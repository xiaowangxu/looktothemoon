import { Ref, type ToRefed } from "@/system/utils/RefCounted";
import { RenderDeviceObject } from "../RenderDeviceObject";
import { RenderStateValueType, type RenderState, type RenderStateValueTypeMap, type RenderStateValueTypeKey, type RenderStateAllValueType } from "../RenderState";
import type { RenderStateProgram } from "../render_state_objects/RenderStateProgram";
import type { RenderDevice } from "../RenderDevice";
import type { RenderStateShader } from "../render_state_objects/RenderStateShader";
import { unref } from "../../utils/RefCounted";

type ProgramMap<T extends RenderState<T>, Program extends RenderStateProgram<T>> = Map<string, { program: Ref<Program>, uniforms: RenderDeviceUniformSet<T> }>;

type UniformValueTypeByTypeName<RS extends RenderState<RS>> = {
    [K in (keyof (typeof RenderStateValueType))]: {
        type: (typeof RenderStateValueType)[K];
        default: RenderStateValueTypeMap<RS>[K]
    };
};
export type UniformInitSet<RS extends RenderState<RS>> = { [name: string]: UniformValueTypeByTypeName<RS>[keyof typeof RenderStateValueType] };
export type UniformSetItemType<RS extends RenderState<RS>> = { type: RenderStateValueType, default: ToRefed<RenderStateAllValueType<RS>>, value: ToRefed<RenderStateAllValueType<RS>> | undefined, location: any, changed: boolean }

export class RenderDeviceUniformSet<RS extends RenderState<RS>> {
    protected uniforms: Map<string, UniformSetItemType<RS>> = new Map();

    protected is_Texture(type: RenderStateValueType) {
        return type === RenderStateValueType.Tex2D || type === RenderStateValueType.Tex2DArray || type === RenderStateValueType.Tex3D;
    }

    public add_Uniform<T extends RenderStateValueType>(name: string, type: T, location: any, default_value: RenderStateValueTypeKey<RS, T>) {
        if (this.uniforms.has(name)) return;
        this.uniforms.set(name, {
            type: type,
            default: this.is_Texture(type) ? (default_value === undefined ? undefined : new Ref(default_value)) : default_value,
            value: undefined,
            location: location,
            changed: true,
        });
    }

    public set_Uniform<T extends RenderStateValueType>(name: string, value: RenderStateValueTypeKey<RS, T>) {
        if (this.uniforms.has(name)) {
            const obj = this.uniforms.get(name)!;
            if (this.is_Texture(obj.type)) {
                if (obj.value !== undefined) {
                    if (value === undefined) {
                        (obj.value as Ref<RenderStateValueTypeKey<RS, T>>).clear();
                        obj.value = undefined;
                    }
                    else {
                        (obj.value as Ref<RenderStateValueTypeKey<RS, T>>).value = value;
                    }
                }
                else {
                    obj.value = new Ref(value);
                }
            }
            else {
                obj.value = value;
            }
            obj.changed = true;
        }
    }

    protected push_UniformInternal(render_state: RS, program: RenderStateProgram<RS>, obj: UniformSetItemType<RS>) {
        const { changed, location, type, default: default_value, value } = obj;
        if (!changed) return;
        render_state.set_ProgramUniform(program, location, type, unref(value ?? default_value));
        obj.changed = false;
    }

    public push_Uniform(render_state: RS, program: RenderStateProgram<RS>, name: string) {
        if (this.uniforms.has(name)) {
            const obj = this.uniforms.get(name)!;
            this.push_UniformInternal(render_state, program, obj);
        }
    }

    public push_AllUniform(render_state: RS, program: RenderStateProgram<RS>) {
        for (const obj of this.uniforms.values()) {
            this.push_UniformInternal(render_state, program, obj);
        }
    }

    public clear() {
        for (const obj of this.uniforms.values()) {
            if (obj.default instanceof Ref) obj.default.clear();
            if (obj.value instanceof Ref) obj.value.clear();
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
        uniformset.push_AllUniform(this.render_state, program.expect);
        return program.value;
    }

    public set_Uniform<Val extends RenderStateValueType>(name: string, uniform: string, value: RenderStateValueTypeKey<T, Val>) {
        const uniformset = this.programs_ref.get(name)?.uniforms;
        if (uniformset === undefined) return;
        uniformset.set_Uniform<Val>(uniform, value);
    }

    public push_Uniform(name: string, uniform: string) {
        const obj = this.programs_ref.get(name);
        if (obj === undefined) return;
        const { program, uniforms: uniformset } = obj;
        uniformset.push_Uniform(this.render_state, program.expect, uniform);
    }

    public push_AllUniform(name: string) {
        const obj = this.programs_ref.get(name);
        if (obj === undefined) return;
        const { program, uniforms: uniformset } = obj;
        uniformset.push_AllUniform(this.render_state, program.expect);
    }

    private clear_Programs() {
        for (const { program, uniforms } of this.programs_ref.values()) {
            program.clear();
            uniforms.clear();
        }
        this.programs_ref.clear();
    }

    public dispose(): void {
        console.log(">>> dispose <RenderDeviceMaterialSet>");
        this.clear_Programs();
    }
}