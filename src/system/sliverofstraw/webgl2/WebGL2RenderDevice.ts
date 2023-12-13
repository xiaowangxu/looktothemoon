import { Ref } from "@/system/utils/RefCounted";
import { RenderDevice, type RDCanvas, type RenderDeviceInitOption } from "../RenderDevice";
import { WebGL2RenderState, type WebGL2RenderStateInitOption } from "./WebGL2RenderState";
import { RenderStateBufferType, RenderStateBufferUsage, RenderStateDataType, RenderStateShaderType, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType, type RenderStateInitOption, RenderStateTextureDataFormat } from "../RenderState";
import type { WebGL2RenderStateBuffer } from "./webgl2_render_state_objects/WebGL2RenderStateBuffer";
import { process_WebGL2ShaderCode } from "./WebGL2ShaderProcessor";
import type { WebGL2RenderStateTexture } from "./webgl2_render_state_objects/WebGL2RenderStateTexture";
import { Deg2Rad, Rad2Ded } from "@/system/fivepebble/Scalar";

export interface WebGL2RenderDeviceInitOption extends RenderDeviceInitOption, WebGL2RenderStateInitOption { }

const vertex_shader_source = process_WebGL2ShaderCode(RenderStateShaderType.Vertex, undefined, undefined, undefined, undefined, '');
const frag_shader_source = process_WebGL2ShaderCode(RenderStateShaderType.Fragment, undefined, undefined, undefined, undefined, '');

export class WebGL2RenderDevice extends RenderDevice<WebGL2RenderState, WebGL2RenderDeviceInitOption> {
    private static readonly WorldUniformsName: string = 'WorldUniforms';
    private static readonly WorldUniformsItems: string[] = ['camera_world', 'camera_projection', 'screen_size', 'time', 'camera_is_orthogonal'];
    public static readonly WorldUniformsUnit: number = 0;
    public static readonly EmptyTextureUnit: number = 1;
    public static readonly LightsTextureUnit: number = 1;

    public readonly empty_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    public readonly lights_texture: Ref<WebGL2RenderStateTexture> = new Ref();

    private world_uniform_buffer: Ref<WebGL2RenderStateBuffer> = new Ref();
    private world_uniform_setting: { [name: string]: { index: number, offset: number } } = {};

