import { Ray3 } from "@/system/fivepebble/geometries/Ray3";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { MeshInstance3D } from "../visual_instance3ds/geometry3ds/MeshInstance3D";
import { NodeNotification } from "../../Node";
import { Plane3 } from "@/system/fivepebble/geometries/Plane3";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { RenderServer, RenderServerSingleton } from "@/system/engine/render_server/RenderServer";
import { RenderServerGeometryAttributeLocation, RenderServerGeometryAttributeLayout, RenderServerGeometryAttributeLayoutBuffer } from "@/system/engine/render_server/geometry/RenderServerGeometryDefination";
import { RenderServerRenderMaterial } from "@/system/engine/render_server/material/RenderServerRenderMaterial";
import { MaterialResource } from "@/system/engine/resources/material_resources/MaterialResource";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { WebGPURenderState } from "@/system/sliverofstraw/WebGPURenderState";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderStateAttributeType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { WebGPURenderStateBufferUniformType } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { RefCacher, ReadonlyRef, Ref } from "@/system/utils/RefCounted";
import { Color } from "@/system/fivepebble/graphics/Color";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { Geometry3DResource } from "@/system/engine/resources/geometry_resources/geometry3d_resources/Geometry3DResource";
import type { ResourceSetOptionAllAtOnce } from "@/system/engine/resources/Resource";
import { WebGPURenderElementVector3Buffer, WebGPURenderElementVector2Buffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementVectorBuffer";
import { WebGPURenderStatePrimitiveType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";

const GridGeometry = new RefCacher(() => {
	const grid_geo = new GridGeometry3DResource();
	grid_geo.option = {
		width: 1000,
		depth: 1000,
		width_segments: 1000,
		depth_segments: 1000,
	};
	return grid_geo;
});

const GridMaterial = new RefCacher(() => {
	const grid_material = new InfiniteGridMaterial3DResource();
	grid_material.color = Color.create(1, 1, 1, 0.05);
	return grid_material;
});

export class InfiniteGrid3D extends MeshInstance3D {

	static #tmp_matrix3_0 = Matrix3.new;
	static #tmp_matrix4_0 = Matrix4.new;
	static #tmp_vector3_0 = Vector3.new;
	static #tmp_vector3_1 = Vector3.new;

	private readonly _plane: Plane3 = Plane3.create(Vector3.create(0, 1, 0), 0);
	public get plane() { return this._plane.clone(); }
	public set plane(plane: Plane3) {
		if (!this._plane.equal(plane)) {
			this._plane.copy(plane);
			this._plane.project_Point(this._center, this._center);
			this.update_Transform();
		}
	}

	private readonly _center: Vector3 = Vector3.create(0, 0, 0);
	public get center() { return this._center.clone(); }
	public set center(center: Vector3) {
		const _center = this._plane.project_Point(center, InfiniteGrid3D.#tmp_vector3_0);
		if (!this._center.equal(_center)) {
			this._center.copy(_center);
			this.update_Transform();
		}
	}

	private readonly _up: Vector3 = Vector3.create(0, 0, -1);
	public get up() { return this._up.clone(); }
	public set up(up: Vector3) {
		const _up = InfiniteGrid3D.#tmp_vector3_0.normalize(up);
		if (!this._up.equal(_up)) {
			this._up.copy(_up);
			this.update_Transform();
		}
	}

	constructor() {
		super();
		this.top_level = true;
		this.block_redundant_before_render_notification = false;
		this.block_input = true;
		this.block_physics_process = true;
		this.block_process = true;
		this.geometry = GridGeometry.get();
		this.material = GridMaterial.get();

		// const red = 0xDA2530FF;
		// const green = 0x1BAF4AFF;
		// const blue = 0x0A4DFFFF;
		// const line_x_geo = new PolyLineGeometry3DResource();
		// {
		// 	const line_x = new MeshInstance3D();
		// 	const line_x_mat = new PolyLineMaterial3DResource();
		// 	line_x_mat.color = Color.color8code(red);
		// 	line_x.material = line_x_mat;
		// 	line_x.geometry = line_x_geo;
		// 	// line_x.local_rotation = Euler.create(0, 0, Pi/2);
		// 	this.add_Child(line_x);
		// }
		// {
		// 	const line_x = new MeshInstance3D();
		// 	const line_x_mat = new PolyLineMaterial3DResource();
		// 	line_x_mat.color = Color.color8code(green);
		// 	line_x.material = line_x_mat;
		// 	line_x.geometry = line_x_geo;
		// 	line_x.local_rotation = Euler.create(0, 0, Pi / 2);
		// 	this.add_Child(line_x);
		// }
		// {
		// 	const line_x = new MeshInstance3D();
		// 	const line_x_mat = new PolyLineMaterial3DResource();
		// 	line_x_mat.color = Color.color8code(blue);
		// 	line_x.material = line_x_mat;
		// 	line_x.geometry = line_x_geo;
		// 	line_x.local_rotation = Euler.create(0, -Pi / 2, 0);
		// 	this.add_Child(line_x);
		// }

	}

	public _notification(what: NodeNotification): void {
		switch (what) {
			case NodeNotification.InternalBeforeRender: {
				this.update_Transform();
				break;
			}
		}
		super._notification(what);
	}

	private update_Transform() {
		this.global_transform = InfiniteGrid3D.#tmp_matrix4_0.set_BasisPosition(
			InfiniteGrid3D.#tmp_matrix3_0.set_LookAt(this._plane.normal, this._up),
			this._center,
		);
		// move
		const camera = this.get_SceneTree()?.get_RenderingViewport()?.get_Camera3D();
		if (camera === undefined) {
			this.local_visible = false;
			return;
		}
		const ray = camera.get_Camera().project_Ray(Vector2.new, undefined, Ray3.new);
		const point = this.plane.intersect_UncappedRay(ray, Vector3.new);
		if (point === undefined) {
			this.local_visible = false;
			return;
		}
		else {
			this.local_visible = true;
			const center = this.to_Local(this._center, InfiniteGrid3D.#tmp_vector3_0);
			const local = this.to_Local(point, InfiniteGrid3D.#tmp_vector3_1);
			local.sub(local, center);
			local.snap(local, Vector3.create(1, 1, 1));
			local.z = 0;
			local.add(center, local);
			this.global_position = this.to_Global(local, center);
		}
	}
}

//#region geometry

type GridGeometry3DResourceOption = {
	width?: number | undefined;
	depth?: number | undefined;
	width_segments?: number | undefined;
	depth_segments?: number | undefined;
};

class GridGeometry3DResource extends Geometry3DResource implements ResourceSetOptionAllAtOnce<GridGeometry3DResourceOption> {

	private readonly position_normal_buffer_ref: Ref<WebGPURenderElementVector3Buffer> = new Ref();
	private readonly uv_buffer_ref: Ref<WebGPURenderElementVector2Buffer> = new Ref();

	protected _width: number = 10;
	protected _depth: number = 10;
	protected _width_segments: number = 10;
	protected _depth_segments: number = 10;

	public get width() { return this._width; }
	public get depth() { return this._depth; }
	public get width_segments() { return this._width_segments; }
	public get depth_segments() { return this._depth_segments; }

	public set width(width: number) {
		width = Math.max(width, 0);
		if (this._width !== width) {
			this._width = width;
			this.build();
		}
	}
	public set depth(depth: number) {
		depth = Math.max(depth, 0);
		if (this._depth !== depth) {
			this._depth = depth;
			this.build();
		}
	}
	public set width_segments(width_segments: number) {
		width_segments = Math.max(Math.floor(width_segments), 1);
		if (this._width_segments !== width_segments) {
			this._width_segments = width_segments;
			this.build();
		}
	}
	public set depth_segments(depth_segments: number) {
		depth_segments = Math.max(Math.floor(depth_segments), 1);
		if (this._depth_segments !== depth_segments) {
			this._depth_segments = depth_segments;
			this.build();
		}
	}

	public set option(option: GridGeometry3DResourceOption) {
		let changed = false;
		if (option.width !== undefined) {
			const width = Math.max(option.width, 0);
			if (this._width !== width) {
				changed = true;
				this._width = width;
			}
		}
		if (option.depth !== undefined) {
			const depth = Math.max(option.depth, 0);
			if (this._depth !== depth) {
				changed = true;
				this._depth = depth;
			}
		}
		if (option.width_segments !== undefined) {
			const width_segments = Math.max(Math.floor(option.width_segments), 1);
			if (this._width_segments !== width_segments) {
				changed = true;
				this._width_segments = width_segments;
			}
		}
		if (option.depth_segments !== undefined) {
			const depth_segments = Math.max(Math.floor(option.depth_segments), 1);
			if (this._depth_segments !== depth_segments) {
				changed = true;
				this._depth_segments = depth_segments;
			}
		}
		if (changed) {
			this.build();
		}
	}

	constructor() {
		super();
		this.build();
	}

	public build() {
		const width = this.width;
		const depth = this.depth;
		const width_segments = this.width_segments;
		const depth_segments = this.depth_segments;

		const vertex_count = (width_segments + depth_segments + 2) * 2;

		const position_normal_buffer = new WebGPURenderElementVector3Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count * 2);
		const uv_buffer = new WebGPURenderElementVector2Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count);

		const width_half = width / 2;
		const depth_half = depth / 2;

		const width_segments_1 = width_segments + 1;
		const depth_segments_1 = depth_segments + 1;

		const segment_width = width / width_segments;
		const segment_depth = depth / depth_segments;

		let vertex_idx = 0;
		
		for (let iy = 0; iy < depth_segments_1; iy++) {
			const y = iy * segment_depth - depth_half;
			const uv_y = 1 - (iy / depth_segments);
			let vec6_idx = vertex_idx * 6;
			let vec2_idx = vertex_idx * 2;
			// position normal
			position_normal_buffer.data[vec6_idx + 0] = -width_half;
			position_normal_buffer.data[vec6_idx + 1] = -y;
			position_normal_buffer.data[vec6_idx + 2] = 0;
			position_normal_buffer.data[vec6_idx + 3] = 0;
			position_normal_buffer.data[vec6_idx + 4] = 0;
			position_normal_buffer.data[vec6_idx + 5] = -1;
			// uv
			uv_buffer.data[vec2_idx + 0] = 1;
			uv_buffer.data[vec2_idx + 1] = uv_y;
			vertex_idx++;
			vec6_idx = vertex_idx * 6;
			vec2_idx = vertex_idx * 2;
			// position normal
			position_normal_buffer.data[vec6_idx + 0] = width_half;
			position_normal_buffer.data[vec6_idx + 1] = -y;
			position_normal_buffer.data[vec6_idx + 2] = 0;
			position_normal_buffer.data[vec6_idx + 3] = 0;
			position_normal_buffer.data[vec6_idx + 4] = 0;
			position_normal_buffer.data[vec6_idx + 5] = -1;
			// uv
			uv_buffer.data[vec2_idx + 0] = 0;
			uv_buffer.data[vec2_idx + 1] = uv_y;
			vertex_idx++;
		}

		for (let ix = 0; ix < width_segments_1; ix++) {
			const x = ix * segment_width - width_half;
			const uv_x = ix / width_segments;
			let vec6_idx = vertex_idx * 6;
			let vec2_idx = vertex_idx * 2;
			// position normal
			position_normal_buffer.data[vec6_idx + 0] = -x;
			position_normal_buffer.data[vec6_idx + 1] = -depth_half;
			position_normal_buffer.data[vec6_idx + 2] = 0;
			position_normal_buffer.data[vec6_idx + 3] = 0;
			position_normal_buffer.data[vec6_idx + 4] = 0;
			position_normal_buffer.data[vec6_idx + 5] = -1;
			// uv
			uv_buffer.data[vec2_idx + 0] = uv_x;
			uv_buffer.data[vec2_idx + 1] = 0;
			vertex_idx++;
			vec6_idx = vertex_idx * 6;
			vec2_idx = vertex_idx * 2;
			// position normal
			position_normal_buffer.data[vec6_idx + 0] = -x;
			position_normal_buffer.data[vec6_idx + 1] = depth_half;
			position_normal_buffer.data[vec6_idx + 2] = 0;
			position_normal_buffer.data[vec6_idx + 3] = 0;
			position_normal_buffer.data[vec6_idx + 4] = 0;
			position_normal_buffer.data[vec6_idx + 5] = -1;
			// uv
			uv_buffer.data[vec2_idx + 0] = uv_x;
			uv_buffer.data[vec2_idx + 1] = 1;
			vertex_idx++;
		}

		position_normal_buffer.commit(true);
		uv_buffer.commit(true);

		// build geometry
		this.position_normal_buffer_ref.value = position_normal_buffer;
		this.uv_buffer_ref.value = uv_buffer;

		this.render_server_geometry.clear_Geometry();
		this.render_server_geometry.set_VertexLength(vertex_count);
		this.render_server_geometry.set_PrimitiveType(WebGPURenderStatePrimitiveType.Lines);
		this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.PositionNormal, this.position_normal_buffer_ref.expect.buffer);
		this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Uv, this.uv_buffer_ref.expect.buffer);
		Geometry3DResource.$tmp_box3_for_bbox.min.set(-width_half, 0, -depth_half);
		Geometry3DResource.$tmp_box3_for_bbox.max.set(width_half, 0, depth_half);
		this.render_server_geometry.set_BBox(Geometry3DResource.$tmp_box3_for_bbox);
	}

	protected dispose(): void {
		this.position_normal_buffer_ref.clear();
		this.uv_buffer_ref.clear();
		super.dispose();
	}
}

