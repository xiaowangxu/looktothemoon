import { ReadonlyRef, RefArray, RefCacher, type RefCountedLike } from "@/system/utils/RefCounted";
import { WebGPURenderStateCullMode, WebGPURenderStateDepthCompareFunc, WebGPURenderStateFacing, WebGPURenderStatePrimitiveType, type WebGPURenderStateProgramState } from "../../../sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import type { WebGPURenderStateUniformGroup } from "../../../sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformGroup";
import { WebGPURenderElementRenderPipelineCache, type WebGPURenderElementRenderPipelineCacheGetterFn, type WebGPURenderElementRenderPipelineCacheHash, type WebGPURenderElementVertexArrayLike } from "../../../sliverofstraw/render_element_object/pipeline/WebGPURenderElementRenderPipelineCache";
import type { WebGPURenderElementFrameBuffer } from "../../../sliverofstraw/render_element_object/frame_buffer/WebGPURenderElementFrameBuffer";
import type { WebGPURenderStateRenderPipeline } from "../../../sliverofstraw/render_state_object/pipeline/WebGPURenderStateRenderPipeline";
import type { Disposable, Temp } from "@/system/utils/Type";
import { RenderServer, RenderServerSingleton } from "../RenderServer";
import { WebGPURenderStateBlendFactor, WebGPURenderStateBlendOperator, type WebGPURenderStateOutputState } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateOutputState";
import type { WebGPURenderStateUniformLayout } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { WebGPURenderStateAttributeType, type WebGPURenderStateAttributeLayout } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { WebGPURenderStateTextureFormat } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTexture";
import { RenderServerObjectRefCounted } from "../RenderServerObject";
import type { WebGPURenderStateBuffer, WebGPURenderStateBufferData } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import type { WebGPURenderStateBufferView } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBufferView";
import { WebGPURenderStateMultiSampleCount } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateMultiSampleTexture";
import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { RenderServerGeometryAttributeLayoutBuffer, RenderServerGeometryAttributeLocation } from "../geometry/RenderServerGeometryDefination";
import { bitmask_check } from "@/system/utils/BitMask";
import { RenderServerMaterial } from "./RenderServerMaterial";

export enum RenderServerRenderMaterialPass {
	Depth,
	Solid,
	Transparent,
	Max = 3,
	Compose = 3,
	Set = 4,
}

type RenderServerRenderMaterialUsablePass = Exclude<RenderServerRenderMaterialPass, RenderServerRenderMaterialPass.Max>;

class RenderServerRenderMaterialPipelineUniformItem implements RefCountedLike {

	public readonly pipeline_cache: WebGPURenderElementRenderPipelineCache;
	public readonly uniform: WebGPURenderStateUniformGroup | undefined;

	constructor(pipeline_cache: WebGPURenderElementRenderPipelineCache, uniform: WebGPURenderStateUniformGroup | undefined) {
		this.pipeline_cache = pipeline_cache;
		this.uniform = uniform;
	}

	ref(): void {
		this.pipeline_cache.ref();
		this.uniform?.ref();
	}

	unref(): void {
		this.pipeline_cache.unref();
		this.uniform?.unref();
	}

	release(): void {
		this.pipeline_cache.release();
		this.uniform?.release();
	}
}

type RenderServerRenderMaterialPipelineUniformTarget = { pipeline: WebGPURenderStateRenderPipeline, uniform: WebGPURenderStateUniformGroup | undefined };

