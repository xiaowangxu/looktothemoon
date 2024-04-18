import { RenderStateShaderType, RenderStateUniformType } from "@/system/sliverofstraw/RenderState";
import { RenderServerDevice, RenderServerPlainColorTexture } from "../../render_server/RenderServer";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import type { UniformInitSet } from "../../render_server/RenderServerShader";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { RenderServerGeometry } from "../../render_server/RenderServerGeometry";
import type { Config } from "../../ConfiguredObject";
import { Cacher } from "@/system/utils/Cacher";
import { Ref } from "@/system/utils/RefCounted";
import type { MaterialReadOnlyUniforms, MaterialResource } from "./MaterialResource";
import type { TextureResource } from "../texture_resources/TextureResource";

export class GlslPrimitives {

    public static readonly VertexBuiltinAttributes = `layout(location = ${RenderServerGeometry.GeometryAttributeLocations.position}) in vec3 a_position;
layout(location = ${RenderServerGeometry.GeometryAttributeLocations.normal}) in vec3 a_normal;
layout(location = ${RenderServerGeometry.GeometryAttributeLocations.tangent}) in vec3 a_tangent;
layout(location = ${RenderServerGeometry.GeometryAttributeLocations.color}) in vec3 a_color;
layout(location = ${RenderServerGeometry.GeometryAttributeLocations.uv}) in vec2 a_uv;
layout(location = ${RenderServerGeometry.GeometryAttributeLocations.uv2}) in vec2 a_uv2;
layout(location = ${RenderServerGeometry.GeometryAttributeLocations.bone}) in int a_bone;
layout(location = ${RenderServerGeometry.GeometryAttributeLocations.weight}) in float a_weight;
layout(location = ${RenderServerGeometry.GeometryAttributeLocations.instance_transform}) in mat4 a_instance_transform;`;

    public static readonly WorldUniforms = RenderServerDevice.WorldUniformsCode;

    public static readonly Constants = `const float PI = 3.1415926535;
const float TAU = 6.283185307;
const float EPSILON = 1e-10;
const float SQRT2 = 1.414213562373095;`;

    public static readonly FragmentFrameSolidOuts = `layout(location = 0) out vec4 o_color;
layout(location = 1) out vec4 o_normal;`;

    public static readonly FragmentFrameTransparentOuts = `layout(location = 0) out vec4 o_color;
layout(location = 1) out float o_accum;
layout(location = 2) out vec4 o_normal;`;

    public static readonly FragmentFrameTransparentCalculation = `// OIT
COLOR.rgb *= COLOR.a;
float _z = gl_FragCoord.z;
float _a = COLOR.a;
float _w = _a * max(0.01, min(3000.0, 0.03 / (1e-5 + pow(abs(_z) / 200.0, 4.0))));
o_color = vec4(COLOR.rgb * _w, COLOR.a);
o_accum = COLOR.a * _w;`;

    public static readonly VertexEssentialOuts = `uniform mat4 MODEL_WORLD;

// VERTEX POSITION IN WORLD
out vec3 v_VERTEX;
// VERTEX POSITION IN VIEW, CAMERA SPACE
out vec3 v_VERTEX_VIEW;
// NORMAL IN WORLD
out vec3 v_NORMAL;
// NORMAL IN VIEW, CAMERA SPACE
out vec3 v_NORMAL_VIEW;
// LOOKAT VERTEX TO CAMERA IN WORLD
out vec3 v_LOOKAT;
// LOOKAT VERTEX TO CAMERA IN VIEW, CAMERA SPACE, FOR orthogonal CAMERA IT IS ALWAYS VEC3(0,0,1)
out vec3 v_LOOKAT_VIEW;
// ORIGIN UV
out vec2 v_UV;
// ORIGIN UV2
out vec2 v_UV2;
// ORIGIN TANGENT
out vec3 v_TANGENT;
// TANGENT IN VIEW, CAMERA SPACE
out vec3 v_TANGENT_VIEW;
`;

