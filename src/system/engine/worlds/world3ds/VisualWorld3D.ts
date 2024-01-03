import { SignalEmitter } from "../../../utils/SignalEmitter";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import type { WebGL2RenderStateFrameBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateFrameBuffer";
import { RenderStateTextureType, RenderStateTextureFormat, RenderStateTextureMinFilter, RenderStateTextureMagFilter, RenderStateTextureDataFormat, RenderStateDataType, RenderStateShaderType, RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { WebGL2RenderStateFrameBufferAttachmentPoint } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { WebGL2RenderStateFloatUniformSlot } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateUniformSlot";
import { RenderDeviceVector2AttributeBuffer, RenderDeviceIndexAttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import type { SceneTree } from "../../SceneTree";
import { Ref, RefArray } from "@/system/utils/RefCounted";
import type { RenderServerGeometry } from "../../render_server/RenderServerGeometry";
import { vec2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import type { RenderServerMaterial } from "../../render_server/RenderServerMaterial";
import { WorldObject } from "../WorldObject";
import { Rid, type RID } from "../../Rid";
import { GeometryResource } from "../../resources/geometry_resources/GeometryResource";
import type { MaterialResource } from "../../resources/material_resources/MaterialResource";
import type { Renderer3DQueue } from "../../renderer/renderer_3d/EditorRenderer3D";
import type { Frustum3 } from "@/system/fivepebble/graphics/Frustum3";
import { ConfiguredObject, type Config } from "../../ConfiguredObject";
import { Cacher } from "@/system/utils/Cacher";
import type { WebGL2RenderStateProgram } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateProgram";
import { RenderServerLightType, RenderServerLightsData } from "../../render_server/RenderServerLightData";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import type { Color } from "@/system/fivepebble/graphics/Color";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Deg2Rad } from "@/system/fivepebble/Scalar";

// #region sky

const SkyQuadGeometry = new Cacher((config: Config) => {
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

const quad_vert_shader_code = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

out vec2 v_uv;

void main() {
	gl_Position = vec4(a_position, 1.0, 1.0);
	v_uv = (a_position + 1.0) / 2.0;
}
`;
const sky_frag_shader_code = `#version 300 es
precision highp float;

const float PI = 3.1415926535;
const float TAU = 6.283185307;
const float EPSILON = 0.00001;

in vec2 v_uv;

uniform float time;

layout(location = 0) out vec4 o_color;

// Optical length at zenith for molecules.
const float rayleigh_zenith_size = 8.4e3;
const float mie_zenith_size = 1.25e3;
const vec3 UP = vec3( 0.0, 1.0, 0.0 );

float henyey_greenstein(float cos_theta, float g) {
	const float k = 0.0795774715459;
	return k * (1.0 - g * g) / (pow(1.0 + g * g - 2.0 * g * cos_theta, 1.5));
}

void main() {
	float theta = (v_uv.x - 0.5) * TAU;
	float gamma = v_uv.y * PI;
	float singamma = sin(gamma);
	vec3 normal = normalize(vec3(singamma * cos(theta), cos(gamma), singamma * sin(theta)));
	
	float rayleigh = 2.0;
	vec4 rayleigh_color = vec4(0.06, 0.28, 0.6, 1.0);
	float mie  = 0.005;
	float mie_eccentricity = 0.8;
	vec4 mie_color = vec4(0.79, 0.5, 0.49, 1.0);	
	float turbidity = 10.0;
	float sun_disk_scale = 1.0;
	vec4 ground_color = vec4(0.1, 0.07, 0.034, 1.0);
	float exposure = 3.0;
	float date = time / 5.0;
	vec3 LIGHT0_DIRECTION = vec3(cos(date), (sin(date) + 1.0) / 2.0, 0.0);
	float LIGHT0_ENERGY = 1.0;
	float LIGHT0_SIZE = 0.025;
	vec3 LIGHT0_COLOR = vec3(1.0, 1.0, 1.0);
	vec3 EYEDIR = normal;

	float zenith_angle = clamp(dot(UP, normalize(LIGHT0_DIRECTION)), -1.0, 1.0 );
	float sun_energy = max(0.0, 1.0 - exp(-((PI * 0.5) - acos(zenith_angle)))) * LIGHT0_ENERGY;
	float sun_fade = 1.0 - clamp(1.0 - exp(LIGHT0_DIRECTION.y), 0.0, 1.0);

	// Rayleigh coefficients.
	float rayleigh_coefficient = rayleigh - ( 1.0 * ( 1.0 - sun_fade ) );
	vec3 rayleigh_beta = rayleigh_coefficient * rayleigh_color.rgb * 0.0001;
	// mie coefficients from Preetham
	vec3 mie_beta = turbidity * mie * mie_color.rgb * 0.000434;

	// Optical length.
	float zenith = acos(max(0.0, dot(UP, EYEDIR)));
	float optical_mass = 1.0 / (cos(zenith) + 0.15 * pow(93.885 - degrees(zenith), -1.253));
	float rayleigh_scatter = rayleigh_zenith_size * optical_mass;
	float mie_scatter = mie_zenith_size * optical_mass;

	// Light extinction based on thickness of atmosphere.
	vec3 extinction = exp(-(rayleigh_beta * rayleigh_scatter + mie_beta * mie_scatter));

	// In scattering.
	float cos_theta = dot(EYEDIR, normalize(LIGHT0_DIRECTION));

	float rayleigh_phase = (3.0 / (16.0 * PI)) * (1.0 + pow(cos_theta * 0.5 + 0.5, 2.0));
	vec3 betaRTheta = rayleigh_beta * rayleigh_phase;

	float mie_phase = henyey_greenstein(cos_theta, mie_eccentricity);
	vec3 betaMTheta = mie_beta * mie_phase;

	vec3 Lin = pow(sun_energy * ((betaRTheta + betaMTheta) / (rayleigh_beta + mie_beta)) * (1.0 - extinction), vec3(1.5));
	// Hack from https://github.com/mrdoob/three.js/blob/master/examples/jsm/objects/Sky.js
	Lin *= mix(vec3(1.0), pow(sun_energy * ((betaRTheta + betaMTheta) / (rayleigh_beta + mie_beta)) * extinction, vec3(0.5)), clamp(pow(1.0 - zenith_angle, 5.0), 0.0, 1.0));

	// Hack in the ground color.
	Lin  *= mix(ground_color.rgb, vec3(1.0), smoothstep(-0.1, 0.1, dot(UP, EYEDIR)));

	// Solar disk and out-scattering.
	float sunAngularDiameterCos = cos(LIGHT0_SIZE * sun_disk_scale);
	float sunAngularDiameterCos2 = cos(LIGHT0_SIZE * sun_disk_scale*0.5);
	float sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos2, cos_theta);
	vec3 L0 = (sun_energy * extinction) * sundisk * LIGHT0_COLOR;

	vec3 color = Lin + L0;
	o_color = vec4(pow(color, vec3(1.0 / (1.2 + (1.2 * sun_fade)))), 1.0);
	o_color.rgb *= exposure;
}
`;

const SkyProgramUniform = new Cacher((config: Config) => {
	const quad_vert_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Vertex, quad_vert_shader_code).expect();
	const quad_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, sky_frag_shader_code).expect();
	const sky_program = config.render_server.render_state.create_Program(quad_vert_shader, quad_frag_shader).expect();
	const uniform_time_location = config.render_server.render_state.get_ProgramUniformLocation(sky_program, 'time');
	const uniform_time_slot = new WebGL2RenderStateFloatUniformSlot(config.render_server.render_state, sky_program, uniform_time_location!, 0);
	return { sky_program, uniform_time_slot };
});

// #endregion

export class VisualWorld3DMesh extends WorldObject {
	public readonly geometry_ref: Ref<RenderServerGeometry> = new Ref();
	protected readonly surface_materials_ref: RefArray<RenderServerMaterial> = new RefArray();
	public readonly material_override_ref: Ref<RenderServerMaterial> = new Ref();

	private is_surface_materials_empty: boolean = false;

	public readonly global_transform: Matrix4 = Matrix4.make_Identity();
	public _visible: boolean = true;
	public layer: number = 0xffffffff;
	public render_queue: number = 0;

	public get visible() {
		return this._visible && !this.is_bbox_empty;
	}

	public get has_geometry() {
		return !this.geometry_ref.is_empty && this.geometry_ref.expect.has_geometry;
	}

	public get bbox() { return this._bbox; }
	private is_bbox_empty: boolean = true;
	private _bbox: Box3 = new Box3();

	constructor(config: Config, rid: RID) {
		super(config, rid);
	}

	private on_geometry_bbox_changed = (bbox: Box3) => {
		this.update_BBox();
	}

	static #zero_vec3: Vector3 = new Vector3(0, 0, 0);

	private update_BBox() {
		if (!this.has_geometry) {
			this._bbox.set(VisualWorld3DMesh.#zero_vec3, VisualWorld3DMesh.#zero_vec3);
		}
		else {
			this._bbox.applys_Matrix4(this.geometry_ref.expect.bbox, this.global_transform);
		}
		this.is_bbox_empty = this._bbox.is_empty;
	}

	private update_SurfaceMaterialsEmpty() {
		const count = this.surface_materials_ref.length;
		for (let i = 0; i < count; i++) {
			if (!this.surface_materials_ref.get(i, true)!.is_empty) {
				this.is_surface_materials_empty = false;
			}
		}
		this.is_surface_materials_empty = true;
	}

	public set_Geometry(geometry: RenderServerGeometry | undefined) {
		if (!this.geometry_ref.is_empty) {
			this.geometry_ref.expect.singal_bbox_changed.disconnect(this.on_geometry_bbox_changed);
		}
		this.geometry_ref.value = geometry;
		if (!this.geometry_ref.is_empty) {
			this.geometry_ref.expect.singal_bbox_changed.connect(this.on_geometry_bbox_changed);
			const surface_count = this.geometry_ref.expect.surface_count;
			if (surface_count === 0) this.surface_materials_ref.clear();
			else {
				this.surface_materials_ref.resize(surface_count);
			}
		}
		else {
			this.surface_materials_ref.clear();
		}
		this.update_SurfaceMaterialsEmpty();
		this.update_BBox();
	}

	public set_SurfaceMaterial(surface_idx: number, material: RenderServerMaterial | undefined) {
		if (this.geometry_ref.is_empty) return;
		const geometry = this.geometry_ref.expect;
		if (surface_idx < 0 || surface_idx >= geometry.surface_count || surface_idx >= this.surface_materials_ref.length) return;
		this.surface_materials_ref.set(surface_idx, material);
		if (material === undefined) this.update_SurfaceMaterialsEmpty();
		else this.is_surface_materials_empty = false;
	}

	public set_MaterialOverride(material: RenderServerMaterial | undefined) {
		this.material_override_ref.value = material;
	}

	public set_GlobalTransform(mat: Matrix4) {
		this.global_transform.copy(mat);
		this.update_BBox();
	}

	public set_Visible(visible: boolean) {
		this._visible = visible;
	}

	public set_Layer(layer: number) {
		this.layer = layer;
	}

	public set_RenderQueue(render_queue: number) {
		this.render_queue = render_queue;
	}

	public clear_Materials() {
		this.material_override_ref.clear();
		this.surface_materials_ref.clear();
	}

	// fill render queue

	public fill_RenderQueue(queue: Renderer3DQueue, mask: number, frustum: Frustum3): boolean {
		if (!this.visible || (this.layer & mask) === 0 || this.geometry_ref.is_empty || !frustum.contain_Box(this.bbox, false)) return false;
		if (this.is_surface_materials_empty) {
			if (this.material_override_ref.is_empty) return false;
			const geometry = this.geometry_ref.expect;
			const vertex_array = geometry.get_Geometry();
			if (vertex_array !== undefined) queue.add(vertex_array, this.material_override_ref.expect, geometry.is_indexed, geometry.instance_count, this.global_transform, this.layer);
		}
		else {
			const surface_materials_count = this.surface_materials_ref.length;
			for (let i = 0; i < surface_materials_count; i++) {
				let material = this.surface_materials_ref.get(i, false);
				if (material === undefined) {
					if (this.material_override_ref.is_empty) continue;
					else material = this.material_override_ref.expect;
				}
				const geometry = this.geometry_ref.expect;
				const vertex_array_view = geometry.get_Surface(i);
				if (vertex_array_view !== undefined) queue.add(vertex_array_view, material, geometry.is_indexed, geometry.instance_count, this.global_transform, this.layer);
			}
		}
		return true;
	}

	public dispose(): void {
		this.geometry_ref.clear();
		this.clear_Materials();
	}
}

export class VisualWorld3DLight extends WorldObject {
	public type: RenderServerLightType = RenderServerLightType.SpotLight;
	public readonly position: Vector3 = new Vector3();
	public readonly direction: Vector3 = new Vector3(0, 0, -1);
	public readonly color: Vector3 = new Vector3(1, 1, 1);
	public intensity: number = 1.0;

	constructor(config: Config, rid: RID) {
		super(config, rid);
	}

	public set_GlobalPosition(position: Vector3) {
		this.position.copy(position);
	}

	// fill light data

	static #color: Color = new Vector4();

	public fill_LightData(lights_data: RenderServerLightsData, idx: number, lid: number): number {
		if (idx >= lights_data.max_light_count) return idx;
		const color = VisualWorld3DLight.#color;
		color.r = this.color.x * this.intensity;
		color.g = this.color.y * this.intensity;
		color.b = this.color.z * this.intensity;
		lights_data.set_Light(idx, this.type, lid, this.position, this.direction, color, 0.0, 0xffffffff, 12 * Deg2Rad, 0 * Deg2Rad, 10, 11)
		return idx;
	}

	public dispose(): void { }
}

export class VisualWorld3D extends ConfiguredObject {
	protected readonly meshes_map: Map<RID, VisualWorld3DMesh> = new Map();
	protected readonly lights_map: Map<RID, VisualWorld3DLight> = new Map();

	public get render_server() { return this.config.render_server; }

	public get meshes() { return this.meshes_map.values(); }
	public get lights() { return this.lights_map.values(); }

	// signal
	public signal_before_render: SignalEmitter<() => void> = new SignalEmitter();

	public readonly sky_texture: Ref<WebGL2RenderStateTexture> = new Ref();
	public readonly sky_frame_buffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
	private readonly sky_quad_geometry: RenderServerGeometry;
	private readonly sky_program: WebGL2RenderStateProgram;
	private readonly sky_uniform_time_slot: WebGL2RenderStateFloatUniformSlot;

	constructor(config: Config) {
		super(config);
		this.sky_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0, undefined, undefined, undefined, RenderStateTextureMinFilter.Linear, RenderStateTextureMagFilter.Linear).expect();
		this.render_server.render_state.alloc_Texture2D(this.sky_texture.expect, 2048, 1024, 0, RenderStateTextureDataFormat.RGBA);
		this.sky_frame_buffer.value = this.render_server.render_state.create_FrameBuffer().expect();
		this.render_server.render_state.set_FrameBufferAttachment(this.sky_frame_buffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.sky_texture.expect);
		this.render_server.render_state.enable_FrameBuffer(this.sky_frame_buffer.expect);
		this.sky_quad_geometry = SkyQuadGeometry.get(this.config);
		const { sky_program, uniform_time_slot } = SkyProgramUniform.get(this.config);
		this.sky_program = sky_program;
		this.sky_uniform_time_slot = uniform_time_slot;

		const rid = this.create_Light();
	}

	public trigger_BeforeRender(scene_tree: SceneTree) {
		this.signal_before_render.trigger();
		this.update_Sky(scene_tree);
	}

	// Sky

	private sky_changed: boolean = true;

	private update_Sky(scene_tree: SceneTree) {
		if (this.sky_changed) {
			this.sky_changed = false;
			this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, false);
			this.render_server.render_state.set_ViewportProxy(0, 0, this.sky_texture.expect.width, this.sky_texture.expect.height);
			this.render_server.render_state.set_ScissorProxy(0, 0, this.sky_texture.expect.width, this.sky_texture.expect.height);
			this.render_server.render_state.use_FrameBuffer(this.sky_frame_buffer.expect);
			this.sky_uniform_time_slot.value = scene_tree.time;
			this.sky_uniform_time_slot.commit();
			this.render_server.render_state.draw_Elements(this.sky_program, this.sky_quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
		}
	}

	// Mesh

	public create_Mesh(): RID {
		const rid = Rid();
		const mesh = new VisualWorld3DMesh(this.config, rid);
		this.meshes_map.set(rid, mesh);
		return rid;
	}

	protected get_Mesh(rid: RID): VisualWorld3DMesh | undefined {
		return this.meshes_map.get(rid);
	}

	public free_Mesh(rid: RID) {
		const instance = this.get_Mesh(rid);
		if (instance === undefined) return;
		instance.dispose();
		this.meshes_map.delete(rid);
	}

	public set_MeshGeometry(rid: RID, geometry: GeometryResource | undefined) {
		const instance = this.get_Mesh(rid);
		if (instance) {
			if (geometry === undefined) {
				instance.set_Geometry(undefined);
			}
			else {
				instance.set_Geometry(geometry.geometry);
			}
		}
	}

	public set_MeshSurfaceMaterial(rid: RID, surface_idx: number, material: MaterialResource | undefined) {
		const instance = this.get_Mesh(rid);
		if (instance) {
			if (material === undefined) {
				instance.set_SurfaceMaterial(surface_idx, undefined);
			}
			else {
				instance.set_SurfaceMaterial(surface_idx, material.material);
			}
		}
	}

	public set_MeshMaterialOverride(rid: RID, material: MaterialResource | undefined) {
		const instance = this.get_Mesh(rid);
		if (instance) {
			if (material === undefined) {
				instance.set_MaterialOverride(undefined);
			}
			else {
				instance.set_MaterialOverride(material.material);
			}
		}
	}

	public set_MeshGlobalTransform(rid: RID, transform: Matrix4) {
		const instance = this.get_Mesh(rid);
		if (instance) {
			instance.set_GlobalTransform(transform);
		}
	}

	public set_MeshVisibility(rid: RID, visible: boolean) {
		const instance = this.get_Mesh(rid);
		if (instance) {
			instance.set_Visible(visible);
		}
	}

	public set_MeshLayer(rid: RID, layer: number) {
		const instance = this.get_Mesh(rid);
		if (instance) {
			instance.set_Layer(layer);
		}
	}

	public set_MeshRenderQueue(rid: RID, render_queue: number) {
		const instance = this.get_Mesh(rid);
		if (instance) {
			instance.set_RenderQueue(render_queue);
		}
	}

	// Light

	public create_Light(): RID {
		const rid = Rid();
		const mesh = new VisualWorld3DLight(this.config, rid);
		this.lights_map.set(rid, mesh);
		return rid;
	}

	protected get_Light(rid: RID): VisualWorld3DLight | undefined {
		return this.lights_map.get(rid);
	}

	public free_Light(rid: RID) {
		const instance = this.get_Light(rid);
		if (instance === undefined) return;
		instance.dispose();
		this.lights_map.delete(rid);
	}

	public set_LightGlobalPosition(rid: RID, position: Vector3) {
		const instance = this.get_Light(rid);
		if (instance) {
			instance.set_GlobalPosition(position);
		}
	}

	public dispose() {
		for (const mesh of this.meshes) {
			mesh.dispose();
		}
		for (const light of this.lights) {
			light.dispose();
		}
		this.meshes_map.clear();
		this.lights_map.clear();
	}
}