type RenderServerRenderMaterialPipelineCodeOption = {
	fragment_depth_override?: boolean,
	// tangent
	check_tangent_attribute?: boolean,
	tangent_attribute_buffer?: RenderServerGeometryAttributeLayoutBuffer,
	tangent_attribute_location?: RenderServerGeometryAttributeLocation,
	tangent_attribute_name?: string,
	// instance_transform_color
	check_instance_transform_color_attribute?: boolean,
	instance_transform_color_attribute_buffer?: RenderServerGeometryAttributeLayoutBuffer,
	instance_transform_color_attribute_location?: RenderServerGeometryAttributeLocation,
	instance_transform_color_attribute_name?: string,

	vertex_instance_transform_color?: boolean,
	fragment_tbn_matrix3?: boolean,

	// naming
	fragment_out_color_name?: string,
	fragment_out_normal_name?: string,
	fragment_tbn_vertex_view_vary_name?: string,
	fragment_tbn_normal_view_vary_name?: string,
	fragment_tbn_tangent_view_vary_name?: string,
	fragment_tbn_uv_vary_name?: string,

	// builtin func
	builtin_func?: {
		position_to_screen_uv?: boolean,
		invert_mat3?: boolean,
		sample_background?: boolean,
	}
}

class RenderServerRenderMaterialPipelineCacheSet implements RefCountedLike {

	private readonly depth_pipeline_cache: WebGPURenderElementRenderPipelineCache | undefined;
	private readonly solid_pipeline_cache: WebGPURenderElementRenderPipelineCache | undefined;
	private readonly transparent_pipeline_cache: WebGPURenderElementRenderPipelineCache | undefined;

	constructor(
		depth_pipeline_cache: WebGPURenderElementRenderPipelineCache | undefined,
		solid_pipeline_cache: WebGPURenderElementRenderPipelineCache | undefined,
		transparent_pipeline_cache: WebGPURenderElementRenderPipelineCache | undefined,
	) {
		this.depth_pipeline_cache = depth_pipeline_cache;
		this.solid_pipeline_cache = solid_pipeline_cache;
		this.transparent_pipeline_cache = transparent_pipeline_cache;
	}

	public set_RenderServerMaterialPipelineCaches(material: RenderServerRenderMaterial, uniform_group: WebGPURenderStateUniformGroup | undefined) {
		if (this.depth_pipeline_cache) material.set_PipelineUniform(RenderServerRenderMaterialPass.Depth, this.depth_pipeline_cache, uniform_group);
		if (this.solid_pipeline_cache) material.set_PipelineUniform(RenderServerRenderMaterialPass.Solid, this.solid_pipeline_cache, uniform_group);
		if (this.transparent_pipeline_cache) material.set_PipelineUniform(RenderServerRenderMaterialPass.Transparent, this.transparent_pipeline_cache, uniform_group);
	}

	ref(): void {
		this.depth_pipeline_cache?.ref();
		this.solid_pipeline_cache?.ref();
		this.transparent_pipeline_cache?.ref();
	}

	unref(): void {
		this.depth_pipeline_cache?.unref();
		this.solid_pipeline_cache?.unref();
		this.transparent_pipeline_cache?.unref();
	}

	release(): void {
		this.depth_pipeline_cache?.release();
		this.solid_pipeline_cache?.release();
		this.transparent_pipeline_cache?.release();
	}

}

export class RenderServerRenderMaterial extends RenderServerMaterial<RenderServerRenderMaterial> {

	static readonly #tmp_pipeline_uniform_for_result: RenderServerRenderMaterialPipelineUniformTarget = { pipeline: undefined!, uniform: undefined };

	public cull_mode: WebGPURenderStateCullMode = WebGPURenderStateCullMode.Back;
	public depth_bias: number = 0.0;
	public depth_bias_slope_scale: number = 0.0;

	public is_transparent: boolean = false;

	protected readonly pipeline_uniform_refs: RefArray<RenderServerRenderMaterialPipelineUniformItem> = new RefArray(RenderServerRenderMaterialPass.Max);

	//#region create Pipeline Cache