    public static readonly FragmentVertexEssentialIns = `uniform bool HAS_TANGENT;
    
// VERTEX POSITION IN WORLD
in vec3 v_VERTEX;
// VERTEX POSITION IN VIEW, CAMERA SPACE
in vec3 v_VERTEX_VIEW;
// NORMAL IN WORLD
in vec3 v_NORMAL;
// NORMAL IN VIEW, CAMERA SPACE
in vec3 v_NORMAL_VIEW;
// LOOKAT VERTEX TO CAMERA IN WORLD
in vec3 v_LOOKAT;
// LOOKAT VERTEX TO CAMERA IN VIEW, CAMERA SPACE, FOR orthogonal CAMERA IT IS ALWAYS VEC3(0,0,1)
in vec3 v_LOOKAT_VIEW;
// ORIGIN UV
in vec2 v_UV;
// ORIGIN UV2
in vec2 v_UV2;
// ORIGIN TANGENT
in vec3 v_TANGENT;
in vec3 v_TANGENT_VIEW;`;

    public static readonly VertexEssentialCalculations = `mat4 _model_world = MODEL_WORLD * a_instance_transform;
mat4 _model_view = CAMERA_VIEW * _model_world;
// VERTEX
vec4 world = _model_world * vec4(a_position, 1.0f); // WORLD SPACE
v_VERTEX = world.xyz;
vec4 world_in_view = CAMERA_VIEW * world; // IN CAMERA SPACE
v_VERTEX_VIEW = world_in_view.xyz;
gl_Position = CAMERA_PROJECTION * world_in_view;
// NORMAL
v_NORMAL = transpose(inverse(mat3(_model_world))) * a_normal;
mat3 normal_transform = transpose(inverse(mat3(_model_view)));
v_NORMAL_VIEW = normal_transform * a_normal;
// LOOKAT
v_LOOKAT = CAMERA_IS_ORTH ? normalize(mat3(CAMERA_WORLD) * vec3(0.0f, 0.0f, 1.0f)) : (CAMERA_WORLD[3].xyz - v_VERTEX);
v_LOOKAT_VIEW = CAMERA_IS_ORTH ? vec3(0.0f, 0.0f, 1.0f) : -v_VERTEX_VIEW;
// UV
v_UV = a_uv;
v_UV2 = a_uv2;
// TANGENT
v_TANGENT = a_tangent;
v_TANGENT_VIEW = normal_transform * a_tangent;`;

    public static readonly FragmentVertexEssentialCalculations = `float FACING = gl_FrontFacing ? 1.0 : -1.0;
vec3 NORMAL = normalize(v_NORMAL) * FACING;
vec3 NORMAL_VIEW = normalize(v_NORMAL_VIEW) * FACING;
vec3 LOOKAT = normalize(v_LOOKAT);
vec3 LOOKAT_VIEW = normalize(v_LOOKAT_VIEW);`

    public static readonly FragmentTangentAndTBNCalculations = `vec3 TANGENT_VIEW = normalize(v_TANGENT_VIEW);
mat3 TBN;
if (!HAS_TANGENT) {
    vec3 q0 = dFdx(v_VERTEX_VIEW);
	vec3 q1 = dFdy(v_VERTEX_VIEW);
	vec2 st0 = dFdx(v_UV.st);
	vec2 st1 = dFdy(v_UV.st);
	vec3 q1perp = cross(q1, NORMAL_VIEW);
	vec3 q0perp = cross(NORMAL_VIEW, q0);
	TANGENT_VIEW = q1perp * st0.x + q0perp * st1.x;
	vec3 B = q1perp * st0.y + q0perp * st1.y;
	float det = max(dot(TANGENT_VIEW, TANGENT_VIEW), dot(B, B));
	float scale = (det == 0.0) ? 0.0 : inversesqrt(det);
	TBN = mat3(TANGENT_VIEW * scale, B * scale, NORMAL_VIEW);
}
else {
    TBN = mat3(TANGENT_VIEW, cross(TANGENT_VIEW, NORMAL_VIEW), NORMAL_VIEW);
}`;

