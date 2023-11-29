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
    private static readonly WorldUniformsItems: string[] = ['camera_world', 'camera_view', 'camera_projection', 'screen_size', 'time'];
    public static readonly WorldUniformsUnit: number = 0;
    public static readonly EmptyTextureUnit: number = 0;
    
    public readonly empty_texture: Ref<WebGL2RenderStateTexture> = new Ref();

    private world_uniform_buffer: Ref<WebGL2RenderStateBuffer> = new Ref();
    private world_uniform_setting: { [name: string]: { index: number, offset: number } } = {};

    constructor(canvas: RDCanvas) {
        super(canvas, WebGL2RenderState);
        this.setup_WorldUniformBuffer();
        this.setup_EmptyTexture();
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

    private setup_EmptyTexture(){
        const texture = this.render_state.create_Texture(RenderStateTextureType.Tex2D, RenderStateTextureFormat.RGBA8, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.empty_texture.value = texture;
        this.render_state.alloc_Texture(texture, 2, 2, 0, new Uint8ClampedArray([
            255, 0, 255, 255,
            128, 128, 128, 255,
            128, 128, 128, 255,
            255, 0, 255, 255,
        ]));
        this.render_state.active_Texture(texture, WebGL2RenderDevice.EmptyTextureUnit);
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