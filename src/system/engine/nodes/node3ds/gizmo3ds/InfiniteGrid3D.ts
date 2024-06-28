import { Ray3 } from "@/system/fivepebble/geometries/Ray3";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { MeshInstance3D } from "../visual_instance3ds/geometry3ds/MeshInstance3D";
import { NodeNotification } from "../../Node";
import { Plane3 } from "@/system/fivepebble/geometries/Plane3";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { RenderServer, RenderServerSingleton, RenderServerDefaultTextureType } from "@/system/engine/render_server/RenderServer";
import { RenderServerGeometryAttributeLocation, RenderServerGeometryAttributeLayout } from "@/system/engine/render_server/geometry/RenderServerGeometryDefination";
import { RenderServerRenderMaterial } from "@/system/engine/render_server/material/RenderServerRenderMaterial";
import { MaterialResource, MaterialTextureSamplerStorage } from "@/system/engine/resources/material_resources/MaterialResource";
import type { Texture2DResource } from "@/system/engine/resources/texture_resources/texture2d_resources/Texture2DResource";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { WebGPURenderState } from "@/system/sliverofstraw/WebGPURenderState";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderStateAttributeType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { WebGPURenderStateTextureWrap, WebGPURenderStateTextureFilter } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureSampler";
import { WebGPURenderStateTextureUniformType, WebGPURenderStateTextureUniformSampleType, WebGPURenderStateSamplerUniformType, WebGPURenderStateBufferUniformType } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { RefCacher, ReadonlyRef } from "@/system/utils/RefCounted";

export class InfiniteGrid3D extends MeshInstance3D {

    private readonly _plane: Plane3 = Plane3.create(Vector3.create(0, 1, 0), 0);
    public get plane() { return this._plane.clone(); }
    public set plane(ray: Plane3) {
        this._plane.copy(ray);
    }

    constructor() {
        super();
        this.top_level = true;
        this.block_redundant_before_render_notification = false;
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.InternalBeforeRender: {
                this.update_Visual();
                break;
            }
        }
        super._notification(what);
    }


    private update_Visual() {
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
            this.global_position = point.snap(point, Vector3.create(1, 1, 1));
        }
    }
}

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
	let fade = 1 - smoothstep(100.0, 250.0, distance);
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

export class InfiniteGridMaterial3DResource extends MaterialResource {

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