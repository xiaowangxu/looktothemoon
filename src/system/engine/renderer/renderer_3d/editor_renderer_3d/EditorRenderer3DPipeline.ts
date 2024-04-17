import { Ref } from "@/system/utils/RefCounted";
import type { Config } from "../../../ConfiguredObject";
import type { EditorRenderer3D } from "./EditorRenderer3D";
import { Renderer3DPipeline } from "../Renderer3DPipeline";
import type { WebGL2RenderStateFrameBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateFrameBuffer";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { RenderStateBufferUsage, RenderStateDataType, RenderStateFrameBufferPart, RenderStatePrimitiveType, RenderStateShaderType, RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureMinFilter, RenderStateTextureMagFilter, RenderStateTextureType, RenderStateTextureWrap, RenderStateUniformType } from "@/system/sliverofstraw/RenderState";
import { WebGL2RenderStateFrameBufferAttachmentPoint } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { Cacher } from "@/system/utils/Cacher";
import { RenderDeviceVector2AttributeBuffer, RenderDeviceIndexAttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { WebGL2RenderStateFloatUniformSlot, WebGL2RenderStateIntUniformSlot, WebGL2RenderStateUintUniformSlot, WebGL2RenderStateVec4UniformSlot } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateUniformSlot";
import { RenderServerDevice } from "../../../render_server/RenderServer";
import { RenderServerShaderPass } from "../../../render_server/RenderServerShader";
import { RenderServerMaterialCullFace } from "../../../render_server/RenderServerMaterial";
import type { Viewport } from "../../../nodes/Node";
import type { World3D } from "../../../worlds/world3ds/World3D";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { Color } from "@/system/fivepebble/graphics/Color";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { RenderServerGeometry } from "@/system/engine/render_server/RenderServerGeometry";
import { GlslPrimitives } from "@/system/engine/resources/material_resources/Primitives";

// #region quad surface

const QuadGeometry = new Cacher((config: Config) => {
    const quad_position = new RenderDeviceVector2AttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [
		/* 0 */Vector2.create(-1, 1),			//   1  0 ------ 2
		/* 1 */Vector2.create(-1, -1),		//   |  |        |
		/* 2 */Vector2.create(1, 1),			//   |  |        |
		/* 3 */Vector2.create(1, -1),			//  -1  1 ------ 3
        /*                        *///     -1 ------ 1
    ]);
    const quad_index = new RenderDeviceIndexAttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [0, 1, 2, 3]);
    const quad_surface = config.render_server.create_Geometry();
    quad_surface.set_Geometry(RenderStatePrimitiveType.TriangleStrip, { position: quad_position }, quad_index);
    return new Ref(quad_surface);
});

// #endregion

// #region quad shader

const quad_vert_shader_code = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

out vec2 v_uv;

void main() {
	gl_Position = vec4(a_position, 1.0, 1.0);
	v_uv = (a_position + 1.0) / 2.0;
}`;

const QuadVertexShader = new Cacher((config: Config) => {
    const quad_vert_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Vertex, quad_vert_shader_code).expect();
    return new Ref(quad_vert_shader);
});

// #endregion

// #region on screen

const onscreen_frag_shader_code = `#version 300 es
precision highp float;

${GlslPrimitives.WorldUniforms}

in vec2 v_uv;

uniform sampler2D u_screen;
uniform bool u_colormap;

layout(location = 0) out vec4 o_color;

void main() {
	o_color = vec4(texture(u_screen, vec2(v_uv.x, v_uv.y)).rgba);
}`;

const OnscreenProgramUniform = new Cacher((config: Config) => {
    const onscreen_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, onscreen_frag_shader_code).expect();
    const onscreen_program = config.render_server.render_state.create_Program(QuadVertexShader.get(config).expect, onscreen_frag_shader).expect();
    const program = new Ref(onscreen_program);

    const uniform_screen_slot = config.render_server.render_state.create_ProgramUniform(onscreen_program, 'u_screen', RenderStateUniformType.Int, 0).expect();
    uniform_screen_slot.commit();
    uniform_screen_slot.dispose();

    return program;
});

// #endregion

// #region oit composite

const oit_frag_shader_code = `#version 300 es
precision highp float;

${GlslPrimitives.WorldUniforms}

uniform sampler2D u_color;
uniform sampler2D u_accum;
uniform bool u_colormap;

in vec2 v_uv;

layout(location = 0) out vec4 o_color;

void main() {
	ivec2 uv = ivec2(v_uv * SCREEN_SIZE);
	vec4 color = texelFetch(u_color, uv, 0);
	float color_a = 1.0 - color.a;
	float a = texelFetch(u_accum, uv, 0).r;
	o_color = vec4(color_a * color.rgb / max(a, 0.00001), color_a);
}`;

const OiTPorgramUniform = new Cacher((config: Config) => {
    const oit_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, oit_frag_shader_code).expect();
    const oit_program = config.render_server.render_state.create_Program(QuadVertexShader.get(config).expect, oit_frag_shader).expect();
    const program = new Ref(oit_program);

    const uniform_oit_color_slot = config.render_server.render_state.create_ProgramUniform(oit_program, 'u_color', RenderStateUniformType.Int, 0).expect();
    uniform_oit_color_slot.commit();
    uniform_oit_color_slot.dispose();

    const uniform_oit_accum_slot = config.render_server.render_state.create_ProgramUniform(oit_program, 'u_accum', RenderStateUniformType.Int, 1).expect();
    uniform_oit_accum_slot.commit();
    uniform_oit_accum_slot.dispose();

    return program;
});

// #endregion

// #region highlight

const highlight_frag_shader_code = `#version 300 es
precision highp float;

${GlslPrimitives.WorldUniforms}
${GlslPrimitives.Constants}

in vec2 v_uv;

uniform sampler2D u_depth;
uniform sampler2D u_scene_depth;
uniform vec4 u_color;
uniform float u_line_width;

layout(location = 0) out vec4 o_color;

bool is_visible(const vec2 uv) {
    return (texture(u_depth, uv).r + 1.0) / 2.0 < 0.999999;
}

