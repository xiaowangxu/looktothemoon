import type { Viewport } from "../nodes/Node";
import type { Camera3D } from "../nodes/camera3ds/Camera3D";
import { World3D } from "../worlds/world3ds/World3D";
import { RenderServer, RenderServerDevice, RenderServerPlainColorTexture } from "../render_server/RenderServer";
import { RenderServerLightType } from "../render_server/RenderServerLightData";
import { vec3 } from "../../fivepebble/linear_algebra/Vector3";
import { color } from "../../fivepebble/graphics/Color";
import { Deg2Rad } from "../../fivepebble/Scalar";
import { RenderStateBufferUsage, RenderStateDataType, RenderStateFrameBufferPart, RenderStatePrimitiveType, RenderStateShaderType, RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType, RenderStateUniformType } from "../../sliverofstraw/RenderState";
import { RenderDeviceAttributeBufferView, RenderDeviceIndexAttributeBuffer, RenderDeviceVector2AttributeBuffer } from "../../sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { Vector2, vec2 } from "../../fivepebble/linear_algebra/Vector2";
import { WebGL2RenderStateIntUniformSlot, WebGL2RenderStateTextureUniformSlot } from "../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateUniformSlot";
import type { WebGL2RenderStateFrameBuffer } from "../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateFrameBuffer";
import { Ref } from "../../utils/RefCounted";
import { WebGL2RenderStateFrameBufferAttachmentPoint } from "../../sliverofstraw/webgl2/WebGL2RenderState";
import type { WebGL2RenderStateTexture } from "../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import type { WebGL2RenderStateRenderBuffer } from "../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateRenderBuffer";
import { Matrix4 } from "../../fivepebble/linear_algebra/Matrix4";
import { Matrix3 } from "../../fivepebble/linear_algebra/Matrix3";

const RS = RenderServer;
const lights_data = RenderServer.create_LightsData(64, 64);

function update_Lights() {
	for (let i = 0; i < lights_data.max_light_count; i++) {
		const radius = Math.random() * 4.0;
		lights_data.set_Light(
			i,
			RenderServerLightType.PointLight,
			undefined,
			vec3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.75) * 2),
			vec3(0, 0, 0),
			color(Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2),
			2.0,
			undefined,
			radius,
			radius + Math.random(),
		);
	}

	lights_data.set_Light(2, RenderServerLightType.SpotLight, undefined, vec3(-2, 2, -2.2), vec3(1, -1, 1), color(0, 0, 5), 2.0, 0xffffffff, 45 * Deg2Rad, 0 * Deg2Rad, 3, 7);
	lights_data.set_Light(3, RenderServerLightType.SpotLight, undefined, vec3(0.3, 0.3, 5.0), vec3(0, 0, -1), color(10, 0, 0), 2.0, 0xffffffff, 12 * Deg2Rad, 4 * Deg2Rad, 10, 11);
	lights_data.set_Light(4, RenderServerLightType.SpotLight, undefined, vec3(-0.3, 0.3, 5.0), vec3(0, 0, -1), color(0, 10, 0), 2.0, 0xffffffff, 12 * Deg2Rad, 4 * Deg2Rad, 10, 11);
	lights_data.set_Light(5, RenderServerLightType.SpotLight, undefined, vec3(0.0, -0.15, 5.0), vec3(0, 0, -1), color(0, 0, 10), 2.0, 0xffffffff, 12 * Deg2Rad, 4 * Deg2Rad, 10, 11);

	lights_data.set_Light(0, RenderServerLightType.DirectionalLight, undefined, vec3(-1, -1, -1), undefined, color(0, 0.12, 0));
	lights_data.set_Light(1, RenderServerLightType.DirectionalLight, undefined, vec3(1, 1, 1), undefined, color(0.4, 0.4, 0.4));
}

update_Lights();
lights_data.commit_AllLightsData();

