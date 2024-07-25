import { RenderServerGeometryAttributeLocation } from "@/system/engine/render_server/geometry/RenderServerGeometryDefination";
import { RenderServerRenderMaterial, RenderServerRenderMaterialPass } from "@/system/engine/render_server/material/RenderServerRenderMaterial";
import { RenderServerSingleton, RenderServer } from "@/system/engine/render_server/RenderServer";
import { WebGPURenderStateAttributeType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { WebGPURenderStateStencilOperator } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateOutputState";
import { WebGPURenderStateDepthCompareFunc } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { WebGPURenderStateTextureUsage, WebGPURenderStateTextureFormat, WebGPURenderStateTextureDimension } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTexture";
import { WebGPURenderStateTextureUniformType, WebGPURenderStateTextureUniformSampleType, WebGPURenderStateSamplerUniformType } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { ReadonlyRef, RefCacher } from "@/system/utils/RefCounted";
import { PostprocessingResource } from "../PostprocessingResource";
import { AreaTextureWidth, AreaTextureHeight, AreaTextureData } from "./SmaaAreaTextureData";
import { SearchTextureWidth, SearchTextureHeight, SearchTextureData } from "./SmaaSearchTextureData";
import { WebGPURenderStateTextureWrap, WebGPURenderStateTextureFilter } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureSampler";
import type { WebGPURenderStateTextureView } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureView";
import type { WebGPURenderStateUniformGroup } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformGroup";

// https://github.com/fintelia/smaa-rs/blob/main/third_party/smaa/SMAA.hlsl#L1021

const EffectSMAAEdgePipeline = new RefCacher(() => {

    const shader_code = `

    struct Attributes {
        @location(${RenderServerGeometryAttributeLocation.Position}) position: vec2f,
    };
    
    struct WorldEnvUniformCameraMatrix {
        camera_world: mat4x4f,
        camera_view: mat4x4f,
        camera_proj: mat4x4f,
        camera_inv_proj: mat4x4f,
        camera_norview: mat3x3f,
    }

    struct WorldEnvUniformParams {
        screen_size: vec2f,
        time: f32,
        orthogonal: u32,
        pixel_ratio: f32,
    }
    
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(0) var<uniform> world_env_uniform_camera_matrix: WorldEnvUniformCameraMatrix; 
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(1) var<uniform> world_env_uniform_params: WorldEnvUniformParams;
    
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) uv: vec2f,
        @location(1) offset_0: vec4f,
        @location(2) offset_1: vec4f,
        @location(3) offset_2: vec4f,
    };

    @vertex
    fn vs_main(attri: Attributes) -> VertexOutput {
        var out: VertexOutput;
	    var uv = attri.position / 2.0;
        var resolution = 1 / world_env_uniform_params.screen_size.xyxy;

        out.uv = vec2(uv.x, 1.0 - uv.y);
        out.offset_0 = out.uv.xyxy + resolution * vec4f(-1.0, 0.0, 0.0, -1.0); // WebGL port note: Changed sign in W component
		out.offset_1 = out.uv.xyxy + resolution * vec4f( 1.0, 0.0, 0.0,  1.0); // WebGL port note: Changed sign in W component
		out.offset_2 = out.uv.xyxy + resolution * vec4f(-2.0, 0.0, 0.0, -2.0); // WebGL port note: Changed sign in W component
        out.position = vec4f(attri.position - vec2f(1.0), 1.0, 1.0);

        return out;
    }

    struct FragmentOutput {
        @location(0) color: vec4f,
    };

    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(2) var color: texture_2d<f32>;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(3) var normal: texture_2d<f32>;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(4) var depth: texture_depth_2d;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(5) var sample: sampler;
    
    /**
     * SMAA_THRESHOLD specifies the threshold or sensitivity to edges.
     * Lowering this value you will be able to detect more edges at the expense of
     * performance. 
     *
     * Range: [0, 0.5]
     *   0.1 is a reasonable value, and allows to catch most visible edges.
     *   0.05 is a rather overkill value, that allows to catch 'em all.
     */
    const SMAA_THRESHOLD: vec2f = vec2f(0.075);
    /**
     * If there is an neighbor edge that has SMAA_LOCAL_CONTRAST_FACTOR times
     * bigger contrast than current edge, current edge will be discarded.
     *
     * This allows to eliminate spurious crossing edges, and is based on the fact
     * that, if there is too much contrast in a direction, that will hide
     * perceptually contrast in the other neighbors.
     */
    const SMAA_LOCAL_CONTRAST_ADAPTATION_FACTOR: vec2f = vec2f(2.0);

    @fragment
    fn fs_main(vary: VertexOutput) -> FragmentOutput {
        var out: FragmentOutput;

        var texcoord   = vary.uv;
        var offset_0   = vary.offset_0;
        var offset_1   = vary.offset_1;
        var offset_2   = vary.offset_2;
    
		var threshold  = SMAA_THRESHOLD;

		// Calculate color deltas:

		var delta: vec4f;
		var C          = textureSample(color, sample, texcoord   ).rgb;
		var Cleft      = textureSample(color, sample, offset_0.xy).rgb;
		var t          = abs(C - Cleft);
		delta.x        = max(max(t.r, t.g), t.b);
		var Ctop       = textureSample(color, sample, offset_0.zw).rgb;
		t              = abs(C - Ctop);
		delta.y        = max(max(t.r, t.g), t.b);

		// We do the usual threshold:
		var edges      = step(threshold, delta.xy);

		// Then discard if there is no edge:
		if dot(edges, vec2f(1.0)) == 0.0 { discard; }

		// Calculate right and bottom deltas:
		var Cright     = textureSample(color, sample, offset_1.xy).rgb;
		t              = abs(C - Cright);
		delta.z        = max(max(t.r, t.g), t.b);
		var Cbottom    = textureSample(color, sample, offset_1.zw).rgb;
		t              = abs(C - Cbottom);
		delta.w        = max(max(t.r, t.g), t.b);

		// Calculate the maximum delta in the direct neighborhood:
		var maxDelta   = max(delta.xy, delta.zw);

		// Calculate left-left and top-top deltas:
		var Cleftleft  = textureSample(color, sample, offset_2.xy).rgb;
		t              = abs(C - Cleftleft);
		delta.z        = max(max(t.r, t.g), t.b);
		var Ctoptop    = textureSample(color, sample, offset_2.zw).rgb;
		t              = abs(C - Ctoptop);
		delta.w        = max(max(t.r, t.g), t.b);

		// Calculate the final maximum delta:
		maxDelta       = max(maxDelta.xy, delta.zw);
		var finalDelta = max(maxDelta.x, maxDelta.y);
        
		// Local contrast adaptation in action:
		edges         *= step(vec2f(finalDelta), SMAA_LOCAL_CONTRAST_ADAPTATION_FACTOR * delta.xy);

		out.color      = vec4f(edges, 0.0, 1.0);

        return out;
    }
    `;

    const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
    const program = RenderServer.render_state.create_Program(shader, shader).expect();

    const pipeline = RenderServer.render_state.create_RenderPipeline(
        program,
        RenderServerRenderMaterial.ProgramStatePipelineTemplates[RenderServerRenderMaterialPass.Set],
        {
            ...RenderServerRenderMaterial.OutputStatePipelineTemplates[RenderServerRenderMaterialPass.Set],
            stencil_front: {
                compare: WebGPURenderStateDepthCompareFunc.Always,
                pass_operator: WebGPURenderStateStencilOperator.Replace
            },
            stencil_back: {
                compare: WebGPURenderStateDepthCompareFunc.Never,
            },
            stencil_read_mask: 0xff,
            stencil_write_mask: 0xff,
        },
        [RenderServer.world_env_uniform_layout],
        [
            {
                stride: 8, // 2 * 4
                per_instance: false,
                rows: [{
                    location: 0,
                    offset: 0,
                    type: WebGPURenderStateAttributeType.Vector2
                }]
            },
        ]
    ).expect();

    // mannually release shader and program
    shader.release();
    program.release();

    return pipeline;
});

const EffectSMAAAreaTextureView = new RefCacher(() => {
    const texture = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopyDst, WebGPURenderStateTextureFormat.RG8, WebGPURenderStateTextureDimension.D2, AreaTextureWidth, AreaTextureHeight).expect();
    texture.update_Data(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, AreaTextureData, AreaTextureWidth, AreaTextureHeight, undefined);
    return RenderServer.render_state.create_TextureView(texture).expect();
});