void main() {
    vec2 pixel_uv_size = vec2(1.0, 1.0) / SCREEN_SIZE;
    bool base_visible = is_visible(v_uv);
    float line_width = u_line_width * PIXEL_RATIO;
    float line_width_sqrt = line_width * SQRT2 / 2.0;
    float line_width_cos = 0.92387953251 * line_width;
    float line_width_sin = 0.38268343236 * line_width;
    bool visible = 
                   is_visible(v_uv + vec2(0.0, pixel_uv_size.y) * line_width) ||
                   is_visible(v_uv + vec2(0.0, pixel_uv_size.y) * -line_width) ||
                   is_visible(v_uv + vec2(pixel_uv_size.x, 0.0) * line_width) ||
                   is_visible(v_uv + vec2(pixel_uv_size.x, 0.0) * -line_width) ||
                   is_visible(v_uv + pixel_uv_size * line_width_sqrt) ||
                   is_visible(v_uv + vec2(-pixel_uv_size.x, pixel_uv_size.y) * line_width_sqrt) ||
                   is_visible(v_uv + vec2(pixel_uv_size.x, -pixel_uv_size.y) * line_width_sqrt) ||
                   is_visible(v_uv + vec2(-pixel_uv_size.x, -pixel_uv_size.y) * line_width_sqrt) 

                    ||

                   is_visible(v_uv + pixel_uv_size * vec2(line_width_cos, line_width_sin)) ||
                   is_visible(v_uv + pixel_uv_size * vec2(-line_width_cos, line_width_sin)) ||
                   is_visible(v_uv + pixel_uv_size * vec2(line_width_sin, line_width_cos)) ||
                   is_visible(v_uv + pixel_uv_size * vec2(-line_width_sin, line_width_cos)) ||
                   is_visible(v_uv + pixel_uv_size * vec2(line_width_cos, -line_width_sin)) ||
                   is_visible(v_uv + pixel_uv_size * vec2(-line_width_cos, -line_width_sin)) ||
                   is_visible(v_uv + pixel_uv_size * vec2(line_width_sin, -line_width_cos)) ||
                   is_visible(v_uv + pixel_uv_size * vec2(-line_width_sin, -line_width_cos))
    ;
	o_color = vec4(u_color.rgb, (visible && !base_visible) ? u_color.a : 0.0);
}`;

const HighlightProgramUniform = new Cacher((config: Config) => {
    const highlight_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, highlight_frag_shader_code).expect();
    const highlight_program = config.render_server.render_state.create_Program(QuadVertexShader.get(config).expect, highlight_frag_shader).expect();
    const program = new Ref(highlight_program);

    const uniform_depth_slot = config.render_server.render_state.create_ProgramUniform(highlight_program, 'u_depth', RenderStateUniformType.Int, 0).expect();
    uniform_depth_slot.commit();
    uniform_depth_slot.dispose();

    // const uniform_screen_slot = config.render_server.render_state.create_ProgramUniform(highlight_program, 'u_scene_depth', RenderStateUniformType.Int, 1).expect();
    // uniform_screen_slot.commit();
    // uniform_screen_slot.dispose();

    const uniform_color_slot = config.render_server.render_state.create_ProgramUniform(highlight_program, 'u_color', RenderStateUniformType.Vec4, Vector4.create(1.0, 0.0, 0.0, 1.0)).expect();
    uniform_color_slot.commit();

    const uniform_line_width_slot = config.render_server.render_state.create_ProgramUniform(highlight_program, 'u_line_width', RenderStateUniformType.Float, 2.0).expect();
    uniform_line_width_slot.commit();

    return { program, uniform_color_slot: new Ref(uniform_color_slot), uniform_line_width_slot: new Ref(uniform_line_width_slot) };
});

// #endregion

// #region sky

const skydome_frag_shader_code = `#version 300 es
precision highp float;
precision highp usampler2DArray;
precision highp sampler3D;

const float PI = 3.1415926535;
const float TAU = 6.283185307;
const float EPSILON = 0.00001;

${GlslPrimitives.WorldUniforms}

in vec2 v_uv;

uniform sampler2D sky;

${GlslPrimitives.FragmentFrameSolidOuts}

void main() {
    vec4 view = CAMERA_INV_PROJECTION * vec4((v_uv * 2.0 - 1.0), 1.0, 1.0);
    vec3 NORMAL_VIEW = CAMERA_IS_ORTH ? vec3(0.0, 0.0, 1.0) : -normalize(view.xyz);
    vec4 dir = mat4(mat3(CAMERA_WORLD)) * view;
    vec3 R = normalize(dir.xyz);
    float theta = atan(R.z, R.x);
    float gamma = acos(R.y);
    vec4 sky_color = texture(sky, vec2(theta / TAU + 0.5, gamma / PI));
    o_color = mix(BACKGROUND_COLOR, sky_color, float(USE_SKY));
    o_normal = vec4(NORMAL_VIEW, 1.0);
}
`;

const SkyDomeProgram = new Cacher((config: Config) => {
    const skydome_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, skydome_frag_shader_code).expect();
    const skydome_program = config.render_server.render_state.create_Program(QuadVertexShader.get(config).expect, skydome_frag_shader).expect();
    config.render_server.setup_ProgramUniformBlocks(skydome_program);
    const program = new Ref(skydome_program);

    const uniform_sky_slot = config.render_server.render_state.create_ProgramUniform(skydome_program, 'sky', RenderStateUniformType.Int, RenderServerDevice.SkyTextureUnit).expect();
    uniform_sky_slot.commit();
    uniform_sky_slot.dispose();

    return program;
});

// #endregion

// #region postprocessing fxaa

const fxaa_vert_shader_code = `#version 300 es
precision highp float;

${GlslPrimitives.WorldUniforms}

layout(location = 0) in vec2 a_position;

out vec2 v_frag_coord;
out vec2 v_rgbNW;
out vec2 v_rgbNE;
out vec2 v_rgbSW;
out vec2 v_rgbSE;
out vec2 v_rgbM;

void texcoords(vec2 fragCoord, vec2 resolution, out vec2 v_rgbNW, out vec2 v_rgbNE, out vec2 v_rgbSW, out vec2 v_rgbSE, out vec2 v_rgbM) {
	  vec2 inverseVP = 1.0 / resolution.xy;
	  v_rgbNW = (fragCoord + vec2(-1.0, -1.0)) * inverseVP;
	  v_rgbNE = (fragCoord + vec2(1.0, -1.0)) * inverseVP;
	  v_rgbSW = (fragCoord + vec2(-1.0, 1.0)) * inverseVP;
	  v_rgbSE = (fragCoord + vec2(1.0, 1.0)) * inverseVP;
	  v_rgbM = vec2(fragCoord * inverseVP);
}

void main() {
    v_frag_coord = (a_position + 1.0) / 2.0 * SCREEN_SIZE;
    texcoords(v_frag_coord, SCREEN_SIZE , v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);
	  gl_Position = vec4(a_position, 1.0, 1.0);
}`;

const fxaa_frag_shader_code = `#version 300 es
precision highp float;

${GlslPrimitives.WorldUniforms}

uniform sampler2D u_screen;
uniform bool u_colormap;

in vec2 v_frag_coord;
in vec2 v_rgbNW;
in vec2 v_rgbNE;
in vec2 v_rgbSW;
in vec2 v_rgbSE;
in vec2 v_rgbM;

layout(location = 0) out vec4 o_color;

#ifndef FXAA_REDUCE_MIN
    #define FXAA_REDUCE_MIN   (1.0/ 128.0)
#endif
#ifndef FXAA_REDUCE_MUL
    #define FXAA_REDUCE_MUL   (1.0 / 8.0)
#endif
#ifndef FXAA_SPAN_MAX
    #define FXAA_SPAN_MAX     8.0
#endif

//To save 9 dependent texture reads, you can compute
//these in the vertex shader and use the optimized
//frag.glsl function in your frag shader. 

//This is best suited for mobile devices, like iOS.

