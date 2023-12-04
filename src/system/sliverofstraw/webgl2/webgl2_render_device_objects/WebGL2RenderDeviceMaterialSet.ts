import { Matrix4 } from "@/system/math/linear_algebra/Matrix4";
import { RenderStateValueType } from "../../RenderState";
import { RenderDeviceMaterialSet, RenderDeviceUniformSet, type UniformInitSet, type UniformSetItemType } from "../../render_device_objects/RenderDeviceMaterialSet";
import type { WebGL2RenderDevice } from "../WebGL2RenderDevice";
import type { WebGL2RenderState } from "../WebGL2RenderState";
import type { WebGL2RenderStateProgram } from "../webgl2_render_state_objects/WebGL2RenderStateProgram";
import type { WebGL2RenderStateShader } from "../webgl2_render_state_objects/WebGL2RenderStateShader";
import { Ref } from "@/system/utils/RefCounted";
import type { WebGL2RenderStateTexture } from "../webgl2_render_state_objects/WebGL2RenderStateTexture";

export class WebGL2RenderDeviceUniformSet extends RenderDeviceUniformSet<WebGL2RenderState> {
    protected uniforms: Map<string, UniformSetItemType<WebGL2RenderState> & { texture_slot: number | undefined }> = new Map();

    protected push_UniformInternal(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, obj: UniformSetItemType<WebGL2RenderState> & { texture_slot: number | undefined }): void {
        const { type, changed, default: default_value, value, texture_slot, location } = obj;
        const val = value ?? default_value;
        if (this.is_Texture(type)) {
            if (val === undefined) {
                if (changed) render_state.set_ProgramUniform(program, location, type, undefined);
            }
            else {
                const texture = (val as Ref<WebGL2RenderStateTexture>).expect;
                if (texture.active_slot === undefined || texture.active_slot !== texture_slot) {
                    render_state.set_ProgramUniform(program, location, type, texture);
                }
                obj.texture_slot = texture.active_slot;
            }
        }
        else if (changed) {
            render_state.set_ProgramUniform(program, location, type, val as any);
        }
        obj.changed = false;
    }
}

export class WebGL2RenderDeviceMaterialSet extends RenderDeviceMaterialSet<WebGL2RenderState, WebGL2RenderStateProgram> {
    public depth_test: boolean = true;

    constructor(render_device: WebGL2RenderDevice, vertex: WebGL2RenderStateShader, uniforms: UniformInitSet<WebGL2RenderState>, fragments_set: { [name: string]: { shader: WebGL2RenderStateShader, uniforms: UniformInitSet<WebGL2RenderState> } }) {
        super(render_device, vertex, uniforms, fragments_set);
    }

    protected bind_ProgramUniforms(program: WebGL2RenderStateProgram, uniforms: UniformInitSet<WebGL2RenderState>): RenderDeviceUniformSet<WebGL2RenderState> {
        const uniform = new WebGL2RenderDeviceUniformSet();
        // model world
        const model_world_location = this.render_state.get_ProgramUniformLocation(program, 'model_world');
        if (model_world_location !== null) {
            uniform.add_Uniform('model_world', RenderStateValueType.Mat4, model_world_location, Matrix4.make_Identity());
        }
        // lights
        const lights_location = this.render_state.get_ProgramUniformLocation(program, 'lights');
        if (lights_location !== null) {
            uniform.add_Uniform('lights', RenderStateValueType.Tex2DArray, lights_location, (this.render_device as WebGL2RenderDevice).lights_texture.expect);
        }
        for (const name in uniforms) {
            const { type, default: default_value } = uniforms[name];
            const location = this.render_state.get_ProgramUniformLocation(program, name);
            if (location === null) continue;
            uniform.add_Uniform(name, type, location, default_value);
        }
        return uniform;
    }
}