	static ProgramStatePipelineTemplates: [WebGPURenderStateProgramState, WebGPURenderStateProgramState, WebGPURenderStateProgramState, WebGPURenderStateProgramState, WebGPURenderStateProgramState] = [
		// RenderServerMaterialPass.Depth
		{
			primitive_type: WebGPURenderStatePrimitiveType.Triangles,
			cull_mode: WebGPURenderStateCullMode.Back,
			facing: WebGPURenderStateFacing.CounterClockwise,
			depth_bias: 0,
			depth_bias_slope_scale: 0,
			depth_compare_func: WebGPURenderStateDepthCompareFunc.LessEqual,
			depth_write: true,
		},
		// RenderServerMaterialPass.Solid
		{
			primitive_type: WebGPURenderStatePrimitiveType.Triangles,
			cull_mode: WebGPURenderStateCullMode.Back,
			facing: WebGPURenderStateFacing.CounterClockwise,
			depth_bias: 0,
			depth_bias_slope_scale: 0,
			depth_compare_func: WebGPURenderStateDepthCompareFunc.LessEqual,
			depth_write: true,
		},
		// RenderServerMaterialPass.Transparent
		{
			primitive_type: WebGPURenderStatePrimitiveType.Triangles,
			cull_mode: WebGPURenderStateCullMode.Back,
			facing: WebGPURenderStateFacing.CounterClockwise,
			depth_bias: 0,
			depth_bias_slope_scale: 0,
			depth_compare_func: WebGPURenderStateDepthCompareFunc.LessEqual,
			depth_write: false,
		},
		// RenderServerMaterialPass.Compose
		{
			primitive_type: WebGPURenderStatePrimitiveType.Triangles,
			cull_mode: WebGPURenderStateCullMode.Back,
			facing: WebGPURenderStateFacing.CounterClockwise,
			depth_bias: 0,
			depth_bias_slope_scale: 0,
			depth_compare_func: WebGPURenderStateDepthCompareFunc.Always,
			depth_write: false,
		},
		// RenderServerMaterialPass.Set
		{
			primitive_type: WebGPURenderStatePrimitiveType.Triangles,
			cull_mode: WebGPURenderStateCullMode.Back,
			facing: WebGPURenderStateFacing.CounterClockwise,
			depth_bias: 0,
			depth_bias_slope_scale: 0,
			depth_compare_func: WebGPURenderStateDepthCompareFunc.Always,
			depth_write: false,
		}
	];

	static OutputStatePipelineTemplates: [WebGPURenderStateOutputState, WebGPURenderStateOutputState, WebGPURenderStateOutputState, WebGPURenderStateOutputState, WebGPURenderStateOutputState] = [
		// RenderServerMaterialPass.Depth
		{
			depth_stencil_format: WebGPURenderStateTextureFormat.D32FS8,
			multi_sample_count: WebGPURenderStateMultiSampleCount.None,
			attachments: [
				// normal
				{
					format: WebGPURenderStateTextureFormat.RGBA16F,
					blend: false,
				}
			],
		},
		// RenderServerMaterialPass.Solid
		{
			depth_stencil_format: WebGPURenderStateTextureFormat.D32FS8,
			multi_sample_count: WebGPURenderStateMultiSampleCount.None,
			attachments: [
				// color
				{
					format: WebGPURenderStateTextureFormat.RGBA16F,
					blend: false,
				},
				// normal
				{
					format: WebGPURenderStateTextureFormat.RGBA16F,
					blend: true,
				}
			],
		},
		// RenderServerMaterialPass.Transparent
		{
			depth_stencil_format: WebGPURenderStateTextureFormat.D32FS8,
			multi_sample_count: WebGPURenderStateMultiSampleCount.None,
			alpha_to_coverage: false,
			attachments: [
				// accum
				{
					format: WebGPURenderStateTextureFormat.RGBA16F,
					color_src_factor: WebGPURenderStateBlendFactor.One,
					color_dst_factor: WebGPURenderStateBlendFactor.One,
					alpha_src_factor: WebGPURenderStateBlendFactor.One,
					alpha_dst_factor: WebGPURenderStateBlendFactor.One,
					blend: true,
				},
				// reveal
				{
					format: WebGPURenderStateTextureFormat.R16F,
					color_src_factor: WebGPURenderStateBlendFactor.Zero,
					color_dst_factor: WebGPURenderStateBlendFactor.OneMinusSrc,
					alpha_src_factor: WebGPURenderStateBlendFactor.Zero,
					alpha_dst_factor: WebGPURenderStateBlendFactor.Zero,
					blend: true,
				},
			],
		},
		// RenderServerMaterialPass.Compose
		{
			depth_stencil_format: undefined,
			multi_sample_count: WebGPURenderStateMultiSampleCount.None,
			alpha_to_coverage: false,
			attachments: [
				// compose
				{
					format: WebGPURenderStateTextureFormat.RGBA16F,
					color_src_factor: WebGPURenderStateBlendFactor.SrcAlpha,
					color_dst_factor: WebGPURenderStateBlendFactor.OneMinusSrcAlpha,
					alpha_src_factor: WebGPURenderStateBlendFactor.SrcAlpha,
					alpha_dst_factor: WebGPURenderStateBlendFactor.OneMinusSrcAlpha,
					blend: true,
				},
			],
		},
		// RenderServerMaterialPass.Set
		{
			depth_stencil_format: undefined,
			multi_sample_count: WebGPURenderStateMultiSampleCount.None,
			alpha_to_coverage: false,
			attachments: [
				// compose
				{
					format: WebGPURenderStateTextureFormat.RGBA16F,
					blend: false,
				},
			],
		},
	];