//optimized version for mobile, where dependent 
//texture reads can be a bottleneck
vec4 fxaa(sampler2D tex, vec2 fragCoord, vec2 resolution,
            vec2 v_rgbNW, vec2 v_rgbNE, 
            vec2 v_rgbSW, vec2 v_rgbSE, 
            vec2 v_rgbM) {
    vec4 color;
    vec2 inverseVP = vec2(1.0) / resolution;
    vec3 rgbNW = texture(tex, v_rgbNW).xyz;
    vec3 rgbNE = texture(tex, v_rgbNE).xyz;
    vec3 rgbSW = texture(tex, v_rgbSW).xyz;
    vec3 rgbSE = texture(tex, v_rgbSE).xyz;
    vec4 texColor = texture(tex, v_rgbM);
    vec3 rgbM  = texColor.xyz;
    vec3 luma = vec3(0.2126729,  0.7151522, 0.0721750);
    float lumaNW = dot(rgbNW, luma);
    float lumaNE = dot(rgbNE, luma);
    float lumaSW = dot(rgbSW, luma);
    float lumaSE = dot(rgbSE, luma);
    float lumaM  = dot(rgbM,  luma);
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));
    
    vec2 dir;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));
    
    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *
                          (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);
    
    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
              max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
              dir * rcpDirMin)) * inverseVP;
    
    vec3 rgbA = 0.5 * (
        texture(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz +
        texture(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);
    vec3 rgbB = rgbA * 0.5 + 0.25 * (
        texture(tex, fragCoord * inverseVP + dir * -0.5).xyz +
        texture(tex, fragCoord * inverseVP + dir * 0.5).xyz);

    float lumaB = dot(rgbB, luma);
    if ((lumaB < lumaMin) || (lumaB > lumaMax))
        color = vec4(rgbA, texColor.a);
    else
        color = vec4(rgbB, texColor.a);
    return color;
}

void main() {
	o_color = fxaa(u_screen, v_frag_coord, SCREEN_SIZE, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);
    if (u_colormap) {
        float r = o_color.r;
        o_color.r = r <= 0.0031308 ? (12.92 * r) : (1.055 * pow(r, 1.0 / 2.4) - 0.055);
        float g = o_color.g;
        o_color.g = g <= 0.0031308 ? (12.92 * g) : (1.055 * pow(g, 1.0 / 2.4) - 0.055);
        float b = o_color.b;
        o_color.b = b <= 0.0031308 ? (12.92 * b) : (1.055 * pow(b, 1.0 / 2.4) - 0.055);
    }
}`;

// const fxaa_frag_shader_code = `#version 300 es
// precision highp float;

// // https://www.zhihu.com/question/56111556/answer/2786741301

// ${GlslPrimitives.WorldUniforms}

// const float ContrastThreshold = 0.05;
// const float RelativeThreshold = 0.4;

// uniform sampler2D u_screen;
// uniform bool u_colormap;

// in vec2 v_uv;

// layout(location = 0) out vec4 o_color;

// float linear_to_luminance(vec3 rgb)
// {
//     return dot(rgb, vec3(0.1126729,  0.8151522, 0.0721750));
// }

// vec4 sample_screen(vec2 uv, float shift_x, float shift_y) {
//     vec4 color = texture(u_screen, uv + vec2(shift_x, shift_y));
//     if (u_colormap) {
//         float r = color.r;
//         color.r = r <= 0.0031308 ? (12.92 * r) : (1.055 * pow(r, 1.0 / 2.4) - 0.055);
//         float g = color.g;
//         color.g = g <= 0.0031308 ? (12.92 * g) : (1.055 * pow(g, 1.0 / 2.4) - 0.055);
//         float b = color.b;
//         color.b = b <= 0.0031308 ? (12.92 * b) : (1.055 * pow(b, 1.0 / 2.4) - 0.055);
//     }
//     return color;
// }

// float sample_luminance(vec2 uv, float shift_x, float shift_y)
// {
//     return linear_to_luminance(texture(u_screen, uv + vec2(shift_x, shift_y)).rgb);
// }

// struct LuminanceData {
//     float m, n, e, s, w;
//     float ne, nw, se, sw;
//     float highest, lowest, contrast;
// };

// LuminanceData sample_luminance_neighborhood(vec2 uv) {
//     vec2 pixel_size = 1.0 / SCREEN_SIZE;

//     LuminanceData l;

//     l.m  = sample_luminance(uv,          0.0,           0.0);
//     l.n  = sample_luminance(uv,          0.0,  pixel_size.y);
//     l.e  = sample_luminance(uv, pixel_size.x,           0.0);
//     l.s  = sample_luminance(uv,          0.0, -pixel_size.y);
//     l.w  = sample_luminance(uv,-pixel_size.x,           0.0);
//     l.ne = sample_luminance(uv, pixel_size.x,  pixel_size.y);
//     l.nw = sample_luminance(uv,-pixel_size.x,  pixel_size.y);
//     l.se = sample_luminance(uv, pixel_size.x, -pixel_size.y);
//     l.sw = sample_luminance(uv,-pixel_size.x, -pixel_size.y);

//     l.highest = max(max(max(max(l.n, l.e), l.s), l.w), l.m);
//     l.lowest = min(min(min(min(l.n, l.e), l.s), l.w), l.m);

//     l.contrast = l.highest - l.lowest;

//     return l;
// }

// bool skip_pixel (LuminanceData l) {
//     float threshold = max(ContrastThreshold, RelativeThreshold * l.highest);
//     return l.contrast < threshold;
// }

// float blend_factor(LuminanceData l) {
//     float blend = 2.0 * (l.n + l.e + l.s + l.w);
//     blend += l.ne + l.nw + l.se + l.sw;
//     blend *= 1.0 / 12.0;
//     blend = abs(blend - l.m);
//     blend = clamp(blend / l.contrast, 0.0, 1.0);
//     return blend;
//     // float blend_factor = smoothstep(0.0, 1.0, blend);
//     // return blend_factor * blend_factor;
// }

// struct EdgeData {
//     float pixel_step; 
//     bool is_horizontal;
// };

// EdgeData determine_edge (LuminanceData l) {
//     EdgeData e;

//     float horizontal =
//         abs(l.n + l.s - 2.0 * l.m) * 2.0 +
//         abs(l.ne + l.se - 2.0 * l.e) +
//         abs(l.nw + l.sw - 2.0 * l.w);
//     float vertical =
//         abs(l.e + l.w - 2.0 * l.m) * 2.0 +
//         abs(l.ne + l.nw - 2.0 * l.n) +
//         abs(l.se + l.sw - 2.0 * l.s);

//     e.is_horizontal = horizontal >= vertical;

//     vec2 pixel_size = 1.0 / SCREEN_SIZE;
//     e.pixel_step = e.is_horizontal ? pixel_size.y : pixel_size.x;
//     float positive = abs((e.is_horizontal ? l.n : l.e) - l.m);
//     float negative = abs((e.is_horizontal ? l.s : l.w) - l.m);
//     if(positive < negative) e.pixel_step = -e.pixel_step;

//     return e;
// }

// vec4 fxaa(vec2 uv) {
//     LuminanceData l = sample_luminance_neighborhood(uv);
//     if (skip_pixel(l)) {
//         return sample_screen(uv, 0.0, 0.0);
//     }
//     float pixel_blend = blend_factor(l);
//     EdgeData e = determine_edge(l);
//     float shift_x = 0.0;
//     float shift_y = 0.0;
//     if (e.is_horizontal) {
//         shift_y = e.pixel_step * pixel_blend;
//     }
//     else {
//         shift_x = e.pixel_step * pixel_blend;
//     }
//     return vec4(sample_screen(uv, shift_x, shift_y).rgb, 1.0);
// }

// void main() {
//     LuminanceData l = sample_luminance_neighborhood(v_uv);
//     EdgeData e = determine_edge(l);
//     bool skip = skip_pixel(l);
//     vec3 color = skip ? vec3(0.0) : e.is_horizontal ? vec3(1.0, 0.0, 0.0) : vec3(1.0);
// 	o_color = vec4(color, 1.0);

// 	o_color = fxaa(v_uv);
// }`;

const FxaaProgram = new Cacher((config: Config) => {
    const fxaa_vert_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Vertex, fxaa_vert_shader_code).expect();
    const fxaa_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, fxaa_frag_shader_code).expect();
    const fxaa_program = config.render_server.render_state.create_Program(fxaa_vert_shader /*QuadVertexShader.get(config).expect*/, fxaa_frag_shader).expect();
    const program = new Ref(fxaa_program);

    const uniform_screen_slot = config.render_server.render_state.create_ProgramUniform(fxaa_program, 'u_screen', RenderStateUniformType.Int, 0).expect();
    uniform_screen_slot.commit();
    uniform_screen_slot.dispose();

    const uniform_colormap_slot = config.render_server.render_state.create_ProgramUniform(fxaa_program, 'u_colormap', RenderStateUniformType.Bool, false).expect();
    uniform_colormap_slot.commit();

    return { program, uniform_colormap_slot: new Ref(uniform_colormap_slot) };
});

