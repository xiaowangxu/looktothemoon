import { ReadonlyRef, RefArray, RefCacher, type RefCountedLike } from "@/system/utils/RefCounted";
import { WebGPURenderStateCullMode, WebGPURenderStateDepthCompareFunc, WebGPURenderStateFacing, WebGPURenderStatePrimitiveType, type WebGPURenderStateProgramState } from "../../../sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import type { WebGPURenderStateUniformGroup } from "../../../sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformGroup";
import { WebGPURenderElementRenderPipelineCache, type WebGPURenderElementRenderPipelineCacheGetterFn, type WebGPURenderElementRenderPipelineCacheHash, type WebGPURenderElementVertexArrayLike } from "../../../sliverofstraw/render_element_object/pipeline/WebGPURenderElementRenderPipelineCache";
import type { WebGPURenderElementFrameBuffer } from "../../../sliverofstraw/render_element_object/frame_buffer/WebGPURenderElementFrameBuffer";
import type { WebGPURenderStateRenderPipeline } from "../../../sliverofstraw/render_state_object/pipeline/WebGPURenderStateRenderPipeline";
import type { Disposable, Temp } from "@/system/utils/Type";
import { RenderServer, RenderServerSingleton } from "../RenderServer";
import { WebGPURenderStateBlendFactor, type WebGPURenderStateOutputState } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateOutputState";
import type { WebGPURenderStateUniformLayout } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { WebGPURenderStateAttributeType, type WebGPURenderStateAttributeLayout } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { WebGPURenderStateTextureFormat } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTexture";
import { RenderServerObjectRefCounted } from "../RenderServerObject";
import type { WebGPURenderStateBuffer, WebGPURenderStateBufferData } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import type { WebGPURenderStateBufferView } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBufferView";
import { WebGPURenderStateMultiSampleCount } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateMultiSampleTexture";
import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { RenderServerGeometryAttributeLocation } from "../geometry/RenderServerGeometryDefination";
import { bitmask_check } from "@/system/utils/BitMask";

export enum RenderServerMaterialPass {
	Depth,
	Solid,
	Transparent,
	Max = 3,
	Compose = 3,
}

type RenderServerMaterialUsablePass = Exclude<RenderServerMaterialPass, RenderServerMaterialPass.Max>;

class RenderServerMaterialPipelineUniformItem implements RefCountedLike {

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

class RenderServerMaterialUniformBufferItem implements RefCountedLike {

	public readonly buffer: WebGPURenderStateBuffer | WebGPURenderStateBufferView;
	public data: WebGPURenderStateBufferData;
	public changed: boolean = true;

	constructor(buffer: WebGPURenderStateBuffer, data: WebGPURenderStateBufferData) {
		this.buffer = buffer;
		this.data = data;
	}

	public commit() {
		if (this.changed) {
			this.changed = false;
			this.buffer.update_Data(0, this.data);
		}
	}

	ref(): void {
		this.buffer.ref();
	}

	unref(): void {
		this.buffer.unref();
	}

	release(): void {
		this.buffer.release();
	}
}

type RenderServerMaterialPipelineUniformTarget = { pipeline: WebGPURenderStateRenderPipeline, uniform: WebGPURenderStateUniformGroup | undefined };

type PipelineCodeOption = {
	fragment_depth_override?: boolean,
	check_tangent_attribute?: boolean,
	tangent_attribute_location?: number,
	tangent_attribute_name?: string,
}

export class RenderServerMaterial extends RenderServerObjectRefCounted {

	static readonly #tmp_pipeline_uniform_for_result: RenderServerMaterialPipelineUniformTarget = { pipeline: undefined!, uniform: undefined };

	public cull_mode: WebGPURenderStateCullMode = WebGPURenderStateCullMode.Back;
	public depth_bias: number = 0.0;
	public depth_bias_slope_scale: number = 0.0;

	public is_transparent: boolean = false;

	protected readonly pipeline_uniform_refs: RefArray<RenderServerMaterialPipelineUniformItem> = new RefArray(RenderServerMaterialPass.Max);

	protected readonly uniform_buffer_refs: RefArray<RenderServerMaterialUniformBufferItem> = new RefArray(0);

	//#region create Pipeline Cache

	static ProgramStatePipelineTemplates: [WebGPURenderStateProgramState, WebGPURenderStateProgramState, WebGPURenderStateProgramState, WebGPURenderStateProgramState] = [
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
		}
	];

