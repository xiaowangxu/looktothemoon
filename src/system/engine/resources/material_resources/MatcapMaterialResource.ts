import { WebGPURenderState } from "@/system/sliverofstraw/WebGPURenderState";
import { WebGPURenderStateBufferUniformType, WebGPURenderStateSamplerUniformType, WebGPURenderStateTextureUniformSampleType, WebGPURenderStateTextureUniformType } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { MaterialResource, MaterialTextureSamplerStorage } from "./MaterialResource";
import { ReadonlyRef, RefCacher } from "@/system/utils/RefCounted";
import { RenderServerMaterial, RenderServerMaterialPass } from "../../render_server/material/RenderServerMaterial";
import { RenderServerGeometryAttributeLayout, RenderServerGeometryAttributeLocation } from "../../render_server/geometry/RenderServerGeometryDefination";
import { WebGPURenderStateAttributeType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { RenderServer, RenderServerDefaultTextureType, RenderServerSingleton } from "../../render_server/RenderServer";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { WebGPURenderStateTextureFilter } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureSampler";
import type { Texture2DResource } from "../texture_resources/texture2d_resources/Texture2DResource";

const MatcapMaterialResourceUniformLayout = new RefCacher(() => {
	const layout = RenderServer.render_state.create_UniformLayout();
	layout.add_BufferUniform(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 0, false);
	layout.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.Float, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 1);
	layout.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.Float, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 2);
	layout.add_Sampler(WebGPURenderStateSamplerUniformType.Filter, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 3);
	return layout;
});

const MatcapMaterialSolidPipelineCacheSet = new RefCacher(() => {
	const pipeline_cache_set = RenderServerMaterial.create_PipelineCacheSet(
		// attributes
		[
			['position', RenderServerGeometryAttributeLocation.Position, WebGPURenderStateAttributeType.Vector3],
			['normal', RenderServerGeometryAttributeLocation.Normal, WebGPURenderStateAttributeType.Vector3],
			['uv', RenderServerGeometryAttributeLocation.Uv, WebGPURenderStateAttributeType.Vector2],
		],
		// uniforms
		`struct Uniform {
	color: vec4f,
	has_normal: u32,
};

@group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(0) var<uniform> mat_uniform: Uniform;
@group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(1) var mat_uniform_normal_tex: texture_2d<f32>; 
@group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(2) var mat_uniform_matcap_tex: texture_2d<f32>; 
@group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(3) var mat_uniform_sampler: sampler;
`,
		// vertex code
		`	var _world = instance_uniform.transform * vec4(attri.position, 1.0f);
	var _world_in_view = world_env_uniform_camera_matrix.camera_view * _world;
	out.position = world_env_uniform_camera_matrix.camera_proj * _world_in_view;
	out.vertex_view = _world_in_view.xyz;
	out.normal = world_env_uniform_camera_matrix.camera_norview * instance_uniform.normal * attri.normal;
	out.uv = attri.uv;
	if bool(world_env_uniform_params.orthogonal) { out.lookat = vec3f(0.0f, 0.0f, 1.0f); } else { out.lookat = -normalize(_world_in_view.xyz); }`,
		// varys
		`	@builtin(position) position: vec4f,
	@location(0) vertex_view: vec3f,
	@location(1) normal: vec3f,
	@location(2) lookat: vec3f,
	@location(3) uv: vec2f,`,
		// fragment code
		`	var normal = normalize(vary.normal);
	var normal_sample = normalize(tbn * (textureSample(mat_uniform_normal_tex, mat_uniform_sampler, vary.uv).xyz * 2.0 - 1.0));
	var matcap_uv = matcap_uv_compute(vary.lookat, normal_sample);
	var color = textureSample(mat_uniform_matcap_tex, mat_uniform_sampler, matcap_uv) * mat_uniform.color;`,
		// custom
		`fn matcap_uv_compute(I: vec3f, N: vec3f) -> vec2f {
	/* Quick creation of an orthonormal basis */
	var a: f32 = 1.0 / (1.0 + I.z);
	var b: f32 = -I.x * I.y * a;
	var b1: vec3f = vec3f(1.0 - I.x * I.x * a, b, -I.x);
	var b2: vec3f = vec3f(b, 1.0 - I.y * I.y * a, -I.y);
	var matcap_uv: vec2f = vec2f(dot(b1, N), dot(b2, N));
	return matcap_uv * 0.496 + 0.5;
}`,
		MatcapMaterialResourceUniformLayout.get(),
		RenderServerGeometryAttributeLayout,
		{}
	);
	return pipeline_cache_set;
});