// #endregion

//#region discard

// #region ssao

// let str = '';
// for (let i = 0; i < 64; i++) {
//     const x = Math.random() * 2.0 - 1.0;
//     const y = Math.random();
//     const z = Math.random() * 2.0 - 1.0;
//     const sample = vec3(x, y, z).normalize();
//     sample.mult_Number(Math.random());
//     str += `\nvec3(${sample.x},${sample.y},${sample.z}),`;
// }
// console.log(str);

// const ssao_frag_shader_code = `#version 300 es
// precision highp float;

// ${GlslPrimitives.Constants}

// ${GlslPrimitives.WorldUniforms}

// in vec2 v_uv;

// uniform sampler2D u_depth;
// uniform sampler2D u_normal;

// const float bias = 0.025;
// const float radius = 0.5;
// const int kernelSize = 64;
// const vec3 samples[kernelSize] = vec3[](
//     vec3(-0.6461535025531936,0.3415344845091158,0.6825246127645016),
//     vec3(0.21316628344767577,-0.623366284516482,0.7523128411300857),
//     vec3(0.3799144135773504,0.024133323545212117,0.924706775713707),
//     vec3(-0.08423802786032628,-0.8570409587920366,0.508315600404935),
//     vec3(0.009846245178737214,0.47599411945621445,0.8793933418550447),
//     vec3(-0.8855378614254795,-0.33440506396940356,0.3224840293310777),
//     vec3(0.08555443733251479,-0.6294937180380744,0.7722810998615194),
//     vec3(0.706550302187274,0.6921413241323758,0.14740101053708285),
//     vec3(-0.5599783319468491,0.5745346195806277,0.5969373825229644),
//     vec3(0.1700456217488921,0.637026876091111,0.7518518774743022),
//     vec3(-0.640420420967183,0.08269414241711674,0.7635596657878895),
//     vec3(-0.37719919359879706,0.19630480692985658,0.9050884990566663),
//     vec3(0.4025581250773821,-0.627372571804153,0.6665962886800567),
//     vec3(0.18507612333267376,-0.78564176421444,0.5903506135290887),
//     vec3(0.20188305726290817,0.6607471409713764,0.722949823216199),
//     vec3(0.6294354710752066,0.09537512675236554,0.7711773939563471),
//     vec3(0.47081107921457804,-0.7573287198248655,0.4525374435527238),
//     vec3(0.5477404357334903,0.5174077002302778,0.6574721947009633),
//     vec3(0.2711279470778007,-0.4505144114982932,0.8506035512186179),
//     vec3(-0.4537535112805829,0.471738817080832,0.7560226448061721),
//     vec3(0.16784231845837558,0.9694285697537001,0.17898939711561884),
//     vec3(-0.5414292136449984,-0.0035888610577260146,0.8407386791911428),
//     vec3(0.7540838436876407,0.3781096272305008,0.5370201732569136),
//     vec3(0.26390041862393865,0.6251155536734335,0.7345659355059059),
//     vec3(0.1814880691005595,-0.5894612083651781,0.7871451991893329),
//     vec3(0.6161940362909589,0.18260516995136772,0.7661333183894881),
//     vec3(0.08261796006877171,0.9756301732826078,0.20327330777705066),
//     vec3(-0.7873137209948928,0.3886473002533235,0.4786338691933314),
//     vec3(-0.6834760573685718,0.7295988291725818,0.02336723077111548),
//     vec3(-0.3716528441089272,-0.3549713260160245,0.8578283751264996),
//     vec3(0.6399379411027141,-0.2591665717591502,0.7234031515136139),
//     vec3(-0.6358320462419872,-0.7425152725669697,0.210686209744554),
//     vec3(0.8325322102368441,0.44429714454223834,0.33089298310748216),
//     vec3(-0.6562251874395587,-0.4865345249134194,0.5767604870630347),
//     vec3(0.2680331623525847,0.929292549425359,0.25411332405403214),
//     vec3(0.6107612797017136,-0.17009768026534314,0.7733288035405601),
//     vec3(0.6923427993585343,0.5073835870215343,0.5130529639301868),
//     vec3(-0.17937879186262323,-0.8967413978834633,0.40457151945226916),
//     vec3(-0.23525951208887652,0.6746932063076695,0.699601343147639),
//     vec3(-0.717189546295273,0.6951308175358738,0.04931836571388366),
//     vec3(0.9676944961419178,0.2181253237212629,0.12644645225602),
//     vec3(-0.949297253866882,0.304422069391244,0.0784979456313922),
//     vec3(0.8742329846002038,-0.23289970168584567,0.4259981427091718),
//     vec3(0.3647441448601729,0.7354733923131597,0.5709996479767694),
//     vec3(0.3154811337040074,-0.7597761996194768,0.568517177197505),
//     vec3(-0.6593422130955403,-0.7514469825106265,0.02439832998279667),
//     vec3(0.2553875748271308,-0.6900798392501166,0.6771757542059889),
//     vec3(-0.10838678854633545,-0.6915280575627578,0.7141717228174825),
//     vec3(0.33617729000362245,-0.9023426297322606,0.2697454508489227),
//     vec3(0.7150513514953425,0.25996391592094736,0.6489378453625054),
//     vec3(-0.4916618314675892,0.7366527364019604,0.4643397349241608),
//     vec3(0.1597354967506508,0.380251895968289,0.9109846687460467),
//     vec3(-0.36640774864824965,-0.7297541814074718,0.577238422533386),
//     vec3(-0.1659754649141276,-0.3679361429598238,0.9149181054883477),
//     vec3(0.4520723191074955,0.49008498157084934,0.7452833884741233),
//     vec3(-0.4317767545374975,0.7061727986106393,0.5611495457928155),
//     vec3(-0.6788326630325183,0.19782778976736792,0.7071424051744722),
//     vec3(-0.2626542813285348,0.7690145897308462,0.582777220969462),
//     vec3(-0.6992155958314731,0.5177923208294436,0.49293880252633454),
//     vec3(-0.668810351925821,-0.732322243037798,0.1280501679379906),
//     vec3(0.6501589946906978,-0.6001596259214834,0.46594173995958554),
//     vec3(0.5845334015542828,-0.6841744036050019,0.4361491578796405),
//     vec3(0.6823074466804337,-0.48978982693520084,0.5427360994398778),
//     vec3(0.6255710141037082,-0.4906184897928708,0.6065924527939832)
// );

// layout(location = 0) out vec4 o_color;

// vec3 get_world_pos(in vec2 uv, float depth) {
//     vec4 clip_pos = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
//     vec4 view_pos = CAMERA_INV_PROJECTION * clip_pos;

//     view_pos /= view_pos.w;

//     vec4 world_pos = CAMERA_WORLD * view_pos;

//     return world_pos.xyz;
// }

// //generating noise/pattern texture for dithering
// vec3 rand(vec2 coord) {
//     float width = SCREEN_SIZE.x;
//     float height = SCREEN_SIZE.y;
//     float noiseX = ((fract(1.0-coord.s*(width/2.0))*0.25)+(fract(coord.t*(height/2.0))*0.75))*2.0-1.0;
//     float noiseY = ((fract(1.0-coord.s*(width/2.0))*0.75)+(fract(coord.t*(height/2.0))*0.25))*2.0-1.0;
//     float noiseZ = ((fract(1.0-coord.s*(width/2.0))*0.5)+(fract(coord.t*(height/2.0))*0.5))*2.0-1.0;
//     noiseX = clamp(fract(sin(dot(coord ,vec2(12.9898,78.233))) * 43758.5453),0.0,1.0)*2.0-1.0;
//     noiseY = clamp(fract(sin(dot(coord ,vec2(12.9898,78.233)*2.0)) * 43758.5453),0.0,1.0)*2.0-1.0;
//     noiseZ = clamp(fract(sin(dot(coord ,vec2(12.9898,78.233)*3.0)) * 43758.5453),0.0,1.0)*2.0-1.0;
//     return vec3(noiseX, noiseY, noiseZ) * 0.002;
// }