// sky texture indoor
const skybox_texture = RS.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA8, 8, undefined, undefined, undefined, RenderStateTextureMinFilter.Linear, RenderStateTextureMagFilter.Linear).expect();
// RS.render_state.alloc_Texture2D(skybox_texture, 2048, 1024, 0, RenderStateTextureDataFormat.RGBA);
import skybox_url from 'res://studio.png';
import { ImageLoader } from "../loaders/ImageLoader";
import type { RenderServerGeometry } from "../render_server/RenderServerGeometry";
import type { RenderServerMaterial } from "../render_server/RenderServerMaterial";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import { RenderServerShaderPass } from "../render_server/RenderServerShader";
import type { WebGL2RenderStateVertexArray, WebGL2RenderStateVertexArrayView } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateVertexArray";
new ImageLoader().parse(skybox_url).then(res => {
	const image_res = res.expect();
	const { width, height, image_data } = image_res;
	RS.render_state.alloc_Texture2D(skybox_texture, width, height, 0, RenderStateTextureDataFormat.RGBA, image_data.data);
	RS.render_state.generate_Mipmap(skybox_texture);
});

// #region quad surface

const quad_position = new RenderDeviceVector2AttributeBuffer(RS, RenderStateBufferUsage.StaticDraw, [
	/* 0 */vec2(-1, 1),			//   1  0 ------ 2
	/* 1 */vec2(-1, -1),		//   |  |        |
	/* 2 */vec2(1, 1),			//   |  |        |
	/* 3 */vec2(1, -1),			//  -1  1 ------ 3
	/*                        *///     -1 ------ 1
]);
const quad_index = new RenderDeviceIndexAttributeBuffer(RS, RenderStateBufferUsage.StaticDraw, [0, 1, 2, 3]);
const quad_surface = RS.create_Geometry();
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
const quad_vert_shader = RS.render_state.create_Shader(RenderStateShaderType.Vertex, quad_vert_shader_code).expect();

// #endregion

// #region full screen quad

const onscreen_frag_shader_code = `#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D screen;

layout(location = 0) out vec4 o_color;

void main() {
	o_color = vec4(texture(screen, vec2(v_uv.x, v_uv.y)).rgba);
	float r = o_color.r;
	o_color.r = r <= 0.0031308 ? (12.92 * r) : (1.055 * pow(r, 1.0 / 2.4) - 0.055);
	float g = o_color.g;
	o_color.g = g <= 0.0031308 ? (12.92 * g) : (1.055 * pow(g, 1.0 / 2.4) - 0.055);
	float b = o_color.b;
	o_color.b = b <= 0.0031308 ? (12.92 * b) : (1.055 * pow(b, 1.0 / 2.4) - 0.055);
}
`;
const onscreen_frag_shader = RS.render_state.create_Shader(RenderStateShaderType.Fragment, onscreen_frag_shader_code).expect();
const onscreen_program = RS.render_state.create_Program(quad_vert_shader, onscreen_frag_shader).expect();

const uniform_screen_location = RS.render_state.get_ProgramUniformLocation(onscreen_program, 'screen');
const uniform_screen_slot = new WebGL2RenderStateTextureUniformSlot(RS.render_state, onscreen_program, RenderStateUniformType.Tex2D, uniform_screen_location!, undefined, undefined);

// #endregion

// #region sky dome

