import { RenderStateShaderType, RenderStateUniformType } from "@/system/sliverofstraw/RenderState";
import { RenderServerDevice } from "../../render_server/RenderServer";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import type { UniformInitSet } from "../../render_server/RenderServerShader";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { RenderServerGeometry } from "../../render_server/RenderServerGeometry";
import type { Config } from "../../ConfiguredObject";
import { Cacher } from "@/system/utils/Cacher";
import { Ref } from "@/system/utils/RefCounted";

/* glsl VertexEssential
uniform mat4 model_world;

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

void main() {
    mat4 _model_world = model_world * a_instance_transform;
    mat4 _model_view = camera_view * _model_world;
    // VERTEX
    vec4 world = _model_world * vec4(a_position, 1.0f); // WORLD SPACE
    v_VERTEX = world.xyz;
    vec4 world_in_view = camera_view * world; // IN CAMERA SPACE
    v_VERTEX_VIEW = world_in_view.xyz;
    gl_Position = camera_projection * world_in_view;
    // NORMAL
    v_NORMAL = normalize(transpose(inverse(mat3(_model_world))) * a_normal);
    v_NORMAL_VIEW = normalize(transpose(inverse(mat3(_model_view))) * a_normal);
    // LOOKAT
    v_LOOKAT = camera_is_orthogonal ? normalize(mat3(camera_world) * vec3(0.0f, 0.0f, 1.0f)) : normalize(camera_world[3].xyz - v_world);
    v_LOOKAT_VIEW = camera_is_orthogonal ? vec3(0.0f, 0.0f, 1.0f) : -normalize(v_VERTEX_VIEW);
    // UV
    v_UV = a_uv;
    v_UV2 = a_uv2;
}
*/

export class GlslPrimitives {

    public static readonly VertexEssentialOuts = `uniform mat4 model_world;
    
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
out vec2 v_UV2;`;

    public static readonly FragmentVertexEssentialIns = `// VERTEX POSITION IN WORLD
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
in vec2 v_UV2;`;

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
v_NORMAL_VIEW = normalize(transpose(inverse(mat3(_model_view))) * a_normal);
// LOOKAT
v_LOOKAT = camera_is_orthogonal ? normalize(mat3(camera_world) * vec3(0.0f, 0.0f, 1.0f)) : normalize(camera_world[3].xyz - v_VERTEX);
v_LOOKAT_VIEW = camera_is_orthogonal ? vec3(0.0f, 0.0f, 1.0f) : -normalize(v_VERTEX_VIEW);
// UV
v_UV = a_uv;
v_UV2 = a_uv2;`;

    public static readonly FragmentVertexEssentialCalculations = `vec3 NORMAL = normalize(v_NORMAL);
vec3 NORMAL_VIEW = normalize(v_NORMAL_VIEW);
vec3 LOOKAT = normalize(v_LOOKAT);
vec3 LOOKAT_VIEW = normalize(v_LOOKAT_VIEW);`

}

export const PrimitiveVertexShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;
    
    ${RenderServerDevice.ConstantsCode}
    
    ${RenderServerDevice.WorldUniformsCode}
    
    ${RenderServerGeometry.GeometryAttributesCode}
    
    ${GlslPrimitives.VertexEssentialOuts}
    
    void main() {
        ${GlslPrimitives.VertexEssentialCalculations}
    }`;

    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Vertex, code).expect());
});
export const PrimitiveVertexShaderUniforms: UniformInitSet<WebGL2RenderState> = {
    model_world: { type: RenderStateUniformType.Mat4, default: Matrix4.new },
};

export const PrimitiveFragmentPreZShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}
    
    ${GlslPrimitives.FragmentVertexEssentialIns}

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        ${GlslPrimitives.FragmentVertexEssentialCalculations}
        o_normal = vec4(NORMAL_VIEW, 1.0);
    }`;
    
    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
export const PrimitiveFragmentPreZShaderUniforms: UniformInitSet<WebGL2RenderState> = {};