// void main() {
//     vec2 noiseScale = SCREEN_SIZE / 4.0; // screen = 800x600
    
//     float depth = texture(u_depth, v_uv).r;
//     float sampleDepth = depth * 2.0 - 1.0;
//     vec3 fragPos   = get_world_pos(v_uv, depth);
//     vec3 normal    = texture(u_normal, v_uv).rgb;
//     vec3 randomVec = rand(v_uv);

//     vec3 tangent   = normalize(randomVec - normal * dot(randomVec, normal));
//     vec3 bitangent = cross(normal, tangent);
//     mat3 TBN       = mat3(tangent, bitangent, normal);

//     float occlusion = 0.0;
//     for(int i = 0; i < kernelSize; ++i)
//     {
//         // get sample position
//         vec3 samplePos = TBN * samples[i]; // from tangent to view-space
//         samplePos = fragPos + samplePos * radius; 

//         vec4 offset = vec4(samplePos, 1.0);
//         offset      = CAMERA_PROJECTION * CAMERA_VIEW * offset;    // from view to clip-space
//         offset.xyz /= offset.w;               // perspective divide
//         offset.xyz  = offset.xyz * 0.5 + 0.5; // transform to range 0.0 - 1.0

//         occlusion += (abs(sampleDepth - samplePos.z) <= bias ? 1.0 : 0.0);
//     }

//     occlusion = (occlusion / float(kernelSize));
//     o_color = vec4(0.0, 0.0, 0.0, occlusion);

//     // o_color = vec4(texture(u_normal, v_uv).rgb, 1.0);
//     // o_color = vec4(fragPos, 1.0);
// }`;

// const SSAOProgramUniform = new Cacher((config: Config) => {
//     const ssao_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, ssao_frag_shader_code).expect();
//     const ssao_program = config.render_server.render_state.create_Program(QuadVertexShader.get(config).expect, ssao_frag_shader).expect();

//     const uniform_depth_location = config.render_server.render_state.get_ProgramUniformLocation(ssao_program, 'u_depth');
//     const uniform_depth_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, ssao_program, uniform_depth_location!, 0);
//     uniform_depth_slot.commit();

//     const uniform_normal_location = config.render_server.render_state.get_ProgramUniformLocation(ssao_program, 'u_normal');
//     const uniform_normal_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, ssao_program, uniform_normal_location!, 1);
//     uniform_normal_slot.commit();

//     return ssao_program;
// });

// #endregion

// #region fog

// const fog_frag_shader_code = `#version 300 es
// precision highp float;

// ${GlslPrimitives.Constants}

// ${GlslPrimitives.WorldUniforms}

// in vec2 v_uv;

// uniform sampler2D u_depth;
// uniform sampler2D u_normal;

// layout(location = 0) out vec4 o_color;

// void main() {
//     float depth = texture(u_depth, v_uv).r;
//     o_color = vec4(vec3(0.95, 0.95, 0.95), pow(depth, 10.0));
// }`;

// const FogProgramUniform = new Cacher((config: Config) => {
//     const fog_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, fog_frag_shader_code).expect();
//     const fog_program = config.render_server.render_state.create_Program(QuadVertexShader.get(config).expect, fog_frag_shader).expect();

//     const uniform_depth_location = config.render_server.render_state.get_ProgramUniformLocation(fog_program, 'u_depth');
//     const uniform_depth_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, fog_program, uniform_depth_location!, 0);
//     uniform_depth_slot.commit();

//     const uniform_normal_location = config.render_server.render_state.get_ProgramUniformLocation(fog_program, 'u_normal');
//     const uniform_normal_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, fog_program, uniform_normal_location!, 1);
//     uniform_normal_slot.commit();

//     return fog_program;
// });

// #endregion

//#endregion

export class EditorRenderer3DPipeline extends Renderer3DPipeline {
    private get render_server() { return this.config.render_server; }

    //#region Solid

    //#region Frame Buffer
    private readonly solid_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly solid_1_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    //#endregion

    //#region Texture
    private readonly solid_color_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    private readonly solid_normal_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    private readonly solid_depth_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    private readonly solid_color_1_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    private readonly solid_normal_1_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    private readonly solid_depth_1_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    //#endregion

    //#endregion

    //#region Transaprent

    //#region Frame Buffer
    private readonly transparent_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly transparent_1_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly transparent_depth_normal_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    //#endregion

    //#region Texture
    private readonly transparent_color_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    private readonly transparent_accum_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    //#endregion

    //#endregion

    //#region Highlight

    //#region Frame Buffer
    private readonly highlight_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    //#endregion

    //#region Texture
    private readonly highlight_depth_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    //#endregion

    //#endregion

    //#region Result

    //#region Frame Buffer
    private readonly result_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    //#endregion

    //#region Texture
    private readonly result_color_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    //#endregion

    //#endregion

    //#region Postprocessing

    //#region Frame Buffer
    private readonly postprocessing_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly postprocessing_1_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    //#endregion

    //#region Texture
    private readonly postprocessing_color_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    private readonly postprocessing_color_1_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    //#endregion

    //#endregion

    public get texture() { return this.postprocessing_color_texture.expect; }

    private alloc_Solid() {
        // frame buffer
        this.solid_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.solid_1_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();

        // texture
        this.solid_color_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.solid_normal_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.solid_depth_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.D32F, 0, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();

        this.solid_color_1_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.solid_normal_1_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.solid_depth_1_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.D32F, 0, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
       
        this.resize_Solid();

        // link frame buffer
        this.render_server.render_state.set_FrameBufferAttachment(this.solid_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.solid_color_texture.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.solid_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color1, this.solid_normal_texture.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.solid_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, this.solid_depth_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.solid_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.solid_1_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.solid_color_1_texture.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.solid_1_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color1, this.solid_normal_1_texture.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.solid_1_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, this.solid_depth_1_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.solid_1_framebuffer.expect);
    }

    private resize_Solid() {
        this.render_server.render_state.alloc_Texture2D(this.solid_color_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.RGBA);
        this.render_server.render_state.alloc_Texture2D(this.solid_normal_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.RGBA);
        this.render_server.render_state.alloc_Texture2D(this.solid_depth_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.Depth);
        this.render_server.render_state.alloc_Texture2D(this.solid_color_1_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.RGBA);
        this.render_server.render_state.alloc_Texture2D(this.solid_normal_1_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.RGBA);
        this.render_server.render_state.alloc_Texture2D(this.solid_depth_1_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.Depth);
    }