const skydome_frag_shader_code = `#version 300 es
precision highp float;
precision highp usampler2DArray;
precision highp sampler3D;

const float PI = 3.1415926535;
const float TAU = 6.283185307;
const float EPSILON = 0.00001;

uniform WorldUniforms {
    mat4 camera_world;
    mat4 camera_projection;
    vec2 screen_size;
    float time;
    bool camera_is_orthogonal;
};

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
const skydome_frag_shader = RS.render_state.create_Shader(RenderStateShaderType.Fragment, skydome_frag_shader_code).expect();
const skydome_program = RS.render_state.create_Program(quad_vert_shader, skydome_frag_shader).expect();

const uniform_sky_location = RS.render_state.get_ProgramUniformLocation(skydome_program, 'sky');
const uniform_sky_slot = new WebGL2RenderStateIntUniformSlot(RS.render_state, skydome_program, uniform_sky_location!, RenderServerDevice.SkyTextureUnit);
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

	constructor(solid_preserved: number = 65536, transparent_preserved = 1024) {
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
	private size: Vector2 = new Vector2(1, 1);
	private pixel_ratio: number = 1;

	private size_changed: boolean = true;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.canvas.style.width = '100%';
		this.canvas.style.height = '100%';
		const ctx = this.canvas.getContext('2d');
		if (ctx === null) throw new Error('<Renderer3D> constructor: can not create canvas 2d context');
		this.ctx = ctx;

		const msaa = 2;
		const frame_buffer_depth_tex = RS.render_state.create_RenderBuffer(RenderStateTextureFormat.D32F, msaa).expect();
		RS.render_state.alloc_RenderBuffer(frame_buffer_depth_tex, 1024, 1024);

		const frame_buffer_prez = RS.render_state.create_FrameBuffer().expect();
		this.frame_buffer_prez.value = frame_buffer_prez;
		RS.render_state.set_FrameBufferAttachment(frame_buffer_prez, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_buffer_depth_tex);
		RS.render_state.enable_FrameBuffer(frame_buffer_prez);

		const frame_buffer = RS.render_state.create_FrameBuffer().expect();
		RS.render_state.set_FrameBufferAttachment(frame_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_buffer_depth_tex);
		const frame_buffer_color_tex = RS.render_state.create_RenderBuffer(RenderStateTextureFormat.RGBA32F, msaa).expect();
		RS.render_state.alloc_RenderBuffer(frame_buffer_color_tex, 1024, 1024);
		RS.render_state.set_FrameBufferAttachment(frame_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, frame_buffer_color_tex);
		RS.render_state.set_FrameBufferAttachment(frame_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_buffer_depth_tex);
		RS.render_state.enable_FrameBuffer(frame_buffer);

		this.frame_buffer_depth.value = frame_buffer_depth_tex;
		this.frame_buffer_color.value = frame_buffer_color_tex;
		this.frame_buffer.value = frame_buffer;

		const frame_buffer_copy = RS.render_state.create_FrameBuffer().expect();
		const frame_buffer_texture = RS.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
		RS.render_state.alloc_Texture2D(frame_buffer_texture, 1024, 1024, 0, RenderStateTextureDataFormat.RGBA, undefined);
		RS.render_state.set_FrameBufferAttachment(frame_buffer_copy, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, frame_buffer_texture);
		RS.render_state.enable_FrameBuffer(frame_buffer_copy);

		this.frame_buffer_texture.value = frame_buffer_texture;
		this.frame_buffer_copy.value = frame_buffer_copy;

		this.fps_array.fill(0);

		console.log(this.render_queue_1);
	}

	public resize(width: number, height: number) {
		const size = vec2(width, height);
		if (!this.base_size.equal(size)) {
			this.base_size = size;
			this.size = this.base_size.mult_Number(this.pixel_ratio);
			this.size_changed = true;
		}
	}

	public set_PixelRatio(pixel_ratio: number) {
		if (this.pixel_ratio !== pixel_ratio) {
			this.pixel_ratio = pixel_ratio;
			this.size = this.base_size.mult_Number(this.pixel_ratio);
			this.size_changed = true;
		}
	}

	private fps_array: number[] = new Array(512);
	private fps_pointer: number = 0;
	public render(world: World3D, viewport: Viewport, camera: Camera3D): void {
		const time = viewport.get_SceneTree()!.time;
		const cam = camera.get_Camera();
		const cam_world = cam.global_transform;
		const cam_projection = cam.projection;
		const cam_frustum = cam.get_Frustum();
		const cam_mask = cam.mask;

		RenderServer.set_WorldUniform('camera_world', cam_world.typed_transposed_array_f32);
		RenderServer.set_WorldUniform('camera_projection', cam_projection.typed_transposed_array_f32);
		RenderServer.set_WorldUniform('camera_is_orthogonal', cam.is_orthogonal ? new Int32Array([1]) : new Int32Array([0]));
		RenderServer.set_WorldUniform('time', new Float32Array([time]));

		const world_3d = world.get_VisualWorld();
		RS.use_LightsData(lights_data);
		const sky_texture = world_3d.sky_texture.expect;
		RS.use_SkyTexture(sky_texture);

		const { x, y } = this.size;

		// resize
		if (this.size_changed) {
			this.size_changed = false;
			this.canvas.width = x;
			this.canvas.height = y;
			const rs_size_w = Math.max(RS.canvas.width, x);
			const rs_size_h = Math.max(RS.canvas.height, y);
			RS.render_state.alloc_RenderBuffer(this.frame_buffer_depth.expect, x, y);
			RS.render_state.alloc_RenderBuffer(this.frame_buffer_color.expect, x, y);
			RS.render_state.alloc_Texture2D(this.frame_buffer_texture.expect, x, y, 0, RenderStateTextureDataFormat.RGBA, undefined);
			if (RS.canvas.width !== rs_size_w || RS.canvas.height !== rs_size_h) {
				RS.canvas.width = rs_size_w;
				RS.canvas.height = rs_size_h;
			}
		}

		// fill up render queue
		let total_objects_count = 0;
		let rendered_objects_count = 0;
		this.render_queue_1.reset();
		for (const mesh of world_3d.meshes) {
			total_objects_count++;
			const layer = mesh.layer;
			const bbox = mesh.bbox;
			const visible = mesh.visible;
			if (!visible || (layer & cam_mask) === 0 || !cam_frustum.contain_Box(bbox, false)) continue;
			rendered_objects_count++;
			mesh.fill_RenderQueue(this.render_queue_1);
		}

		// draw scene
		RS.render_state.set_ViewportProxy(0, 0, x, y);
		RS.render_state.set_ScissorProxy(0, 0, x, y);
		RS.render_state.set_DepthFuncProxy(RS.render_state.gl.LEQUAL);
		RS.render_state.set_DepthMaskProxy(true);
		RS.render_state.set_CapabilityProxy(RS.render_state.gl.DEPTH_TEST, true);
		RS.render_state.set_CapabilityProxy(RS.render_state.gl.CULL_FACE, true);
		RS.render_state.clear_FrameBuffer(this.frame_buffer.expect, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth);

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
					RS.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
				}
				else {
					RS.render_state.draw_Arrays(program, geometry, instance_count);
				}
			}
		}

		// // draw sky
		RS.render_state.set_DepthFuncProxy(RS.render_state.gl.LEQUAL);
		RS.render_state.draw_Elements(skydome_program, quad_surface.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);

		// blit
		RS.render_state.blit_FrameBuffer(this.frame_buffer.expect, this.frame_buffer_copy.expect, RenderStateFrameBufferPart.Color, RenderStateTextureMagFilter.Nearest, 0, 0, x, y);

		// on screen
		uniform_screen_slot.texture = this.frame_buffer_texture.expect;
		uniform_screen_slot.commit();
		RS.render_state.set_ViewportProxy(0, 0, x, y);
		RS.render_state.set_ScissorProxy(0, 0, x, y);
		RS.render_state.clear_FrameBuffer(undefined, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth);
		RS.render_state.draw_Elements(onscreen_program, quad_surface.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);

		this.ctx.globalCompositeOperation = 'source-over';
		this.ctx.drawImage(RS.canvas, 0, RS.canvas.height - y, x, y, 0, 0, x, y);

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

	public dispose() {
	}
}