//#endregion

//#region material

const InfiniteGridMaterial3DResourceUniformLayout = new RefCacher(() => {
	const layout = RenderServer.render_state.create_UniformLayout();
	layout.add_BufferUniform(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 0, false);
	// layout.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.Float, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 1);
	// layout.add_Sampler(WebGPURenderStateSamplerUniformType.Filter, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 2);
	return layout;
});

const InfiniteGridMaterial3DResourcePipelineCacheSet = new RefCacher(() => {
	const pipeline_cache_set = RenderServerRenderMaterial.create_PipelineCacheSet(
		// attributes
		[
			['position', RenderServerGeometryAttributeLocation.Position, WebGPURenderStateAttributeType.Vector3],
			['normal', RenderServerGeometryAttributeLocation.Normal, WebGPURenderStateAttributeType.Vector3],
			['uv', RenderServerGeometryAttributeLocation.Uv, WebGPURenderStateAttributeType.Vector2],
		],
		// uniforms
		`struct Uniform {
	color: vec4f,
};

@group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(0) var<uniform> mat_uniform: Uniform;
// @group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(1) var mat_albedo_tex: texture_2d<f32>;
// @group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(2) var mat_sampler: sampler;
`,
		// vertex code
		`	var _instance_transform = instance_uniform.transform * instance_transform;
	var _world = _instance_transform * vec4(attri.position, 1.0f);
	var _world_in_view = world_env_uniform_camera_matrix.camera_view * _world;
	out.position = world_env_uniform_camera_matrix.camera_proj * _world_in_view;
	out.vertex_view = _world_in_view.xyz;
	out.normal = world_env_uniform_camera_matrix.camera_norview * instance_uniform.normal * instance_normal * attri.normal;
	out.uv = attri.uv;
	out.color = instance_color;
	out.world = _world.xyz;
	out.center = _instance_transform[3].xyz;
	if bool(world_env_uniform_params.orthogonal) { out.lookat = vec3f(0.0f, 0.0f, 1.0f); } else { out.lookat = -_world_in_view.xyz; }`,
		// varys
		`	@builtin(position) position: vec4f,
	@location(0) vertex_view: vec3f,
	@location(1) normal: vec3f,
	@location(2) lookat: vec3f,
	@location(3) uv: vec2f,
	@location(4) center: vec3f,
	@location(5) world: vec3f,
	@location(6) color: vec4f,`,
		// fragment code
		`let normal = normalize(vary.normal);
	let lookat = normalize(vary.lookat);
	let normal_dot = smoothstep(0.05, 0.075, abs(dot(normal, lookat)));
	let distance = distance(vary.center, vary.world);
	let fade = 1 - smoothstep(250.0, 500.0, distance);
	var color = mat_uniform.color * vary.color;
	color.a = clamp(color.a * fade * normal_dot, 0, 1);`,
		// custom
		undefined,
		InfiniteGridMaterial3DResourceUniformLayout.get(),
		RenderServerGeometryAttributeLayout,
		{
			builtin_func: {
				position_to_screen_uv: true,
			}
		}
	);
	return pipeline_cache_set;
});

