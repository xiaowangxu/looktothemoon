import { Deg2Rad } from "@/system/fivepebble/Scalar";
import type { RDCanvas } from "@/system/sliverofstraw/RenderDevice";
import { RenderStateBufferType, RenderStateBufferUsage, RenderStateDataType, RenderStateShaderType, RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType } from "@/system/sliverofstraw/RenderState";
import { WebGL2RenderDevice } from "@/system/sliverofstraw/webgl2/WebGL2RenderDevice";
import { process_WebGL2ShaderCode } from "@/system/sliverofstraw/webgl2/WebGL2ShaderProcessor";
import type { WebGL2RenderStateBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateBuffer";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { Ref } from "@/system/utils/RefCounted";
import type { RenderServerLightsData } from "./RenderServerLightData";

const vertex_shader_source = process_WebGL2ShaderCode(RenderStateShaderType.Vertex, undefined, undefined, undefined, undefined, '');
const frag_shader_source = process_WebGL2ShaderCode(RenderStateShaderType.Fragment, undefined, undefined, undefined, undefined, '');

class RenderServerDevice extends WebGL2RenderDevice {
    private static readonly WorldUniformsName: string = 'WorldUniforms';
    private static readonly WorldUniformsItems: string[] = ['camera_world', 'camera_projection', 'screen_size', 'time', 'camera_is_orthogonal'];
    public static readonly WorldUniformsUnit: number = 0;
    public static readonly EmptyTextureUnit: number = 1;
    public static readonly LightsTextureUnit: number = 2;

    public readonly empty_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    public readonly lights_texture: Ref<WebGL2RenderStateTexture> = new Ref();

    private world_uniform_buffer: Ref<WebGL2RenderStateBuffer> = new Ref();
    private world_uniform_setting: { [name: string]: { index: number, offset: number } } = {};

    constructor(canvas: RDCanvas) {
        super(canvas, { preserve_texture_count: 6 });
        this.setup_WorldUniformBuffer();
        this.setup_EmptyTexture();
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

    private setup_EmptyTexture() {
        const texture = this.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.empty_texture.value = texture;
        this.render_state.alloc_Texture2D(texture, 2, 2, 0, RenderStateTextureDataFormat.RGBA, new Uint8ClampedArray([
            255, 0, 255, 255,
            128, 128, 128, 255,
            128, 128, 128, 255,
            255, 0, 255, 255,
        ]));
        this.render_state.active_Texture(texture, RenderServerDevice.EmptyTextureUnit);
    }

    public use_LightsData(lights_data: RenderServerLightsData) {
        const texture = lights_data.lights_texture;
        this.lights_texture.value = texture;
        this.render_state.active_Texture(texture, RenderServerDevice.LightsTextureUnit);
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

export const RenderServer = new RenderServerDevice(new OffscreenCanvas(1024, 1024));