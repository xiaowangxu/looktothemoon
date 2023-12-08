import { Ref } from "@/system/utils/RefCounted";
import { RenderDevice, type RDCanvas } from "../RenderDevice";
import { WebGL2RenderState } from "./WebGL2RenderState";
import { RenderStateBufferType, RenderStateBufferUsage, RenderStateDataType, RenderStateShaderType, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType } from "../RenderState";
import type { WebGL2RenderStateBuffer } from "./webgl2_render_state_objects/WebGL2RenderStateBuffer";
import { process_WebGL2ShaderCode } from "./WebGL2ShaderProcessor";
import type { WebGL2RenderStateTexture } from "./webgl2_render_state_objects/WebGL2RenderStateTexture";

const vertex_shader_source = process_WebGL2ShaderCode(RenderStateShaderType.Vertex, undefined, undefined, undefined, undefined, '');
const frag_shader_source = process_WebGL2ShaderCode(RenderStateShaderType.Fragment, undefined, undefined, undefined, undefined, '');

export class WebGL2RenderDevice extends RenderDevice<WebGL2RenderState> {
    private static readonly WorldUniformsName: string = 'WorldUniforms';
    private static readonly WorldUniformsItems: string[] = ['camera_world', 'camera_projection', 'screen_size', 'time', 'camera_is_orthogonal'];
    public static readonly WorldUniformsUnit: number = 0;
    public static readonly EmptyTextureUnit: number = 1;
    public static readonly LightsTextureUnit: number = 1;

    public readonly empty_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    public readonly lights_texture: Ref<WebGL2RenderStateTexture> = new Ref();

    private world_uniform_buffer: Ref<WebGL2RenderStateBuffer> = new Ref();
    private world_uniform_setting: { [name: string]: { index: number, offset: number } } = {};

    constructor(canvas: RDCanvas) {
        super(canvas, WebGL2RenderState);
        this.setup_WorldUniformBuffer();
        this.setup_EmptyTexture();
        this.setup_LightsTexture();
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

        this.render_state.bind_UniformBuffer(this.world_uniform_buffer.expect, WebGL2RenderDevice.WorldUniformsUnit);
    }

    private setup_EmptyTexture() {
        const texture = this.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.empty_texture.value = texture;
        this.render_state.alloc_Texture2D(texture, 2, 2, 0, new Uint8ClampedArray([
            255, 0, 255, 255,
            128, 128, 128, 255,
            128, 128, 128, 255,
            255, 0, 255, 255,
        ]));
        this.render_state.active_Texture(texture, WebGL2RenderDevice.EmptyTextureUnit);
    }

    private setup_LightsTexture() {
        const texture = this.render_state.create_Texture(RenderStateTextureType.Tex2DArray, false, RenderStateTextureFormat.R32UI, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.lights_texture.value = texture;
        this.update_Lights();
    }

    public update_Lights() {
        const texture = this.lights_texture.expect;

        const light_width = 128;
        const light_height = 128;
        const param_count = 9;

        this.render_state.alloc_Texture3D(texture, light_width, light_height, param_count, 0);
        this.render_state.active_Texture(texture, WebGL2RenderDevice.LightsTextureUnit);

        const lights = new Float32Array(light_width * light_height * param_count);

        const layer = light_width * light_height * Float32Array.BYTES_PER_ELEMENT;

        const light_pos_x = new Float32Array(lights.buffer, layer * 0, light_width * light_height);
        const light_pos_y = new Float32Array(lights.buffer, layer * 1, light_width * light_height);
        const light_pos_z = new Float32Array(lights.buffer, layer * 2, light_width * light_height);
        const light_type = new Uint32Array(lights.buffer, layer * 3, light_width * light_height);
        const light_color_r = new Float32Array(lights.buffer, layer * 4, light_width * light_height);
        const light_color_g = new Float32Array(lights.buffer, layer * 5, light_width * light_height);
        const light_color_b = new Float32Array(lights.buffer, layer * 6, light_width * light_height);
        const light_intensity = new Float32Array(lights.buffer, layer * 7, light_width * light_height);
        const light_mask = new Uint32Array(lights.buffer, layer * 8, light_width * light_height);

        for (let y = 0; y < light_height; y++) {
            for (let x = 0; x < light_width; x++) {
                const id = y * light_width + x;

                light_pos_x[id] = (Math.random() - 0.5) * 8;
                light_pos_y[id] = (Math.random() - 0.5) * 8;
                light_pos_z[id] = (Math.random() - 0.75) * 2;

                light_type[id] = 3;

                // const c = Math.random() * 3;
                // if (c < 1) {
                //     light_color_r[id] = 1;
                //     light_color_g[id] = 0;
                //     light_color_b[id] = 0;
                // }
                // else if (c < 2) {
                //     light_color_r[id] = 0;
                //     light_color_g[id] = 1;
                //     light_color_b[id] = 0;
                // }
                // else {
                //     light_color_r[id] = 0;
                //     light_color_g[id] = 0;
                //     light_color_b[id] = 1;
                // }

                light_color_r[id] = Math.random();
                light_color_g[id] = Math.random();
                light_color_b[id] = Math.random();
                light_intensity[id] = 0.5;

                light_mask[id] = 0xffffffff;
            }
        }

        light_type[0] = 2;
        light_pos_x[0] = 1.0;
        light_pos_y[0] = 1.0;
        light_pos_z[0] = 1.0;
        light_color_r[0] = 1.0;
        light_color_g[0] = 1.0;
        light_color_b[0] = 1.0;
        light_intensity[0] = 0.1;

        this.render_state.update_Texture3D(texture, 0, new Uint32Array(lights.buffer), light_width, light_height, param_count, 0, 0, 0);
    }

    public set_WorldUniform(name: string, data: ArrayBufferView) {
        const setting = this.world_uniform_setting[name];
        if (setting !== undefined) {
            this.render_state.update_Buffer(this.world_uniform_buffer.expect, data, setting.offset);
        }
    }

    public dispose(): void {
        this.world_uniform_buffer.clear();
    }
}