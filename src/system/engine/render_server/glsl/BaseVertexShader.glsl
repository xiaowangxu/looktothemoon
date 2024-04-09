 #version 300 es
precision highp float;
precision highp usampler2DArray;
precision highp sampler3D;

const float PI = 3.1415926535f;
const float TAU = 6.283185307f;
const float EPSILON = 1e-10f;
const float SQRT2 = 1.414213562373095f;

layout(std140) uniform WorldUniforms {
    // CAMERA'S GLOBAL TRANSFORM
    mat4 camera_world;
    // FROM WORLD TO CAMERA SPACE
    mat4 camera_view;
    // FROM CAMERA SPACE TO CLIP SPACE
    mat4 camera_projection;
    mat4 camera_inv_projection;
    vec2 screen_size;
    float time;
    bool camera_is_orthogonal;
    float pixel_ratio;
    float _preserved_0;
    float _preserved_1;
    float _preserved_2;
     // environment
    vec4 background_color;
    bool use_sky;
};

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec3 a_tangent;
layout(location = 3) in vec3 a_color;
layout(location = 4) in vec2 a_uv;
layout(location = 5) in vec2 a_uv2;
layout(location = 6) in int a_bone;
layout(location = 7) in float a_weight;
layout(location = 8) in mat4 a_instance_transform;

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
    v_LOOKAT = camera_is_orthogonal ? normalize(mat3(camera_world) * vec3(0.0f, 0.0f, 1.0f)) : normalize(camera_world[3].xyz - v_VERTEX);
    v_LOOKAT_VIEW = camera_is_orthogonal ? vec3(0.0f, 0.0f, 1.0f) : -normalize(v_VERTEX_VIEW);
    // UV
    v_UV = a_uv;
    v_UV2 = a_uv2;
}
