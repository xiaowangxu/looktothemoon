import type { RDCanvas } from "@/system/sliverofstraw/RenderDevice";
import { RenderStateBufferType, RenderStateBufferUsage, RenderStateDataType, RenderStateShaderType, RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType } from "@/system/sliverofstraw/RenderState";
import { WebGL2RenderDevice } from "@/system/sliverofstraw/webgl2/WebGL2RenderDevice";
import { process_WebGL2ShaderCode } from "@/system/sliverofstraw/webgl2/WebGL2ShaderProcessor";
import type { WebGL2RenderStateBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateBuffer";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { Ref } from "@/system/utils/RefCounted";
import { RenderServerLightsData } from "./RenderServerLightData";
import { RenderServerGeometry } from "./RenderServerGeometry";
import { RenderServerShader } from "./RenderServerShader";
import { RenderServerMaterial } from "./RenderServerMaterial";
import { RenderDeviceMatrix4AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";

const vertex_shader_source = process_WebGL2ShaderCode(RenderStateShaderType.Vertex, undefined, undefined, undefined, undefined, '');
const frag_shader_source = process_WebGL2ShaderCode(RenderStateShaderType.Fragment, undefined, undefined, undefined, undefined, '');

export enum RenderServerPlainColorTexture { White, Black, Transparent, }

export class RenderServerDevice extends WebGL2RenderDevice {

    public static readonly ConstantsCode =`const float PI = 3.1415926535;
const float TAU = 6.283185307;
const float EPSILON = 0.00001;`

    public static readonly WorldUniformsCode = `uniform WorldUniforms {
    mat4 camera_world;
    mat4 camera_projection;
    vec2 screen_size;
    float time;
    bool camera_is_orthogonal;
};`

    public static readonly FrameOutputBufferCode = `layout(location = 0) out vec4 o_color;
layout(location = 1) out vec3 o_normal;`

    public static readonly WorldUniformsName: string = 'WorldUniforms';
    public static readonly WorldUniformsItems: string[] = ['camera_world', 'camera_projection', 'screen_size', 'time', 'camera_is_orthogonal'];
    public static readonly WorldUniformsUnit: number = 0;

    public static readonly EmptyTextureUnit: number = 1;
    public static readonly LightsTextureUnit: number = 2;
    public static readonly LightsClusterTextureUnit: number = 3;
    public static readonly SkyTextureUnit: number = 4;

    public readonly identity_transform_attribute_buffer_ref: Ref<RenderDeviceMatrix4AttributeBuffer<WebGL2RenderState>> = new Ref();
    public get identity_transform_attribute_buffer() { return this.identity_transform_attribute_buffer_ref.expect; }

    public readonly empty_texture_ref: Ref<WebGL2RenderStateTexture> = new Ref();
    public get empty_texture() { return this.empty_texture_ref.expect; }

    public readonly plain_color_textures = {
        white: new Ref<WebGL2RenderStateTexture>(),
        black: new Ref<WebGL2RenderStateTexture>(),
        transparent: new Ref<WebGL2RenderStateTexture>(),
    }
    public readonly lights_data_ref: Ref<RenderServerLightsData> = new Ref();
    public readonly sky_texture_ref: Ref<WebGL2RenderStateTexture> = new Ref();

    private world_uniform_buffer: Ref<WebGL2RenderStateBuffer> = new Ref();
    private world_uniform_setting: { [name: string]: { index: number, offset: number } } = {};

    constructor(canvas: RDCanvas) {
        super(canvas, { preserve_texture_count: 6 });
        this.setup_IdentityTransformAttributeBuffer();
        this.setup_WorldUniformBuffer();
        this.setup_EmptyTexture();
        this.setup_PlainColorTextures();
    }

    private setup_IdentityTransformAttributeBuffer() {
        this.identity_transform_attribute_buffer_ref.value = new RenderDeviceMatrix4AttributeBuffer(this, RenderStateBufferUsage.StaticDraw, [Matrix4.make_Identity()], 1);
    }

    private setup_EmptyTexture() {
        const texture = this.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.empty_texture_ref.value = texture;
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
        console.log(this);
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
        if (this.lights_data_ref.value !== lights_data) {
            const texture = lights_data.lights_texture;
            this.lights_data_ref.value = lights_data;
            this.render_state.active_Texture(texture, RenderServerDevice.LightsTextureUnit);
        }
    }

    public use_SkyTexture(sky: WebGL2RenderStateTexture) {
        if (this.sky_texture_ref.value !== sky) {
            this.sky_texture_ref.value = sky;
            this.render_state.active_Texture(sky, RenderServerDevice.SkyTextureUnit);
        }
    }

    public create_Geometry() {
        return new RenderServerGeometry(this);
    }

    public create_Shader() {
        return new RenderServerShader(this);
    }

    public create_Material() {
        return new RenderServerMaterial(this);
    }

    public dispose(): void {
        this.world_uniform_buffer.clear();
        this.empty_texture_ref.clear();
        this.lights_data_ref.clear();
        this.plain_color_textures.white.clear();
        this.plain_color_textures.black.clear();
        this.plain_color_textures.transparent.clear();
    }
}

export const RenderServer = new RenderServerDevice(new OffscreenCanvas(1024, 1024));