import { Ref } from "@/system/utils/RefCounted";
import { RenderDevice, type RDCanvas } from "../RenderDevice";
import { WebGL2RenderState } from "./WebGL2RenderState";
import { RenderStateBufferType, RenderStateBufferUsage, RenderStateDataType, RenderStateShaderType } from "../RenderState";
import type { WebGL2RenderStateBuffer } from "./webgl2_render_state_objects/WebGL2RenderStateBuffer";
import type { WebGL2RenderStateShader } from "./webgl2_render_state_objects/WebGL2RenderStateShader";

const vertex_shader_source = `#version 300 es
uniform WorldUniforms {
    mat4 model_world;
    mat4 camera_world;
    mat4 camera_projection;
    vec2 screen_size;
    float time;
};
void main() {
}
`
const frag_shader_source = `#version 300 es
void main() {
}
`;

export class WebGL2RenderDevice extends RenderDevice<WebGL2RenderState> {
    private static readonly WorldUniformsName: string = 'WorldUniforms';
    private static readonly WorldUniformsItems: string[] = ['model_world', 'camera_world', 'camera_projection', 'screen_size', 'time'];
    private static readonly WorldUniformsUnit: number = 0;

    private world_uniform_buffer: Ref<WebGL2RenderStateBuffer> = new Ref();
    private world_uniform_setting: { [name: string]: { index: number, offset: number } } = {};

    constructor(canvas: RDCanvas) {
        super(canvas, WebGL2RenderState);
        this.setup_WorldUniformBuffer();
        // this.scene_uniform_buffer.value = this.render_state.create_Buffer(RenderStateBufferType.Uniform, RenderStateBufferUsage.DynamicDraw, 12, RenderStateDataType.Float, false, 0).expect();
        // this.render_state.bind_UniformBuffer(this.scene_uniform_buffer.expect, 0);
    }

    private setup_WorldUniformBuffer() {
        const vert = this.render_state.create_Shader(RenderStateShaderType.Vertex, vertex_shader_source).expect();
        const frag = this.render_state.create_Shader(RenderStateShaderType.Fragment, frag_shader_source).expect();
        const program = this.render_state.create_Program(vert, frag).expect();

        const location = this.render_state.get_ProgramUniformBlockLocation(program, WebGL2RenderDevice.WorldUniformsName);
        const size = this.render_state.get_ProgramUniformBlockSize(program, location);
        const settings = this.render_state.get_ProgramUniformBlockMemberIndexOffsets(program, WebGL2RenderDevice.WorldUniformsItems);
        if (settings === null) throw new Error('<WebGL2RenderDevice> setup_WorldUniformBuffer: failed');

        this.world_uniform_setting = settings;
        this.world_uniform_buffer.value = this.render_state.create_Buffer(RenderStateBufferType.Uniform, RenderStateBufferUsage.DynamicDraw, 1, RenderStateDataType.Float, false, 0).expect();
        this.render_state.alloc_Buffer(this.world_uniform_buffer.expect, size);

        console.log(this.world_uniform_setting);

        this.render_state.bind_UniformBuffer(this.world_uniform_buffer.expect, WebGL2RenderDevice.WorldUniformsUnit);
    }

    public set_WorldUniform(name: string, data: ArrayBufferView) {
        const setting = this.world_uniform_setting[name];
        if (setting !== undefined) {
            this.render_state.update_Buffer(this.world_uniform_buffer.expect, data, setting.offset);
        }
    }

    public create_Program(vert_shader: WebGL2RenderStateShader, frag_shader: WebGL2RenderStateShader) {
        const program = this.render_state.create_Program(vert_shader, frag_shader).expect();
        const location = this.render_state.get_ProgramUniformBlockLocation(program, WebGL2RenderDevice.WorldUniformsName);
        this.render_state.set_ProgramUniformBuffer(program, location, WebGL2RenderDevice.WorldUniformsUnit);
        return program;
    }

    public dispose(): void {
        this.world_uniform_buffer.clear();
    }
}