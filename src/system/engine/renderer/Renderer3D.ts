import type { Viewport } from "../nodes/Node";
import type { Camera3D } from "../nodes/camera3ds/Camera3D";
import { World3D } from "../worlds/world3ds/World3D";
import { RenderServer3D, RenderServerDevice } from "../render_server/RenderServer";
import { RenderStateBufferUsage, RenderStateDataType, RenderStateFrameBufferPart, RenderStatePrimitiveType, RenderStateShaderType, RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType } from "../../sliverofstraw/RenderState";
import { RenderDeviceIndexAttributeBuffer, RenderDeviceVector2AttributeBuffer } from "../../sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { Vector2, vec2 } from "../../fivepebble/linear_algebra/Vector2";
import { WebGL2RenderStateIntUniformSlot, WebGL2RenderStateUintUniformSlot } from "../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateUniformSlot";
import type { WebGL2RenderStateFrameBuffer } from "../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateFrameBuffer";
import { Ref } from "../../utils/RefCounted";
import { WebGL2RenderStateFrameBufferAttachmentPoint } from "../../sliverofstraw/webgl2/WebGL2RenderState";
import type { WebGL2RenderStateTexture } from "../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import type { WebGL2RenderStateRenderBuffer } from "../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateRenderBuffer";
import { Matrix4 } from "../../fivepebble/linear_algebra/Matrix4";
import { RenderServerMaterialCullFace, type RenderServerMaterial } from "../render_server/RenderServerMaterial";
import { RenderServerShaderPass } from "../render_server/RenderServerShader";
import type { WebGL2RenderStateVertexArray, WebGL2RenderStateVertexArrayView } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateVertexArray";

const debug_text = document.getElementById('render-server-debug')!;

// #region quad surface

const quad_position = new RenderDeviceVector2AttributeBuffer(RenderServer3D, RenderStateBufferUsage.StaticDraw, [
	/* 0 */vec2(-1, 1),			//   1  0 ------ 2
	/* 1 */vec2(-1, -1),		//   |  |        |
	/* 2 */vec2(1, 1),			//   |  |        |
	/* 3 */vec2(1, -1),			//  -1  1 ------ 3
	/*                        *///     -1 ------ 1
]);
const quad_index = new RenderDeviceIndexAttributeBuffer(RenderServer3D, RenderStateBufferUsage.StaticDraw, [0, 1, 2, 3]);
const quad_surface = RenderServer3D.create_Geometry();
quad_surface.set_Geometry(RenderStatePrimitiveType.TriangleStrip, { position: quad_position }, quad_index);

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
const quad_vert_shader = RenderServer3D.render_state.create_Shader(RenderStateShaderType.Vertex, quad_vert_shader_code).expect();

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
const onscreen_frag_shader = RenderServer3D.render_state.create_Shader(RenderStateShaderType.Fragment, onscreen_frag_shader_code).expect();
const onscreen_program = RenderServer3D.render_state.create_Program(quad_vert_shader, onscreen_frag_shader).expect();

const uniform_screen_location = RenderServer3D.render_state.get_ProgramUniformLocation(onscreen_program, 'u_screen');
const uniform_screen_slot = new WebGL2RenderStateIntUniformSlot(RenderServer3D.render_state, onscreen_program, uniform_screen_location!, 0);
uniform_screen_slot.commit();
const uniform_colormap_location = RenderServer3D.render_state.get_ProgramUniformLocation(onscreen_program, 'u_colormap');
const uniform_colormap_slot = new WebGL2RenderStateUintUniformSlot(RenderServer3D.render_state, onscreen_program, uniform_colormap_location!, 0);
uniform_colormap_slot.commit();

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
const oit_frag_shader = RenderServer3D.render_state.create_Shader(RenderStateShaderType.Fragment, oit_frag_shader_code).expect();
const oit_program = RenderServer3D.render_state.create_Program(quad_vert_shader, oit_frag_shader).expect();