	static PipelineOutputCodeTemplates: [string, string, string, string, string] = [
		`    @location(0) normal: vec4f,`,
		`    @location(0) color: vec4f,
    @location(1) normal: vec4f,`,
		`    @location(0) accum: vec4f,
    @location(1) reveal: f32,`,
		`    @location(0) color: vec4f,`,
		`    @location(0) color: vec4f,`,
	];

	static RenderStateAttributeType(type: WebGPURenderStateAttributeType) {
		switch (type) {
			case WebGPURenderStateAttributeType.Bool: return 'bool';
			case WebGPURenderStateAttributeType.Int: return 'i32';
			case WebGPURenderStateAttributeType.Float: return 'f32';
			case WebGPURenderStateAttributeType.Vector2: return 'vec2f';
			case WebGPURenderStateAttributeType.Vector3: return 'vec3f';
			case WebGPURenderStateAttributeType.Vector4: return 'vec4f';
			case WebGPURenderStateAttributeType.IVector2: return 'vec2i';
			case WebGPURenderStateAttributeType.IVector3: return 'vec3i';
			case WebGPURenderStateAttributeType.IVector4: return 'vec4i';
			case WebGPURenderStateAttributeType.UVector2: return 'vec2u';
			case WebGPURenderStateAttributeType.UVector3: return 'vec3u';
			case WebGPURenderStateAttributeType.UVector4: return 'vec4u';
			default: {
				const n: never = type;
				throw new Error('should not reach');
			}
		}
	}

	static create_PipelineCache(fn: WebGPURenderElementRenderPipelineCacheGetterFn, pass: RenderServerRenderMaterialUsablePass, uniform_layout: WebGPURenderStateUniformLayout | undefined, attribute_layouts: Iterable<WebGPURenderStateAttributeLayout>) {
		return new WebGPURenderElementRenderPipelineCache(
			RenderServer.render_state,
			fn,
			RenderServerRenderMaterial.ProgramStatePipelineTemplates[pass],
			RenderServerRenderMaterial.OutputStatePipelineTemplates[pass],
			uniform_layout !== undefined ?
				[RenderServer.world_env_uniform_layout, RenderServer.lights_uniform_layout, RenderServer.instance_uniform_layout, uniform_layout] :
				[RenderServer.world_env_uniform_layout, RenderServer.lights_uniform_layout, RenderServer.instance_uniform_layout],
			attribute_layouts,
		);
	}

