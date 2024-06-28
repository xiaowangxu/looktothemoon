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
import type { TextureCubeMapResource } from "../../texture_resources/texture2d_resources/TextureCubeMapResource";

const PbrMaterial3DResourceUniformLayout = new RefCacher(() => {
	const layout = RenderServer.render_state.create_UniformLayout();
	layout.add_BufferUniform(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 0, false);
	layout.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.Float, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 1);
	layout.add_Texture(WebGPURenderStateTextureUniformType.TexCubeMap, WebGPURenderStateTextureUniformSampleType.Float, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 2);
	layout.add_Sampler(WebGPURenderStateSamplerUniformType.Filter, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 3);
	return layout;
});

const PbrMaterial3DPipelineCacheSet = new RefCacher(() => {
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
	reflection: f32,
	roughness: f32,
	metallic: f32,
	has_normal: u32,
};

@group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(0) var<uniform> mat_uniform: Uniform;
@group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(1) var mat_uniform_normal_tex: texture_2d<f32>; 
@group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(2) var mat_uniform_cubemap_tex: texture_cube<f32>; 
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
	if bool(world_env_uniform_params.orthogonal) { out.lookat = vec3f(0.0f, 0.0f, 1.0f); } else { out.lookat = -_world_in_view.xyz; }`,
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
	var roughness = mat_uniform.roughness;
	var metallic = mat_uniform.metallic;
	
	var view = normalize(vary.lookat);
	var world = vary.vertex;
	
    var f0 = vec3f(0.05); 
    f0 = mix(f0, albedo.rgb, metallic);
	
	var Am = vec3f(0.0);
	var Lo = vec3f(0.0);

	let cluster_index = get_cluster_index(vary.position);
	var light_cluster: u32 = cluster_index.z * (light_cluster_uniform.width_count * light_cluster_uniform.height_count) + cluster_index.y * light_cluster_uniform.width_count + cluster_index.x;
	var light_index_base = light_cluster * (light_cluster_uniform.cluster_count + 1);
	var light_count = light_cluster_data_uniform[light_index_base];

	for (var i: u32 = 1; i <= light_count; i++) {
	
		var light_index = light_cluster_data_uniform[light_index_base + i];

	    var light: LightDataUniform = light_data_uniform[light_index];
		var t: u32 = light.visible_queue_type & 0xff;
		var visible: bool = (light.visible_queue_type & 0x80000000) != 0u;

		if !visible { continue; }

		var attenuation = light.direction_attenuation.w;
		var direction = light.direction_attenuation.xyz;
		var position = light.position.xyz;

		var radiance = light.color;
		switch t {
	        case 1u {
	            // ambient light
				Am += radiance;
				continue;
	        }
	        case 2u {
	            // directional light
	            direction = normalize(world_env_uniform_camera_matrix.camera_norview * direction);
				Am += max(0, dot(normal, direction)) * radiance;
	        }
	        case 3u {
	            // point light
	            var l_distance = distance(position, world);
	            direction = normalize(world_env_uniform_camera_matrix.camera_norview * normalize(position - world));
	            var near_distance = light.params.x;
	            var far_distance = light.params.y;
	            var distance_w = (l_distance - near_distance) / ( far_distance - near_distance);
	            var distance_strength = smoothstep(1.0, 0.0, distance_w);
	            radiance *= distance_strength / pow(max(l_distance, 1.0), attenuation);
				Am += max(0, dot(normal, direction)) * radiance;
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
            	radiance *= (angle_strength * distance_strength) / pow(l_distance, attenuation);
            	direction = normalize(world_env_uniform_camera_matrix.camera_norview * l_dir);
				Am += max(0, dot(normal, direction)) * radiance;
	        }
			default {}
	    }

		var half = normalize(direction + view);

 		var ndf: f32 = DistributionGGX(normal, half, roughness);
        var gsf: f32 = GeometrySmith(normal, view, direction, roughness);      
        var fnl: vec3f = fresnelSchlick(max(dot(half, view), 0.0), f0);       

		var kS = fnl;
        var kD = vec3f(1.0) - kS;
        kD *= 1.0 - metallic;	  
        
		var strength = max(0.0, dot(normal, direction));

        var numerator   = ndf * gsf * fnl;
        var denominator = 4.0 * max(dot(normal, view), 0.0) * strength + 0.0001;
        var specular    = numerator / denominator;  

        Lo += (kD * albedo.rgb / PI + specular) * radiance * strength; 
	}

	var fnl: vec3f = fresnelSchlickRoughness(max(dot(normal, view), 0.0), f0, roughness);       
	var kS = fnl;
    var kD = vec3f(1.0) - kS;
    kD *= 1.0 - metallic;	  

	var _direction = reflect(-normalize(vary.lookat), normal);
	var dir = mat3x3f(
        world_env_uniform_camera_matrix.camera_world[0].xyz,
        world_env_uniform_camera_matrix.camera_world[1].xyz,
        world_env_uniform_camera_matrix.camera_world[2].xyz,
	) * _direction;
	var mipmap = f32(textureNumLevels(light_uniform_background_texture));
	var specular = textureSampleBias(mat_uniform_cubemap_tex, mat_uniform_sampler, dir, roughness * mipmap).rgb * 0.5;
	// var specular = sample_background(_direction, roughness).rgb;

	var ambient = (kD * Am * albedo.rgb + specular) * 1.0; // 1.0 is AO
    var color = vec4f(ambient + Lo, 1.0);`,
		// custom
		`fn linear_depth(depth: f32) -> f32 {
	let z_near = world_env_uniform_params.z_range.x;
	let z_far = world_env_uniform_params.z_range.y;
  	return z_far * z_near / fma(depth, z_near - z_far, z_far);
}

fn get_cluster_index(position : vec4f) -> vec3u {
	let z_near = world_env_uniform_params.z_range.x;
	let z_far = world_env_uniform_params.z_range.y;
	let tile_x = f32(light_cluster_uniform.width_count);
	let tile_y = f32(light_cluster_uniform.height_count);
	let tile_z = f32(light_cluster_uniform.depth_count);

	let slice_scale = tile_z / log2(z_far / z_near);
	let slice_bias = -(tile_z * log2(z_near) / log2(z_far / z_near));
	var z_tile = u32(max(log2(linear_depth(position.z)) * slice_scale + slice_bias, 0.0));

	let uv = position_to_screen_uv(position.xy, vec4f(0.0, 0.0, world_env_uniform_params.screen_size));

  	return vec3u(
		u32(uv.x * tile_x),
		u32(uv.y * tile_y),
  	    z_tile,
	);
}

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

fn fresnelSchlickRoughness(cosTheta: f32, F0: vec3f, roughness: f32) -> vec3f {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
} 

fn DistributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    var a      = roughness * roughness;
    var a2     = a * a;
    var NdotH  = max(dot(N, H), 0.0);
    var NdotH2 = NdotH * NdotH;
    var num    = a2;
    var denom  = (NdotH2 * (a2 - 1.0) + 1.0);
    denom      = PI * denom * denom;
    return num / denom;
}

fn GeometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    var r = roughness + 1.0;
    var k = (r * r) / 8.0;
    var num   = NdotV;
    var denom = NdotV * (1.0 - k) + k;
    return num / denom;
}

fn GeometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    var NdotV = max(dot(N, V), 0.0);
    var NdotL = max(dot(N, L), 0.0);
    var ggx2  = GeometrySchlickGGX(NdotV, roughness);
    var ggx1  = GeometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
}
		`,
		PbrMaterial3DResourceUniformLayout.get(),
		RenderServerGeometryAttributeLayout,
		{
			builtin_func: {
				sample_background: true,
				position_to_screen_uv: true,
			}
		}
	);
	return pipeline_cache_set;
});

