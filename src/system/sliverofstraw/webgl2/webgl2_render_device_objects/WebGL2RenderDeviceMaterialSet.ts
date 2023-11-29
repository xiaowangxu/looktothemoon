import { Matrix4 } from "@/system/math/linear_algebra/Matrix4";
import { RenderStateValueType, type RenderStateAllValueType } from "../../RenderState";
import { RenderDeviceMaterialSet, RenderDeviceUniformSet, type UniformInitSet } from "../../render_device_objects/RenderDeviceMaterialSet";
import type { WebGL2RenderDevice } from "../WebGL2RenderDevice";
import type { WebGL2RenderState } from "../WebGL2RenderState";
import type { WebGL2RenderStateProgram } from "../webgl2_render_state_objects/WebGL2RenderStateProgram";
import type { WebGL2RenderStateShader } from "../webgl2_render_state_objects/WebGL2RenderStateShader";

export class WebGL2RenderDeviceUniformSet extends RenderDeviceUniformSet<WebGL2RenderState> {
    protected push_UniformInternal(render_state: WebGL2RenderState, changed: boolean, program: WebGL2RenderStateProgram, location: any, type: RenderStateValueType, value: RenderStateAllValueType<WebGL2RenderState>): void {
        if (changed || type === RenderStateValueType.Tex2D) {
            render_state.set_ProgramUniform(program, location, type, value);
        }
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
        for (const name in uniforms) {
            const { type, default: default_value } = uniforms[name];
            const location = this.render_state.get_ProgramUniformLocation(program, name);
            if (location === null) continue;
            uniform.add_Uniform(name, type, location, default_value);
        }
        return uniform;
    }
}