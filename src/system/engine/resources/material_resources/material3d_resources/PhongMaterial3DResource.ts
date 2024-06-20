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
import { WebGPURenderStateTextureFilter } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureSampler";
import type { Texture2DResource } from "../../texture_resources/texture2d_resources/Texture2DResource";

const PhongMaterialResourceUniformLayout = new RefCacher(() => {
	const layout = RenderServer.render_state.create_UniformLayout();
	layout.add_BufferUniform(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 0, false);
	layout.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.Float, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 1);
	layout.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.Float, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 2);
	layout.add_Sampler(WebGPURenderStateSamplerUniformType.Filter, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 3);
	return layout;
});

const PhongMaterialSolidPipelineCacheSet = new RefCacher(() => {
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
	has_normal: u32,
	roughness: f32,
};

@group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(0) var<uniform> mat_uniform: Uniform;
@group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(1) var mat_uniform_normal_tex: texture_2d<f32>; 
@group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(2) var mat_uniform_matcap_tex: texture_2d<f32>; 
@group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(3) var mat_uniform_sampler: sampler;
`,
		// vertex code
		`	var _instance_transform = instance_uniform.transform * instance_transform;
	var _world = _instance_transform * vec4(attri.position, 1.0f);
	out.vertex = _world.xyz;
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
	@location(4) color: vec4f,
	@location(5) vertex: vec3f,`,
		// fragment code
		`	var normal = normalize(vary.normal);
	if bool(mat_uniform.has_normal) {
		normal = normalize(tbn * (textureSample(mat_uniform_normal_tex, mat_uniform_sampler, vary.uv).xyz * 2.0 - 1.0));
	}
	var albedo = mat_uniform.color;
	var diffuse: vec3f = vec3f(0.0);
	var specular: vec3f = vec3f(0.0);

	for (var i: u32 = 0; i < light_uniform.count; i += 1) {
	    var light: LightDataUniform = light_data_uniform[i];
		var t: u32 = light.visible_queue_type & 0xff;
		var visible: bool = (light.visible_queue_type & 0x80000000) != 0u;
		var attenuation = light.direction_attenuation.w;
		var view = vary.lookat;
		var direction = light.direction_attenuation.xyz;
		var position = light.position.xyz;
		var world = vary.vertex;
		switch t {
	        case 1u {
	            // ambient light
	            calc_light(t, normal, view, normal, light.color, 1.0, &diffuse, &specular);
	        }
	        case 2u {
	            // directional light
	            var l_direction = normalize(world_env_uniform_camera_matrix.camera_norview * direction);
	            calc_light(t, l_direction, view, normal, light.color, 1.0, &diffuse, &specular);
	        }
	        case 3u {
	            // point light
	            var l_distance = distance(position, world);
	            var l_dir = normalize(world_env_uniform_camera_matrix.camera_norview * normalize(position - world));
	            var near_distance = light.params.x;
	            var far_distance = light.params.y;
	            var distance_w = (l_distance - near_distance) / ( far_distance - near_distance);
	            var distance_strength = smoothstep(1.0, 0.0, distance_w);
	            var l_atten = distance_strength / pow(max(l_distance, 1.0), attenuation);
	            calc_light(t, l_dir, view, normal, light.color, l_atten, &diffuse, &specular);
	        }
	        case 4u {
	            // spot light
	            var l_dir = normalize(position - world);
            	var l_dot_dir = dot(l_dir, -normalize(direction));
            	var l_distance = distance(position, world);
            	var angle_strength = smoothstep(cos(light.params.y), cos(light.params.x), l_dot_dir);
            	var near_distance = light.params.z;
            	var far_distance = light.params.w;
            	var distance_w = (l_distance - near_distance) / (far_distance - near_distance);
            	var distance_strength = smoothstep(1.0f, 0.0f, distance_w);
            	var l_atten = (angle_strength * distance_strength) / pow(l_distance, attenuation);
            	var l_dir_view = normalize(world_env_uniform_camera_matrix.camera_norview * l_dir);
            	calc_light(t, l_dir_view, view, normal, light.color, l_atten, &diffuse, &specular);
	        }
			default {}
	    }
	}

	var color = albedo * vec4f(diffuse, 1.0) + vec4f(specular, 0.0);`,
		// custom
		`fn ndf(l: vec3f, v: vec3f, n: vec3f, roughness: f32) -> f32 {
    var roughness_sqr = roughness * roughness;
    var h = normalize(l + v);
    var ndoth = max(dot(n, h), 0.0);
    var ndoth_sqr = ndoth * ndoth;
    return max(EPSILON, (1.0 / (PI * roughness_sqr * ndoth_sqr * ndoth_sqr)) * exp((ndoth_sqr - 1.0) / (roughness_sqr * ndoth_sqr)));
}

fn calc_light(t: u32, direction: vec3f, view: vec3f, normal: vec3f, color: vec3f, attenuation: f32, diffuse: ptr<function, vec3f>, specular: ptr<function, vec3f>) {
	var strength = dot(normal, direction);
    var _color = color * attenuation;
    if strength > EPSILON {
        *diffuse += strength * _color;
        if t != 1u {
            var ndf = ndf(direction, view, normal, mat_uniform.roughness);
            *specular += ndf * _color;
        }
    }
}`,
		PhongMaterialResourceUniformLayout.get(),
		RenderServerGeometryAttributeLayout,
		{}
	);
	return pipeline_cache_set;
});

export class PhongMaterialResource extends MaterialResource {

	static UniformMemoryLayout = WebGPURenderState.RenderStateMemoryLayout({
		type: 'struct',
		members: [
			WebGPURenderStateBufferUniformType.Vector4,
			WebGPURenderStateBufferUniformType.Bool,
			WebGPURenderStateBufferUniformType.Float,
		],
	} as const);

	private readonly uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(PhongMaterialResourceUniformLayout.get()).expect());
	private readonly uniform_buffer_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, PhongMaterialResource.UniformMemoryLayout.size, false).expect());
	private readonly uniform_array_buffer = new ArrayBuffer(PhongMaterialResource.UniformMemoryLayout.size);

	private _color = Vector4.create(1.0, 1.0, 1.0, 1.0);
	public get color() { return this._color.clone(); }
	public set color(color: Vector4) {
		if (!this._color.equal(color)) {
			this._color.copy(color);
			this.render_server_material.is_transparent = this._color.w < 1;
			this.update_UniformBuffer();
		}
	}

	private _roughness = 0.5;
	public get roughness() { return this._roughness; }
	public set roughness(roughness: number) {
		if (this._roughness !== roughness) {
			this._roughness = roughness;
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
		PhongMaterialSolidPipelineCacheSet.get().set_RenderServerMaterialPipelineCaches(this.render_server_material, this.uniform_group_ref.expect);
		this.update_UniformBuffer();
	}

	private update_UniformBuffer() {
		const float32array0 = new Float32Array(this.uniform_array_buffer, PhongMaterialResource.UniformMemoryLayout.members[0].offset);
		float32array0[0] = this._color.x;
		float32array0[1] = this._color.y;
		float32array0[2] = this._color.z;
		float32array0[3] = this._color.w;
		const uint32array0 = new Uint32Array(this.uniform_array_buffer, PhongMaterialResource.UniformMemoryLayout.members[1].offset);
		uint32array0[0] = this._has_normal ? 1 : 0;
		const float32array1 = new Float32Array(this.uniform_array_buffer, PhongMaterialResource.UniformMemoryLayout.members[2].offset);
		float32array1[0] = this._roughness;
		this.render_server_material.trigger_UniformBufferChange(0);
	}

	protected dispose(): void {
		this.uniform_group_ref.clear();
		this.uniform_buffer_ref.clear();
		super.dispose();
	}
}