const EffectSMAASearchTextureView = new RefCacher(() => {
    const texture = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopyDst, WebGPURenderStateTextureFormat.R8, WebGPURenderStateTextureDimension.D2, SearchTextureWidth, SearchTextureHeight).expect();
    texture.update_Data(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, SearchTextureData, SearchTextureWidth, SearchTextureHeight, undefined);
    return RenderServer.render_state.create_TextureView(texture).expect();
});

const EffectSMAAWeightUniformLayout = new RefCacher(() => {
    const layout = RenderServer.render_state.create_UniformLayout();
    layout.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.Float, WebGPURenderStateShaderType.Fragment, 0);
    layout.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.Float, WebGPURenderStateShaderType.Fragment, 1);
    layout.add_Sampler(WebGPURenderStateSamplerUniformType.Filter, WebGPURenderStateShaderType.Fragment, 2);
    return layout;
});

const EffectSMAAWeightPipeline = new RefCacher(() => {

    const shader_code = `

    struct Attributes {
        @location(${RenderServerGeometryAttributeLocation.Position}) position: vec2f,
    };
    
    struct WorldEnvUniformCameraMatrix {
        camera_world: mat4x4f,
        camera_view: mat4x4f,
        camera_proj: mat4x4f,
        camera_inv_proj: mat4x4f,
        camera_norview: mat3x3f,
    }

    struct WorldEnvUniformParams {
        screen_size: vec2f,
        time: f32,
        orthogonal: u32,
        pixel_ratio: f32,
    }
    
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(0) var<uniform> world_env_uniform_camera_matrix: WorldEnvUniformCameraMatrix; 
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(1) var<uniform> world_env_uniform_params: WorldEnvUniformParams;
    
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) uv: vec2f,
        @location(1) offset_0: vec4f,
        @location(2) offset_1: vec4f,
        @location(3) offset_2: vec4f,
        @location(4) pixel_coord: vec2f,
    };

    @vertex
    fn vs_main(attri: Attributes) -> VertexOutput {
        var out: VertexOutput;

	    var uv = attri.position / 2.0;
        var resolution = 1 / world_env_uniform_params.screen_size;
        
        out.uv = vec2(uv.x, 1.0 - uv.y);
        out.pixel_coord = out.uv * world_env_uniform_params.screen_size;
        out.position = vec4f(attri.position - vec2f(1.0), 1.0, 1.0);

        // We will use these offsets for the searches later on (see @PSEUDO_GATHER4):
		out.offset_0 = out.uv.xyxy + resolution.xyxy * vec4f(-0.25, -0.125, 1.25, -0.125);
		out.offset_1 = out.uv.xyxy + resolution.xyxy * vec4f(-0.125, -0.25, -0.125, 1.25);

		// And these for the searches, they indicate the ends of the loops:
		out.offset_2 = vec4f(out.offset_0.xz, out.offset_1.yw) + resolution.xxyy * vec4f(-2.0, 2.0, -2.0, 2.0) * f32(SMAA_MAX_SEARCH_STEPS);

        return out;
    }

    struct FragmentOutput {
        @location(0) color: vec4f,
    };

    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(2) var edge: texture_2d<f32>;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(3) var normal: texture_2d<f32>;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(4) var depth: texture_depth_2d;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(5) var sample: sampler;

    @group(1) @binding(0) var area_tex: texture_2d<f32>; 
    @group(1) @binding(1) var search_tex: texture_2d<f32>; 
    @group(1) @binding(2) var linear_sample: sampler;
    
    const SMAA_MAX_SEARCH_STEPS: i32 = 8;
	const SMAA_AREATEX_MAX_DISTANCE: i32 = 16;
	const SMAA_AREATEX_PIXEL_SIZE: vec2f = 1.0 / vec2f(160.0, 560.0);
	const SMAA_AREATEX_SUBTEX_SIZE: f32 = 1.0 / 7.0;
    const SMAA_SEARCHTEX_SIZE: vec2f = vec2f(66.0, 33.0);
    const SMAA_SEARCHTEX_PACKED_SIZE: vec2f = vec2f(64.0, 16.0);
    /**
     * SMAA_CORNER_ROUNDING specifies how much sharp corners will be rounded.
     * Range: [0, 100]
     */
    const SMAA_CORNER_ROUNDING: f32 = 25;
    const SMAA_CORNER_ROUNDING_NORM: f32 = SMAA_CORNER_ROUNDING / 100.0;

    @fragment
    fn fs_main(vary: VertexOutput) -> FragmentOutput {
        var out: FragmentOutput;
        out.color = SMAABlendingWeightCalculationPS(vary.uv, vary.pixel_coord, vary.offset_0, vary.offset_1, vary.offset_2, vec4i(0));
        return out;
    }

    fn SMAASearchLength(e: vec2f, offset: f32) -> f32 {
    	// The texture is flipped vertically, with left and right cases taking half
        // of the space horizontally:
        var scale = SMAA_SEARCHTEX_SIZE * vec2f(0.5, -1.0);
        var bias = SMAA_SEARCHTEX_SIZE * vec2f(offset, 1.0);

        // Scale and bias to access texel centers:
        scale += vec2f(-1.0,  1.0);
        bias  += vec2f( 0.5, -0.5);

        // Convert from pixel coordinates to texcoords:
        // (We use SMAA_SEARCHTEX_PACKED_SIZE because the texture is cropped)
        scale *= 1.0 / SMAA_SEARCHTEX_PACKED_SIZE;
        bias *= 1.0 / SMAA_SEARCHTEX_PACKED_SIZE;

        // Lookup the search texture:
        return textureSampleLevel(search_tex, linear_sample, scale * e + bias, 0).r;
    }

    fn SMAASearchXLeft(texcoord: vec2f, end: f32) -> f32 {
        /**
         * @PSEUDO_GATHER4
         * This texcoord has been offset by (-0.25, -0.125) in the vertex shader to
         * sample between edge, thus fetching four edges in a row.
         * Sampling with different offsets in each direction allows to disambiguate
         * which edges are active from the four fetched ones.
         */
        var e = vec2f(0.0, 1.0);
        var resolution = 1 / world_env_uniform_params.screen_size;
        var _texcoord = texcoord;
        while (_texcoord.x > end && 
               e.g > 0.8281 && // Is there some edge not activated?
               e.r == 0.0) { // Or is there a crossing edge that breaks the line?
            e = textureSampleLevel(edge, linear_sample, _texcoord, 0).rg;
            _texcoord = -vec2f(2.0, 0.0) * resolution + _texcoord;
        }
        var offset = -(255.0 / 127.0) * SMAASearchLength(e, 0.0) + 3.25;
        return resolution.x * offset + _texcoord.x;
    }

    fn SMAASearchXRight(texcoord: vec2f, end: f32) -> f32 {
        var e = vec2f(0.0, 1.0);
        var resolution = 1 / world_env_uniform_params.screen_size;
        var _texcoord = texcoord;
        while (_texcoord.x < end && 
               e.g > 0.8281 && // Is there some edge not activated?
               e.r == 0.0) { // Or is there a crossing edge that breaks the line?
            e = textureSampleLevel(edge, linear_sample, _texcoord, 0).rg;
            _texcoord = vec2f(2.0, 0.0) * resolution + _texcoord;
        }
        var offset = -(255.0 / 127.0) * SMAASearchLength(e, 0.5) + 3.25;
        return -resolution.x * offset + _texcoord.x;
    }

    fn SMAASearchYUp(texcoord: vec2f, end: f32) -> f32 {
        var e = vec2f(1.0, 0.0);
        var resolution = 1 / world_env_uniform_params.screen_size;
        var _texcoord = texcoord;
        while (_texcoord.y > end && 
            e.r > 0.8281 && // Is there some edge not activated?
            e.g == 0.0) { // Or is there a crossing edge that breaks the line?
            e = textureSampleLevel(edge, linear_sample, _texcoord, 0).rg;
            _texcoord = -vec2f(0.0, 2.0) * resolution + _texcoord;
        }
        var offset = -(255.0 / 127.0) * SMAASearchLength(e.gr, 0.0) + 3.25;
        return resolution.y * offset + _texcoord.y;
    }

    fn SMAASearchYDown(texcoord: vec2f, end: f32) -> f32 {
        var e = vec2f(1.0, 0.0);
        var resolution = 1 / world_env_uniform_params.screen_size;
        var _texcoord = texcoord;
        while (_texcoord.y < end && 
            e.r > 0.8281 && // Is there some edge not activated?
            e.g == 0.0) { // Or is there a crossing edge that breaks the line?
            e = textureSampleLevel(edge, linear_sample, _texcoord, 0).rg;
            _texcoord = vec2f(0.0, 2.0) * resolution + _texcoord;
        }
        var offset = -(255.0 / 127.0) * SMAASearchLength(e.gr, 0.5) + 3.25;
        return -resolution.y * offset + _texcoord.y;
    }

    /** 
     * Ok, we have the distance and both crossing edges. So, what are the areas
     * at each side of current edge?
     */
    fn SMAAArea(dist: vec2f, e1: f32, e2: f32, offset: f32) -> vec2f {
        // Rounding prevents precision errors of bilinear filtering:
        var texcoord = vec2f(f32(SMAA_AREATEX_MAX_DISTANCE), f32(SMAA_AREATEX_MAX_DISTANCE)) * round(4.0 * vec2f(e1, e2)) + dist;

        // We do a scale and bias for mapping to texel space:
        texcoord = SMAA_AREATEX_PIXEL_SIZE * texcoord + 0.5 * SMAA_AREATEX_PIXEL_SIZE;

        // Move to proper place, according to the subpixel offset:
        texcoord.y = SMAA_AREATEX_SUBTEX_SIZE * offset + texcoord.y;

        // Do it!
        return textureSampleLevel(area_tex, linear_sample, texcoord, 0).rg;
    }

    fn SMAADetectHorizontalCornerPattern(weights: vec2f, texcoord: vec4f, d: vec2f) -> vec2f {
        let leftRight = step(d.xy, d.yx);
        var rounding = (1.0 - SMAA_CORNER_ROUNDING_NORM) * leftRight;
        let resolution = 1 / world_env_uniform_params.screen_size;

        rounding /= leftRight.x + leftRight.y; // Reduce blending for pixels in the center of a line.

        var factor = vec2f(1.0, 1.0);
        factor.x -= rounding.x * textureSampleLevel(edge, linear_sample, texcoord.xy + vec2f(0,  1) * resolution, 0).r;
        factor.x -= rounding.y * textureSampleLevel(edge, linear_sample, texcoord.zw + vec2f(1,  1) * resolution, 0).r;
        factor.y -= rounding.x * textureSampleLevel(edge, linear_sample, texcoord.xy + vec2f(0, -2) * resolution, 0).r;
        factor.y -= rounding.y * textureSampleLevel(edge, linear_sample, texcoord.zw + vec2f(1, -2) * resolution, 0).r;

        return weights * saturate(factor);
    }

    fn SMAADetectVerticalCornerPattern(weights: vec2f, texcoord: vec4f, d: vec2f) -> vec2f {
        let leftRight = step(d.xy, d.yx);
        var rounding = (1.0 - SMAA_CORNER_ROUNDING_NORM) * leftRight;
        let resolution = 1 / world_env_uniform_params.screen_size;

        rounding /= leftRight.x + leftRight.y;

        var factor = vec2f(1.0, 1.0);
        factor.x -= rounding.x * textureSampleLevel(edge, linear_sample, texcoord.xy + vec2f( 1, 0) * resolution, 0).g;
        factor.x -= rounding.y * textureSampleLevel(edge, linear_sample, texcoord.zw + vec2f( 1, 1) * resolution, 0).g;
        factor.y -= rounding.x * textureSampleLevel(edge, linear_sample, texcoord.xy + vec2f(-2, 0) * resolution, 0).g;
        factor.y -= rounding.y * textureSampleLevel(edge, linear_sample, texcoord.zw + vec2f(-2, 1) * resolution, 0).g;

        return weights * saturate(factor);
    }

    fn SMAABlendingWeightCalculationPS(texcoord: vec2f, pixcoord: vec2f, offset_0: vec4f, offset_1: vec4f, offset_2: vec4f, subsampleIndices: vec4i) -> vec4f {
    	
        var weights = vec4f(0.0, 0.0, 0.0, 0.0);
        let screen_size = world_env_uniform_params.screen_size;
        let resolution = 1 / world_env_uniform_params.screen_size;

        let e = textureSample(edge, linear_sample, texcoord).rg;

        if e.g > 0.0 { // Edge at north
            var d: vec2f;

            // Find the distance to the left:
            var coords: vec3f;
            coords.x = SMAASearchXLeft(offset_0.xy, offset_2.x);
            coords.y = offset_1.y; // offset[1].y = texcoord.y - 0.25 * SMAA_RT_METRICS.y (@CROSSING_OFFSET)
            d.x = coords.x;

            // Now fetch the left crossing edges, two at a time using bilinear
            // filtering. Sampling at -0.25 (see @CROSSING_OFFSET) enables to
            // discern what value each edge has:
            let e1 = textureSampleLevel(edge, linear_sample, coords.xy, 0).r;

            // Find the distance to the right:
            coords.z = SMAASearchXRight(offset_0.zw, offset_2.y);
            d.y = coords.z;

            // We want the distances to be in pixel units (doing this here allow to
            // better interleave arithmetic and memory accesses):
            d = abs(round(screen_size.xx * d - pixcoord.xx));

            // SMAAArea below needs a sqrt, as the areas texture is compressed
            // quadratically:
            let sqrt_d = sqrt(d);

            // Fetch the right crossing edges:
            let e2 = textureSampleLevel(edge, linear_sample, coords.zy + vec2f(1, 0) * resolution, 0).r;

            // Ok, we know how this pattern looks like, now it is time for getting
            // the actual area:
            var c = SMAAArea(sqrt_d, e1, e2, f32(subsampleIndices.y));
            weights.r = c.x;
            weights.g = c.y;

            // // Fix corners:
            coords.y = texcoord.y;
            var fixed = SMAADetectHorizontalCornerPattern(weights.rg, coords.xyzy, d);
            weights.r = fixed.x;
            weights.g = fixed.y;
        }

        if e.r > 0.0 { // Edge at west
            var d: vec2f;

            // Find the distance to the top:
            var coords: vec3f;
            coords.y = SMAASearchYUp(offset_1.xy, offset_2.z);
            coords.x = offset_0.x;
            d.x = coords.y;

            // Fetch the top crossing edges:
            let e1 = textureSampleLevel(edge, linear_sample, coords.xy, 0).g;

            // Find the distance to the bottom:
            coords.z = SMAASearchYDown(offset_1.zw, offset_2.w);
            d.y = coords.z;

            // We want the distances to be in pixel units:
            d = abs(round(screen_size.yy * d - pixcoord.yy));

            // SMAAArea below needs a sqrt, as the areas texture is compressed 
            // quadratically:
            let sqrt_d = sqrt(d);

            // Fetch the bottom crossing edges:
            let e2 = textureSampleLevel(edge, linear_sample, coords.xz+ vec2f(0, 1) * resolution, 0).g;

            // Get the area for this direction:
            var c = SMAAArea(sqrt_d, e1, e2, f32(subsampleIndices.x));
            weights.b = c.x;
            weights.a = c.y;

            // Fix corners:
            coords.x = texcoord.x;
            var fixed = SMAADetectVerticalCornerPattern(weights.ba, coords.xyxz, d);
            weights.b = fixed.x;
            weights.a = fixed.y;
        }

        return weights;
    }
    `;

    const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
    const program = RenderServer.render_state.create_Program(shader, shader).expect();

    const pipeline = RenderServer.render_state.create_RenderPipeline(
        program,
        RenderServerRenderMaterial.ProgramStatePipelineTemplates[RenderServerRenderMaterialPass.Set],
        {
            ...RenderServerRenderMaterial.OutputStatePipelineTemplates[RenderServerRenderMaterialPass.Set],
            stencil_front: {
                compare: WebGPURenderStateDepthCompareFunc.NotEqual,
                pass_operator: WebGPURenderStateStencilOperator.Keep,
            },
            stencil_back: {
                compare: WebGPURenderStateDepthCompareFunc.Never,
            },
            stencil_read_mask: 0x80,
        },
        [RenderServer.world_env_uniform_layout, EffectSMAAWeightUniformLayout.get()],
        [
            {
                stride: 8, // 2 * 4
                per_instance: false,
                rows: [{
                    location: 0,
                    offset: 0,
                    type: WebGPURenderStateAttributeType.Vector2
                }]
            },
        ]
    ).expect();

    // mannually release shader and program
    shader.release();
    program.release();

    return pipeline;
});