	/**
	 * internal builtins:
	 * 
	 * instance_transform: mat4x4f
	 * 
	 * instance_normal: mat3x3f
	 * 
	 * instance_color: vec4f
	 * 
	 * tbn: mat3x3f
	 * 
	 * internal outputs:
	 * 
	 * color: vec4f
	 * 
	 * normal: vec4f(normal, 1.0)
	 * 
	 */
	static create_PipelineCacheFromCode(
		pass: RenderServerRenderMaterialUsablePass,
		attributes: Iterable<[name: string, location: number, type: WebGPURenderStateAttributeType]>,
		uniforms: string | undefined, vertex: string, vary: string, fragment: string, custom: string | undefined,
		uniform_layout: WebGPURenderStateUniformLayout | undefined, attribute_layouts: Iterable<WebGPURenderStateAttributeLayout>, option: RenderServerRenderMaterialPipelineCodeOption | undefined = {}) {

		const {
			fragment_depth_override = false,

			check_tangent_attribute = true,
			tangent_attribute_buffer = RenderServerGeometryAttributeLayoutBuffer.Tangent,
			tangent_attribute_location = RenderServerGeometryAttributeLocation.Tangent,
			tangent_attribute_name = 'tangent',

			check_instance_transform_color_attribute = true,
			instance_transform_color_attribute_buffer = RenderServerGeometryAttributeLayoutBuffer.InstanceTransformColor,
			instance_transform_color_attribute_location = RenderServerGeometryAttributeLocation.InstanceTransformColorRow0,
			instance_transform_color_attribute_name = 'instance_transform_color',

			vertex_instance_transform_color = true,
			fragment_tbn_matrix3 = true,

			fragment_out_color_name = 'color',
			fragment_out_normal_name = 'normal',
			fragment_tbn_vertex_view_vary_name = 'vertex_view',
			fragment_tbn_normal_view_vary_name = 'normal',
			fragment_tbn_tangent_view_vary_name = 'tangent',
			fragment_tbn_uv_vary_name = 'uv',

			builtin_func
		} = option;

		const builtin_func_code = `${builtin_func?.position_to_screen_uv ? `

fn position_to_screen_uv(position: vec2f, viewport: vec4f) -> vec2f {
	var screen_uv = (position - viewport.xy) / viewport.zw;
	return screen_uv;
}`: ``}${builtin_func?.invert_mat3 ? `

fn invert_mat3(mat: mat3x3f) -> mat3x3f {
	let s = (1.0f / determinant(mat));
	  return (s * mat3x3<f32>(vec3<f32>(((mat[1u][1u] * mat[2u][2u]) - (mat[1u][2u] * mat[2u][1u])), ((mat[0u][2u] * mat[2u][1u]) - (mat[0u][1u] * mat[2u][2u])), ((mat[0u][1u] * mat[1u][2u]) - (mat[0u][2u] * mat[1u][1u]))), vec3<f32>(((mat[1u][2u] * mat[2u][0u]) - (mat[1u][0u] * mat[2u][2u])), ((mat[0u][0u] * mat[2u][2u]) - (mat[0u][2u] * mat[2u][0u])), ((mat[0u][2u] * mat[1u][0u]) - (mat[0u][0u] * mat[1u][2u]))), vec3<f32>(((mat[1u][0u] * mat[2u][1u]) - (mat[1u][1u] * mat[2u][0u])), ((mat[0u][1u] * mat[2u][0u]) - (mat[0u][0u] * mat[2u][1u])), ((mat[0u][0u] * mat[1u][1u]) - (mat[0u][1u] * mat[1u][0u])))));
}`: ``}${builtin_func?.sample_background ? `

fn sample_background(direction: vec3f, bias: f32) -> vec4f {
 	var dir = normalize(mat3x3f(
        world_env_uniform_camera_matrix.camera_world[0].xyz,
        world_env_uniform_camera_matrix.camera_world[1].xyz,
        world_env_uniform_camera_matrix.camera_world[2].xyz,
    ) * direction);
	var mipmap = f32(textureNumLevels(light_uniform_background_texture) - 1);
	return textureSampleBias(light_uniform_background_texture, light_uniform_sampler, dir, bias * mipmap);
}`: ``}`;

		const fn: WebGPURenderElementRenderPipelineCacheGetterFn = (hash: WebGPURenderElementRenderPipelineCacheHash) => {

			const has_tangent = bitmask_check(hash, tangent_attribute_buffer);
			const has_instance_transform_color = bitmask_check(hash, instance_transform_color_attribute_buffer);

			const shader_code = `// Constants
const PI: f32 = 3.141592653589793;
const TAU: f32 = 6.283185307179586;
const EPSILON: f32 = 1E-10;
			
// Attributes
struct Attributes {
	@builtin(vertex_index) vertex_index: u32,
	@builtin(instance_index) instance_index: u32,${check_tangent_attribute && has_tangent ? `
	@location(${tangent_attribute_location}) ${tangent_attribute_name}: vec3f,` : ``}${check_instance_transform_color_attribute && has_instance_transform_color ? `
	@location(${instance_transform_color_attribute_location + 0}) ${instance_transform_color_attribute_name}_0: vec4f,
	@location(${instance_transform_color_attribute_location + 1}) ${instance_transform_color_attribute_name}_1: vec4f,
	@location(${instance_transform_color_attribute_location + 2}) ${instance_transform_color_attribute_name}_2: vec4f,
	@location(${instance_transform_color_attribute_location + 3}) ${instance_transform_color_attribute_name}_3: vec4f,` : ``}
	// Custom Attributes
${[...attributes].map(([name, location, type]) => `	@location(${location}) ${name}: ${RenderServerRenderMaterial.RenderStateAttributeType(type)},`).join('\n')}
};

// WorldUniformsStruct
${RenderServerSingleton.WorldUniformsStructCode}

// InstanceUniformsStruct
${RenderServerSingleton.InstanceUniformsStructCode}

// LightUniformsStruct
${RenderServerSingleton.LightDataUniformsStructCode}

// WorldUniformsGroupBinding
${RenderServerSingleton.WorldUniformsGroupBindingCode}

// InstanceUniformsGroupBinding
${RenderServerSingleton.InstanceUniformsGroupBindingCode}

// LightUniformsGroupBinding
${RenderServerSingleton.LightUniformsGroupBindingCode}
${uniforms !== undefined ? `
// Custom Uniforms
${uniforms}
`: ``}
// Varying
struct VertexOutput {
${vary}
};    

@vertex
fn vs_main(attri: Attributes) -> VertexOutput {
	var out: VertexOutput;
${vertex_instance_transform_color ? has_instance_transform_color ? `
	// Instance Transform Color with Attribute
	var instance_transform = mat4x4f(
		vec4f(attri.${instance_transform_color_attribute_name}_0.xyz, 0.0),
		vec4f(attri.${instance_transform_color_attribute_name}_1.xyz, 0.0),
		vec4f(attri.${instance_transform_color_attribute_name}_2.xyz, 0.0),
		vec4f(attri.${instance_transform_color_attribute_name}_3.xyz, 1.0),
	);
	var instance_normal = transpose(_invert_mat3x3f(mat3x3f(
		attri.${instance_transform_color_attribute_name}_0.xyz,
		attri.${instance_transform_color_attribute_name}_1.xyz,
		attri.${instance_transform_color_attribute_name}_2.xyz,
	)));
	var instance_color = vec4f(
		attri.${instance_transform_color_attribute_name}_0.w,
		attri.${instance_transform_color_attribute_name}_1.w,
		attri.${instance_transform_color_attribute_name}_2.w,
		attri.${instance_transform_color_attribute_name}_3.w,
	);
` : `
	// Instance Transform Color Default
	var instance_transform = mat4x4f(
		vec4f(1.0, 0.0, 0.0, 0.0),
		vec4f(0.0, 1.0, 0.0, 0.0),
		vec4f(0.0, 0.0, 1.0, 0.0),
		vec4f(0.0, 0.0, 0.0, 1.0),
	);
	var instance_normal = mat3x3f(
		vec3f(1.0, 0.0, 0.0),
		vec3f(0.0, 1.0, 0.0),
		vec3f(0.0, 0.0, 1.0),
	);
	var instance_color = vec4f(1.0);
`: ``
				}
	// Custom Vertex
${vertex}
	// End Custom Vertex

	return out;
}

// Out
struct FragmentOutput {
${RenderServerRenderMaterial.PipelineOutputCodeTemplates[pass]}
${fragment_depth_override ? `	@builtin(frag_depth) depth: f32,
`: ``}}

@fragment
fn fs_main(vary: VertexOutput, @builtin(front_facing) front_facing: bool) -> FragmentOutput {
	var _out: FragmentOutput;
${fragment_tbn_matrix3 ? `
	// TBN Matrix3
	var _normal_view: vec3f = normalize(vary.${fragment_tbn_normal_view_vary_name});
	var tbn: mat3x3f;
${!has_tangent ?
						`	var _q0: vec3f = dpdx(vary.${fragment_tbn_vertex_view_vary_name});
	var _q1: vec3f = dpdy(vary.${fragment_tbn_vertex_view_vary_name});
	var _st0: vec2f = dpdx(vary.${fragment_tbn_uv_vary_name}.xy);
	var _st1: vec2f = dpdy(vary.${fragment_tbn_uv_vary_name}.xy);
	var _q1perp: vec3f = cross(_q1, _normal_view);
	var _q0perp: vec3f = cross(_normal_view, _q0);
	var _tangent_view: vec3f = _q1perp * _st0.x + _q0perp * _st1.x;
	var _B: vec3f = _q1perp * _st0.y + _q0perp * _st1.y;
	var _det = max(dot(_tangent_view, _tangent_view), dot(_B, _B));
	var _scale: f32 = 0.0;
	if _det != 0.0 { _scale = -inverseSqrt(_det); }
	tbn = mat3x3f(_tangent_view * _scale, _B * _scale, _normal_view);`:
						`	var _tangent_view: vec3f = normalize(vary.${fragment_tbn_tangent_view_vary_name});
	tbn = mat3x3f(-_tangent_view, -cross(_tangent_view, _normal_view), _normal_view);`}
`: ``}
	// Custom Fragment
${fragment}
	// End Custom Fragment
	${pass === RenderServerRenderMaterialPass.Transparent ? `
	// Transparent OIT
	let _z = abs(vary.position.z);
	let _a = ${fragment_out_color_name}.a;
	if _a < EPSILON {
		_out.accum = vec4f(0.0);
		_out.reveal = 0;
	}
	else {
		let _weight = max(0.01, min(3000.0, 0.03 / (1e-5 + pow(abs(_z) / 200.0, 4.0))));
		_out.accum = vec4f(${fragment_out_color_name}.rgb * ${fragment_out_color_name}.a, ${fragment_out_color_name}.a)  * _weight;
		_out.reveal = ${fragment_out_color_name}.a;
	}
	` :
					pass === RenderServerRenderMaterialPass.Solid ? `
	// Solid
	_out.color = ${fragment_out_color_name};
	_out.normal = vec4f(${fragment_out_normal_name}, 1.0);
	` :
						pass === RenderServerRenderMaterialPass.Depth ? `
	// Depth
	_out.normal = vec4f(${fragment_out_normal_name}, 1.0);
	` :
							``}
	return _out;
}${builtin_func_code}${vertex_instance_transform_color && has_instance_transform_color ? `
fn _invert_mat3x3f(mat: mat3x3f) -> mat3x3f {
	let s = (1.0f / determinant(mat));
  	return (s * mat3x3<f32>(vec3<f32>(((mat[1u][1u] * mat[2u][2u]) - (mat[1u][2u] * mat[2u][1u])), ((mat[0u][2u] * mat[2u][1u]) - (mat[0u][1u] * mat[2u][2u])), ((mat[0u][1u] * mat[1u][2u]) - (mat[0u][2u] * mat[1u][1u]))), vec3<f32>(((mat[1u][2u] * mat[2u][0u]) - (mat[1u][0u] * mat[2u][2u])), ((mat[0u][0u] * mat[2u][2u]) - (mat[0u][2u] * mat[2u][0u])), ((mat[0u][2u] * mat[1u][0u]) - (mat[0u][0u] * mat[1u][2u]))), vec3<f32>(((mat[1u][0u] * mat[2u][1u]) - (mat[1u][1u] * mat[2u][0u])), ((mat[0u][1u] * mat[2u][0u]) - (mat[0u][0u] * mat[2u][1u])), ((mat[0u][0u] * mat[1u][1u]) - (mat[0u][1u] * mat[1u][0u])))));
}
`: ``}
${custom !== undefined ? `
// Custom
${custom}` : ``}`;

			// console.log(shader_code.split('\n').map((l, i) => `${(i + 1).toFixed(0).padEnd(4, ' ')}|	${l}`).join('\n'));

			const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
			const program = RenderServer.render_state.create_Program(shader, shader).expect();
			return program;
		};

		return RenderServerRenderMaterial.create_PipelineCache(fn, pass, uniform_layout, attribute_layouts);
	}