export class PbrMaterial3DResource extends MaterialResource {

	static UniformMemoryLayout = WebGPURenderState.RenderStateMemoryLayout({
		type: 'struct',
		members: [
			WebGPURenderStateBufferUniformType.Vector4,
			WebGPURenderStateBufferUniformType.Float,
			WebGPURenderStateBufferUniformType.Float,
			WebGPURenderStateBufferUniformType.Float,
			WebGPURenderStateBufferUniformType.Bool,
		],
	} as const);

	private readonly uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(PbrMaterial3DResourceUniformLayout.get()).expect());
	private readonly uniform_buffer_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, PbrMaterial3DResource.UniformMemoryLayout.size, false).expect());
	private readonly uniform_array_buffer = new ArrayBuffer(PbrMaterial3DResource.UniformMemoryLayout.size);

	private _color = Vector4.create(1.0, 1.0, 1.0, 1.0);
	public get color() { return this._color.clone(); }
	public set color(color: Vector4) {
		if (!this._color.equal(color)) {
			this._color.copy(color);
			this.render_server_material.is_transparent = this._color.w < 1;
			this.update_UniformBuffer();
		}
	}

	private _reflection = 0.5;
	public get reflection() { return this._reflection; }
	public set reflection(reflection: number) {
		if (this._reflection !== reflection) {
			this._reflection = reflection;
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

	private _metallic = 0;
	public get metallic() { return this._metallic; }
	public set metallic(metalic: number) {
		if (this._metallic !== metalic) {
			this._metallic = metalic;
			this.update_UniformBuffer();
		}
	}

	private _has_normal: boolean = false;
	private readonly normal_texture_storage = new MaterialTextureSamplerStorage<Texture2DResource>(this.uniform_group_ref.expect, 1, undefined, RenderServerDefaultTextureType.White, 3, RenderServer.get_TextureSampler(undefined, undefined, undefined, WebGPURenderStateTextureFilter.Linear, WebGPURenderStateTextureFilter.Linear, WebGPURenderStateTextureFilter.Linear));
	public get normal_texture() { return this.normal_texture_storage.get(); }
	public set normal_texture(texture: Texture2DResource | undefined) {
		if (this.normal_texture_storage.set(texture)) {
			this._has_normal = !this.normal_texture_storage.is_empty;
			this.update_UniformBuffer();
		}
	}

	private readonly cube_texture_storage = new MaterialTextureSamplerStorage<TextureCubeMapResource>(this.uniform_group_ref.expect, 2, undefined, RenderServerDefaultTextureType.CubeWhite);
	public get cube_texture() { return this.cube_texture_storage.get(); }
	public set cube_texture(texture: TextureCubeMapResource | undefined) { this.cube_texture_storage.set(texture); }

	constructor() {
		super();
		this.uniform_group_ref.expect.set_BufferUniform(0, this.uniform_buffer_ref.expect);
		this.render_server_material.add_UniformBuffer(this.uniform_buffer_ref.expect, this.uniform_array_buffer);
		PbrMaterial3DPipelineCacheSet.get().set_RenderServerMaterialPipelineCaches(this.render_server_material, this.uniform_group_ref.expect);
		this.update_UniformBuffer();
	}

	private update_UniformBuffer() {
		const float32array0 = new Float32Array(this.uniform_array_buffer, PbrMaterial3DResource.UniformMemoryLayout.members[0].offset);
		float32array0[0] = this._color.x;
		float32array0[1] = this._color.y;
		float32array0[2] = this._color.z;
		float32array0[3] = this._color.w;
		float32array0[4] = this._reflection;
		float32array0[5] = this._roughness;
		float32array0[6] = this._metallic;
		const uint32array0 = new Uint32Array(this.uniform_array_buffer, PbrMaterial3DResource.UniformMemoryLayout.members[4].offset);
		uint32array0[0] = this._has_normal ? 1 : 0;
		this.render_server_material.trigger_UniformBufferChange(0);
	}

	protected dispose(): void {
		this.uniform_group_ref.clear();
		this.uniform_buffer_ref.clear();
		super.dispose();
	}
}