const EffectSMAABlendUniformLayout = new RefCacher(() => {
    const layout = RenderServer.render_state.create_UniformLayout();
    layout.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.Float, WebGPURenderStateShaderType.Fragment, 0);
    layout.add_Sampler(WebGPURenderStateSamplerUniformType.Filter, WebGPURenderStateShaderType.Fragment, 1);
    return layout;
});

const EffectSMAABlendPipeline = new RefCacher(() => {
    const shader_code = `

    struct Attributes {
        @location(${RenderServerGeometryAttributeLocation.Position}) position: vec2f,
    };
    
    struct WorldEnvUniformCameraMatrix {
        camera_world: mat4x4f,
        camera_view: mat4x4f,
        camera_proj: mat4x4f,
        camera_inv_proj: mat4x4f,
        camera_norview: mat3x3f,
    }

    struct WorldEnvUniformParams {
        screen_size: vec2f,
        time: f32,
        orthogonal: u32,
        pixel_ratio: f32,
    }
    
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(0) var<uniform> world_env_uniform_camera_matrix: WorldEnvUniformCameraMatrix; 
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(1) var<uniform> world_env_uniform_params: WorldEnvUniformParams;
    
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) uv: vec2f,
        @location(1) offset: vec4f,
    };

    @vertex
    fn vs_main(attri: Attributes) -> VertexOutput {
        var out: VertexOutput;

	    var uv = attri.position / 2.0;
        var resolution = 1 / world_env_uniform_params.screen_size.xyxy;
        
        out.uv = vec2(uv.x, 1.0 - uv.y);
        out.position = vec4f(attri.position - vec2f(1.0), 1.0, 1.0);

        out.offset = out.uv.xyxy + resolution * vec4f(1.0, 0.0, 0.0, 1.0);

        return out;
    }

    struct FragmentOutput {
        @location(0) color: vec4f,
    };

    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(2) var weight: texture_2d<f32>;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(3) var normal: texture_2d<f32>;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(4) var depth: texture_depth_2d;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(5) var sample: sampler;

    @group(1) @binding(0) var raw_color: texture_2d<f32>; 
    @group(1) @binding(1) var raw_color_sample: sampler; 
    
    @fragment
    fn fs_main(vary: VertexOutput) -> FragmentOutput {
        var out: FragmentOutput;
        var resolution = 1 / world_env_uniform_params.screen_size.xy;

        // Fetch the blending weights for current pixel:
        var a: vec4f;
        a.x = textureSample(weight, raw_color_sample, vary.offset.xy).a; // Right
        a.y = textureSample(weight, raw_color_sample, vary.offset.zw).g; // Top
        var c = textureSample(weight, raw_color_sample, vary.uv); // Bottom / Left
        a.w = c.x;
        a.z = c.z;

        var linear_color: vec4f;

        // Is there any blending weight with a value greater than 0.0?
        if dot(a, vec4f(1.0, 1.0, 1.0, 1.0)) < 1e-5 {
            linear_color = textureSampleLevel(raw_color, raw_color_sample, vary.uv, 0);
        }
        else {
            var h = max(a.x, a.z) > max(a.y, a.w); // max(horizontal) > max(vertical)

            // Calculate the blending offsets:
            var blendingOffset = vec4f(0.0, a.y, 0.0, a.w);
            var blendingWeight = a.yw;
            blendingOffset = SMAAMovc4(vec4<bool>(h, h, h, h), blendingOffset, vec4f(a.x, 0.0, a.z, 0.0));
            blendingWeight = SMAAMovc2(vec2<bool>(h, h), blendingWeight, a.xz);
            blendingWeight /= dot(blendingWeight, vec2f(1.0, 1.0));

            // Calculate the texture coordinates:
            var blendingCoord = blendingOffset * vec4f(resolution, -resolution) + vary.uv.xyxy;

            // We exploit bilinear filtering to mix current pixel with the chosen
            // neighbor:
            var color = blendingWeight.x * textureSampleLevel(raw_color, raw_color_sample, blendingCoord.xy, 0);
            color += blendingWeight.y * textureSampleLevel(raw_color, raw_color_sample, blendingCoord.zw, 0);

            linear_color = color;
        }

        out.color = linear_color;
        return out;
    }

    fn SMAAMovc2(cond: vec2<bool>, variable: vec2f, value: vec2f) -> vec2f {
        return vec2f(
            select(variable.x, value.x, cond.x),
            select(variable.y, value.y, cond.y)
        );
    }

    fn SMAAMovc4(cond: vec4<bool>, variable: vec4f, value: vec4f) -> vec4f {
        return vec4f(
            SMAAMovc2(cond.xy, variable.xy, value.xy),
            SMAAMovc2(cond.zw, variable.zw, value.zw)
        );
    }
    `;

    const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
    const program = RenderServer.render_state.create_Program(shader, shader).expect();

    const pipeline = RenderServer.render_state.create_RenderPipeline(
        program,
        RenderServerRenderMaterial.ProgramStatePipelineTemplates[RenderServerRenderMaterialPass.Set],
        RenderServerRenderMaterial.OutputStatePipelineTemplates[RenderServerRenderMaterialPass.Set],
        [RenderServer.world_env_uniform_layout, EffectSMAABlendUniformLayout.get()],
        [
            {
                stride: 8, // 2 * 4
                per_instance: false,
                rows: [{
                    location: 0,
                    offset: 0,
                    type: WebGPURenderStateAttributeType.Vector2
                }]
            },
        ]
    ).expect();

    // mannually release shader and program
    shader.release();
    program.release();

    return pipeline;
});

