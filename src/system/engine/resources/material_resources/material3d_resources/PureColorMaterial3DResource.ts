import { WebGPURenderState } from "@/system/sliverofstraw/WebGPURenderState";
import { WebGPURenderStateBufferUniformType, WebGPURenderStateSamplerUniformType, WebGPURenderStateTextureUniformSampleType, WebGPURenderStateTextureUniformType } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { MaterialResource, MaterialTextureSamplerStorage } from "../MaterialResource";
import { ReadonlyRef, RefCacher } from "@/system/utils/RefCounted";
import { RenderServerRenderMaterial } from "../../../render_server/material/RenderServerRenderMaterial";
import { RenderServerGeometryAttributeLayout, RenderServerGeometryAttributeLocation } from "../../../render_server/geometry/RenderServerGeometryDefination";
import { WebGPURenderStateAttributeType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { RenderServer, RenderServerDefaultTextureType, RenderServerSingleton } from "../../../render_server/RenderServer";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import type { Texture2DResource } from "../../texture_resources/texture2d_resources/Texture2DResource";
import { WebGPURenderStateTextureFilter, WebGPURenderStateTextureWrap } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureSampler";

const PureColorMaterial3DUniformLayout = new RefCacher(() => {
	const layout = RenderServer.render_state.create_UniformLayout();
	layout.add_BufferUniform(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 0, false);
	layout.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.Float, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 1);
	layout.add_Sampler(WebGPURenderStateSamplerUniformType.Filter, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 2);
	return layout;
});

const PureColorMaterial3DSolidPipelineCacheSet = new RefCacher(() => {
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
@group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(1) var mat_albedo_tex: texture_2d<f32>;
@group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(2) var mat_sampler: sampler;
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
	if bool(world_env_uniform_params.orthogonal) { out.lookat = vec3f(0.0f, 0.0f, 1.0f); } else { out.lookat = -normalize(_world_in_view.xyz); }`,
		// varys
		`	@builtin(position) position: vec4f,
	@location(0) vertex_view: vec3f,
	@location(1) normal: vec3f,
	@location(2) lookat: vec3f,
	@location(3) uv: vec2f,
	@location(4) color: vec4f,`,
		// fragment code
		`	var normal = normalize(vary.normal);
	var color = textureSample(mat_albedo_tex, mat_sampler, vary.uv) * mat_uniform.color * vary.color;`,
		// custom
		undefined,
		PureColorMaterial3DUniformLayout.get(),
		RenderServerGeometryAttributeLayout,
		{
			builtin_func: {
				position_to_screen_uv: true,
			}
		}
	);
	return pipeline_cache_set;
});

export class PureColorMaterial3DResource extends MaterialResource {

	static UniformMemoryLayout = WebGPURenderState.RenderStateMemoryLayout({
		type: 'struct',
		members: [
			WebGPURenderStateBufferUniformType.Vector4,
		],
	} as const);

	private readonly uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(PureColorMaterial3DUniformLayout.get()).expect());
	private readonly uniform_buffer_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, PureColorMaterial3DResource.UniformMemoryLayout.size, false).expect());
	private readonly uniform_array_buffer = new ArrayBuffer(PureColorMaterial3DResource.UniformMemoryLayout.size);

	private _color = Vector4.create(1.0, 1.0, 1.0, 1.0);
	public get color() { return this._color.clone(); }
	public set color(color: Vector4) {
		if (!this._color.equal(color)) {
			this._color.copy(color);
			this.render_server_material.is_transparent = this._color.w < 1;
			this.update_UniformBuffer();
		}
	}

	private readonly albedo_texture_storage = new MaterialTextureSamplerStorage<Texture2DResource>(this.uniform_group_ref.expect, 1, undefined, RenderServerDefaultTextureType.White, 2, RenderServer.get_TextureSampler(
		WebGPURenderStateTextureWrap.Clamp, WebGPURenderStateTextureWrap.Clamp, WebGPURenderStateTextureWrap.Clamp,
		WebGPURenderStateTextureFilter.Linear, WebGPURenderStateTextureFilter.Linear, WebGPURenderStateTextureFilter.Linear
	));
	public get albedo_texture() { return this.albedo_texture_storage.get(); }
	public set albedo_texture(texture: Texture2DResource | undefined) { this.albedo_texture_storage.set(texture); }

	constructor() {
		super();
		this.uniform_group_ref.expect.set_BufferUniform(0, this.uniform_buffer_ref.expect);
		this.render_server_material.add_UniformBuffer(this.uniform_buffer_ref.expect, this.uniform_array_buffer);
		PureColorMaterial3DSolidPipelineCacheSet.get().set_RenderServerMaterialPipelineCaches(this.render_server_material, this.uniform_group_ref.expect);
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