	static create_PipelineCacheSet(attributes: Iterable<[name: string, location: number, type: WebGPURenderStateAttributeType]>, uniforms: string | undefined, vertex: string, vary: string, fragment: string, custom: string | undefined, uniform_layout: WebGPURenderStateUniformLayout | undefined, attribute_layouts: Iterable<WebGPURenderStateAttributeLayout>, option?: RenderServerRenderMaterialPipelineCodeOption) {
		const depth_pipeline_cache = RenderServerRenderMaterial.create_PipelineCacheFromCode(RenderServerRenderMaterialPass.Depth, attributes, uniforms, vertex, vary, fragment, custom, uniform_layout, attribute_layouts, option);
		const solid_pipeline_cache = RenderServerRenderMaterial.create_PipelineCacheFromCode(RenderServerRenderMaterialPass.Solid, attributes, uniforms, vertex, vary, fragment, custom, uniform_layout, attribute_layouts, option);
		const transparent_pipeline_cache = RenderServerRenderMaterial.create_PipelineCacheFromCode(RenderServerRenderMaterialPass.Transparent, attributes, uniforms, vertex, vary, fragment, custom, uniform_layout, attribute_layouts, option);
		return new RenderServerRenderMaterialPipelineCacheSet(depth_pipeline_cache, solid_pipeline_cache, transparent_pipeline_cache);
	}