export class SmaaPostprocessingResource extends PostprocessingResource {

    public get pass_count(): number { return 3; }

    protected readonly edge_pipeline_ref = new ReadonlyRef(EffectSMAAEdgePipeline.get());
    protected readonly weight_pipeline_ref = new ReadonlyRef(EffectSMAAWeightPipeline.get());
    protected readonly blend_pipeline_ref = new ReadonlyRef(EffectSMAABlendPipeline.get());
    protected readonly weight_uniform_group_ref: ReadonlyRef<WebGPURenderStateUniformGroup>;
    protected readonly blend_uniform_group_ref: ReadonlyRef<WebGPURenderStateUniformGroup>;

    constructor() {
        super();
        const sampler = RenderServer.get_TextureSampler(
            WebGPURenderStateTextureWrap.Clamp,
            WebGPURenderStateTextureWrap.Clamp,
            WebGPURenderStateTextureWrap.Clamp,
            WebGPURenderStateTextureFilter.Linear,
            WebGPURenderStateTextureFilter.Linear,
            WebGPURenderStateTextureFilter.Linear,
        );
        this.weight_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(EffectSMAAWeightUniformLayout.get()).expect());
        this.weight_uniform_group_ref.expect.set_Texture(0, EffectSMAAAreaTextureView.get());
        this.weight_uniform_group_ref.expect.set_Texture(1, EffectSMAASearchTextureView.get());
        this.weight_uniform_group_ref.expect.set_Sampler(2, sampler);
        this.blend_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(EffectSMAABlendUniformLayout.get()).expect());
        this.blend_uniform_group_ref.expect.set_Sampler(1, sampler);
    }

    public render_Pass(pass: number, encoder: GPURenderPassEncoder, color_texture_view: WebGPURenderStateTextureView, normal_texture_view: WebGPURenderStateTextureView, depth_texture_view: WebGPURenderStateTextureView): void {
        switch (pass) {
            case 0: {
                encoder.setStencilReference(0xff);
                encoder.setPipeline(this.edge_pipeline_ref.expect.pipeline);
                break;
            }
            case 1: {
                encoder.setStencilReference(0x00);
                encoder.setPipeline(this.weight_pipeline_ref.expect.pipeline);
                encoder.setBindGroup(1, this.weight_uniform_group_ref.expect.binding_group);
                break;
            }
            case 2: {
                this.blend_uniform_group_ref.expect.set_Texture(0, color_texture_view);
                encoder.setPipeline(this.blend_pipeline_ref.expect.pipeline);
                encoder.setBindGroup(1, this.blend_uniform_group_ref.expect.binding_group);
                break;
            }
            default: {
                break;
            }
        }
    }

    protected dispose(): void {
        this.edge_pipeline_ref.clear();
        this.weight_pipeline_ref.clear();
        this.blend_pipeline_ref.clear();
        this.weight_uniform_group_ref.clear();
        this.blend_uniform_group_ref.clear();
    }
}