const uniform_oit_color_location = RenderServer3D.render_state.get_ProgramUniformLocation(oit_program, 'u_color');
const uniform_oit_color_slot = new WebGL2RenderStateIntUniformSlot(RenderServer3D.render_state, oit_program, uniform_oit_color_location!, 0);
uniform_oit_color_slot.commit();
const uniform_oit_accum_location = RenderServer3D.render_state.get_ProgramUniformLocation(oit_program, 'u_accum');
const uniform_oit_accum_slot = new WebGL2RenderStateIntUniformSlot(RenderServer3D.render_state, oit_program, uniform_oit_accum_location!, 1);
uniform_oit_accum_slot.commit();
const uniform_oit_colormap_location = RenderServer3D.render_state.get_ProgramUniformLocation(oit_program, 'u_colormap');
const uniform_oit_colormap_slot = new WebGL2RenderStateUintUniformSlot(RenderServer3D.render_state, oit_program, uniform_oit_colormap_location!, 0);
uniform_oit_colormap_slot.commit();

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
const skydome_frag_shader = RenderServer3D.render_state.create_Shader(RenderStateShaderType.Fragment, skydome_frag_shader_code).expect();
const skydome_program = RenderServer3D.render_state.create_Program(quad_vert_shader, skydome_frag_shader).expect();

const uniform_sky_location = RenderServer3D.render_state.get_ProgramUniformLocation(skydome_program, 'sky');
const uniform_sky_slot = new WebGL2RenderStateIntUniformSlot(RenderServer3D.render_state, skydome_program, uniform_sky_location!, RenderServerDevice.SkyTextureUnit);
uniform_sky_slot.commit();

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

export class Renderer3D {
	public readonly canvas: HTMLElement;

	private readonly render_queue_0 = new Renderer3DQueue();
	private readonly render_queue_1 = new Renderer3DQueue();

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

	private readonly base_position: Vector2 = new Vector2(0, 0);
	private readonly base_size: Vector2 = new Vector2(1, 1);

	private size_changed: boolean = true;