    private alloc_Transparent() {
        // frame buffer
        this.transparent_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.transparent_1_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.transparent_depth_normal_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();

        // texture
        this.transparent_color_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.transparent_accum_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.R32F, 0, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();

        this.resize_Transparent();

        // link frame buffer
        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.transparent_color_texture.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color1, this.transparent_accum_texture.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, this.solid_depth_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.transparent_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_1_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.transparent_color_texture.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_1_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color1, this.transparent_accum_texture.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_1_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, this.solid_depth_1_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.transparent_1_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_depth_normal_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, this.solid_depth_texture.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_depth_normal_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color1, this.solid_normal_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.transparent_depth_normal_framebuffer.expect);
    }

    private resize_Transparent() {
        this.render_server.render_state.alloc_Texture2D(this.transparent_color_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.RGBA);
        this.render_server.render_state.alloc_Texture2D(this.transparent_accum_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.Red);
    }

    private alloc_Highlight() {
        // frame buffer
        this.highlight_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();

        // texture
        this.highlight_depth_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.D32F, 0, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();

        this.resize_Highlight();

        // link frame buffer
        this.render_server.render_state.set_FrameBufferAttachment(this.highlight_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, this.highlight_depth_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.highlight_framebuffer.expect);
    }

    private resize_Highlight() {
        this.render_server.render_state.alloc_Texture2D(this.highlight_depth_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.Depth);
    }

    private alloc_Result() {
        // frame buffer
        this.result_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();

        // texture
        this.result_color_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureMinFilter.Linear, RenderStateTextureMagFilter.Linear).expect();

        this.resize_Result();

        // link frame buffer
        this.render_server.render_state.set_FrameBufferAttachment(this.result_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.result_color_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.result_framebuffer.expect);
    }

    private resize_Result() {
        this.render_server.render_state.alloc_Texture2D(this.result_color_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.RGBA);
    }

    private alloc_Postprocessing() {
        // frame buffer
        this.postprocessing_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.postprocessing_1_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();

        // texture
        this.postprocessing_color_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.postprocessing_color_1_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureWrap.Clamp, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();

        this.resize_Postprocessing();

        // link frame buffer
        this.render_server.render_state.set_FrameBufferAttachment(this.postprocessing_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.postprocessing_color_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.postprocessing_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.postprocessing_1_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.postprocessing_color_1_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.postprocessing_1_framebuffer.expect);
    }

    private resize_Postprocessing() {
        this.render_server.render_state.alloc_Texture2D(this.postprocessing_color_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.RGBA);
        this.render_server.render_state.alloc_Texture2D(this.postprocessing_color_1_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.RGBA);
    }

    constructor(config: Config) {
        super(config);
        this.alloc_Result();
        this.alloc_Solid();
        this.alloc_Highlight();
        this.alloc_Transparent();
        this.alloc_Postprocessing();
    }

    private quad_geometry = QuadGeometry.get(this.config).expect;

    private screen_quad_solid_program = OnscreenProgramUniform.get(this.config).expect;

    private highlight_program = HighlightProgramUniform.get(this.config).program.expect;
    private highlight_color_uniform_slot = HighlightProgramUniform.get(this.config).uniform_color_slot.expect;
    private highlight_line_width_uniform_slot = HighlightProgramUniform.get(this.config).uniform_line_width_slot.expect;

    private oit_screen_quad_solid_program = OiTPorgramUniform.get(this.config).expect;

    private postprocessing_fxaa_program = FxaaProgram.get(this.config).program.expect;
    private postprocessing_fxaa_uniform_colormap_slot = FxaaProgram.get(this.config).uniform_colormap_slot.expect;

    private sky_quad_solid_program = SkyDomeProgram.get(this.config).expect;

    protected resize_Internal(): void {
        this.resize_Result();
        this.resize_Solid();
        this.resize_Highlight();
        this.resize_Transparent();
        this.resize_Postprocessing();
    }

    private set_CullFace(face: RenderServerMaterialCullFace) {
        switch (face) {
            case RenderServerMaterialCullFace.Back: {
                this.render_server.render_state.set_FaceWindingProxy(this.render_server.render_state.gl.CCW);
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
                return;
            }
            case RenderServerMaterialCullFace.Front: {
                this.render_server.render_state.set_FaceWindingProxy(this.render_server.render_state.gl.CW);
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
                return;
            }
            case RenderServerMaterialCullFace.None: {
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, false);
                return;
            }
            default: {
                const n: never = face;
                return;
            }
        }
    }

    // render pipeline

    //#region render queue 0

    private render_RenderQueue0Solid(renderer: EditorRenderer3D, transparent_bg: boolean) {
        const { x: width, y: height } = this.size;
        this.render_server.set_RenderCapabilities(true, true, this.render_server.render_state.gl.LEQUAL, false);
        this.render_server.render_state.set_ViewportProxy(0, 0, width, height);
        this.render_server.render_state.set_ScissorProxy(0, 0, width, height);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        if (transparent_bg) {
            this.render_server.render_state.set_ClearColorProxy(0, 0, 0, 0);
            this.render_server.render_state.clear_FrameBuffer(this.solid_framebuffer.expect, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth);
        }
        else {
            this.render_server.render_state.clear_FrameBuffer(this.solid_framebuffer.expect, RenderStateFrameBufferPart.Depth);
        }

        // render queue solid
        const render_queue = renderer.render_queue_0;
        for (const i of render_queue.get_SolidIterator()) {
            const geometry = render_queue.solid_geometry_queue[i];
            const indexed = render_queue.solid_indexed_queue[i];
            const instance_count = render_queue.solid_instance_count_queue[i];
            const material = render_queue.solid_material_queue[i];
            const transform = render_queue.solid_transform_queue[i];
            const layer = render_queue.solid_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.Shade);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.POLYGON_OFFSET_FILL, material.polygon_offset);
                if (material.polygon_offset) {
                    this.render_server.render_state.set_PolygonOffsetProxy(material.polygon_offset_factor, material.polygon_offset_units);
                }
                material.set_Uniform('MODEL_WORLD', transform);
                material.set_Uniform('HAS_TANGENT', geometry.has_AttributeLocation(RenderServerGeometry.GeometryAttributeLocations.tangent));
                material.set_Uniform('LAYER', layer);
                material.commit_AllUniforms(RenderServerShaderPass.Shade);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }

        // draw sky
        if (!transparent_bg) {
            this.render_server.render_state.set_DepthFuncProxy(this.render_server.render_state.gl.LEQUAL);
            this.render_server.render_state.draw_Elements(this.sky_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
        }
    }

    private compose_RenderQueue0Solid(renderer: EditorRenderer3D) {
        this.render_server.render_state.use_FrameBuffer(this.result_framebuffer.expect);
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, false, false);
        this.set_CullFace(RenderServerMaterialCullFace.None);
        this.render_server.render_state.active_Texture(this.solid_color_texture.expect, 0);
        this.render_server.render_state.draw_Elements(this.screen_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
    }

    private render_RenderQueue0Transparent(renderer: EditorRenderer3D) {
        this.render_server.set_RenderCapabilities(true, false, this.render_server.render_state.gl.LEQUAL, true);
        this.render_server.render_state.gl.blendFuncSeparate(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ZERO, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        this.render_server.render_state.set_ClearColorProxy(0, 0, 0, 1);
        this.render_server.render_state.clear_FrameBuffer(this.transparent_framebuffer.expect, RenderStateFrameBufferPart.Color);

        this.render_server.render_state.active_Texture(this.solid_depth_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.solid_color_texture.expect, 1);

        // draw scene
        // render queue transparent
        const render_queue = renderer.render_queue_0;
        for (const i of render_queue.get_TransparentIterator()) {
            const geometry = render_queue.transparent_geometry_queue[i];
            const indexed = render_queue.transparent_indexed_queue[i];
            const instance_count = render_queue.transparent_instance_count_queue[i];
            const material = render_queue.transparent_material_queue[i];
            const transform = render_queue.transparent_transform_queue[i];
            const layer = render_queue.transparent_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.OiT);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.POLYGON_OFFSET_FILL, material.polygon_offset);
                if (material.polygon_offset) {
                    this.render_server.render_state.set_PolygonOffsetProxy(material.polygon_offset_factor, material.polygon_offset_units);
                }
                material.set_Uniform('MODEL_WORLD', transform);
                material.set_Uniform('HAS_TANGENT', geometry.has_AttributeLocation(RenderServerGeometry.GeometryAttributeLocations.tangent));
                material.set_Uniform('LAYER', layer);
                material.commit_AllUniforms(RenderServerShaderPass.OiT);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }

        // depth
        this.render_server.set_RenderCapabilities(true, true, this.render_server.render_state.gl.LEQUAL, false);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        this.render_server.render_state.use_FrameBuffer(this.transparent_depth_normal_framebuffer.expect);

        for (const i of render_queue.get_TransparentIterator()) {
            const geometry = render_queue.transparent_geometry_queue[i];
            const indexed = render_queue.transparent_indexed_queue[i];
            const instance_count = render_queue.transparent_instance_count_queue[i];
            const material = render_queue.transparent_material_queue[i];
            const transform = render_queue.transparent_transform_queue[i];
            const layer = render_queue.transparent_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.PreZ);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.POLYGON_OFFSET_FILL, material.polygon_offset);
                if (material.polygon_offset) {
                    this.render_server.render_state.set_PolygonOffsetProxy(material.polygon_offset_factor, material.polygon_offset_units);
                }
                material.set_Uniform('MODEL_WORLD', transform);
                material.set_Uniform('HAS_TANGENT', geometry.has_AttributeLocation(RenderServerGeometry.GeometryAttributeLocations.tangent));
                material.set_Uniform('LAYER', layer);
                material.commit_AllUniforms(RenderServerShaderPass.PreZ);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }
    }

    private compose_RenderQueue0Transparent(renderer: EditorRenderer3D) {
        this.render_server.render_state.use_FrameBuffer(this.result_framebuffer.expect);
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, true, false);
        this.set_CullFace(RenderServerMaterialCullFace.None);
        this.render_server.render_state.gl.blendFunc(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.render_server.render_state.active_Texture(this.transparent_color_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.transparent_accum_texture.expect, 1);
        this.render_server.render_state.draw_Elements(this.oit_screen_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
    }

    //#endregion

    //#region render queue 1

    private render_RenderQueue1Solid(renderer: EditorRenderer3D) {
        const { x: width, y: height } = this.size;

        this.render_server.set_RenderCapabilities(true, true, this.render_server.render_state.gl.LEQUAL, false);
        this.render_server.render_state.set_ViewportProxy(0, 0, width, height);
        this.render_server.render_state.set_ScissorProxy(0, 0, width, height);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        this.render_server.render_state.set_ClearColorProxy(0, 0, 0, 0);
        this.render_server.render_state.clear_FrameBuffer(this.solid_1_framebuffer.expect, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth);

        this.render_server.render_state.active_Texture(this.solid_depth_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.solid_color_texture.expect, 1);

        // render queue solid
        const render_queue = renderer.render_queue_1;
        for (const i of render_queue.get_SolidIterator()) {
            const geometry = render_queue.solid_geometry_queue[i];
            const indexed = render_queue.solid_indexed_queue[i];
            const instance_count = render_queue.solid_instance_count_queue[i];
            const material = render_queue.solid_material_queue[i];
            const transform = render_queue.solid_transform_queue[i];
            const layer = render_queue.solid_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.Shade);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.POLYGON_OFFSET_FILL, material.polygon_offset);
                if (material.polygon_offset) {
                    this.render_server.render_state.set_PolygonOffsetProxy(material.polygon_offset_factor, material.polygon_offset_units);
                }
                material.set_Uniform('MODEL_WORLD', transform);
                material.set_Uniform('HAS_TANGENT', geometry.has_AttributeLocation(RenderServerGeometry.GeometryAttributeLocations.tangent));
                material.set_Uniform('LAYER', layer);
                material.commit_AllUniforms(RenderServerShaderPass.Shade);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }
    }

    private compose_RenderQueue1Solid(renderer: EditorRenderer3D) {
        this.render_server.render_state.use_FrameBuffer(this.result_framebuffer.expect);
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, true, false);
        this.render_server.render_state.gl.blendFunc(this.render_server.render_state.gl.SRC_ALPHA, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.set_CullFace(RenderServerMaterialCullFace.None);
        this.render_server.render_state.active_Texture(this.solid_color_1_texture.expect, 0);
        this.render_server.render_state.draw_Elements(this.screen_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
    }

    private render_RenderQueue1Transparent(renderer: EditorRenderer3D) {
        this.render_server.set_RenderCapabilities(true, false, this.render_server.render_state.gl.LEQUAL, true);
        this.render_server.render_state.gl.blendFuncSeparate(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ZERO, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        this.render_server.render_state.set_ClearColorProxy(0, 0, 0, 1);
        this.render_server.render_state.clear_FrameBuffer(this.transparent_1_framebuffer.expect, RenderStateFrameBufferPart.Color);

        this.render_server.render_state.active_Texture(this.solid_depth_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.solid_color_texture.expect, 1);

        // draw scene
        // render queue transparent
        const render_queue = renderer.render_queue_1;
        for (const i of render_queue.get_TransparentIterator()) {
            const geometry = render_queue.transparent_geometry_queue[i];
            const indexed = render_queue.transparent_indexed_queue[i];
            const instance_count = render_queue.transparent_instance_count_queue[i];
            const material = render_queue.transparent_material_queue[i];
            const transform = render_queue.transparent_transform_queue[i];
            const layer = render_queue.transparent_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.OiT);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.POLYGON_OFFSET_FILL, material.polygon_offset);
                if (material.polygon_offset) {
                    this.render_server.render_state.set_PolygonOffsetProxy(material.polygon_offset_factor, material.polygon_offset_units);
                }
                material.set_Uniform('MODEL_WORLD', transform);
                material.set_Uniform('HAS_TANGENT', geometry.has_AttributeLocation(RenderServerGeometry.GeometryAttributeLocations.tangent));
                material.set_Uniform('LAYER', layer);
                material.commit_AllUniforms(RenderServerShaderPass.OiT);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }
    }

    private compose_RenderQueue1Transparent(renderer: EditorRenderer3D) {
        this.render_server.render_state.use_FrameBuffer(this.result_framebuffer.expect);
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, true, false);
        this.set_CullFace(RenderServerMaterialCullFace.None);
        this.render_server.render_state.gl.blendFunc(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.render_server.render_state.active_Texture(this.transparent_color_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.transparent_accum_texture.expect, 1);
        this.render_server.render_state.draw_Elements(this.oit_screen_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
    }

    //#endregion

    //#region post processing

    private render_RenderQueueHighlight(renderer: EditorRenderer3D) {
        const { x: width, y: height } = this.size;
        this.render_server.set_RenderCapabilities(true, true, this.render_server.render_state.gl.LEQUAL, false);
        this.render_server.render_state.set_ViewportProxy(0, 0, width, height);
        this.render_server.render_state.set_ScissorProxy(0, 0, width, height);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        this.render_server.render_state.clear_FrameBuffer(this.highlight_framebuffer.expect, RenderStateFrameBufferPart.Depth);

        // render queue highlight
        const render_queue = renderer.render_queue_highlight;
        for (const i of render_queue.get_SolidIterator()) {
            const geometry = render_queue.solid_geometry_queue[i];
            const indexed = render_queue.solid_indexed_queue[i];
            const instance_count = render_queue.solid_instance_count_queue[i];
            const material = render_queue.solid_material_queue[i];
            const transform = render_queue.solid_transform_queue[i];
            const layer = render_queue.solid_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.PreZ);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.POLYGON_OFFSET_FILL, material.polygon_offset);
                if (material.polygon_offset) {
                    this.render_server.render_state.set_PolygonOffsetProxy(material.polygon_offset_factor, material.polygon_offset_units);
                }
                material.set_Uniform('MODEL_WORLD', transform);
                material.set_Uniform('HAS_TANGENT', geometry.has_AttributeLocation(RenderServerGeometry.GeometryAttributeLocations.tangent));
                material.set_Uniform('LAYER', layer);
                material.commit_AllUniforms(RenderServerShaderPass.PreZ);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }
        for (const i of render_queue.get_TransparentIterator()) {
            const geometry = render_queue.transparent_geometry_queue[i];
            const indexed = render_queue.transparent_indexed_queue[i];
            const instance_count = render_queue.transparent_instance_count_queue[i];
            const material = render_queue.transparent_material_queue[i];
            const transform = render_queue.transparent_transform_queue[i];
            const layer = render_queue.transparent_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.PreZ);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.POLYGON_OFFSET_FILL, material.polygon_offset);
                if (material.polygon_offset) {
                    this.render_server.render_state.set_PolygonOffsetProxy(material.polygon_offset_factor, material.polygon_offset_units);
                }
                material.set_Uniform('MODEL_WORLD', transform);
                material.set_Uniform('HAS_TANGENT', geometry.has_AttributeLocation(RenderServerGeometry.GeometryAttributeLocations.tangent));
                material.set_Uniform('LAYER', layer);
                material.commit_AllUniforms(RenderServerShaderPass.PreZ);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }
    }

    private compose_RenderQueueHighlight(renderer: EditorRenderer3D, editor_highlight_color: Color, line_width: number) {
        this.render_server.render_state.use_FrameBuffer(this.result_framebuffer.expect);
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, true, false);
        this.render_server.render_state.gl.blendFunc(this.render_server.render_state.gl.SRC_ALPHA, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.set_CullFace(RenderServerMaterialCullFace.None);
        this.render_server.render_state.active_Texture(this.highlight_depth_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.solid_depth_texture.expect, 1);
        this.highlight_color_uniform_slot.set_Value(editor_highlight_color);
        this.highlight_color_uniform_slot.commit();
        this.highlight_line_width_uniform_slot.set_Value(line_width);
        this.highlight_line_width_uniform_slot.commit();
        this.render_server.render_state.draw_Elements(this.highlight_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
    }

    private render_Postprocessing(renderer: EditorRenderer3D, color_map: boolean) {
        this.render_server.render_state.use_FrameBuffer(this.postprocessing_framebuffer.expect);
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, false, false);
        this.set_CullFace(RenderServerMaterialCullFace.None);
        this.render_server.render_state.active_Texture(this.result_color_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.solid_depth_texture.expect, 1);
        this.render_server.render_state.active_Texture(this.solid_normal_texture.expect, 2);
        this.postprocessing_fxaa_uniform_colormap_slot.set_Value(color_map);
        this.postprocessing_fxaa_uniform_colormap_slot.commit();
        this.render_server.render_state.draw_Elements(this.postprocessing_fxaa_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);

        // this.render_server.render_state.use_FrameBuffer(this.postprocessing_1_framebuffer.expect);
        // this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, false, false);
        // this.set_CullFace(RenderServerMaterialCullFace.None);
        // this.render_server.render_state.active_Texture(this.postprocessing_color_texture.expect, 0);
        // this.render_server.render_state.active_Texture(this.solid_depth_texture.expect, 1);
        // this.render_server.render_state.active_Texture(this.solid_normal_texture.expect, 2);
        // this.postprocessing_fxaa_uniform_colormap_slot.value = 0;
        // this.postprocessing_fxaa_uniform_colormap_slot.commit();
        // this.render_server.render_state.draw_Elements(this.postprocessing_fxaa_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);

        // this.render_server.render_state.use_FrameBuffer(this.postprocessing_framebuffer.expect);
        // this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, false, false);
        // this.set_CullFace(RenderServerMaterialCullFace.None);
        // this.render_server.render_state.active_Texture(this.postprocessing_color_1_texture.expect, 0);
        // this.render_server.render_state.active_Texture(this.solid_depth_texture.expect, 1);
        // this.render_server.render_state.active_Texture(this.solid_normal_texture.expect, 2);
        // this.postprocessing_fxaa_uniform_colormap_slot.value = 0;
        // this.postprocessing_fxaa_uniform_colormap_slot.commit();
        // this.render_server.render_state.draw_Elements(this.postprocessing_fxaa_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);

        // this.render_server.render_state.use_FrameBuffer(this.postprocessing_1_framebuffer.expect);
        // this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, false, false);
        // this.set_CullFace(RenderServerMaterialCullFace.None);
        // this.render_server.render_state.active_Texture(this.postprocessing_color_texture.expect, 0);
        // this.render_server.render_state.active_Texture(this.solid_depth_texture.expect, 1);
        // this.render_server.render_state.active_Texture(this.solid_normal_texture.expect, 2);
        // this.postprocessing_fxaa_uniform_colormap_slot.value = 0;
        // this.postprocessing_fxaa_uniform_colormap_slot.commit();
        // this.render_server.render_state.draw_Elements(this.postprocessing_fxaa_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
    }

    //#endregion

    static readonly #editor_highlight_color: Color = Vector4.new;

    protected render_Internal(renderer: EditorRenderer3D, world: World3D, viewport: Viewport, once: boolean): void {
        const { transparent: transparent_bg, color_map, editor_highlight_line_width } = viewport;
        const editor_highlight_color = viewport.get_EditorHighlightColor(EditorRenderer3DPipeline.#editor_highlight_color);

        // render queue 0
        this.render_RenderQueue0Solid(renderer, transparent_bg);
        this.compose_RenderQueue0Solid(renderer);
        if (renderer.render_queue_0.transparent_pointer >= 0) {
            this.render_RenderQueue0Transparent(renderer);
            this.compose_RenderQueue0Transparent(renderer);
        }
        // render queue 1
        if (renderer.render_queue_1 !== undefined) {
            this.render_RenderQueue1Solid(renderer);
            this.compose_RenderQueue1Solid(renderer);
            if (renderer.render_queue_1.transparent_pointer >= 0) {
                this.render_RenderQueue1Transparent(renderer);
                this.compose_RenderQueue1Transparent(renderer);
            }
        }

        this.render_server.use_LightsData(undefined);
        this.render_server.use_ShadowsTexture(undefined);
        this.render_server.use_SkyTexture(undefined);

        // render highlight
        if (renderer.render_queue_highlight.solid_pointer >= 0 || renderer.render_queue_highlight.transparent_pointer >= 0) {
            this.render_RenderQueueHighlight(renderer);
            this.compose_RenderQueueHighlight(renderer, editor_highlight_color, editor_highlight_line_width);
        }

        // post processing
        this.render_Postprocessing(renderer, color_map);
    }

    public dispose(): void {
        // solid
        this.solid_framebuffer.clear();
        this.solid_1_framebuffer.clear();
        this.solid_color_texture.clear();
        this.solid_normal_texture.clear();
        this.solid_depth_texture.clear();
        this.solid_color_1_texture.clear();
        this.solid_normal_1_texture.clear();
        this.solid_depth_1_texture.clear();
        // transparent
        this.transparent_framebuffer.clear();
        this.transparent_1_framebuffer.clear();
        this.transparent_depth_normal_framebuffer.clear();
        this.transparent_color_texture.clear();
        this.transparent_accum_texture.clear();
        // highlight
        this.highlight_framebuffer.clear();
        this.highlight_depth_texture.clear();
        // reuslt
        this.result_framebuffer.clear();
        this.result_color_texture.clear();
        // postprocessing
        this.postprocessing_framebuffer.clear();
        this.postprocessing_color_texture.clear();
        this.postprocessing_1_framebuffer.clear();
        this.postprocessing_color_1_texture.clear();
    }
}