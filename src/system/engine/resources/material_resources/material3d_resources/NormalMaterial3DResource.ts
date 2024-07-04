import { MaterialResource } from "../MaterialResource";
import { RefCacher } from "@/system/utils/RefCounted";
import { RenderServerRenderMaterial } from "../../../render_server/material/RenderServerRenderMaterial";
import { RenderServerGeometryAttributeLayout, RenderServerGeometryAttributeLocation } from "../../../render_server/geometry/RenderServerGeometryDefination";
import { WebGPURenderStateAttributeType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { RenderServerSingleton } from "../../../render_server/RenderServer";

const NormalMaterial3DResourcePipelineCacheSet = new RefCacher(() => {
	const pipeline_cache_set = RenderServerRenderMaterial.create_PipelineCacheSet(
		// attributes
		[
			['position', RenderServerGeometryAttributeLocation.Position, WebGPURenderStateAttributeType.Vector3],
			['normal', RenderServerGeometryAttributeLocation.Normal, WebGPURenderStateAttributeType.Vector3],
			['uv', RenderServerGeometryAttributeLocation.Uv, WebGPURenderStateAttributeType.Vector2],
		],
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
	var color = vec4f((normal + 1) / 2, 1.0);`,
		// custom
		undefined,
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

export class NormalMaterial3DResource extends MaterialResource {

	constructor() {
		super();
		NormalMaterial3DResourcePipelineCacheSet.get().set_RenderServerMaterialPipelineCaches(this.render_server_material, undefined);
	}

}