    public static readonly FragmentNormalTextureViewCalculations = `vec3 normal_texture = texture(u_normal_texture, v_UV).xyz * 2.0 - 1.0;
NORMAL_VIEW = normalize(TBN * normal_texture);`;

    public static readonly ShaderNormalTextureUniforms = `uniform sampler2D u_normal_texture;
uniform bool u_has_normal_texture;`;

    public static readonly FragmentNormalTextureCalculations = `if (u_has_normal_texture) {
    ${GlslPrimitives.FragmentTangentAndTBNCalculations}
    ${GlslPrimitives.FragmentNormalTextureViewCalculations}
}`;

    public static readonly FragmentLightDataUniformStruct = `uniform usampler2DArray LIGHTS;
uniform uint LAYER;
uniform sampler2D SKY;

struct LightData {
    uint type;
    uint mask;
    int stride;
    vec3 color;
    float attenuation;
    vec3 position;
    float param_0;
    vec3 direction;
    float param_1;
    float param_2;
    float param_3;
    float shadow_bias;
    float shadow_normal_bias;
    float shadow_opacity;
};

LightData get_light(const in ivec3 lights_size, const in int i) {
    int x = i % lights_size.x;
    int y = i / lights_size.x;
    uint l_type_id = texelFetch(LIGHTS, ivec3(x, y, 0), 0).r;
    if (l_type_id == 0u) return LightData(0u, 0u, 0, vec3(0.0), 0.0, vec3(0.0), 0.0, vec3(0.0), 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    uint l_pos_x = texelFetch(LIGHTS, ivec3(x, y, 1), 0).r;
    uint l_pos_y = texelFetch(LIGHTS, ivec3(x, y, 2), 0).r;
    uint l_pos_z = texelFetch(LIGHTS, ivec3(x, y, 3), 0).r;
    uint l_dir_x = texelFetch(LIGHTS, ivec3(x, y, 4), 0).r;
    uint l_dir_y = texelFetch(LIGHTS, ivec3(x, y, 5), 0).r;
    uint l_dir_z = texelFetch(LIGHTS, ivec3(x, y, 6), 0).r;
    uint l_color_r = texelFetch(LIGHTS, ivec3(x, y, 7), 0).r;
    uint l_color_g = texelFetch(LIGHTS, ivec3(x, y, 8), 0).r;
    uint l_color_b = texelFetch(LIGHTS, ivec3(x, y, 9), 0).r;
    uint _l_attenuation = texelFetch(LIGHTS, ivec3(x, y, 10), 0).r;
    uint l_mask = texelFetch(LIGHTS, ivec3(x, y, 11), 0).r;
    uint _l_param_0 = texelFetch(LIGHTS, ivec3(x, y, 12), 0).r;
    uint _l_param_1 = texelFetch(LIGHTS, ivec3(x, y, 13), 0).r;
    uint _l_param_2 = texelFetch(LIGHTS, ivec3(x, y, 14), 0).r;
    uint _l_param_3 = texelFetch(LIGHTS, ivec3(x, y, 15), 0).r;
    uint _l_shadow_bias = texelFetch(LIGHTS, ivec3(x, y, 16), 0).r;
    uint _l_shadow_normal_bias = texelFetch(LIGHTS, ivec3(x, y, 17), 0).r;
    uint _l_shadow_opacity = texelFetch(LIGHTS, ivec3(x, y, 18), 0).r;
    uint _l_data_stride = texelFetch(LIGHTS, ivec3(x, y, 19), 0).r;
    uint l_type = l_type_id & 0xffffu;
    vec3 l_position = vec3(uintBitsToFloat(l_pos_x), uintBitsToFloat(l_pos_y), uintBitsToFloat(l_pos_z));
    vec3 l_direction = vec3(uintBitsToFloat(l_dir_x), uintBitsToFloat(l_dir_y), uintBitsToFloat(l_dir_z));
    vec3 l_color = vec3(uintBitsToFloat(l_color_r), uintBitsToFloat(l_color_g), uintBitsToFloat(l_color_b));
    return LightData(l_type, l_mask, int(_l_data_stride), l_color, uintBitsToFloat(_l_attenuation), l_position, uintBitsToFloat(_l_param_0), l_direction, uintBitsToFloat(_l_param_1), uintBitsToFloat(_l_param_2), uintBitsToFloat(_l_param_3), uintBitsToFloat(_l_shadow_bias), uintBitsToFloat(_l_shadow_normal_bias), uintBitsToFloat(_l_shadow_opacity));
}`;