class InfiniteGridMaterial3DResource extends MaterialResource {

	static UniformMemoryLayout = WebGPURenderState.RenderStateMemoryLayout({
		type: 'struct',
		members: [
			WebGPURenderStateBufferUniformType.Vector4,
		],
	} as const);

	private readonly uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(InfiniteGridMaterial3DResourceUniformLayout.get()).expect());
	private readonly uniform_buffer_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, InfiniteGridMaterial3DResource.UniformMemoryLayout.size, false).expect());
	private readonly uniform_array_buffer = new ArrayBuffer(InfiniteGridMaterial3DResource.UniformMemoryLayout.size);

	private _color = Vector4.create(1.0, 1.0, 1.0, 1.0);
	public get color() { return this._color.clone(); }
	public set color(color: Vector4) {
		if (!this._color.equal(color)) {
			this._color.copy(color);
			this.render_server_material.is_transparent = this._color.w < 1;
			this.update_UniformBuffer();
		}
	}

	// private readonly albedo_texture_storage = new MaterialTextureSamplerStorage<Texture2DResource>(this.uniform_group_ref.expect, 1, undefined, RenderServerDefaultTextureType.White, 2, RenderServer.get_TextureSampler(
	// 	WebGPURenderStateTextureWrap.Clamp, WebGPURenderStateTextureWrap.Clamp, WebGPURenderStateTextureWrap.Clamp,
	// 	WebGPURenderStateTextureFilter.Linear, WebGPURenderStateTextureFilter.Linear, WebGPURenderStateTextureFilter.Linear
	// ));
	// public get albedo_texture() { return this.albedo_texture_storage.get(); }
	// public set albedo_texture(texture: Texture2DResource | undefined) { this.albedo_texture_storage.set(texture); }

	constructor() {
		super();
		this.uniform_group_ref.expect.set_BufferUniform(0, this.uniform_buffer_ref.expect);
		this.render_server_material.add_UniformBuffer(this.uniform_buffer_ref.expect, this.uniform_array_buffer);
		InfiniteGridMaterial3DResourcePipelineCacheSet.get().set_RenderServerMaterialPipelineCaches(this.render_server_material, this.uniform_group_ref.expect);
		this.update_UniformBuffer();
	}

	private update_UniformBuffer() {
		const float32array0 = new Float32Array(this.uniform_array_buffer);
		float32array0[0] = this._color.x;
		float32array0[1] = this._color.y;
		float32array0[2] = this._color.z;
		float32array0[3] = this._color.w;
		this.render_server_material.trigger_UniformBufferChange(0);
	}

	protected dispose(): void {
		this.uniform_group_ref.clear();
		this.uniform_buffer_ref.clear();
		super.dispose();
	}
}

//#endregion