    constructor(canvas: RDCanvas, option: WebGL2RenderDeviceInitOption) {
        super(canvas, WebGL2RenderState, option);
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
        this.render_state.alloc_Texture2D(texture, 2, 2, 0, RenderStateTextureDataFormat.RGBA, new Uint8ClampedArray([
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
        this.render_state.alloc_Texture3D(texture, this.light_width, this.light_height, this.light_param_count, 0, RenderStateTextureDataFormat.RInt);
        this.update_Lights();
    }

    private light_width = 64;
    private light_height = 64;
    private light_param_count = 19;
    private lights = new Uint32Array(this.light_width * this.light_height * this.light_param_count);
    private light_layer = this.light_width * this.light_height * Float32Array.BYTES_PER_ELEMENT;
    private/*    */ light_type_id = new Uint32Array(this.lights.buffer, this.light_layer * 0, this.light_width * this.light_height);
    private/*      */ light_pos_x = new Float32Array(this.lights.buffer, this.light_layer * 1, this.light_width * this.light_height);
    private/*      */ light_pos_y = new Float32Array(this.lights.buffer, this.light_layer * 2, this.light_width * this.light_height);
    private/*      */ light_pos_z = new Float32Array(this.lights.buffer, this.light_layer * 3, this.light_width * this.light_height);
    private/*      */ light_dir_x = new Float32Array(this.lights.buffer, this.light_layer * 4, this.light_width * this.light_height);
    private/*      */ light_dir_y = new Float32Array(this.lights.buffer, this.light_layer * 5, this.light_width * this.light_height);
    private/*      */ light_dir_z = new Float32Array(this.lights.buffer, this.light_layer * 6, this.light_width * this.light_height);
    private/*    */ light_color_r = new Float32Array(this.lights.buffer, this.light_layer * 7, this.light_width * this.light_height);
    private/*    */ light_color_g = new Float32Array(this.lights.buffer, this.light_layer * 8, this.light_width * this.light_height);
    private/*    */ light_color_b = new Float32Array(this.lights.buffer, this.light_layer * 9, this.light_width * this.light_height);
    private/**/ light_attenuation = new Float32Array(this.lights.buffer, this.light_layer * 10, this.light_width * this.light_height);
    private/*       */ light_mask = new Uint32Array(this.lights.buffer, this.light_layer * 11, this.light_width * this.light_height);
    private/*    */ light_param_0 = new Float32Array(this.lights.buffer, this.light_layer * 12, this.light_width * this.light_height);
    private/*    */ light_param_1 = new Float32Array(this.lights.buffer, this.light_layer * 13, this.light_width * this.light_height);
    private/*    */ light_param_2 = new Float32Array(this.lights.buffer, this.light_layer * 14, this.light_width * this.light_height);
    private/*    */ light_param_3 = new Float32Array(this.lights.buffer, this.light_layer * 15, this.light_width * this.light_height);
    private/*    */ light_shadow_bias = new Float32Array(this.lights.buffer, this.light_layer * 16, this.light_width * this.light_height);
    private/*    */ light_shadow_normal_bias = new Float32Array(this.lights.buffer, this.light_layer * 17, this.light_width * this.light_height);
    private/*    */ light_shadow_opacity = new Float32Array(this.lights.buffer, this.light_layer * 18, this.light_width * this.light_height);

    public update_Lights() {

        console.time('update lights');
        
        const texture = this.lights_texture.expect;

        const light_width = this.light_width;
        const light_height = this.light_height;

        const/*    */ light_type_id = this.light_type_id;
        const/*      */ light_pos_x = this.light_pos_x;
        const/*      */ light_pos_y = this.light_pos_y;
        const/*      */ light_pos_z = this.light_pos_z;
        const/*      */ light_dir_x = this.light_dir_x;
        const/*      */ light_dir_y = this.light_dir_y;
        const/*      */ light_dir_z = this.light_dir_z;
        const/*    */ light_color_r = this.light_color_r;
        const/*    */ light_color_g = this.light_color_g;
        const/*    */ light_color_b = this.light_color_b;
        const/**/ light_attenuation = this.light_attenuation;
        const/*       */ light_mask = this.light_mask;
        const/*    */ light_param_0 = this.light_param_0;
        const/*    */ light_param_1 = this.light_param_1;
        const/*    */ light_param_2 = this.light_param_2;
        const/*    */ light_param_3 = this.light_param_3;
        const/*    */ light_shadow_bias = this.light_shadow_bias;
        const/*    */ light_shadow_normal_bias = this.light_shadow_normal_bias;
        const/*    */ light_shadow_opacity = this.light_shadow_opacity;

        for (let y = 0; y < light_height; y++) {
            for (let x = 0; x < light_width; x++) {
                const id = y * light_width + x;
                
                light_type_id[id] = 3;

                light_pos_x[id] = (Math.random() - 0.5) * 8;
                light_pos_y[id] = (Math.random() - 0.5) * 8;
                light_pos_z[id] = (Math.random() - 0.75) * 2;

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

                light_color_r[id] = Math.random() * 0.2;
                light_color_g[id] = Math.random() * 0.2;
                light_color_b[id] = Math.random() * 0.2;
                light_attenuation[id] = 2.0;

                const radius = Math.random() * 4.0;
                light_param_0[id] = radius;
                light_param_1[id] = radius + Math.random();

                light_mask[id] = 0xffffffff;
            }
        }

        light_type_id[0] = 4;
        light_pos_x[0] = -2.0;
        light_pos_y[0] = 2.0;
        light_pos_z[0] = -2.2;
        light_dir_x[0] = 1.0;
        light_dir_y[0] = -1.0;
        light_dir_z[0] = 1.0;
        light_color_r[0] = 0.0 * 5.0;
        light_color_g[0] = 0.0 * 5.0;
        light_color_b[0] = 1.0 * 5.0;
        light_attenuation[0] = 2.0;
        light_param_0[0] = 45 * Deg2Rad;
        light_param_1[0] = 0 * Deg2Rad;
        light_param_2[0] = 3;
        light_param_3[0] = 7;

        light_type_id[1] = 4;
        light_pos_x[1] = 0.3;
        light_pos_y[1] = 0.3;
        light_pos_z[1] = 5.0;
        light_dir_x[1] = 0.0;
        light_dir_y[1] = 0.0;
        light_dir_z[1] = -1.0;
        light_color_r[1] = 1.0 * 10.0;
        light_color_g[1] = 0.0 * 10.0;
        light_color_b[1] = 0.0 * 10.0;
        light_attenuation[1] = 2.0;
        light_param_0[1] = 12 * Deg2Rad;
        light_param_1[1] = 4 * Deg2Rad;
        light_param_2[1] = 10;
        light_param_3[1] = 10;

        light_type_id[2] = 4;
        light_pos_x[2] = -0.3;
        light_pos_y[2] = 0.3;
        light_pos_z[2] = 5.0;
        light_dir_x[2] = 0.0;
        light_dir_y[2] = 0.0;
        light_dir_z[2] = -1.0;
        light_color_r[2] = 0.0 * 10.0;
        light_color_g[2] = 1.0 * 10.0;
        light_color_b[2] = 0.0 * 10.0;
        light_attenuation[2] = 2.0;
        light_param_0[2] = 12 * Deg2Rad;
        light_param_1[2] = 4 * Deg2Rad;
        light_param_2[2] = 10;
        light_param_3[2] = 10;

        light_type_id[3] = 4;
        light_pos_x[3] = 0.0;
        light_pos_y[3] = -0.15;
        light_pos_z[3] = 5.0;
        light_dir_x[3] = 0.0;
        light_dir_y[3] = 0.0;
        light_dir_z[3] = -1.0;
        light_color_r[3] = 0.0 * 10.0;
        light_color_g[3] = 0.0 * 10.0;
        light_color_b[3] = 1.0 * 10.0;
        light_attenuation[3] = 2.0;
        light_param_0[3] = 12 * Deg2Rad;
        light_param_1[3] = 4 * Deg2Rad;
        light_param_2[3] = 10;
        light_param_3[3] = 10;

        light_type_id[10] = 2;
        light_pos_x[10] = -1.0;
        light_pos_y[10] = -1.0;
        light_pos_z[10] = -1.0;
        light_color_r[10] = 0.0 * 0.12;
        light_color_g[10] = 1.0 * 0.12;
        light_color_b[10] = 0.0 * 0.12;

        light_type_id[11] = 2;
        light_pos_x[11] = 1.0;
        light_pos_y[11] = 1.0;
        light_pos_z[11] = 1.0;
        light_color_r[11] = 0.0 * 0.06;
        light_color_g[11] = 1.0 * 0.06;
        light_color_b[11] = 1.0 * 0.06;

        this.render_state.update_Texture3D(texture, 0, RenderStateTextureDataFormat.RInt, this.lights, this.light_width, this.light_height, this.light_param_count, 0, 0, 0);
        console.timeEnd('update lights');
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