	//#endregion

	public set_PipelineUniform(pass: RenderServerRenderMaterialUsablePass, pipeline_cache: WebGPURenderElementRenderPipelineCache, uniform: WebGPURenderStateUniformGroup | undefined) {
		this.pipeline_uniform_refs.set(pass, new RenderServerRenderMaterialPipelineUniformItem(pipeline_cache, uniform));
	}

	public get_PipelineUniform(pass: RenderServerRenderMaterialPass, vertex_array: WebGPURenderElementVertexArrayLike, frame_buffer: WebGPURenderElementFrameBuffer, depth_compare_func: WebGPURenderStateDepthCompareFunc): Temp<RenderServerRenderMaterialPipelineUniformTarget> | undefined {
		const item = this.pipeline_uniform_refs.get(pass);
		if (item === undefined) return undefined;
		const { pipeline_cache, uniform } = item;
		const pipeline = pipeline_cache.get(vertex_array, frame_buffer, this.cull_mode, this.depth_bias, this.depth_bias_slope_scale, depth_compare_func);
		if (pipeline === undefined) return;
		const tmp = RenderServerRenderMaterial.#tmp_pipeline_uniform_for_result;
		tmp.pipeline = pipeline;
		tmp.uniform = uniform;
		return tmp;
	}

	public dispose(): void {
		this.pipeline_uniform_refs.clear();
		super.dispose();
	}
}