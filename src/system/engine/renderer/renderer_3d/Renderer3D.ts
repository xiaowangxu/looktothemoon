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
		const is_transparent = material.transparent;
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

	// cache items
	private readonly quad_geometry = QuadGeometry.get(this.config);
	private readonly on_screen_program = OnscreenProgramUniform.get(this.config).onscreen_program;
	private readonly on_screen_uniform_colormap_slot = OnscreenProgramUniform.get(this.config).uniform_colormap_slot;

	private readonly base_position: Vector2 = new Vector2(0, 0);
	private readonly base_size: Vector2 = new Vector2(1, 1);

	constructor(config: Config, canvas: HTMLElement) {
		super(config);

		this.canvas = canvas;
		this.render_server = this.config.render_server;
		this.render_pipeline = new (config.render_3d_pipeline)(this.config, this);

		this.update_Lights();

		this.lights_data.expect.commit_AllLightsData();
	}

	public set_Size(size: Vector2) {
		if (!this.base_size.equal(size)) {
			this.base_size.copy(size);
		}
	}

	public set_Position(position: Vector2) {
		if (!this.base_position.equal(position)) {
			this.base_position.copy(position);
		}
	}

	private render_OnScreen(texture: WebGL2RenderStateTexture | undefined, x: number, y: number, width: number, height: number) {
		this.render_server.render_state.use_FrameBuffer(undefined);
		this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, false);
		const _x = x;
		const _y = this.render_server.canvas.height - height - y;
		this.render_server.render_state.set_ViewportProxy(_x, _y, width, height);
		this.render_server.render_state.set_ScissorProxy(_x, _y, width, height);
			if (texture !== undefined) {
				this.render_server.render_state.active_Texture(texture, 0);
				this.on_screen_uniform_colormap_slot.value = 0;
				this.on_screen_uniform_colormap_slot.commit();
				this.render_server.render_state.draw_Elements(this.on_screen_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
			}
	}

	static #size: Vector2 = new Vector2();

	public render(world: World3D, viewport: Viewport, once: boolean): void {

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

		this.render_pipeline.set_Size(size);

		this.render_pipeline.render(world, viewport, once);
		
		this.render_OnScreen(this.render_pipeline.texture, x, y, width, height);

		if (once) {
			this.render_queue_0.clear();
			if (this.render_queue_1 !== undefined) this.render_queue_1.clear();
		}

		// debug
		if (viewport.debug) {
			const delta = viewport.get_SceneTree()!.delta;
			debug_text.innerHTML = `FPS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${(1 / delta).toFixed(3)}<br>FrameDelta: ${delta.toFixed(4)} ms<br>RenderObjs: ${rendered_objects_count} / ${total_objects_count}<br>Solid Objs: ${this.render_queue_0.solid_pointer + 1 + (this.render_queue_1?.solid_pointer ?? -1) + 1}<br>Trans Objs: ${this.render_queue_0.transparent_pointer + 1 + (this.render_queue_1?.transparent_pointer ?? -1) + 1}<br>Draw Calls: ${'???'}<br>Tweens : ${viewport.get_SceneTree()!.tween_processing_count}`;
		}
	}

	public dispose() {
		this.render_queue_0.dispose();
		if (this.render_queue_1 !== undefined) this.render_queue_1.dispose();
		this.render_pipeline.dispose();
	}
}