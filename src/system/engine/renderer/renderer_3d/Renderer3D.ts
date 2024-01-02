import type { Viewport } from "../../nodes/Node";
import { World3D } from "../../worlds/world3ds/World3D";
import { RenderServerDevice } from "../../render_server/RenderServer";
import { RenderStateBufferUsage, RenderStateDataType, RenderStateFrameBufferPart, RenderStatePrimitiveType, RenderStateShaderType, RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType } from "../../../sliverofstraw/RenderState";
import { RenderDeviceIndexAttributeBuffer, RenderDeviceVector2AttributeBuffer } from "../../../sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { Vector2, vec2 } from "../../../fivepebble/linear_algebra/Vector2";
import { WebGL2RenderStateIntUniformSlot, WebGL2RenderStateUintUniformSlot } from "../../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateUniformSlot";
import type { WebGL2RenderStateFrameBuffer } from "../../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateFrameBuffer";
import { Ref } from "../../../utils/RefCounted";
import { WebGL2RenderStateFrameBufferAttachmentPoint } from "../../../sliverofstraw/webgl2/WebGL2RenderState";
import type { WebGL2RenderStateTexture } from "../../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import type { WebGL2RenderStateRenderBuffer } from "../../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateRenderBuffer";
import { Matrix4 } from "../../../fivepebble/linear_algebra/Matrix4";
import { RenderServerMaterialCullFace, type RenderServerMaterial } from "../../render_server/RenderServerMaterial";
import { RenderServerShaderPass } from "../../render_server/RenderServerShader";
import type { WebGL2RenderStateVertexArray, WebGL2RenderStateVertexArrayView } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateVertexArray";
import { ConfiguredObject, type Config } from "../../ConfiguredObject";
import { Cacher } from "@/system/utils/Cacher";
import { RenderServerLightType, type RenderServerLightsData } from "../../render_server/RenderServerLightData";
import { vec3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { color } from "@/system/fivepebble/graphics/Color";
import { Deg2Rad } from "@/system/fivepebble/Scalar";
import type { Renderer3DPipeline } from "./Renderer3DPipeline";

const debug_text = document.getElementById('render-server-debug')!;

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

export class Renderer3DQueue {
	public readonly solid_max_count: number;
	public readonly solid_geometry_queue: Array<WebGL2RenderStateVertexArray | WebGL2RenderStateVertexArrayView | undefined>;
	public readonly solid_indexed_queue: Array<boolean>;
	public readonly solid_instance_count_queue: Array<number>;
	public readonly solid_material_queue: Array<RenderServerMaterial | undefined>;
	public readonly solid_transform_queue: Array<Matrix4>;
	public readonly solid_layer_queue: Array<number>;

	public readonly transparent_max_count: number;
	public readonly transparent_geometry_queue: Array<WebGL2RenderStateVertexArray | WebGL2RenderStateVertexArrayView | undefined>;
	public readonly transparent_indexed_queue: Array<boolean>;
	public readonly transparent_instance_count_queue: Array<number>;
	public readonly transparent_material_queue: Array<RenderServerMaterial | undefined>;
	public readonly transparent_transform_queue: Array<Matrix4>;
	public readonly transparent_layer_queue: Array<number>;

	private last_solid_pointer: number = -1;
	public solid_pointer: number = -1;

	private last_transparent_pointer: number = -1;
	public transparent_pointer: number = -1;

	public get is_solid_full() { return this.solid_max_count <= 0 || this.solid_pointer >= this.solid_max_count; }
	public get is_transparent_full() { return this.transparent_max_count <= 0 || this.transparent_pointer >= this.transparent_max_count; }

	constructor(solid_preserved: number = 65536, transparent_preserved = 2048) {
		this.solid_max_count = solid_preserved;
		this.solid_geometry_queue = new Array(solid_preserved);
		this.solid_indexed_queue = new Array(solid_preserved);
		this.solid_instance_count_queue = new Array(solid_preserved);
		this.solid_material_queue = new Array(solid_preserved);
		this.solid_transform_queue = new Array(solid_preserved);
		this.solid_layer_queue = new Array(solid_preserved);
		for (let i = 0; i < this.solid_max_count; i++) {
			this.solid_geometry_queue[i] = undefined;
			this.solid_indexed_queue[i] = false;
			this.solid_instance_count_queue[i] = 1;
			this.solid_material_queue[i] = undefined;
			this.solid_transform_queue[i] = Matrix4.make_Identity();
			this.solid_layer_queue[i] = 0xffffffff;
		}
		this.transparent_max_count = transparent_preserved;
		this.transparent_geometry_queue = new Array(transparent_preserved);
		this.transparent_indexed_queue = new Array(transparent_preserved);
		this.transparent_instance_count_queue = new Array(transparent_preserved);
		this.transparent_material_queue = new Array(transparent_preserved);
		this.transparent_transform_queue = new Array(transparent_preserved);
		this.transparent_layer_queue = new Array(transparent_preserved);
		for (let i = 0; i < this.transparent_max_count; i++) {
			this.transparent_geometry_queue[i] = undefined;
			this.transparent_indexed_queue[i] = false;
			this.transparent_instance_count_queue[i] = 1;
			this.transparent_material_queue[i] = undefined;
			this.transparent_transform_queue[i] = Matrix4.make_Identity();
			this.transparent_layer_queue[i] = 0xffffffff;
		}
	}

	public add(vertex_array: WebGL2RenderStateVertexArray | WebGL2RenderStateVertexArrayView, material: RenderServerMaterial, indexed: boolean, instance_count: number, transform: Matrix4, layer: number) {
		const is_transparent = material.is_transparent;
		if (!is_transparent) {
			this.solid_pointer++;
			if (this.is_solid_full) return;
			this.solid_geometry_queue[this.solid_pointer] = vertex_array;
			this.solid_indexed_queue[this.solid_pointer] = indexed;
			this.solid_instance_count_queue[this.solid_pointer] = instance_count;
			this.solid_material_queue[this.solid_pointer] = material;
			this.solid_transform_queue[this.solid_pointer].copy(transform);
			this.solid_layer_queue[this.solid_pointer] = layer;
		}
		else {
			this.transparent_pointer++;
			if (this.is_transparent_full) return;
			this.transparent_geometry_queue[this.transparent_pointer] = vertex_array;
			this.transparent_indexed_queue[this.transparent_pointer] = indexed;
			this.transparent_instance_count_queue[this.transparent_pointer] = instance_count;
			this.transparent_material_queue[this.transparent_pointer] = material;
			this.transparent_transform_queue[this.transparent_pointer].copy(transform);
			this.transparent_layer_queue[this.transparent_pointer] = layer;
		}
	}

	public reset() {
		// solid
		if (this.last_solid_pointer > this.solid_pointer) {
			this.solid_geometry_queue.fill(undefined, this.solid_pointer + 1, this.last_solid_pointer + 1);
			this.solid_material_queue.fill(undefined, this.solid_pointer + 1, this.last_solid_pointer + 1);
		}
		this.last_solid_pointer = this.solid_pointer;
		this.solid_pointer = -1;
		// transparent
		if (this.last_transparent_pointer > this.transparent_pointer) {
			this.transparent_geometry_queue.fill(undefined, this.transparent_pointer + 1, this.last_transparent_pointer + 1);
			this.transparent_material_queue.fill(undefined, this.transparent_pointer + 1, this.last_transparent_pointer + 1);
		}
		this.last_transparent_pointer = this.transparent_pointer;
		this.transparent_pointer = -1;
	}

	public clear() {
		this.last_solid_pointer = this.solid_pointer;
		this.last_transparent_pointer = this.transparent_pointer;
		this.solid_pointer = -1;
		this.transparent_pointer = -1;
		this.reset();
	}

	public dispose() {
		this.solid_geometry_queue.fill(undefined, 0, this.solid_max_count);
		this.solid_material_queue.fill(undefined, 0, this.solid_max_count);
		this.transparent_geometry_queue.fill(undefined, 0, this.transparent_max_count);
		this.transparent_material_queue.fill(undefined, 0, this.transparent_max_count);
	}
}

export class Renderer3D extends ConfiguredObject {
	public readonly canvas: HTMLElement;
	private readonly render_server: RenderServerDevice;

	private readonly render_pipeline: Renderer3DPipeline;

	public readonly render_queue_0 = new Renderer3DQueue(this.config.render_queue_max_solid_count, this.config.render_queue_max_transparent_count);
	public readonly render_queue_1 = this.config.disabled_render_queue1 ? undefined : new Renderer3DQueue(this.config.render_queue_max_solid_count ?? this.config.render_queue1_max_solid_count, this.config.render_queue_max_transparent_count ?? this.config.render_queue1_max_transparent_count);

	private readonly frame_solid_buffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
	private readonly frame_solid_buffer_depth: Ref<WebGL2RenderStateRenderBuffer> = new Ref();
	private readonly frame_solid_buffer_color: Ref<WebGL2RenderStateRenderBuffer> = new Ref();
	private readonly frame_solid_buffer_copy_color_depth: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
	private readonly frame_solid_buffer_color_texture: Ref<WebGL2RenderStateTexture> = new Ref();
	private readonly frame_solid_buffer_depth_texture: Ref<WebGL2RenderStateTexture> = new Ref();

	private readonly frame_transparent_buffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
	private readonly frame_transparent_buffer_copy: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
	private readonly frame_transparent_buffer_depth_texture: Ref<WebGL2RenderStateTexture> = new Ref();
	private readonly frame_transparent_buffer_color_texture: Ref<WebGL2RenderStateTexture> = new Ref();
	private readonly frame_transparent_buffer_accum_texture: Ref<WebGL2RenderStateTexture> = new Ref();

	private readonly lights_data: Ref<RenderServerLightsData> = new Ref(this.config.render_server.create_LightsData(64, 64));

	private update_Lights() {
		const lights_data = this.lights_data.expect;

		// for (let i = 0; i < lights_data.max_light_count; i++) {
		// 	const radius = Math.random() * 4.0;
		// 	lights_data.set_Light(
		// 		i,
		// 		RenderServerLightType.PointLight,
		// 		undefined,
		// 		vec3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.75) * 2),
		// 		vec3(0, 0, 0),
		// 		color(Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2),
		// 		2.0,
		// 		undefined,
		// 		radius,
		// 		radius + Math.random(),
		// 	);
		// }

		lights_data.set_Light(0, RenderServerLightType.AmbientLight, undefined, undefined, undefined, color(0.3, 0.3, 0.3), 1.0);

		lights_data.set_Light(1, RenderServerLightType.DirectionalLight, undefined, vec3(-1, 1, -1), undefined, color(0.2, 0.2, 0.2), 1.0, 0xffffffbf);
		lights_data.set_Light(2, RenderServerLightType.DirectionalLight, undefined, vec3(1, 1, 1), undefined, color(0.25, 0.32, 0.4), 1.0, 0xffffffbf);
		lights_data.set_Light(3, RenderServerLightType.DirectionalLight, undefined, vec3(1, 1, -1), undefined, color(0.1, 0.1, 0.1), 1.0, 0xffffffbf);

		// lights_data.set_Light(3, RenderServerLightType.SpotLight, undefined, vec3(-1, 1, 1), vec3(1, -1, -1), color(0, 0, 10), 2.0, 0xffffffff, 12 * Deg2Rad, 0 * Deg2Rad, 2, 3);
		// lights_data.set_Light(1, RenderServerLightType.SpotLight, undefined, vec3(0.3, 0.3, 5.0), vec3(0, 0, -1), color(10, 0, 0), 2.0, 0xffffffff, 12 * Deg2Rad, 4 * Deg2Rad, 10, 11);
		// lights_data.set_Light(2, RenderServerLightType.SpotLight, undefined, vec3(-0.3, 0.3, 5.0), vec3(0, 0, -1), color(0, 10, 0), 2.0, 0xffffffff, 12 * Deg2Rad, 4 * Deg2Rad, 10, 11);
		// lights_data.set_Light(3, RenderServerLightType.SpotLight, undefined, vec3(0.0, -0.15, 5.0), vec3(0, 0, -1), color(0, 0, 10), 2.0, 0xffffffff, 12 * Deg2Rad, 4 * Deg2Rad, 10, 11);
	}

	private readonly base_position: Vector2 = new Vector2(0, 0);
	private readonly base_size: Vector2 = new Vector2(1, 1);

	private size_changed: boolean = true;

	// cache items
	private readonly quad_geometry = QuadGeometry.get(this.config);
	private readonly on_screen_program = OnscreenProgramUniform.get(this.config).onscreen_program;
	private readonly on_screen_uniform_colormap_slot = OnscreenProgramUniform.get(this.config).uniform_colormap_slot;
	private readonly oit_program = OiTPorgramUniform.get(this.config).oit_program;
	private readonly oit_uniform_colormap_slot = OiTPorgramUniform.get(this.config).uniform_oit_colormap_slot;
	private readonly skydome_program = SkyDomeProgram.get(this.config);

	constructor(config: Config, canvas: HTMLElement) {
		super(config);

		this.canvas = canvas;
		this.render_server = this.config.render_server;
		this.render_pipeline = new (config.render_3d_pipeline)(this.config, this);

		this.update_Lights();

		this.lights_data.expect.commit_AllLightsData();

		const msaa = 4;

		// solid

		const frame_solid_buffer = this.render_server.render_state.create_FrameBuffer().expect();

		const frame_solid_buffer_depth_tex = this.render_server.render_state.create_RenderBuffer(RenderStateTextureFormat.D32F, msaa).expect();
		this.render_server.render_state.alloc_RenderBuffer(frame_solid_buffer_depth_tex, 1, 1);
		const frame_solid_buffer_color_tex = this.render_server.render_state.create_RenderBuffer(RenderStateTextureFormat.RGBA32F, msaa).expect();
		this.render_server.render_state.alloc_RenderBuffer(frame_solid_buffer_color_tex, 1, 1);

		this.render_server.render_state.set_FrameBufferAttachment(frame_solid_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, frame_solid_buffer_color_tex);
		this.render_server.render_state.set_FrameBufferAttachment(frame_solid_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_solid_buffer_depth_tex);
		this.render_server.render_state.enable_FrameBuffer(frame_solid_buffer);

		this.frame_solid_buffer_depth.value = frame_solid_buffer_depth_tex;
		this.frame_solid_buffer_color.value = frame_solid_buffer_color_tex;
		this.frame_solid_buffer.value = frame_solid_buffer;

		const frame_solid_buffer_copy_color_depth = this.render_server.render_state.create_FrameBuffer().expect();

		const frame_solid_buffer_color_texture = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
		this.render_server.render_state.alloc_Texture2D(frame_solid_buffer_color_texture, 1, 1, 0, RenderStateTextureDataFormat.RGBA, undefined);
		const frame_solid_buffer_depth_texture = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.D32F, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
		this.render_server.render_state.alloc_Texture2D(frame_solid_buffer_depth_texture, 1, 1, 0, RenderStateTextureDataFormat.Depth, undefined);
		this.render_server.render_state.gl.texParameteri(
			this.render_server.render_state.gl.TEXTURE_2D,
			this.render_server.render_state.gl.TEXTURE_COMPARE_MODE,
			this.render_server.render_state.gl.COMPARE_REF_TO_TEXTURE,
		);
		this.render_server.render_state.set_FrameBufferAttachment(frame_solid_buffer_copy_color_depth, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, frame_solid_buffer_color_texture);
		this.render_server.render_state.set_FrameBufferAttachment(frame_solid_buffer_copy_color_depth, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_solid_buffer_depth_texture);
		this.render_server.render_state.enable_FrameBuffer(frame_solid_buffer_copy_color_depth);

		this.frame_solid_buffer_color_texture.value = frame_solid_buffer_color_texture;
		this.frame_solid_buffer_depth_texture.value = frame_solid_buffer_depth_texture;
		this.frame_solid_buffer_copy_color_depth.value = frame_solid_buffer_copy_color_depth;

		// transparent

		const frame_transparent_buffer = this.render_server.render_state.create_FrameBuffer().expect();

		const frame_transparent_buffer_color_texture = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
		this.render_server.render_state.alloc_Texture2D(frame_transparent_buffer_color_texture, 1, 1, 0, RenderStateTextureDataFormat.RGBA, undefined);
		const frame_transparent_buffer_accum_texture = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.R32F, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
		this.render_server.render_state.alloc_Texture2D(frame_transparent_buffer_accum_texture, 1, 1, 0, RenderStateTextureDataFormat.Red, undefined);

		this.render_server.render_state.set_FrameBufferAttachment(frame_transparent_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, frame_transparent_buffer_color_texture);
		this.render_server.render_state.set_FrameBufferAttachment(frame_transparent_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Color1, frame_transparent_buffer_accum_texture);
		this.render_server.render_state.set_FrameBufferAttachment(frame_transparent_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_solid_buffer_depth_texture);
		this.render_server.render_state.enable_FrameBuffer(frame_transparent_buffer);

		this.frame_transparent_buffer_color_texture.value = frame_transparent_buffer_color_texture;
		this.frame_transparent_buffer_accum_texture.value = frame_transparent_buffer_accum_texture;
		this.frame_transparent_buffer.value = frame_transparent_buffer;

		const frame_transparent_buffer_copy = this.render_server.render_state.create_FrameBuffer().expect();

		const frame_transparent_buffer_depth_texture = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.D32F, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
		this.render_server.render_state.alloc_Texture2D(frame_transparent_buffer_depth_texture, 1, 1, 0, RenderStateTextureDataFormat.Depth, undefined);
		this.render_server.render_state.gl.texParameteri(
			this.render_server.render_state.gl.TEXTURE_2D,
			this.render_server.render_state.gl.TEXTURE_COMPARE_MODE,
			this.render_server.render_state.gl.COMPARE_REF_TO_TEXTURE,
		);

		this.render_server.render_state.set_FrameBufferAttachment(frame_transparent_buffer_copy, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_transparent_buffer_depth_texture);
		this.render_server.render_state.enable_FrameBuffer(frame_transparent_buffer_copy);

		this.frame_transparent_buffer_depth_texture.value = frame_transparent_buffer_depth_texture;
		this.frame_transparent_buffer_copy.value = frame_transparent_buffer_copy;
	}

	public set_Size(size: Vector2) {
		if (!this.base_size.equal(size)) {
			this.base_size.copy(size);
			this.size_changed = true;
		}
	}

	public set_Position(position: Vector2) {
		if (!this.base_position.equal(position)) {
			this.base_position.copy(position);
		}
	}

	private set_RenderCapabilities(depth_test?: boolean, depth_write?: boolean, depth_func?: number, blend?: boolean) {
		if (depth_test !== undefined) {
			this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.DEPTH_TEST, depth_test);
		}
		if (depth_write !== undefined) {
			this.render_server.render_state.set_DepthMaskProxy(depth_write);
		}
		if (depth_func !== undefined) {
			this.render_server.render_state.set_DepthFuncProxy(depth_func);
		}
		if (blend !== undefined) {
			this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.BLEND, blend);
		}
	}

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

	private render_SolidQueue(render_queue: Renderer3DQueue, width: number, height: number, sky: boolean = true, blit_depth: boolean) {
		this.set_RenderCapabilities(true, true, this.render_server.render_state.gl.LEQUAL, false);
		this.render_server.render_state.set_ViewportProxy(0, 0, width, height);
		this.render_server.render_state.set_ScissorProxy(0, 0, width, height);
		this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
		if (!sky) {
			this.render_server.render_state.set_ClearColorProxy(0, 0, 0, 0);
			this.render_server.render_state.clear_FrameBuffer(this.frame_solid_buffer.expect, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth);
		}
		else {
			this.render_server.render_state.clear_FrameBuffer(this.frame_solid_buffer.expect, RenderStateFrameBufferPart.Depth);
		}

		// render queue solid
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
				this.draw_calls++;
				if (indexed) {
					this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
				}
				else {
					this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
				}
			}
		}

		// draw sky
		if (sky) {
			this.render_server.render_state.set_DepthFuncProxy(this.render_server.render_state.gl.LEQUAL);
			this.render_server.render_state.draw_Elements(this.skydome_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
		}

		// blit
		this.render_server.render_state.blit_FrameBuffer(this.frame_solid_buffer.expect, this.frame_solid_buffer_copy_color_depth.expect, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
		if (blit_depth) {
			this.render_server.render_state.blit_FrameBuffer(this.frame_solid_buffer.expect, this.frame_transparent_buffer_copy.expect, RenderStateFrameBufferPart.Depth, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
		}
	}

	private render_TransparentQueue(render_queue: Renderer3DQueue, width: number, height: number) {
		this.set_RenderCapabilities(true, false, this.render_server.render_state.gl.LEQUAL, true);
		this.render_server.render_state.gl.blendFuncSeparate(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ZERO, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
		this.render_server.render_state.set_ViewportProxy(0, 0, width, height);
		this.render_server.render_state.set_ScissorProxy(0, 0, width, height);
		this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
		this.render_server.render_state.set_ClearColorProxy(0, 0, 0, 1);
		this.render_server.render_state.clear_FrameBuffer(this.frame_transparent_buffer.expect, RenderStateFrameBufferPart.Color);

		// draw scene
		// render queue transparent
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
				this.draw_calls++;
				if (indexed) {
					this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
				}
				else {
					this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
				}
			}
		}
	}

	private render_OnScreen(texture: WebGL2RenderStateTexture | undefined, color_map: boolean, x: number, y: number, width: number, height: number, blend: boolean, oit: boolean) {
		this.render_server.render_state.use_FrameBuffer(undefined);
		this.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, blend);
		this.set_CullFace(RenderServerMaterialCullFace.None);
		const _x = x;
		const _y = this.render_server.canvas.height - height - y;
		this.render_server.render_state.set_ViewportProxy(_x, _y, width, height);
		this.render_server.render_state.set_ScissorProxy(_x, _y, width, height);
		if (blend) {
			this.render_server.render_state.gl.blendFunc(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
		}
		if (!oit) {
			if (texture !== undefined) {
				this.render_server.render_state.active_Texture(texture, 0);
				this.on_screen_uniform_colormap_slot.value = color_map ? 1 : 0;
				this.on_screen_uniform_colormap_slot.commit();
				this.render_server.render_state.draw_Elements(this.on_screen_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
			}
		}
		else {
			this.render_server.render_state.active_Texture(this.frame_transparent_buffer_color_texture.expect, 0);
			this.render_server.render_state.active_Texture(this.frame_transparent_buffer_accum_texture.expect, 1);
			this.oit_uniform_colormap_slot.value = color_map ? 1 : 0;
			this.oit_uniform_colormap_slot.commit();
			this.render_server.render_state.draw_Elements(this.oit_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
		}
	}

	private resize_FrameBuffers(width: number, height: number) {
		// // solid
		// this.render_server.render_state.alloc_RenderBuffer(this.frame_solid_buffer_depth.expect, width, height);
		// this.render_server.render_state.alloc_RenderBuffer(this.frame_solid_buffer_color.expect, width, height);
		// this.render_server.render_state.alloc_Texture2D(this.frame_solid_buffer_color_texture.expect, width, height, 0, RenderStateTextureDataFormat.RGBA, undefined);
		// this.render_server.render_state.alloc_Texture2D(this.frame_solid_buffer_depth_texture.expect, width, height, 0, RenderStateTextureDataFormat.Depth, undefined);
		// // transparent
		// this.render_server.render_state.alloc_Texture2D(this.frame_transparent_buffer_depth_texture.expect, width, height, 0, RenderStateTextureDataFormat.Depth, undefined);
		// this.render_server.render_state.alloc_Texture2D(this.frame_transparent_buffer_color_texture.expect, width, height, 0, RenderStateTextureDataFormat.RGBA, undefined);
		// this.render_server.render_state.alloc_Texture2D(this.frame_transparent_buffer_accum_texture.expect, width, height, 0, RenderStateTextureDataFormat.Red, undefined);
	}

	private draw_calls: number = 0;
	static #size: Vector2 = new Vector2();
	public render(world: World3D, viewport: Viewport, once: boolean): void {

		this.draw_calls = 0;

		const is_transparent = viewport.transparent;
		const color_map = viewport.color_map;

		const time = viewport.get_SceneTree()!.time;
		const cam = viewport.get_Camera3D()!.get_Camera();
		const cam_world = cam.global_transform;
		const cam_projection = cam.projection;
		const cam_is_orthogonal = cam.is_orthogonal;
		const cam_frustum = cam.get_Frustum();
		const cam_mask = cam.mask;
		const pixel_ratio = this.render_server.pixel_ratio;
		let { x: width, y: height } = this.base_size;
		width = Math.max(Math.floor(width * pixel_ratio), 1);
		height = Math.max(Math.floor(height * pixel_ratio), 1);
		let { x, y } = this.base_position;
		x = Math.max(Math.floor(x * pixel_ratio), 0);
		y = Math.max(Math.floor(y * pixel_ratio), 0);
		const size = Renderer3D.#size;
		size.set(width, height);

		this.render_server.set_WorldUniforms(cam_world, cam_projection, cam_is_orthogonal, width, height, time);
		this.render_server.set_EnvironmentUniforms();

		const world_3d = world.get_VisualWorld();
		this.render_server.use_LightsData(this.lights_data.expect);
		const sky_texture = world_3d.sky_texture.expect;
		this.render_server.use_SkyTexture(sky_texture);

		// fill up render queue
		let total_objects_count = 0;
		let rendered_objects_count = 0;
		this.render_queue_0.reset();
		if (this.render_queue_1 !== undefined) this.render_queue_1.reset();
		for (const mesh of world_3d.meshes) {
			total_objects_count++;
			const render_queue = mesh.render_queue;
			const queue = render_queue === 0 ? this.render_queue_0 : this.render_queue_1;
			if (queue !== undefined) if (mesh.fill_RenderQueue(queue, cam_mask, cam_frustum)) rendered_objects_count++;
		}

		// resize
		if (this.size_changed) {
			this.size_changed = false;
			this.resize_FrameBuffers(width, height);
		}

		this.render_pipeline.set_Size(size);

		this.render_pipeline.render(world, viewport, once);
		
		this.render_OnScreen(this.render_pipeline.texture, false, x, y, width, height, false, false);

		// //#region RenderQueue0

		// // draw scene queue 0

		// this.render_SolidQueue(this.render_queue_0, width, height, !is_transparent, true);

		// // on screen
		// this.render_OnScreen(this.frame_solid_buffer_color_texture.expect, viewport.color_map, x, y, width, height, false, false);

		// if (this.render_queue_0.transparent_pointer >= 0) {

		// 	this.render_server.render_state.active_Texture(this.frame_transparent_buffer_depth_texture.expect, 0);
		// 	this.render_server.render_state.active_Texture(this.frame_solid_buffer_color_texture.expect, 1);

		// 	this.render_TransparentQueue(this.render_queue_0, width, height);

		// 	// on screen
		// 	this.render_OnScreen(undefined, true, x, y, width, height, true, true);
		// }

		// //#endregion

		// //#region RenderQueue1

		// // setup depth texture

		// if (this.render_queue_1 !== undefined && (this.render_queue_1.solid_pointer >= 0 || this.render_queue_1.transparent_pointer >= 0)) {

		// 	this.render_server.render_state.active_Texture(this.frame_solid_buffer_depth_texture.expect, 0);
		// 	this.render_server.render_state.active_Texture(this.frame_solid_buffer_color_texture.expect, 1);

		// 	// draw scene queue 1
		// 	this.render_SolidQueue(this.render_queue_1, width, height, false, false);

		// 	// on screen
		// 	this.render_OnScreen(this.frame_solid_buffer_color_texture.expect, false, x, y, width, height, true, false);

		// 	if (this.render_queue_1.transparent_pointer >= 0) {

		// 		this.render_server.render_state.active_Texture(this.frame_transparent_buffer_depth_texture.expect, 0);
		// 		this.render_server.render_state.active_Texture(this.frame_solid_buffer_color_texture.expect, 1);

		// 		this.render_TransparentQueue(this.render_queue_1, width, height);

		// 		// on screen
		// 		this.render_OnScreen(undefined, false, x, y, width, height, true, true);
		// 	}
		// }

		// //#endregion

		if (once) {
			this.render_queue_0.clear();
			if (this.render_queue_1 !== undefined) this.render_queue_1.clear();
		}

		// debug
		if (viewport.debug) {
			const delta = viewport.get_SceneTree()!.delta;
			debug_text.innerHTML = `FPS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${(1 / delta).toFixed(3)}<br>FrameDelta: ${delta.toFixed(4)} ms<br>RenderObjs: ${rendered_objects_count} / ${total_objects_count}<br>Solid Objs: ${this.render_queue_0.solid_pointer + 1 + (this.render_queue_1?.solid_pointer ?? -1) + 1}<br>Trans Objs: ${this.render_queue_0.transparent_pointer + 1 + (this.render_queue_1?.transparent_pointer ?? -1) + 1}<br>Draw Calls: ${this.draw_calls}<br>Tweens : ${viewport.get_SceneTree()!.tween_processing_count}`;
		}
	}

	public dispose() {
		this.render_queue_0.dispose();
		if (this.render_queue_1 !== undefined) this.render_queue_1.dispose();
		this.render_pipeline.dispose();
		this.frame_solid_buffer.clear();
		this.frame_solid_buffer_depth.clear();
		this.frame_solid_buffer_color.clear();
		this.frame_solid_buffer_copy_color_depth.clear();
		this.frame_solid_buffer_color_texture.clear();
		this.frame_solid_buffer_depth_texture.clear();
		this.frame_transparent_buffer.clear();
		this.frame_transparent_buffer_copy.clear();
		this.frame_transparent_buffer_depth_texture.clear();
		this.frame_transparent_buffer_color_texture.clear();
		this.frame_transparent_buffer_accum_texture.clear();
	}
}