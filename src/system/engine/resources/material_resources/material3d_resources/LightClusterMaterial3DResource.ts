import { MaterialResource } from "../MaterialResource";
import { RefCacher } from "@/system/utils/RefCounted";
import { RenderServerRenderMaterial } from "../../../render_server/material/RenderServerRenderMaterial";
import { RenderServerGeometryAttributeLayout, RenderServerGeometryAttributeLocation } from "../../../render_server/geometry/RenderServerGeometryDefination";
import { WebGPURenderStateAttributeType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { RenderServerSingleton } from "../../../render_server/RenderServer";

const LightClusterMaterial3DSolidPipelineCacheSet = new RefCacher(() => {
	const pipeline_cache_set = RenderServerRenderMaterial.create_PipelineCacheSet(
		// attributes
		[
			['position', RenderServerGeometryAttributeLocation.Position, WebGPURenderStateAttributeType.Vector3],
			['normal', RenderServerGeometryAttributeLocation.Normal, WebGPURenderStateAttributeType.Vector3],
			['uv', RenderServerGeometryAttributeLocation.Uv, WebGPURenderStateAttributeType.Vector2],
		],
		// uniforms
		undefined,
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
	var cluster_index = get_cluster_index(vary.position);
	var light_cluster: u32 = cluster_index.z * (light_cluster_uniform.width_count * light_cluster_uniform.height_count) + cluster_index.y * light_cluster_uniform.width_count + cluster_index.x;
	// var scale = vec3f(cluster_index) / vec3f(f32(light_cluster_uniform.width_count), f32(light_cluster_uniform.height_count), f32(light_cluster_uniform.depth_count));
	var scale = vec3f(f32(light_cluster) / f32(light_cluster_uniform.width_count * light_cluster_uniform.height_count * light_cluster_uniform.depth_count), 0, 0);
	var color = vec4f(vec3f(1.0) * scale, 1.0);`,
		// custom
		`
fn linear_depth(depth: f32) -> f32 {
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
		
`,
		undefined,
		RenderServerGeometryAttributeLayout,
		{
			builtin_func: {
				position_to_screen_uv: true,
			}
		}
	);
	return pipeline_cache_set;
});

export class LightClusterMaterial3DResource extends MaterialResource {

	constructor() {
		super();
		LightClusterMaterial3DSolidPipelineCacheSet.get().set_RenderServerMaterialPipelineCaches(this.render_server_material, undefined);
	}

	protected dispose(): void {
		super.dispose();
	}
}