import { Ref } from "@/system/utils/RefCounted";
import type { Config } from "../../ConfiguredObject";
import type { Renderer3D } from "./Renderer3D";
import { Renderer3DPipeline } from "./Renderer3DPipeline";
import type { WebGL2RenderStateFrameBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateFrameBuffer";
import type { WebGL2RenderStateRenderBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateRenderBuffer";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { RenderStateBufferUsage, RenderStateDataType, RenderStateFrameBufferPart, RenderStatePrimitiveType, RenderStateShaderType, RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureType } from "@/system/sliverofstraw/RenderState";
import { WebGL2RenderStateFrameBufferAttachmentPoint } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { Cacher } from "@/system/utils/Cacher";
import { RenderDeviceVector2AttributeBuffer, RenderDeviceIndexAttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { WebGL2RenderStateIntUniformSlot, WebGL2RenderStateUintUniformSlot } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateUniformSlot";
import { RenderServerDevice, RenderServerPlainColorTexture } from "../../render_server/RenderServer";
import { vec2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { RenderServerGeometry } from "../../render_server/RenderServerGeometry";
import type { WebGL2RenderStateProgram } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateProgram";
import { RenderServerShaderPass } from "../../render_server/RenderServerShader";
import { RenderServerMaterialCullFace } from "../../render_server/RenderServerMaterial";
import type { Viewport } from "../../nodes/Node";
import type { World3D } from "../../worlds/world3ds/World3D";

// #region quad surface

const QuadGeometry = new Cacher((config: Config) => {
    const quad_position = new RenderDeviceVector2AttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [
		/* 0 */vec2(-1, 1),			//   1  0 ------ 2
		/* 1 */vec2(-1, -1),		//   |  |        |
		/* 2 */vec2(1, 1),			//   |  |        |
		/* 3 */vec2(1, -1),			//  -1  1 ------ 3
        /*                        *///     -1 ------ 1
    ]);
    const quad_index = new RenderDeviceIndexAttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [0, 1, 2, 3]);
    const quad_surface = config.render_server.create_Geometry();
    quad_surface.set_Geometry(RenderStatePrimitiveType.TriangleStrip, { position: quad_position }, quad_index);
    return quad_surface;
});

// #endregion

// #region quad shader

const quad_vert_shader_code = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

out vec2 v_uv;

void main() {
	gl_Position = vec4(a_position, 1.0, 1.0);
	v_uv = (a_position + 1.0) / 2.0;
}`;

const QuadVertexShader = new Cacher((config: Config) => {
    const quad_vert_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Vertex, quad_vert_shader_code).expect();
    return quad_vert_shader;
});

// #endregion

// #region on screen

const onscreen_frag_shader_code = `#version 300 es
precision highp float;

${RenderServerDevice.WorldUniformsCode}

in vec2 v_uv;

uniform sampler2D u_screen;
uniform bool u_colormap;

layout(location = 0) out vec4 o_color;

void main() {
	o_color = vec4(texture(u_screen, vec2(v_uv.x, v_uv.y)).rgba);
	if (u_colormap) {
		float r = o_color.r;
		o_color.r = r <= 0.0031308 ? (12.92 * r) : (1.055 * pow(r, 1.0 / 2.4) - 0.055);
		float g = o_color.g;
		o_color.g = g <= 0.0031308 ? (12.92 * g) : (1.055 * pow(g, 1.0 / 2.4) - 0.055);
		float b = o_color.b;
		o_color.b = b <= 0.0031308 ? (12.92 * b) : (1.055 * pow(b, 1.0 / 2.4) - 0.055);
	}
}`;

const OnscreenProgramUniform = new Cacher((config: Config) => {
    const onscreen_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, onscreen_frag_shader_code).expect();
    const onscreen_program = config.render_server.render_state.create_Program(QuadVertexShader.get(config), onscreen_frag_shader).expect();

    const uniform_screen_location = config.render_server.render_state.get_ProgramUniformLocation(onscreen_program, 'u_screen');
    const uniform_screen_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, onscreen_program, uniform_screen_location!, 0);
    uniform_screen_slot.commit();

    const uniform_colormap_location = config.render_server.render_state.get_ProgramUniformLocation(onscreen_program, 'u_colormap');
    const uniform_colormap_slot = new WebGL2RenderStateUintUniformSlot(config.render_server.render_state, onscreen_program, uniform_colormap_location!, 0);
    uniform_colormap_slot.commit();

    return { onscreen_program, uniform_colormap_slot };
});

// #endregion

// #region oit composite

const oit_frag_shader_code = `#version 300 es
precision highp float;

${RenderServerDevice.WorldUniformsCode}

uniform sampler2D u_color;
uniform sampler2D u_accum;
uniform bool u_colormap;

in vec2 v_uv;

layout(location = 0) out vec4 o_color;

void main() {
	ivec2 uv = ivec2(v_uv * screen_size);
	vec4 color = texelFetch(u_color, uv, 0);
	float color_a = 1.0 - color.a;
	float a = texelFetch(u_accum, uv, 0).r;
	o_color = vec4(color_a * color.rgb / max(a, 0.00001), color_a);
	if (u_colormap) {
		float r = o_color.r;
		o_color.r = r <= 0.0031308 ? (12.92 * r) : (1.055 * pow(r, 1.0 / 2.4) - 0.055);
		float g = o_color.g;
		o_color.g = g <= 0.0031308 ? (12.92 * g) : (1.055 * pow(g, 1.0 / 2.4) - 0.055);
		float b = o_color.b;
		o_color.b = b <= 0.0031308 ? (12.92 * b) : (1.055 * pow(b, 1.0 / 2.4) - 0.055);
	}
}`;

const OiTPorgramUniform = new Cacher((config: Config) => {
    const oit_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, oit_frag_shader_code).expect();
    const oit_program = config.render_server.render_state.create_Program(QuadVertexShader.get(config), oit_frag_shader).expect();

    const uniform_oit_color_location = config.render_server.render_state.get_ProgramUniformLocation(oit_program, 'u_color');
    const uniform_oit_color_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, oit_program, uniform_oit_color_location!, 0);
    uniform_oit_color_slot.commit();

    const uniform_oit_accum_location = config.render_server.render_state.get_ProgramUniformLocation(oit_program, 'u_accum');
    const uniform_oit_accum_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, oit_program, uniform_oit_accum_location!, 1);
    uniform_oit_accum_slot.commit();

    const uniform_oit_colormap_location = config.render_server.render_state.get_ProgramUniformLocation(oit_program, 'u_colormap');
    const uniform_oit_colormap_slot = new WebGL2RenderStateUintUniformSlot(config.render_server.render_state, oit_program, uniform_oit_colormap_location!, 0);
    uniform_oit_colormap_slot.commit();

    return { oit_program, uniform_oit_colormap_slot };
});

// #endregion

// #region sky

const skydome_frag_shader_code = `#version 300 es
precision highp float;
precision highp usampler2DArray;
precision highp sampler3D;

const float PI = 3.1415926535;
const float TAU = 6.283185307;
const float EPSILON = 0.00001;

${RenderServerDevice.WorldUniformsCode}

in vec2 v_uv;

uniform sampler2D sky;

layout(location = 0) out vec4 o_color;

void main() {
	vec4 dir = mat4(mat3(camera_world)) * inverse(camera_projection) * vec4((v_uv * 2.0 - 1.0), 1.0, 1.0);
	vec3 R = normalize(dir.xyz);
	float theta = atan(R.z, R.x);
	float gamma = acos(R.y);
	o_color = texture(sky, vec2(theta / TAU + 0.5, gamma / PI));
}
`;

const SkyDomeProgram = new Cacher((config: Config) => {
    const skydome_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, skydome_frag_shader_code).expect();
    const skydome_program = config.render_server.render_state.create_Program(QuadVertexShader.get(config), skydome_frag_shader).expect();

    const uniform_sky_location = config.render_server.render_state.get_ProgramUniformLocation(skydome_program, 'sky');
    const uniform_sky_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, skydome_program, uniform_sky_location!, RenderServerDevice.SkyTextureUnit);
    uniform_sky_slot.commit();

    return skydome_program;
});

// #endregion

export class EditorRenderer3DPipeline extends Renderer3DPipeline {
    private get render_server() { return this.config.render_server; }

    static readonly Msaa = 1;

    //#region Solid

    //#region Frame Buffer
    private readonly solid_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly solid_color_depth_copy_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    //#endregion

    //#region Render Buffer
    private readonly solid_color_renderbuffer: Ref<WebGL2RenderStateRenderBuffer> = new Ref();
    private readonly solid_depth_renderbuffer: Ref<WebGL2RenderStateRenderBuffer> = new Ref();
    //#endregion

    //#region Texture
    private readonly solid_color_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    private readonly solid_depth_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    //#endregion

    //#endregion

    //#region Transaprent

    //#region Frame Buffer
    private readonly transparent_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly transparent_depth_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly transparent_color_copy_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly transparent_accum_src_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly transparent_accum_copy_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    //#endregion

    //#region Render Buffer
    private readonly transparent_color_renderbuffer: Ref<WebGL2RenderStateRenderBuffer> = new Ref();
    private readonly transparent_accum_renderbuffer: Ref<WebGL2RenderStateRenderBuffer> = new Ref();
    //#endregion

    //#region Texture
    private readonly transparent_color_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    private readonly transparent_accum_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    //#endregion

    //#endregion

    //#region Result

    //#region Frame Buffer
    private readonly result_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    //#endregion

    //#region Texture
    private readonly result_color_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    //#endregion

    //#endregion

    public get texture() { return this.result_color_texture.expect; }

    private alloc_Solid() {
        // frame buffer
        this.solid_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.solid_color_depth_copy_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();

        // render buffer
        this.solid_color_renderbuffer.value = this.render_server.render_state.create_RenderBuffer(RenderStateTextureFormat.RGBA32F, EditorRenderer3DPipeline.Msaa).expect();
        this.solid_depth_renderbuffer.value = this.render_server.render_state.create_RenderBuffer(RenderStateTextureFormat.D32F, EditorRenderer3DPipeline.Msaa).expect();

        // texture
        this.solid_color_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0).expect();
        this.solid_depth_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.D32F, 0).expect();
        this.render_server.render_state.set_TextureDepthParameter(this.solid_depth_texture.expect);

        this.resize_Solid();

        // link frame buffer
        this.render_server.render_state.set_FrameBufferAttachment(this.solid_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.solid_color_renderbuffer.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.solid_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, this.solid_depth_renderbuffer.expect);
        this.render_server.render_state.enable_FrameBuffer(this.solid_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.solid_color_depth_copy_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.solid_color_texture.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.solid_color_depth_copy_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, this.solid_depth_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.solid_color_depth_copy_framebuffer.expect);
    }

    private resize_Solid() {
        this.render_server.render_state.alloc_RenderBuffer(this.solid_color_renderbuffer.expect, this.size.x, this.size.y);
        this.render_server.render_state.alloc_RenderBuffer(this.solid_depth_renderbuffer.expect, this.size.x, this.size.y);
        this.render_server.render_state.alloc_Texture2D(this.solid_color_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.RGBA);
        this.render_server.render_state.alloc_Texture2D(this.solid_depth_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.Depth);
    }

    private alloc_Transparent() {
        // frame buffer
        this.transparent_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.transparent_depth_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.transparent_color_copy_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.transparent_accum_src_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.transparent_accum_copy_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();

        // render buffer
        this.transparent_color_renderbuffer.value = this.render_server.render_state.create_RenderBuffer(RenderStateTextureFormat.RGBA32F, EditorRenderer3DPipeline.Msaa).expect();
        this.transparent_accum_renderbuffer.value = this.render_server.render_state.create_RenderBuffer(RenderStateTextureFormat.R32F, EditorRenderer3DPipeline.Msaa).expect();

        // texture
        this.transparent_color_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0).expect();
        this.transparent_accum_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.R32F, 0).expect();

        this.resize_Transparent();

        // link frame buffer
        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.transparent_color_renderbuffer.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color1, this.transparent_accum_renderbuffer.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, this.solid_depth_renderbuffer.expect);
        this.render_server.render_state.enable_FrameBuffer(this.transparent_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_depth_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, this.solid_depth_renderbuffer.expect);
        this.render_server.render_state.enable_FrameBuffer(this.transparent_depth_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_color_copy_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.transparent_color_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.transparent_color_copy_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_accum_src_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.transparent_accum_renderbuffer.expect);
        this.render_server.render_state.enable_FrameBuffer(this.transparent_accum_src_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_accum_copy_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.transparent_accum_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.transparent_accum_copy_framebuffer.expect);
    }

    private resize_Transparent() {
        this.render_server.render_state.alloc_RenderBuffer(this.transparent_color_renderbuffer.expect, this.size.x, this.size.y);
        this.render_server.render_state.alloc_RenderBuffer(this.transparent_accum_renderbuffer.expect, this.size.x, this.size.y);
        this.render_server.render_state.alloc_Texture2D(this.transparent_color_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.RGBA);
        this.render_server.render_state.alloc_Texture2D(this.transparent_accum_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.Red);
    }

    private alloc_Result() {
        // frame buffer
        this.result_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();

        // texture
        this.result_color_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0).expect();

        this.resize_Result();

        // link frame buffer
        this.render_server.render_state.set_FrameBufferAttachment(this.result_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.result_color_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.result_framebuffer.expect);
    }

    private resize_Result() {
        this.render_server.render_state.alloc_Texture2D(this.result_color_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.RGBA);
    }

    constructor(config: Config, renderer: Renderer3D) {
        super(config, renderer);
        this.alloc_Result();
        this.alloc_Solid();
        this.alloc_Transparent();
    }

    private quad_geometry = QuadGeometry.get(this.config);

    private screen_quad_solid_program = OnscreenProgramUniform.get(this.config).onscreen_program;
    private screen_quad_solid_colormap_uniform_slot = OnscreenProgramUniform.get(this.config).uniform_colormap_slot;

    private oit_screen_quad_solid_program = OiTPorgramUniform.get(this.config).oit_program;
    private oit_screen_quad_solid_colormap_uniform_slot = OiTPorgramUniform.get(this.config).uniform_oit_colormap_slot;

    private sky_quad_solid_program = SkyDomeProgram.get(this.config);

    protected resize_Internal(): void {
        this.resize_Result();
        this.resize_Solid();
        this.resize_Transparent();
    }

    // render pipeline

    private set_CullFace(face: RenderServerMaterialCullFace) {
        switch (face) {
            case RenderServerMaterialCullFace.Back: {
                this.render_server.render_state.set_FaceWindingProxy(this.render_server.render_state.gl.CCW);
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
                return;
            }
            case RenderServerMaterialCullFace.Front: {
                this.render_server.render_state.set_FaceWindingProxy(this.render_server.render_state.gl.CW);
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
                return;
            }
            case RenderServerMaterialCullFace.None: {
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, false);
                return;
            }
            default: {
                const n: never = face;
                return;
            }
        }
    }

    private render_RenderQueue0Solid(transparent_bg: boolean) {
        const { x: width, y: height } = this.size;
        this.render_server.set_RenderCapabilities(true, true, this.render_server.render_state.gl.LEQUAL, false);
        this.render_server.render_state.set_ViewportProxy(0, 0, width, height);
        this.render_server.render_state.set_ScissorProxy(0, 0, width, height);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        if (transparent_bg) {
            this.render_server.render_state.set_ClearColorProxy(0, 0, 0, 0);
            this.render_server.render_state.clear_FrameBuffer(this.solid_framebuffer.expect, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth);
        }
        else {
            this.render_server.render_state.clear_FrameBuffer(this.solid_framebuffer.expect, RenderStateFrameBufferPart.Depth);
        }

        // render queue solid
        const render_queue = this.renderer.render_queue_0;
        for (let i = 0; i <= render_queue.solid_pointer; i++) {
            const geometry = render_queue.solid_geometry_queue[i];
            const indexed = render_queue.solid_indexed_queue[i];
            const instance_count = render_queue.solid_instance_count_queue[i];
            const material = render_queue.solid_material_queue[i];
            const transform = render_queue.solid_transform_queue[i];
            const layer = render_queue.solid_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.Shade);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                material.set_UniformOverride('model_world', transform);
                material.set_UniformOverride('layer', layer);
                material.commit_AllUniformOverride(RenderServerShaderPass.Shade);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }

        // draw sky
        if (!transparent_bg) {
            this.render_server.render_state.set_DepthFuncProxy(this.render_server.render_state.gl.LEQUAL);
            this.render_server.render_state.draw_Elements(this.sky_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
        }

        // blit
        this.render_server.render_state.blit_FrameBuffer(this.solid_framebuffer.expect, this.solid_color_depth_copy_framebuffer.expect, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
    }

    private compose_RenderQueue0Solid(color_map: boolean) {
        this.render_server.render_state.use_FrameBuffer(this.result_framebuffer.expect);
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, false);
        this.set_CullFace(RenderServerMaterialCullFace.None);
        this.render_server.render_state.active_Texture(this.solid_color_texture.expect, 0);
        this.screen_quad_solid_colormap_uniform_slot.value = color_map ? 1 : 0;
        this.screen_quad_solid_colormap_uniform_slot.commit();
        this.render_server.render_state.draw_Elements(this.screen_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
    }

    private render_RenderQueue0Transparent() {
        const { x: width, y: height } = this.size;
        this.render_server.set_RenderCapabilities(true, false, this.render_server.render_state.gl.LEQUAL, true);
        this.render_server.render_state.gl.blendFuncSeparate(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ZERO, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        this.render_server.render_state.set_ClearColorProxy(0, 0, 0, 1);
        this.render_server.render_state.clear_FrameBuffer(this.transparent_framebuffer.expect, RenderStateFrameBufferPart.Color);

        this.render_server.render_state.active_Texture(this.solid_depth_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.solid_color_texture.expect, 1);

        // draw scene
        // render queue transparent
        const render_queue = this.renderer.render_queue_0;
        for (let i = 0; i <= render_queue.transparent_pointer; i++) {
            const geometry = render_queue.transparent_geometry_queue[i];
            const indexed = render_queue.transparent_indexed_queue[i];
            const instance_count = render_queue.transparent_instance_count_queue[i];
            const material = render_queue.transparent_material_queue[i];
            const transform = render_queue.transparent_transform_queue[i];
            const layer = render_queue.transparent_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.OiT);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                material.set_UniformOverride('model_world', transform);
                material.set_UniformOverride('layer', layer);
                material.commit_AllUniformOverride(RenderServerShaderPass.OiT);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }

        // blit
        this.render_server.render_state.blit_FrameBuffer(this.transparent_framebuffer.expect, this.transparent_color_copy_framebuffer.expect, RenderStateFrameBufferPart.Color, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
        this.render_server.render_state.blit_FrameBuffer(this.transparent_accum_src_framebuffer.expect, this.transparent_accum_copy_framebuffer.expect, RenderStateFrameBufferPart.Color, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);

        // depth

        this.render_server.set_RenderCapabilities(true, true, this.render_server.render_state.gl.LEQUAL, false);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        this.render_server.render_state.use_FrameBuffer(this.transparent_depth_framebuffer.expect);

        for (let i = 0; i <= render_queue.transparent_pointer; i++) {
            const geometry = render_queue.transparent_geometry_queue[i];
            const indexed = render_queue.transparent_indexed_queue[i];
            const instance_count = render_queue.transparent_instance_count_queue[i];
            const material = render_queue.transparent_material_queue[i];
            const transform = render_queue.transparent_transform_queue[i];
            const layer = render_queue.transparent_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.PreZ);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                material.set_UniformOverride('model_world', transform);
                material.set_UniformOverride('layer', layer);
                material.commit_AllUniformOverride(RenderServerShaderPass.PreZ);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }

        // blit
        this.render_server.render_state.blit_FrameBuffer(this.solid_framebuffer.expect, this.solid_color_depth_copy_framebuffer.expect, RenderStateFrameBufferPart.Depth, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
    }

    private compose_RenderQueue0Transparent(color_map: boolean) {
        this.render_server.render_state.use_FrameBuffer(this.result_framebuffer.expect);
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, true);
        this.set_CullFace(RenderServerMaterialCullFace.None);
        this.render_server.render_state.gl.blendFunc(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.render_server.render_state.active_Texture(this.transparent_color_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.transparent_accum_texture.expect, 1);
        this.oit_screen_quad_solid_colormap_uniform_slot.value = color_map ? 1 : 0;
        this.oit_screen_quad_solid_colormap_uniform_slot.commit();
        this.render_server.render_state.draw_Elements(this.oit_screen_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
    }

    private render_RenderQueue1Solid() {
        if (this.renderer.render_queue_1 === undefined) return;

        const { x: width, y: height } = this.size;
        this.render_server.set_RenderCapabilities(true, true, this.render_server.render_state.gl.LEQUAL, false);
        this.render_server.render_state.set_ViewportProxy(0, 0, width, height);
        this.render_server.render_state.set_ScissorProxy(0, 0, width, height);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        this.render_server.render_state.set_ClearColorProxy(0, 0, 0, 0);
        this.render_server.render_state.clear_FrameBuffer(this.solid_framebuffer.expect, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth);

        this.render_server.render_state.active_Texture(this.solid_depth_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.solid_color_texture.expect, 1);

        // render queue solid
        const render_queue = this.renderer.render_queue_1;
        for (let i = 0; i <= render_queue.solid_pointer; i++) {
            const geometry = render_queue.solid_geometry_queue[i];
            const indexed = render_queue.solid_indexed_queue[i];
            const instance_count = render_queue.solid_instance_count_queue[i];
            const material = render_queue.solid_material_queue[i];
            const transform = render_queue.solid_transform_queue[i];
            const layer = render_queue.solid_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.Shade);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                material.set_UniformOverride('model_world', transform);
                material.set_UniformOverride('layer', layer);
                material.commit_AllUniformOverride(RenderServerShaderPass.Shade);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }

        // blit
        this.render_server.render_state.blit_FrameBuffer(this.solid_framebuffer.expect, this.solid_color_depth_copy_framebuffer.expect, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
    }

    private compose_RenderQueue1Solid() {
        this.render_server.render_state.use_FrameBuffer(this.result_framebuffer.expect);
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, true);
        this.render_server.render_state.gl.blendFunc(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.set_CullFace(RenderServerMaterialCullFace.None);
        this.render_server.render_state.active_Texture(this.solid_color_texture.expect, 0);
        this.screen_quad_solid_colormap_uniform_slot.value = 0;
        this.screen_quad_solid_colormap_uniform_slot.commit();
        this.render_server.render_state.draw_Elements(this.screen_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
    }

    private render_RenderQueue1Transparent() {
        if (this.renderer.render_queue_1 === undefined) return;

        const { x: width, y: height } = this.size;
        this.render_server.set_RenderCapabilities(true, false, this.render_server.render_state.gl.LEQUAL, true);
        this.render_server.render_state.gl.blendFuncSeparate(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ZERO, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        this.render_server.render_state.set_ClearColorProxy(0, 0, 0, 1);
        this.render_server.render_state.clear_FrameBuffer(this.transparent_framebuffer.expect, RenderStateFrameBufferPart.Color);

        this.render_server.render_state.active_Texture(this.solid_depth_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.solid_color_texture.expect, 1);

        // draw scene
        // render queue transparent
        const render_queue = this.renderer.render_queue_1;
        for (let i = 0; i <= render_queue.transparent_pointer; i++) {
            const geometry = render_queue.transparent_geometry_queue[i];
            const indexed = render_queue.transparent_indexed_queue[i];
            const instance_count = render_queue.transparent_instance_count_queue[i];
            const material = render_queue.transparent_material_queue[i];
            const transform = render_queue.transparent_transform_queue[i];
            const layer = render_queue.transparent_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.OiT);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                material.set_UniformOverride('model_world', transform);
                material.set_UniformOverride('layer', layer);
                material.commit_AllUniformOverride(RenderServerShaderPass.OiT);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }

        // blit
        this.render_server.render_state.blit_FrameBuffer(this.transparent_framebuffer.expect, this.transparent_color_copy_framebuffer.expect, RenderStateFrameBufferPart.Color, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
        this.render_server.render_state.blit_FrameBuffer(this.transparent_accum_src_framebuffer.expect, this.transparent_accum_copy_framebuffer.expect, RenderStateFrameBufferPart.Color, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
    }

    private compose_RenderQueue1Transparent() {
        this.render_server.render_state.use_FrameBuffer(this.result_framebuffer.expect);
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, true);
        this.set_CullFace(RenderServerMaterialCullFace.None);
        this.render_server.render_state.gl.blendFunc(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.render_server.render_state.active_Texture(this.transparent_color_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.transparent_accum_texture.expect, 1);
        this.oit_screen_quad_solid_colormap_uniform_slot.value = 0;
        this.oit_screen_quad_solid_colormap_uniform_slot.commit();
        this.render_server.render_state.draw_Elements(this.oit_screen_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
    }

    protected render_Internal(world: World3D, viewport: Viewport, once: boolean): void {
        const { transparent: transparent_bg, color_map } = viewport;
        // render queue 0
        this.render_RenderQueue0Solid(transparent_bg);
        this.compose_RenderQueue0Solid(color_map);
        if (this.renderer.render_queue_0.transparent_pointer >= 0) {
            this.render_RenderQueue0Transparent();
            this.compose_RenderQueue0Transparent(color_map);
        }
        // render queue 1
        if (this.renderer.render_queue_1 !== undefined) {
            this.render_RenderQueue1Solid();
            this.compose_RenderQueue1Solid();
            if (this.renderer.render_queue_1.transparent_pointer >= 0) {
                this.render_RenderQueue1Transparent();
                this.compose_RenderQueue1Transparent();
            }
        }
    }

    public dispose(): void {
        // solid
        this.solid_framebuffer.clear();
        this.solid_color_depth_copy_framebuffer.clear();
        this.solid_color_renderbuffer.clear();
        this.solid_depth_renderbuffer.clear();
        this.solid_color_texture.clear();
        this.solid_depth_texture.clear();
        // transparent
        this.transparent_framebuffer.clear();
        this.transparent_depth_framebuffer.clear();
        this.transparent_color_copy_framebuffer.clear();
        this.transparent_accum_src_framebuffer.clear();
        this.transparent_accum_copy_framebuffer.clear();
        this.transparent_color_renderbuffer.clear();
        this.transparent_accum_renderbuffer.clear();
        this.transparent_color_texture.clear();
        this.transparent_accum_texture.clear();
        // reuslt
        this.result_framebuffer.clear();
        this.result_color_texture.clear();
    }
}