export class MatcapMaterialResource extends MaterialResource {

	static UniformMemoryLayout = WebGPURenderState.RenderStateMemoryLayout({
		type: 'struct',
		members: [
			WebGPURenderStateBufferUniformType.Vector4,
			WebGPURenderStateBufferUniformType.Bool,
		],
	} as const);

	private readonly uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(MatcapMaterialResourceUniformLayout.get()).expect());
	private readonly uniform_buffer_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, MatcapMaterialResource.UniformMemoryLayout.size, false).expect());
	private readonly uniform_array_buffer = new ArrayBuffer(MatcapMaterialResource.UniformMemoryLayout.size);

	private _color = Vector4.create(1.0, 1.0, 1.0, 1.0);
	public get color() { return this._color.clone(); }
	public set color(color: Vector4) {
		if (!this._color.equal(color)) {
			this._color.copy(color);
			this.render_server_material.is_transparent = this._color.w < 1;
			this.update_UniformBuffer();
		}
	}

	private _has_normal: boolean = false;
	private readonly normal_texture_storage = new MaterialTextureSamplerStorage<Texture2DResource>(this.uniform_group_ref.expect, 1, undefined, RenderServerDefaultTextureType.White);
	public get normal_texture() { return this.normal_texture_storage.get(); }
	public set normal_texture(texture: Texture2DResource | undefined) {
		if (this.normal_texture_storage.set(texture)) {
			this._has_normal = !this.normal_texture_storage.is_empty;
			this.update_UniformBuffer();
		}
	}

	private readonly matcap_texture_storage = new MaterialTextureSamplerStorage<Texture2DResource>(this.uniform_group_ref.expect, 2, undefined, RenderServerDefaultTextureType.White);
	public get matcap_texture() { return this.matcap_texture_storage.get(); }
	public set matcap_texture(texture: Texture2DResource | undefined) { this.matcap_texture_storage.set(texture); }

	constructor() {
		super();
		this.uniform_group_ref.expect.set_BufferUniform(0, this.uniform_buffer_ref.expect);
		this.uniform_group_ref.expect.set_Sampler(3, RenderServer.get_TextureSampler(undefined, undefined, undefined, WebGPURenderStateTextureFilter.Linear, WebGPURenderStateTextureFilter.Linear, WebGPURenderStateTextureFilter.Linear));
		this.render_server_material.add_UniformBuffer(this.uniform_buffer_ref.expect, this.uniform_array_buffer);
		MatcapMaterialSolidPipelineCacheSet.get().set_RenderServerMaterialPipelineCaches(this.render_server_material, this.uniform_group_ref.expect);
		this.update_UniformBuffer();
	}

	private update_UniformBuffer() {
		const float32array0 = new Float32Array(this.uniform_array_buffer, MatcapMaterialResource.UniformMemoryLayout.members[0].offset);
		float32array0[0] = this._color.x;
		float32array0[1] = this._color.y;
		float32array0[2] = this._color.z;
		float32array0[3] = this._color.w;
		const uint32array0 = new Uint32Array(this.uniform_array_buffer, MatcapMaterialResource.UniformMemoryLayout.members[1].offset);
		uint32array0[0] = this._has_normal ? 1 : 0;
		this.render_server_material.trigger_UniformBufferChange(0);
	}

	protected dispose(): void {
		super.dispose();
	}
}