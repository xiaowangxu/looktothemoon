import type { WebGL2RenderDevice } from "../WebGL2RenderDevice";
import type { WebGL2RenderState } from "../WebGL2RenderState";
import type { WebGL2RenderStateProgram } from "../webgl2_render_state_objects/WebGL2RenderStateProgram";
import type { WebGL2RenderStateShader } from "../webgl2_render_state_objects/WebGL2RenderStateShader";
import {
    WebGL2RenderStateIntUniformSlot, WebGL2RenderStateFloatUniformSlot, WebGL2RenderStateVec2UniformSlot, WebGL2RenderStateVec3UniformSlot, WebGL2RenderStateVec4UniformSlot,
    WebGL2RenderStateMat3UniformSlot, WebGL2RenderStateMat4UniformSlot, WebGL2RenderStateTextureUniformSlot, WebGL2RenderStateUintUniformSlot,
} from "../webgl2_render_state_objects/WebGL2RenderStateUniformSlot";
import { Ref } from "@/system/utils/RefCounted";
import { Matrix4 } from "@/system/math/linear_algebra/Matrix4";
import { RenderStateUniformType } from "../../RenderState";
import { RenderDeviceMaterialSet, RenderDeviceUniformSet, type UniformInitSet } from "../../render_device_objects/RenderDeviceMaterialSet";
import type { WebGL2RenderStateTexture, WebGL2RenderStateTextureSampler } from "../webgl2_render_state_objects/WebGL2RenderStateTexture";

type WebGL2RenderStateUniformSlots = WebGL2RenderStateIntUniformSlot | WebGL2RenderStateFloatUniformSlot |
    WebGL2RenderStateVec2UniformSlot | WebGL2RenderStateVec3UniformSlot | WebGL2RenderStateVec4UniformSlot |
    WebGL2RenderStateMat3UniformSlot | WebGL2RenderStateMat4UniformSlot |
    WebGL2RenderStateTextureUniformSlot
    ;

export class WebGL2RenderDeviceUniformSet extends RenderDeviceUniformSet<WebGL2RenderState> {
    protected uniforms: Map<string, Ref<WebGL2RenderStateUniformSlots>> = new Map();
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
            uniform.add_Uniform(
                'model_world',
                new WebGL2RenderStateMat4UniformSlot(this.render_state, program, model_world_location, Matrix4.make_Identity())
            );
        }

        // lights
        const lights_location = this.render_state.get_ProgramUniformLocation(program, 'lights');
        if (lights_location !== null) {
            uniform.add_Uniform(
                'lights',
                new WebGL2RenderStateTextureUniformSlot(this.render_state, program, RenderStateUniformType.Tex2DArray, lights_location, (this.render_device as WebGL2RenderDevice).lights_texture.expect, undefined)
            );
        }

        // light mask
        const light_mask_location = this.render_state.get_ProgramUniformLocation(program, 'light_mask');
        if (light_mask_location !== null) {
            uniform.add_Uniform(
                'light_mask',
                new WebGL2RenderStateUintUniformSlot(this.render_state, program, light_mask_location, 0xffffffff)
            );
        }

        // custom uniforms
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
}