import { Ref, RefMap } from "@/system/utils/RefCounted";
import { RenderStateUniformType, type RenderState, type RenderStateProgramOptionParameterType, type RenderStateProgramUniformOptionParameterType } from "../RenderState";
import type { RenderStateShader } from "../render_state_objects/RenderStateShader";
import { RenderDeviceObject } from "./RenderDeviceObject";
import type { RenderDevice } from "../RenderDevice";
import type { RenderStateProgram } from "../render_state_objects/RenderStateProgram";
import type { RenderStateUniform, RenderStateUniformTypeMap } from "../render_state_objects/RenderStateUniformSlot";

export class RenderDeviceShaderProgram<T extends RenderState<T>> extends RenderDeviceObject<T> {

    protected readonly vertex_shader_ref: Ref<RenderStateShader<T>> = new Ref();
    protected readonly fragment_shader_ref: Ref<RenderStateShader<T>> = new Ref();

    protected readonly program_ref: Ref<RenderStateProgram<T>> = new Ref();

    protected readonly uniform_slot_refs: RefMap<string, RenderStateUniform<T>> = new RefMap();

    constructor(render_device: RenderDevice<T>, vertex_shader: RenderStateShader<T>, fragment_shader: RenderStateShader<T> | undefined, attributes: RenderStateProgramOptionParameterType<T>) {
        super(render_device);
        this.vertex_shader_ref.value = vertex_shader;
        this.fragment_shader_ref.value = fragment_shader;
        this.program_ref.value = this.render_state.create_Program(this.vertex_shader_ref.expect, this.fragment_shader_ref.expect, attributes).expect();
    }

    public add_Uniform<VT extends RenderStateUniformType>(name: string, type: VT, default_value: RenderStateUniformTypeMap<T, VT>, option: RenderStateProgramUniformOptionParameterType<T>) {
        if (this.uniform_slot_refs.has(name)) throw new Error(`<RenderDeviceShaderProgram> add_Uniform: uniform '${name}' already exists`);
        const uniform = this.render_state.create_ProgramUniform(this.program_ref.expect, name, type, default_value, option).expect();
        this.uniform_slot_refs.set(name, uniform);
    }

    public dispose(): void {
        this.uniform_slot_refs.clear();
        this.program_ref.clear();
        this.vertex_shader_ref.clear();
        this.fragment_shader_ref.clear();
    }
}

// import { type WebGL2RenderState } from "../webgl2/WebGL2RenderState";
// const a = new RenderDeviceShaderProgram<WebGL2RenderState>(1 as any, 2 as any, 3 as any, undefined);
// a.add_Uniform('test', RenderStateUniformType.Bool, true, undefined);