	static OutputStatePipelineTemplates: [WebGPURenderStateOutputState, WebGPURenderStateOutputState, WebGPURenderStateOutputState, WebGPURenderStateOutputState] = [
		// RenderServerMaterialPass.Depth
		{
			depth_stencil_format: WebGPURenderStateTextureFormat.D32F,
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
			depth_stencil_format: WebGPURenderStateTextureFormat.D32F,
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
					blend: false,
				}
			],
		},
		// RenderServerMaterialPass.Transparent
		{
			depth_stencil_format: WebGPURenderStateTextureFormat.D32F,
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
		}
	];

	static PipelineOutputCodeTemplates: [string, string, string, string] = [
		`    @location(0) normal: vec4f,`,
		`    @location(0) color: vec4f,
    @location(1) normal: vec4f,`,
		`    @location(0) accum: vec4f,
    @location(1) reveal: f32,`,
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

	static create_PipelineCache(fn: WebGPURenderElementRenderPipelineCacheGetterFn, pass: RenderServerMaterialUsablePass, uniform_layout: WebGPURenderStateUniformLayout | undefined, attribute_layouts: Iterable<WebGPURenderStateAttributeLayout>) {
		return new WebGPURenderElementRenderPipelineCache(
			RenderServer.render_state,
			fn,
			RenderServerMaterial.ProgramStatePipelineTemplates[pass],
			RenderServerMaterial.OutputStatePipelineTemplates[pass],
			uniform_layout !== undefined ?
				[RenderServer.world_env_uniform_layout, RenderServer.lights_uniform_layout, RenderServer.instance_uniform_layout, uniform_layout] :
				[RenderServer.world_env_uniform_layout, RenderServer.lights_uniform_layout, RenderServer.instance_uniform_layout],
			attribute_layouts,
		);
	}

	static create_PipelineCacheFromCode(
		pass: RenderServerMaterialUsablePass,
		attributes: Iterable<[name: string, location: number, type: WebGPURenderStateAttributeType]>,
		uniforms: string | undefined, vertex: string, vary: string, fragment: string, custom: string | undefined,
		uniform_layout: WebGPURenderStateUniformLayout | undefined, attribute_layouts: Iterable<WebGPURenderStateAttributeLayout>, option: PipelineCodeOption | undefined = {}) {

		const {
			fragment_depth_override = false,
			check_tangent_attribute = true,
			tangent_attribute_location = RenderServerGeometryAttributeLocation.Tangent,
			tangent_attribute_name = 'tangent',
		} = option;

		const fn: WebGPURenderElementRenderPipelineCacheGetterFn = (hash: WebGPURenderElementRenderPipelineCacheHash) => {

			const shader_code = `
// Attributes
struct Attributes {
	@builtin(vertex_index) vertex_index : u32,
	@builtin(instance_index) instance_index : u32,${check_tangent_attribute && bitmask_check(hash, tangent_attribute_location) ? `
	@location(${tangent_attribute_location}) ${tangent_attribute_name}: vec3f,` : ``}
	// Custom Attributes
${[...attributes].map(([name, location, type]) => `	@location(${location}) ${name}: ${RenderServerMaterial.RenderStateAttributeType(type)},`).join('\n')}
};

// WorldUniformsStruct
${RenderServerSingleton.WorldUniformsStructCode}

// InstanceUniformsStruct
${RenderServerSingleton.InstanceUniformsStructCode}

// WorldUniformsGroupBinding
${RenderServerSingleton.WorldUniformsGroupBindingCode}

// InstanceUniformsGroupBinding
${RenderServerSingleton.InstanceUniformsGroupBindingCode}
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

	// Custom Vertex
${vertex}
	// End Custom Vertex

	return out;
}

// Out
struct FragmentOutput {
${RenderServerMaterial.PipelineOutputCodeTemplates[pass]}
${fragment_depth_override ? `	@builtin(frag_depth) depth: f32,
`: ``}}

@fragment
fn fs_main(vary: VertexOutput, @builtin(front_facing) front_facing: bool) -> FragmentOutput {
	var out: FragmentOutput;

	// Custom Fragment
${fragment}
	// End Custom Fragment
	${pass === RenderServerMaterialPass.Transparent ? `
	// Transparent OIT
	var weight: f32 = max(min(1.0, max(max(color.r, color.g), color.b) * color.a), color.a) * clamp(0.03 / (1e-5 + pow(vary.position.z / 200, 4.0)), 1e-2, 3e3);
	out.accum = vec4f(color.rgb * color.a, color.a) * weight;
	out.reveal = color.a;
	` :
		pass === RenderServerMaterialPass.Solid ? `
	// Solid
	out.color = color;
	out.normal = vec4f(normal, 1.0);
	` :
			pass === RenderServerMaterialPass.Depth ? `
	// Depth
	out.normal = vec4f(normal, 1.0);
	` :
				``}
	return out;
}
${custom !== undefined ? `
// Custom
${custom}
`: ``}
`;

			console.log(shader_code);

			const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
			const program = RenderServer.render_state.create_Program(shader, shader).expect();
			return program;
		};

		return RenderServerMaterial.create_PipelineCache(fn, pass, uniform_layout, attribute_layouts);
	}

	static create_PipelineCacheSet(attributes: Iterable<[name: string, location: number, type: WebGPURenderStateAttributeType]>, uniforms: string | undefined, vertex: string, vary: string, fragment: string, custom: string | undefined, uniform_layout: WebGPURenderStateUniformLayout | undefined, attribute_layouts: Iterable<WebGPURenderStateAttributeLayout>, option?: PipelineCodeOption) {
		const depth_pipeline_cache = RenderServerMaterial.create_PipelineCacheFromCode(RenderServerMaterialPass.Depth, attributes, uniforms, vertex, vary, fragment, custom, uniform_layout, attribute_layouts, option);
		const solid_pipeline_cache = RenderServerMaterial.create_PipelineCacheFromCode(RenderServerMaterialPass.Solid, attributes, uniforms, vertex, vary, fragment, custom, uniform_layout, attribute_layouts, option);
		const transparent_pipeline_cache = RenderServerMaterial.create_PipelineCacheFromCode(RenderServerMaterialPass.Transparent, attributes, uniforms, vertex, vary, fragment, custom, uniform_layout, attribute_layouts, option);
		return new RenderServerPipelineCacheSet(depth_pipeline_cache, solid_pipeline_cache, transparent_pipeline_cache);
	}

	//#endregion

	public set_PipelineUniform(pass: RenderServerMaterialUsablePass, pipeline_cache: WebGPURenderElementRenderPipelineCache, uniform: WebGPURenderStateUniformGroup | undefined) {
		this.pipeline_uniform_refs.set(pass, new RenderServerMaterialPipelineUniformItem(pipeline_cache, uniform));
	}

	public get_PipelineUniform(pass: RenderServerMaterialPass, vertex_array: WebGPURenderElementVertexArrayLike, frame_buffer: WebGPURenderElementFrameBuffer, depth_compare_func: WebGPURenderStateDepthCompareFunc): Temp<RenderServerMaterialPipelineUniformTarget> | undefined {
		const item = this.pipeline_uniform_refs.get(pass);
		if (item === undefined) return undefined;
		const { pipeline_cache, uniform } = item;
		const pipeline = pipeline_cache.get(vertex_array, frame_buffer, this.cull_mode, this.depth_bias, this.depth_bias_slope_scale, depth_compare_func);
		if (pipeline === undefined) return;
		const tmp = RenderServerMaterial.#tmp_pipeline_uniform_for_result;
		tmp.pipeline = pipeline;
		tmp.uniform = uniform;
		return tmp;
	}

	public add_UniformBuffer(buffer: WebGPURenderStateBuffer, data: WebGPURenderStateBufferData) {
		this.uniform_buffer_refs.push(new RenderServerMaterialUniformBufferItem(buffer, data));
	}

	public set_UniformBufferData(index: number, data: WebGPURenderStateBufferData) {
		const item = this.uniform_buffer_refs.get(index);
		if (item !== undefined) {
			item.data = data;
		}
	}

	public trigger_UniformBufferChange(index: number) {
		const item = this.uniform_buffer_refs.get(index);
		if (item !== undefined) {
			item.changed = true;
		}
	}

	public update_UniformBuffers() {
		for (let i = 0, l = this.uniform_buffer_refs.length; i < l; i++) {
			const item = this.uniform_buffer_refs.get(i);
			if (item !== undefined) {
				item.commit();
			}
		}
	}

	public dispose(): void {
		this.pipeline_uniform_refs.clear();
		this.uniform_buffer_refs.clear();
	}
}

class RenderServerPipelineCacheSet implements RefCountedLike {

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

	public set_RenderServerMaterialPipelineCaches(material: RenderServerMaterial, uniform_group: WebGPURenderStateUniformGroup | undefined) {
		if (this.depth_pipeline_cache) material.set_PipelineUniform(RenderServerMaterialPass.Depth, this.depth_pipeline_cache, uniform_group);
		if (this.solid_pipeline_cache) material.set_PipelineUniform(RenderServerMaterialPass.Solid, this.solid_pipeline_cache, uniform_group);
		if (this.transparent_pipeline_cache) material.set_PipelineUniform(RenderServerMaterialPass.Transparent, this.transparent_pipeline_cache, uniform_group);
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