	constructor(canvas: HTMLElement) {
		this.canvas = canvas;

		const msaa = 4;

		// solid

		const frame_solid_buffer = RenderServer3D.render_state.create_FrameBuffer().expect();

		const frame_solid_buffer_depth_tex = RenderServer3D.render_state.create_RenderBuffer(RenderStateTextureFormat.D32F, msaa).expect();
		RenderServer3D.render_state.alloc_RenderBuffer(frame_solid_buffer_depth_tex, 1, 1);
		const frame_solid_buffer_color_tex = RenderServer3D.render_state.create_RenderBuffer(RenderStateTextureFormat.RGBA32F, msaa).expect();
		RenderServer3D.render_state.alloc_RenderBuffer(frame_solid_buffer_color_tex, 1, 1);

		RenderServer3D.render_state.set_FrameBufferAttachment(frame_solid_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, frame_solid_buffer_color_tex);
		RenderServer3D.render_state.set_FrameBufferAttachment(frame_solid_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_solid_buffer_depth_tex);
		RenderServer3D.render_state.enable_FrameBuffer(frame_solid_buffer);

		this.frame_solid_buffer_depth.value = frame_solid_buffer_depth_tex;
		this.frame_solid_buffer_color.value = frame_solid_buffer_color_tex;
		this.frame_solid_buffer.value = frame_solid_buffer;

		const frame_solid_buffer_copy_color_depth = RenderServer3D.render_state.create_FrameBuffer().expect();

		const frame_solid_buffer_color_texture = RenderServer3D.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
		RenderServer3D.render_state.alloc_Texture2D(frame_solid_buffer_color_texture, 1, 1, 0, RenderStateTextureDataFormat.RGBA, undefined);
		const frame_solid_buffer_depth_texture = RenderServer3D.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.D32F, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
		RenderServer3D.render_state.alloc_Texture2D(frame_solid_buffer_depth_texture, 1, 1, 0, RenderStateTextureDataFormat.Depth, undefined);
		RenderServer3D.render_state.gl.texParameteri(
			RenderServer3D.render_state.gl.TEXTURE_2D,
			RenderServer3D.render_state.gl.TEXTURE_COMPARE_MODE,
			RenderServer3D.render_state.gl.COMPARE_REF_TO_TEXTURE,
		);
		RenderServer3D.render_state.set_FrameBufferAttachment(frame_solid_buffer_copy_color_depth, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, frame_solid_buffer_color_texture);
		RenderServer3D.render_state.set_FrameBufferAttachment(frame_solid_buffer_copy_color_depth, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_solid_buffer_depth_texture);
		RenderServer3D.render_state.enable_FrameBuffer(frame_solid_buffer_copy_color_depth);

		this.frame_solid_buffer_color_texture.value = frame_solid_buffer_color_texture;
		this.frame_solid_buffer_depth_texture.value = frame_solid_buffer_depth_texture;
		this.frame_solid_buffer_copy_color_depth.value = frame_solid_buffer_copy_color_depth;

		// transparent

		const frame_transparent_buffer = RenderServer3D.render_state.create_FrameBuffer().expect();

		const frame_transparent_buffer_color_texture = RenderServer3D.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
		RenderServer3D.render_state.alloc_Texture2D(frame_transparent_buffer_color_texture, 1, 1, 0, RenderStateTextureDataFormat.RGBA, undefined);
		const frame_transparent_buffer_accum_texture = RenderServer3D.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.R32F, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
		RenderServer3D.render_state.alloc_Texture2D(frame_transparent_buffer_accum_texture, 1, 1, 0, RenderStateTextureDataFormat.Red, undefined);

		RenderServer3D.render_state.set_FrameBufferAttachment(frame_transparent_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, frame_transparent_buffer_color_texture);
		RenderServer3D.render_state.set_FrameBufferAttachment(frame_transparent_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Color1, frame_transparent_buffer_accum_texture);
		RenderServer3D.render_state.set_FrameBufferAttachment(frame_transparent_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_solid_buffer_depth_texture);
		RenderServer3D.render_state.enable_FrameBuffer(frame_transparent_buffer);

		this.frame_transparent_buffer_color_texture.value = frame_transparent_buffer_color_texture;
		this.frame_transparent_buffer_accum_texture.value = frame_transparent_buffer_accum_texture;
		this.frame_transparent_buffer.value = frame_transparent_buffer;

		const frame_transparent_buffer_copy = RenderServer3D.render_state.create_FrameBuffer().expect();

		const frame_transparent_buffer_depth_texture = RenderServer3D.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.D32F, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
		RenderServer3D.render_state.alloc_Texture2D(frame_transparent_buffer_depth_texture, 1, 1, 0, RenderStateTextureDataFormat.Depth, undefined);
		RenderServer3D.render_state.gl.texParameteri(
			RenderServer3D.render_state.gl.TEXTURE_2D,
			RenderServer3D.render_state.gl.TEXTURE_COMPARE_MODE,
			RenderServer3D.render_state.gl.COMPARE_REF_TO_TEXTURE,
		);

		RenderServer3D.render_state.set_FrameBufferAttachment(frame_transparent_buffer_copy, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_transparent_buffer_depth_texture);
		RenderServer3D.render_state.enable_FrameBuffer(frame_transparent_buffer_copy);

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
			RenderServer3D.render_state.set_CapabilityProxy(RenderServer3D.render_state.gl.DEPTH_TEST, depth_test);
		}
		if (depth_write !== undefined) {
			RenderServer3D.render_state.set_DepthMaskProxy(depth_write);
		}
		if (depth_func !== undefined) {
			RenderServer3D.render_state.set_DepthFuncProxy(depth_func);
		}
		if (blend !== undefined) {
			RenderServer3D.render_state.set_CapabilityProxy(RenderServer3D.render_state.gl.BLEND, blend);
		}
	}

	private set_CullFace(face: RenderServerMaterialCullFace) {
		switch (face) {
			case RenderServerMaterialCullFace.Back: {
				RenderServer3D.render_state.set_FaceWindingProxy(RenderServer3D.render_state.gl.CCW);
				RenderServer3D.render_state.set_CapabilityProxy(RenderServer3D.render_state.gl.CULL_FACE, true);
				return;
			}
			case RenderServerMaterialCullFace.Front: {
				RenderServer3D.render_state.set_FaceWindingProxy(RenderServer3D.render_state.gl.CW);
				RenderServer3D.render_state.set_CapabilityProxy(RenderServer3D.render_state.gl.CULL_FACE, true);
				return;
			}
			case RenderServerMaterialCullFace.None: {
				RenderServer3D.render_state.set_CapabilityProxy(RenderServer3D.render_state.gl.CULL_FACE, false);
				return;
			}
			default: {
				const n: never = face;
				return;
			}
		}
	}

	private render_SolidQueue(render_queue: Renderer3DQueue, width: number, height: number, sky: boolean = true, blit_depth: boolean) {
		this.set_RenderCapabilities(true, true, RenderServer3D.render_state.gl.LEQUAL, false);
		RenderServer3D.render_state.set_ViewportProxy(0, 0, width, height);
		RenderServer3D.render_state.set_ScissorProxy(0, 0, width, height);
		RenderServer3D.render_state.set_CapabilityProxy(RenderServer3D.render_state.gl.CULL_FACE, true);
		if (!sky) {
			RenderServer3D.render_state.set_ClearColorProxy(0, 0, 0, 0);
			RenderServer3D.render_state.clear_FrameBuffer(this.frame_solid_buffer.expect, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth);
		}
		else {
			RenderServer3D.render_state.clear_FrameBuffer(this.frame_solid_buffer.expect, RenderStateFrameBufferPart.Depth);
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
					RenderServer3D.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
				}
				else {
					RenderServer3D.render_state.draw_Arrays(program, geometry, instance_count);
				}
			}
		}

		// draw sky
		if (sky) {
			RenderServer3D.render_state.set_DepthFuncProxy(RenderServer3D.render_state.gl.LEQUAL);
			RenderServer3D.render_state.draw_Elements(skydome_program, quad_surface.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
		}

		// blit
		RenderServer3D.render_state.blit_FrameBuffer(this.frame_solid_buffer.expect, this.frame_solid_buffer_copy_color_depth.expect, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
		if (blit_depth) {
			RenderServer3D.render_state.blit_FrameBuffer(this.frame_solid_buffer.expect, this.frame_transparent_buffer_copy.expect, RenderStateFrameBufferPart.Depth, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
		}
	}

	private render_TransparentQueue(render_queue: Renderer3DQueue, width: number, height: number) {
		this.set_RenderCapabilities(true, false, RenderServer3D.render_state.gl.LEQUAL, true);
		RenderServer3D.render_state.gl.blendFuncSeparate(RenderServer3D.render_state.gl.ONE, RenderServer3D.render_state.gl.ONE, RenderServer3D.render_state.gl.ZERO, RenderServer3D.render_state.gl.ONE_MINUS_SRC_ALPHA);
		RenderServer3D.render_state.set_ViewportProxy(0, 0, width, height);
		RenderServer3D.render_state.set_ScissorProxy(0, 0, width, height);
		RenderServer3D.render_state.set_CapabilityProxy(RenderServer3D.render_state.gl.CULL_FACE, true);
		RenderServer3D.render_state.set_ClearColorProxy(0, 0, 0, 1);
		RenderServer3D.render_state.clear_FrameBuffer(this.frame_transparent_buffer.expect, RenderStateFrameBufferPart.Color);

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
					RenderServer3D.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
				}
				else {
					RenderServer3D.render_state.draw_Arrays(program, geometry, instance_count);
				}
			}
		}
	}

	private render_OnScreen(texture: WebGL2RenderStateTexture | undefined, color_map: boolean, x: number, y: number, width: number, height: number, blend: boolean, oit: boolean) {
		RenderServer3D.render_state.use_FrameBuffer(undefined);
		this.set_RenderCapabilities(false, false, RenderServer3D.render_state.gl.ALWAYS, blend);
		this.set_CullFace(RenderServerMaterialCullFace.None);
		const _x = x;
		const _y = RenderServer3D.canvas.height - height - y;
		RenderServer3D.render_state.set_ViewportProxy(_x, _y, width, height);
		RenderServer3D.render_state.set_ScissorProxy(_x, _y, width, height);
		if (blend) {
			RenderServer3D.render_state.gl.blendFunc(RenderServer3D.render_state.gl.ONE, RenderServer3D.render_state.gl.ONE_MINUS_SRC_ALPHA);
		}
		if (!oit) {
			if (texture !== undefined) {
				RenderServer3D.render_state.active_Texture(texture, 0);
				uniform_colormap_slot.value = color_map ? 1 : 0;
				uniform_colormap_slot.commit();
				RenderServer3D.render_state.draw_Elements(onscreen_program, quad_surface.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
			}
		}
		else {
			RenderServer3D.render_state.active_Texture(this.frame_transparent_buffer_color_texture.expect, 0);
			RenderServer3D.render_state.active_Texture(this.frame_transparent_buffer_accum_texture.expect, 1);
			uniform_oit_colormap_slot.value = color_map ? 1 : 0;
			uniform_oit_colormap_slot.commit();
			RenderServer3D.render_state.draw_Elements(oit_program, quad_surface.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
		}
	}

	private resize_FrameBuffers(width: number, height: number) {
		console.log("resize");
		// solid
		RenderServer3D.render_state.alloc_RenderBuffer(this.frame_solid_buffer_depth.expect, width, height);
		RenderServer3D.render_state.alloc_RenderBuffer(this.frame_solid_buffer_color.expect, width, height);
		RenderServer3D.render_state.alloc_Texture2D(this.frame_solid_buffer_color_texture.expect, width, height, 0, RenderStateTextureDataFormat.RGBA, undefined);
		RenderServer3D.render_state.alloc_Texture2D(this.frame_solid_buffer_depth_texture.expect, width, height, 0, RenderStateTextureDataFormat.Depth, undefined);
		// transparent
		RenderServer3D.render_state.alloc_Texture2D(this.frame_transparent_buffer_depth_texture.expect, width, height, 0, RenderStateTextureDataFormat.Depth, undefined);
		RenderServer3D.render_state.alloc_Texture2D(this.frame_transparent_buffer_color_texture.expect, width, height, 0, RenderStateTextureDataFormat.RGBA, undefined);
		RenderServer3D.render_state.alloc_Texture2D(this.frame_transparent_buffer_accum_texture.expect, width, height, 0, RenderStateTextureDataFormat.Red, undefined);
	}

	private draw_calls: number = 0;

	public render(world: World3D, viewport: Viewport, once: boolean): void {

		this.draw_calls = 0;

		const is_transparent = viewport.transparent;

		const time = viewport.get_SceneTree()!.time;
		const cam = viewport.get_Camera3D()!.get_Camera();
		const cam_world = cam.global_transform;
		const cam_projection = cam.projection;
		const cam_is_orthogonal = cam.is_orthogonal;
		const cam_frustum = cam.get_Frustum();
		const cam_mask = cam.mask;
		const pixel_ratio = RenderServer3D.pixel_ratio;
		let { x: width, y: height } = this.base_size;
		width = Math.max(Math.floor(width * pixel_ratio), 1);
		height = Math.max(Math.floor(height * pixel_ratio), 1);
		let { x, y } = this.base_position;
		x = Math.max(Math.floor(x * pixel_ratio), 0);
		y = Math.max(Math.floor(y * pixel_ratio), 0);

		RenderServer3D.set_WorldUniforms(cam_world, cam_projection, cam_is_orthogonal, width, height, time);
		RenderServer3D.set_EnvironmentUniforms();

		const world_3d = world.get_VisualWorld();
		// RenderServer.use_LightsData(lights_data);
		const sky_texture = world_3d.sky_texture.expect;
		RenderServer3D.use_SkyTexture(sky_texture);

		// resize
		if (this.size_changed) {
			this.size_changed = false;
			this.resize_FrameBuffers(width, height);
		}

		// fill up render queue
		let total_objects_count = 0;
		let rendered_objects_count = 0;
		this.render_queue_0.reset();
		this.render_queue_1.reset();
		for (const mesh of world_3d.meshes) {
			total_objects_count++;
			const render_queue = mesh.render_queue;
			if (mesh.fill_RenderQueue(render_queue === 0 ? this.render_queue_0 : this.render_queue_1, cam_mask, cam_frustum)) rendered_objects_count++;
		}

		//#region RenderQueue0

		// draw scene queue 0

		this.render_SolidQueue(this.render_queue_0, width, height, !is_transparent, true);

		// on screen
		this.render_OnScreen(this.frame_solid_buffer_color_texture.expect, viewport.color_map, x, y, width, height, false, false);

		if (this.render_queue_0.transparent_pointer >= 0) {

			RenderServer3D.render_state.active_Texture(this.frame_transparent_buffer_depth_texture.expect, 0);
			RenderServer3D.render_state.active_Texture(this.frame_solid_buffer_color_texture.expect, 1);

			this.render_TransparentQueue(this.render_queue_0, width, height);

			// on screen
			this.render_OnScreen(undefined, true, x, y, width, height, true, true);
		}

		//#endregion

		//#region RenderQueue1

		// setup depth texture

		if (this.render_queue_1.solid_pointer >= 0 || this.render_queue_1.transparent_pointer >= 0) {

			RenderServer3D.render_state.active_Texture(this.frame_solid_buffer_depth_texture.expect, 0);
			RenderServer3D.render_state.active_Texture(this.frame_solid_buffer_color_texture.expect, 1);

			// draw scene queue 1
			this.render_SolidQueue(this.render_queue_1, width, height, false, false);

			// on screen
			this.render_OnScreen(this.frame_solid_buffer_color_texture.expect, false, x, y, width, height, true, false);

			if (this.render_queue_1.transparent_pointer >= 0) {

				RenderServer3D.render_state.active_Texture(this.frame_transparent_buffer_depth_texture.expect, 0);
				RenderServer3D.render_state.active_Texture(this.frame_solid_buffer_color_texture.expect, 1);

				this.render_TransparentQueue(this.render_queue_1, width, height);

				// on screen
				this.render_OnScreen(undefined, false, x, y, width, height, true, true);
			}
		}

		//#endregion

		if (once) {
			this.render_queue_0.clear();
			this.render_queue_1.clear();
		}

		// debug
		if (viewport.debug) {
			const delta = viewport.get_SceneTree()!.delta;
			debug_text.innerHTML = `FPS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${(1 / delta).toFixed(3)}<br>FrameDelta: ${delta.toFixed(4)} ms<br>RenderObjs: ${rendered_objects_count} / ${total_objects_count}<br>Solid Objs: ${this.render_queue_0.solid_pointer + 1 + this.render_queue_1.solid_pointer + 1}<br>Trans Objs: ${this.render_queue_0.transparent_pointer + 1 + this.render_queue_1.transparent_pointer + 1}<br>Draw Calls: ${this.draw_calls}<br>Tweens : ${viewport.get_SceneTree()!.tween_processing_count}`;
		}
	}

	public dispose() {
		this.render_queue_0.dispose();
		this.render_queue_1.dispose();
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