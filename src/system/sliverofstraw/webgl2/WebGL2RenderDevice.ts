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
    private static readonly WorldUniformsItems: string[] = ['camera_world', 'camera_projection', 'screen_size', 'time'];
    public static readonly WorldUniformsUnit: number = 0;
    public static readonly EmptyTextureUnit: number = 0;
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
        const texture = this.render_state.create_Texture(RenderStateTextureType.Tex2DArray, false, RenderStateTextureFormat.RGBA32F, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.lights_texture.value = texture;
        this.update_Lights();
    }

    public update_Lights() {
        const texture = this.lights_texture.expect;
        const light_width = 64;
        const light_height = 64;
        this.render_state.alloc_Texture3D(texture, light_width, light_height, 2, 0);
        this.render_state.active_Texture(texture, WebGL2RenderDevice.LightsTextureUnit);
        const lights = new Float32Array(light_width * light_height * 4 * 2);
        const light_pos_type = new Float32Array(lights.buffer, 0, light_width * light_height * 4);
        const light_color_intensity = new Float32Array(lights.buffer, light_width * light_height * 4 * Float32Array.BYTES_PER_ELEMENT, light_width * light_height * 4);
        for (let y = 0; y < light_height; y++) {
            for (let x = 0; x < light_width; x++) {
                const id = y * light_width + x;
                const idx = id * 4;

                light_pos_type[idx] = (Math.random() - 0.5) * 5;
                light_pos_type[idx + 1] = (Math.random() - 0.5) * 5;
                light_pos_type[idx + 2] = -0.85;
                let type = Math.floor(Math.random() * 8);
                if (type >= 2) type = 2;
                light_pos_type[idx + 3] = type;

                light_color_intensity[idx] = Math.random();
                light_color_intensity[idx + 1] = Math.random();
                light_color_intensity[idx + 2] = Math.random();
                light_color_intensity[idx + 3] = type === 2 ? 0.5 : 0.01;
            }
        }
        this.render_state.update_Texture3D(texture, 0, lights, light_width, light_height, 2, 0, 0, 0);

        this.render_state.update_Texture3D(texture, 0, new Float32Array([
            1.0, 0.0, 0.0, 8
        ]), 1, 1, 1, 0, 0, 1);
        this.render_state.update_Texture3D(texture, 0, new Float32Array([
            0.0, 0.0, 0.0, 0,
            -1.0, 1.0, 1.0, 1,
            1.0, 1.0, 1.0, 0.2,
            1.0, 1.0, 1.0, 0.3,
        ]), 2, 1, 2, 0, 0, 0);
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