    /**
     * input:
     * 
     * vec4 ALBEDO
     * 
     * output 
     * 
     * vec3 DIFFUSE, vec3 SPECULAR, vec4 COLOR
     */
    public static FragmentLightCalculations(custom_params?: string[]) {
        const custom_p = custom_params === undefined ? '' : `${custom_params.join(', ')}, `;
        return `    vec3 DIFFUSE = vec3(0.0);
    vec3 SPECULAR = vec3(0.0);

    ivec3 _lights_size_ = textureSize(LIGHTS, 0);
    int _max_lights_count_ = _lights_size_.x * _lights_size_.y;
    const int _MAX_COUNT_ = 128;
    int _max_count_ = min(_max_lights_count_, _MAX_COUNT_);

    for(int i = 0; i < _max_count_; i++) {
        LightData light = get_light(_lights_size_, i);
        if(light.type == 0u) break;
        i += light.stride;
        if((light.mask & LAYER) == 0u) continue;
        if(light.type == 1u) {
            // ambient light
            calc_light(${custom_p}light.type, NORMAL_VIEW, LOOKAT_VIEW, NORMAL_VIEW, light.color, 1.0, DIFFUSE, SPECULAR);
        }
        else if(light.type == 2u) {
            // directional light
            vec3 LDIR_VIEW = normalize(CAMERA_NORMAL_VIEW * light.direction);
            calc_light(${custom_p}light.type, LDIR_VIEW, LOOKAT_VIEW, NORMAL_VIEW, light.color, 1.0, DIFFUSE, SPECULAR);
        } 
        else if(light.type == 3u) {
            // point light
            float l_distance = distance(light.position, v_VERTEX);
            vec3 LDIR_VIEW = normalize(CAMERA_NORMAL_VIEW *  normalize(light.position - v_VERTEX));
            float near_distance = light.param_0;
            float far_distance = light.param_1;
            float distance_w = (l_distance - near_distance) / (far_distance - near_distance);
            float distance_strength = smoothstep(1.0f, 0.0f, distance_w);
            float l_atten = distance_strength / pow(l_distance, light.attenuation);
            calc_light(${custom_p}light.type, LDIR_VIEW, LOOKAT_VIEW, NORMAL_VIEW, light.color, l_atten, DIFFUSE, SPECULAR);
        } 
        else if(light.type == 4u) {
            // spot light
            vec3 l_dir = normalize(light.position - v_VERTEX);
            float l_dot_dir = dot(l_dir, -normalize(light.direction));
            float l_distance = distance(light.position, v_VERTEX);
            float angle_strength = smoothstep(cos(light.param_1), cos(light.param_0), l_dot_dir);
            float near_distance = light.param_2;
            float far_distance = light.param_3;
            float distance_w = (l_distance - near_distance) / (far_distance - near_distance);
            float distance_strength = smoothstep(1.0f, 0.0f, distance_w);
            float l_atten = (angle_strength * distance_strength) / pow(l_distance, light.attenuation);
            vec3 LDIR_VIEW = normalize(CAMERA_NORMAL_VIEW * l_dir);
            calc_light(${custom_p}light.type, LDIR_VIEW, LOOKAT_VIEW, NORMAL_VIEW, light.color, l_atten, DIFFUSE, SPECULAR);
        }
    }
    
    vec4 COLOR = ALBEDO * vec4(DIFFUSE, 1.0) + vec4(SPECULAR, 0.0);`;
    }

