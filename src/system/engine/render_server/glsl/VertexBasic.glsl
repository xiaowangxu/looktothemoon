#version 300 es
precision highp float;
precision highp usampler2DArray;
precision highp sampler3D;

layout(std140)uniform WorldUniforms{
    mat4 camera_world;
    mat4 camera_view;
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
}

layout(location=0)in vec3 a_position;
layout(location=1)in vec3 a_normal;
layout(location=2)in vec3 a_tangent;
layout(location=3)in vec3 a_bitangent;
layout(location=4)in vec3 a_color;
layout(location=5)in vec2 a_uv;
layout(location=6)in vec2 a_uv2;
layout(location=7)in mat4 a_instance_transform;

uniform mat4 model_world;

out vec3 v_world;
out vec3 v_normal;
out vec2 v_uv;
out vec3 v_camera_dir;

vec3 get_bitangent(){
    return cross(a_normal,a_tangent);
}

mat3 get_tbn(const in mat4 model_world){
    vec3 T=normalize(vec3(model_world*vec4(a_tangent,0.)));
    vec3 B=normalize(vec3(model_world*vec4(a_bitangent,0.)));
    vec3 N=normalize(vec3(model_world*vec4(a_normal,0.)));
    return mat3(T,B,N);
}

void main(){
    mat4 _model_world=model_world*a_instance_transform;
    vec4 world=_model_world*vec4(a_position,1.);
    gl_Position=camera_projection*camera_view*world;
    // out
    v_normal=normalize(mat3(transpose(inverse(_model_world)))*a_normal);
    v_uv=a_uv;
    v_world=world.xyz;

    v_camera_dir=camera_is_orthogonal?normalize(mat3(camera_world)*vec3(0.f,0.f,1.f)):normalize(camera_world[3].xyz-v_world);
}