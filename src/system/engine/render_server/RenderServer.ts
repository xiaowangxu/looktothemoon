import type { RDCanvas } from "@/system/sliverofstraw/RenderDevice";
import { RenderStateBufferType, RenderStateBufferUsage, RenderStateDataType, RenderStateShaderType, RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType } from "@/system/sliverofstraw/RenderState";
import { WebGL2RenderDevice } from "@/system/sliverofstraw/webgl2/WebGL2RenderDevice";
import { process_WebGL2ShaderCode } from "@/system/sliverofstraw/webgl2/WebGL2ShaderProcessor";
import type { WebGL2RenderStateBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateBuffer";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { Ref } from "@/system/utils/RefCounted";
import { RenderServerLightsData } from "./RenderServerLightData";
import { RenderServerGeometry } from "./RenderServerGeometry";

const vertex_shader_source = process_WebGL2ShaderCode(RenderStateShaderType.Vertex, undefined, undefined, undefined, undefined, '');
const frag_shader_source = process_WebGL2ShaderCode(RenderStateShaderType.Fragment, undefined, undefined, undefined, undefined, '');

export enum RenderServerPlainColorTexture { White, Black, Transparent, }

export class RenderServerDevice extends WebGL2RenderDevice {
    private static readonly WorldUniformsName: string = 'WorldUniforms';
    private static readonly WorldUniformsItems: string[] = ['camera_world', 'camera_projection', 'screen_size', 'time', 'camera_is_orthogonal'];
    public static readonly WorldUniformsUnit: number = 0;
    public static readonly EmptyTextureUnit: number = 1;
    public static readonly LightsTextureUnit: number = 2;

    public readonly empty_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    public readonly plain_color_textures = {
        white: new Ref<WebGL2RenderStateTexture>(),
        black: new Ref<WebGL2RenderStateTexture>(),
        transparent: new Ref<WebGL2RenderStateTexture>(),
    }
    public readonly lights_data: Ref<RenderServerLightsData> = new Ref();

    private world_uniform_buffer: Ref<WebGL2RenderStateBuffer> = new Ref();
    private world_uniform_setting: { [name: string]: { index: number, offset: number } } = {};

    constructor(canvas: RDCanvas) {
        super(canvas, { preserve_texture_count: 6 });
        this.setup_WorldUniformBuffer();
        this.setup_EmptyTexture();
        this.setup_PlainColorTextures();
    }

    private setup_EmptyTexture() {
        const texture = this.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.empty_texture.value = texture;
        this.render_state.alloc_Texture2D(texture, 2, 2, 0, RenderStateTextureDataFormat.RGBA, new Uint8ClampedArray([
            255, 0, 255, 255,
            0, 255, 255, 255,
            0, 255, 255, 255,
            255, 0, 255, 255,
        ]));
        this.render_state.active_Texture(texture, RenderServerDevice.EmptyTextureUnit);
    }

    private setup_PlainColorTextures() {
        const plain_color_white = this.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1).expect();
        this.render_state.alloc_Texture2D(plain_color_white, 1, 1, 0, RenderStateTextureDataFormat.RGBA, new Uint8ClampedArray([255, 255, 255, 255]));
        this.plain_color_textures.white.value = plain_color_white;
        const plain_color_black = this.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1).expect();
        this.render_state.alloc_Texture2D(plain_color_black, 1, 1, 0, RenderStateTextureDataFormat.RGBA, new Uint8ClampedArray([0, 0, 0, 255]));
        this.plain_color_textures.black.value = plain_color_black;
        const plain_color_transparent = this.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1).expect();
        this.render_state.alloc_Texture2D(plain_color_transparent, 1, 1, 0, RenderStateTextureDataFormat.RGBA, new Uint8ClampedArray([255, 255, 255, 255]));
        this.plain_color_textures.transparent.value = plain_color_transparent;
    }

    public get_PlainColorTexture(color: RenderServerPlainColorTexture): WebGL2RenderStateTexture {
        switch (color) {
            case RenderServerPlainColorTexture.White: return this.plain_color_textures.white.expect;
            case RenderServerPlainColorTexture.Black: return this.plain_color_textures.black.expect;
            case RenderServerPlainColorTexture.Transparent: return this.plain_color_textures.transparent.expect;
            default: {
                const n: never = color;
                throw new Error();
            }
        }
    }

    private setup_WorldUniformBuffer() {
        const vert = this.render_state.create_Shader(RenderStateShaderType.Vertex, vertex_shader_source).expect();
        const frag = this.render_state.create_Shader(RenderStateShaderType.Fragment, frag_shader_source).expect();
        const program = this.render_state.create_Program(vert, frag).expect();

        const location = this.render_state.get_ProgramUniformBlockLocation(program, RenderServerDevice.WorldUniformsName);
        const size = this.render_state.get_ProgramUniformBlockSize(program, location);
        const settings = this.render_state.get_ProgramUniformBlockMemberIndexOffsets(program, RenderServerDevice.WorldUniformsItems);
        if (settings === null) throw new Error('<RenderServerDevice> setup_WorldUniformBuffer: failed');

        this.world_uniform_setting = settings;
        this.world_uniform_buffer.value = this.render_state.create_Buffer(RenderStateBufferType.Uniform, RenderStateBufferUsage.DynamicDraw, 1, RenderStateDataType.Float, false, 0).expect();
        this.render_state.alloc_Buffer(this.world_uniform_buffer.expect, size);

        this.render_state.bind_UniformBuffer(this.world_uniform_buffer.expect, RenderServerDevice.WorldUniformsUnit);
    }

    public set_WorldUniform(name: string, data: ArrayBufferView) {
        const setting = this.world_uniform_setting[name];
        if (setting !== undefined) {
            this.render_state.update_Buffer(this.world_uniform_buffer.expect, data, setting.offset);
        }
    }

    public create_LightsData(width: number, height: number) {
        return new RenderServerLightsData(this, width, height);
    }

    public use_LightsData(lights_data: RenderServerLightsData) {
        const texture = lights_data.lights_texture;
        this.lights_data.value = lights_data;
        this.render_state.active_Texture(texture, RenderServerDevice.LightsTextureUnit);
    }

    public create_Geometry() {
        return new RenderServerGeometry(this);
    }

    public dispose(): void {
        this.world_uniform_buffer.clear();
        this.empty_texture.clear();
        this.lights_data.clear();
        this.plain_color_textures.white.clear();
        this.plain_color_textures.black.clear();
        this.plain_color_textures.transparent.clear();
    }
}

export const RenderServer = new RenderServerDevice(new OffscreenCanvas(1024, 1024));