    /**
     * inputs: 
     * 
     * uint TYPE, vec3 DIRECTION, vec3 VIEW, vec3 NORMAL, vec3 COLOR, float ATTENUATION
     * 
     * output: 
     * 
     * assign vec3 DIFFUSE, vec3 SPECULAR
     * 
     * @param code light shading code 
     * @returns 
     */
    public static FragmentLightFunction(code: string, custom_params?: string[]) {
        const custom_p = custom_params === undefined ? '' : `${custom_params.join(', ')}, `;
        return `void calc_light(${custom_p}const in uint TYPE, const in vec3 DIRECTION, const in vec3 VIEW, const in vec3 NORMAL, const in vec3 COLOR, const in float ATTENUATION, inout vec3 _DIFFUSE_, inout vec3 _SPECULAR_) {
vec3 DIFFUSE = vec3(0.0);
vec3 SPECULAR = vec3(0.0);
${code}
_DIFFUSE_ += DIFFUSE;
_SPECULAR_ += SPECULAR;
}`;
    }
}

export const ShaderNormalTextureUniformsDef: Readonly<UniformInitSet<WebGL2RenderState>> = {
    u_normal_texture: {
        type: RenderStateUniformType.Tex2D,
        default: { texture: undefined }
    },
    u_has_normal_texture: { type: RenderStateUniformType.Uint, default: 0 },
};

export const MaterialNormalTextureUniformsDef: MaterialReadOnlyUniforms = {
    u_normal_texture: RenderStateUniformType.Tex2D,
    u_has_normal_texture: RenderStateUniformType.Uint
};

export const ShaderLightDataTextureUniformsDef: Readonly<UniformInitSet<WebGL2RenderState>> = {
    LAYER: {
        type: RenderStateUniformType.Uint,
        default: 0xffffffff,
    },
    LIGHTS: {
        type: RenderStateUniformType.Int,
        default: RenderServerDevice.LightsTextureUnit,
    },
    SKY: {
        type: RenderStateUniformType.Int,
        default: RenderServerDevice.SkyTextureUnit,
    },
};

export const MaterialLightDataTextureUniformsDef: MaterialReadOnlyUniforms = {
    LAYER: RenderStateUniformType.Uint,
};

export function set_MaterialNormalTexture(material: MaterialResource & { normal_texture: TextureResource | undefined }, normal: TextureResource | undefined) {
    material.set_Uniform('u_normal_texture', normal?.texture);
    material.set_Uniform('u_has_normal_texture', normal !== undefined);
}

export const PrimitiveMaterialUniforms: MaterialReadOnlyUniforms = {
    MODEL_WORLD: RenderStateUniformType.Matrix4,
    HAS_TANGENT: RenderStateUniformType.Bool,
    LAYER: RenderStateUniformType.Uint,
}

export const PrimitiveVertexShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;
    
    ${GlslPrimitives.Constants}
    
    ${GlslPrimitives.WorldUniforms}
    
    ${GlslPrimitives.VertexBuiltinAttributes}
    
    ${GlslPrimitives.VertexEssentialOuts}
    
    void main() {
        ${GlslPrimitives.VertexEssentialCalculations}
    }`;

    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Vertex, code).expect());
});
export const PrimitiveVertexShaderUniforms: Readonly<UniformInitSet<WebGL2RenderState>> = {
    MODEL_WORLD: { type: RenderStateUniformType.Matrix4, default: Matrix4.new },
};

export const PrimitiveFragmentPreZShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${GlslPrimitives.WorldUniforms}

    ${GlslPrimitives.FragmentVertexEssentialIns}

    ${GlslPrimitives.FragmentFrameSolidOuts}

    void main() {
        ${GlslPrimitives.FragmentVertexEssentialCalculations}
        o_normal = vec4(NORMAL_VIEW, 1.0);
    }`;

    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
export const PrimitiveFragmentPreZShaderUniforms: Readonly<UniformInitSet<WebGL2RenderState>> = {};