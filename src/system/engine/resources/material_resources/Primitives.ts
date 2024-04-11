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

    public static readonly VertexEssentialOuts = `uniform mat4 model_world;

// VERTEX POSITION IN WORLD
out vec3 v_VERTEX;
// VERTEX POSITION IN VIEW, CAMERA SPACE
out vec3 v_VERTEX_VIEW;
// NORMAL VIEW MATRIX, TURN A DIRECTION FROM WORLD TO VIEW
out mat3 v_NORMAL_VIEW_MATRIX;
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

    public static readonly FragmentVertexEssentialIns = `uniform bool has_tangent;
    
// VERTEX POSITION IN WORLD
in vec3 v_VERTEX;
// VERTEX POSITION IN VIEW, CAMERA SPACE
in vec3 v_VERTEX_VIEW;
// NORMAL VIEW MATRIX, TURN A DIRECTION FROM WORLD TO VIEW
in mat3 v_NORMAL_VIEW_MATRIX;
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

    public static readonly VertexEssentialCalculations = `mat4 _model_world = model_world * a_instance_transform;
mat4 _model_view = camera_view * _model_world;
// VERTEX
vec4 world = _model_world * vec4(a_position, 1.0f); // WORLD SPACE
v_VERTEX = world.xyz;
vec4 world_in_view = camera_view * world; // IN CAMERA SPACE
v_VERTEX_VIEW = world_in_view.xyz;
gl_Position = camera_projection * world_in_view;
// NORMAL
v_NORMAL = normalize(transpose(inverse(mat3(_model_world))) * a_normal);
mat3 normal_transform = transpose(inverse(mat3(_model_view)));
v_NORMAL_VIEW_MATRIX = normal_transform;
v_NORMAL_VIEW = normalize(normal_transform * a_normal);
// LOOKAT
v_LOOKAT = camera_is_orthogonal ? normalize(mat3(camera_world) * vec3(0.0f, 0.0f, 1.0f)) : normalize(camera_world[3].xyz - v_VERTEX);
v_LOOKAT_VIEW = camera_is_orthogonal ? vec3(0.0f, 0.0f, 1.0f) : -normalize(v_VERTEX_VIEW);
// UV
v_UV = a_uv;
v_UV2 = a_uv2;
// TANGENT
v_TANGENT = a_tangent;
v_TANGENT_VIEW = normalize(normal_transform * a_tangent);`;

    public static readonly FragmentVertexEssentialCalculations = `vec3 NORMAL = normalize(v_NORMAL);
vec3 NORMAL_VIEW = normalize(v_NORMAL_VIEW);
vec3 LOOKAT = normalize(v_LOOKAT);
vec3 LOOKAT_VIEW = normalize(v_LOOKAT_VIEW);`

    public static readonly FragmentTangentAndTBNCalculations = `vec3 TANGENT_VIEW = normalize(v_TANGENT_VIEW);
mat3 TBN;
if (!has_tangent) {
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

export function set_MaterialNormalTexture(material: MaterialResource & { normal_texture: TextureResource | undefined }, normal: TextureResource | undefined) {
    material.set_Uniform('u_normal_texture', normal?.texture);
    material.set_Uniform('u_has_normal_texture', normal !== undefined);
}

export const PrimitiveMaterialUniforms: MaterialReadOnlyUniforms = {
    model_world: RenderStateUniformType.Mat4,
    has_tangent: RenderStateUniformType.Uint,
    layer: RenderStateUniformType.Uint,
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
    model_world: { type: RenderStateUniformType.Mat4, default: Matrix4.new },
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