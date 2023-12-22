import type { Viewport } from "../nodes/Node";
import type { Camera3D } from "../nodes/camera3ds/Camera3D";
import { World3D } from "../worlds/world3ds/World3D";
import { RenderServer, RenderServerDevice } from "../render_server/RenderServer";
import { RenderServerLightType } from "../render_server/RenderServerLightData";
import { vec3 } from "../../fivepebble/linear_algebra/Vector3";
import { color } from "../../fivepebble/graphics/Color";
import { Deg2Rad } from "../../fivepebble/Scalar";
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
import type { RenderServerMaterial } from "../render_server/RenderServerMaterial";
import { RenderServerShaderPass } from "../render_server/RenderServerShader";
import type { WebGL2RenderStateVertexArray, WebGL2RenderStateVertexArrayView } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateVertexArray";

// #region quad surface

const quad_position = new RenderDeviceVector2AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, [
	/* 0 */vec2(-1, 1),			//   1  0 ------ 2
	/* 1 */vec2(-1, -1),		//   |  |        |
	/* 2 */vec2(1, 1),			//   |  |        |
	/* 3 */vec2(1, -1),			//  -1  1 ------ 3
	/*                        *///     -1 ------ 1
]);
const quad_index = new RenderDeviceIndexAttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, [0, 1, 2, 3]);
const quad_surface = RenderServer.create_Geometry();
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
const quad_vert_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Vertex, quad_vert_shader_code).expect();

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
}
`;
const onscreen_frag_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Fragment, onscreen_frag_shader_code).expect();
const onscreen_program = RenderServer.render_state.create_Program(quad_vert_shader, onscreen_frag_shader).expect();

const uniform_screen_location = RenderServer.render_state.get_ProgramUniformLocation(onscreen_program, 'u_screen');
const uniform_screen_slot = new WebGL2RenderStateIntUniformSlot(RenderServer.render_state, onscreen_program, uniform_screen_location!, 0);
uniform_screen_slot.commit();
const uniform_colormap_location = RenderServer.render_state.get_ProgramUniformLocation(onscreen_program, 'u_colormap');
const uniform_colormap_slot = new WebGL2RenderStateUintUniformSlot(RenderServer.render_state, onscreen_program, uniform_colormap_location!, 0);
uniform_colormap_slot.commit();

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
const skydome_frag_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Fragment, skydome_frag_shader_code).expect();
const skydome_program = RenderServer.render_state.create_Program(quad_vert_shader, skydome_frag_shader).expect();

const uniform_sky_location = RenderServer.render_state.get_ProgramUniformLocation(skydome_program, 'sky');
const uniform_sky_slot = new WebGL2RenderStateIntUniformSlot(RenderServer.render_state, skydome_program, uniform_sky_location!, RenderServerDevice.SkyTextureUnit);
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

	constructor(solid_preserved: number = 65536, transparent_preserved = 1) {
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
	public readonly canvas: HTMLCanvasElement;
	private readonly ctx: CanvasRenderingContext2D;

	private readonly render_queue_1 = new Renderer3DQueue();

	private readonly frame_buffer_prez: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
	private readonly frame_buffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
	private readonly frame_buffer_depth: Ref<WebGL2RenderStateRenderBuffer> = new Ref();
	private readonly frame_buffer_color: Ref<WebGL2RenderStateRenderBuffer> = new Ref();
	private readonly frame_buffer_copy: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
	private readonly frame_buffer_texture: Ref<WebGL2RenderStateTexture> = new Ref();

	private base_size: Vector2 = new Vector2(1, 1);
	private readonly size: Vector2 = new Vector2(1, 1);
	private pixel_ratio: number = 1;

	private size_changed: boolean = true;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.canvas.style.width = '100%';
		this.canvas.style.height = '100%';
		const ctx = this.canvas.getContext('2d');
		if (ctx === null) throw new Error('<Renderer3D> constructor: can not create canvas 2d context');
		this.ctx = ctx;

		const msaa = 4;
		const frame_buffer_depth_tex = RenderServer.render_state.create_RenderBuffer(RenderStateTextureFormat.D32F, msaa).expect();
		RenderServer.render_state.alloc_RenderBuffer(frame_buffer_depth_tex, 1, 1);

		const frame_buffer_prez = RenderServer.render_state.create_FrameBuffer().expect();
		this.frame_buffer_prez.value = frame_buffer_prez;
		RenderServer.render_state.set_FrameBufferAttachment(frame_buffer_prez, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_buffer_depth_tex);
		RenderServer.render_state.enable_FrameBuffer(frame_buffer_prez);

		const frame_buffer = RenderServer.render_state.create_FrameBuffer().expect();
		RenderServer.render_state.set_FrameBufferAttachment(frame_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_buffer_depth_tex);
		const frame_buffer_color_tex = RenderServer.render_state.create_RenderBuffer(RenderStateTextureFormat.RGBA32F, msaa).expect();
		RenderServer.render_state.alloc_RenderBuffer(frame_buffer_color_tex, 1, 1);
		RenderServer.render_state.set_FrameBufferAttachment(frame_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, frame_buffer_color_tex);
		RenderServer.render_state.set_FrameBufferAttachment(frame_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_buffer_depth_tex);
		RenderServer.render_state.enable_FrameBuffer(frame_buffer);

		this.frame_buffer_depth.value = frame_buffer_depth_tex;
		this.frame_buffer_color.value = frame_buffer_color_tex;
		this.frame_buffer.value = frame_buffer;

		const frame_buffer_copy = RenderServer.render_state.create_FrameBuffer().expect();
		const frame_buffer_texture = RenderServer.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
		RenderServer.render_state.alloc_Texture2D(frame_buffer_texture, 1, 1, 0, RenderStateTextureDataFormat.RGBA, undefined);
		RenderServer.render_state.set_FrameBufferAttachment(frame_buffer_copy, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, frame_buffer_texture);
		RenderServer.render_state.enable_FrameBuffer(frame_buffer_copy);

		this.frame_buffer_texture.value = frame_buffer_texture;
		this.frame_buffer_copy.value = frame_buffer_copy;

		this.fps_array.fill(0);
	}

	public resize(width: number, height: number) {
		const size = vec2(width, height);
		if (!this.base_size.equal(size)) {
			this.base_size = size;
			this.size.mults_Number(this.base_size, this.pixel_ratio);
			this.size_changed = true;
		}
	}

	public set_PixelRatio(pixel_ratio: number) {
		if (this.pixel_ratio !== pixel_ratio) {
			this.pixel_ratio = pixel_ratio;
			this.size.mults_Number(this.base_size, this.pixel_ratio);
			this.size_changed = true;
		}
	}

	private fps_array: number[] = new Array(512);
	private fps_pointer: number = 0;
	public render(world: World3D, viewport: Viewport, camera: Camera3D, once: boolean): void {
		const is_transparent = viewport.transparent;

		const time = viewport.get_SceneTree()!.time;
		const cam = camera.get_Camera();
		const cam_world = cam.global_transform;
		const cam_projection = cam.projection;
		const cam_is_orthogonal = cam.is_orthogonal;
		const cam_frustum = cam.get_Frustum();
		const cam_mask = cam.mask;

		let { x, y } = this.size;
		x = Math.max(Math.round(x), 1);
		y = Math.max(Math.round(y), 1);

		RenderServer.set_WorldUniforms(cam_world, cam_projection, cam_is_orthogonal, x, y, time);

		const world_3d = world.get_VisualWorld();
		// RenderServer.use_LightsData(lights_data);
		const sky_texture = world_3d.sky_texture.expect;
		RenderServer.use_SkyTexture(sky_texture);

		// resize
		if (this.size_changed) {
			this.size_changed = false;
			this.canvas.width = x;
			this.canvas.height = y;
			RenderServer.render_state.alloc_RenderBuffer(this.frame_buffer_depth.expect, x, y);
			RenderServer.render_state.alloc_RenderBuffer(this.frame_buffer_color.expect, x, y);
			RenderServer.render_state.alloc_Texture2D(this.frame_buffer_texture.expect, x, y, 0, RenderStateTextureDataFormat.RGBA, undefined);
			RenderServer.resize(x, y);
		}

		// fill up render queue
		let total_objects_count = 0;
		let rendered_objects_count = 0;
		this.render_queue_1.reset();
		for (const mesh of world_3d.meshes) {
			total_objects_count++;
			if (mesh.fill_RenderQueue(this.render_queue_1, cam_mask, cam_frustum)) rendered_objects_count++;
		}

		// draw scene
		RenderServer.render_state.set_ViewportProxy(0, 0, x, y);
		RenderServer.render_state.set_ScissorProxy(0, 0, x, y);
		RenderServer.render_state.set_DepthFuncProxy(RenderServer.render_state.gl.LEQUAL);
		RenderServer.render_state.set_DepthMaskProxy(true);
		RenderServer.render_state.set_CapabilityProxy(RenderServer.render_state.gl.DEPTH_TEST, true);
		RenderServer.render_state.set_CapabilityProxy(RenderServer.render_state.gl.CULL_FACE, true);
		if (is_transparent) {
			RenderServer.render_state.set_ClearColorProxy(0, 0, 0, 0);
			RenderServer.render_state.clear_FrameBuffer(this.frame_buffer.expect, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth);
		}
		else {
			RenderServer.render_state.clear_FrameBuffer(this.frame_buffer.expect, RenderStateFrameBufferPart.Depth);
		}

		// render queue 1 solid
		let draw_calls = 0;
		for (let i = 0; i <= this.render_queue_1.solid_pointer; i++) {
			const geometry = this.render_queue_1.solid_geometry_queue[i];
			const indexed = this.render_queue_1.solid_indexed_queue[i];
			const instance_count = this.render_queue_1.solid_instance_count_queue[i];
			const material = this.render_queue_1.solid_material_queue[i];
			const transform = this.render_queue_1.solid_transform_queue[i];
			const layer = this.render_queue_1.solid_layer_queue[i];
			if (material === undefined) continue;
			const program = material.get_Program(RenderServerShaderPass.Shade);
			if (geometry !== undefined && program !== undefined) {
				material.set_UniformOverride('model_world', transform);
				material.set_UniformOverride('layer', layer);
				material.commit_AllUniformOverride(RenderServerShaderPass.Shade);
				draw_calls++;
				if (indexed) {
					RenderServer.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
				}
				else {
					RenderServer.render_state.draw_Arrays(program, geometry, instance_count);
				}
			}
		}

		if (once) this.render_queue_1.clear();

		// draw sky
		if (!is_transparent) {
			RenderServer.render_state.set_DepthFuncProxy(RenderServer.render_state.gl.LEQUAL);
			RenderServer.render_state.draw_Elements(skydome_program, quad_surface.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
		}

		// blit
		RenderServer.render_state.blit_FrameBuffer(this.frame_buffer.expect, this.frame_buffer_copy.expect, RenderStateFrameBufferPart.Color, RenderStateTextureMagFilter.Nearest, 0, 0, x, y);

		// on screen
		RenderServer.render_state.set_ViewportProxy(0, 0, x, y);
		RenderServer.render_state.set_ScissorProxy(0, 0, x, y);
		RenderServer.render_state.clear_FrameBuffer(undefined, RenderStateFrameBufferPart.Color);
		RenderServer.render_state.active_Texture(this.frame_buffer_texture.expect, 0);
		uniform_colormap_slot.value = viewport.color_map ? 1 : 0;
		uniform_colormap_slot.commit();
		RenderServer.render_state.draw_Elements(onscreen_program, quad_surface.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
		this.ctx.globalCompositeOperation = 'source-over';
		if (is_transparent) {
			this.ctx.clearRect(0, 0, x, y);
		}
		this.ctx.drawImage(RenderServer.canvas, 0, RenderServer.canvas.height - y, x, y, 0, 0, x, y);

		// debug
		if (viewport.debug) {
			const fps = 1 / viewport.get_SceneTree()!.delta;
			this.fps_array[this.fps_pointer++] = fps;
			this.fps_pointer %= this.fps_array.length;
			const scale = 1;
			this.ctx.beginPath();
			this.ctx.moveTo(0, y);
			let _fps = this.fps_array[this.fps_pointer];
			this.ctx.lineTo(0, y - _fps * scale);
			for (let i = 0; i < this.fps_array.length; i++) {
				const id = (this.fps_pointer + i) % this.fps_array.length;
				_fps = this.fps_array[id];
				const _x = x * i / (this.fps_array.length - 1);
				this.ctx.lineTo(_x, y - _fps * scale);
			}
			this.ctx.lineTo(x, y);
			this.ctx.closePath();
			this.ctx.fillStyle = 'rgba(255, 200, 0, 0.5)';
			this.ctx.fill();

			this.ctx.beginPath();
			this.ctx.moveTo(0, y - 60 * scale);
			this.ctx.lineTo(x, y - 60 * scale);
			this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
			this.ctx.lineWidth = 1;
			this.ctx.stroke();

			this.ctx.font = '20px consolas';
			this.ctx.fillStyle = 'white';
			this.ctx.textBaseline = 'bottom';
			this.ctx.globalCompositeOperation = 'difference';
			this.ctx.fillText(`FrameDelta: ${viewport.get_SceneTree()!.delta.toFixed(4)} ms`, 10, y - 8);
			this.ctx.fillText(`RenderObjs: ${rendered_objects_count} / ${total_objects_count}`, 10, y - 30);
			this.ctx.fillText(`Draw Calls: ${draw_calls}`, 10, y - 55);
		}
	}

	public dispose() {
	}
}