#version 300 es
precision highp float;
precision highp usampler2DArray;
precision highp sampler3D;

layout(std140) uniform WorldUniforms {
    mat4 camera_world;
    mat4 camera_view;
    mat4 camera_projection;
    mat4 camera_inv_projection;
    vec2 screen_size;
    float time;
    bool camera_is_orthogonal;
};

uniform uint layer;
uniform usampler2DArray lights;

struct LightData {
    uint type;
    uint id;
    uint mask;
    uint stride;
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

struct LightProjRegion {
    mat4 projection;
    vec4 region;
};

void calc_light(const in uint light_type, const in vec3 light_direction, const in vec3 view_direction, const in vec3 normal, const in vec3 light_color, const in float light_attenuation, inout vec3 diffuse, inout vec3 specular) {
    float light_strength = max(0.0f, dot(normal, light_direction));
    diffuse += light_strength * light_color * light_attenuation;
}

LightData get_light(const in ivec3 lights_size, const in int i) {
    int x = i % lights_size.x;
    int y = i / lights_size.x;

    uint l_type_id = texelFetch(lights, ivec3(x, y, 0), 0).r;
    uint l_pos_x = texelFetch(lights, ivec3(x, y, 1), 0).r;
    uint l_pos_y = texelFetch(lights, ivec3(x, y, 2), 0).r;
    uint l_pos_z = texelFetch(lights, ivec3(x, y, 3), 0).r;
    uint l_dir_x = texelFetch(lights, ivec3(x, y, 4), 0).r;
    uint l_dir_y = texelFetch(lights, ivec3(x, y, 5), 0).r;
    uint l_dir_z = texelFetch(lights, ivec3(x, y, 6), 0).r;
    uint l_color_r = texelFetch(lights, ivec3(x, y, 7), 0).r;
    uint l_color_g = texelFetch(lights, ivec3(x, y, 8), 0).r;
    uint l_color_b = texelFetch(lights, ivec3(x, y, 9), 0).r;
    uint _l_attenuation = texelFetch(lights, ivec3(x, y, 10), 0).r;
    uint l_mask = texelFetch(lights, ivec3(x, y, 11), 0).r;
    uint _l_param_0 = texelFetch(lights, ivec3(x, y, 12), 0).r;
    uint _l_param_1 = texelFetch(lights, ivec3(x, y, 13), 0).r;
    uint _l_param_2 = texelFetch(lights, ivec3(x, y, 14), 0).r;
    uint _l_param_3 = texelFetch(lights, ivec3(x, y, 15), 0).r;
    uint _l_shadow_bias = texelFetch(lights, ivec3(x, y, 16), 0).r;
    uint _l_shadow_normal_bias = texelFetch(lights, ivec3(x, y, 17), 0).r;
    uint _l_shadow_opacity = texelFetch(lights, ivec3(x, y, 18), 0).r;
    uint _l_data_stride = texelFetch(lights, ivec3(x, y, 19), 0).r;

    uint l_type = l_type_id & uint(0xffff);
    uint l_id = l_type_id >> 16;
    vec3 l_position = vec3(uintBitsToFloat(l_pos_x), uintBitsToFloat(l_pos_y), uintBitsToFloat(l_pos_z));
    vec3 l_direction = vec3(uintBitsToFloat(l_dir_x), uintBitsToFloat(l_dir_y), uintBitsToFloat(l_dir_z));
    vec3 l_color = vec3(uintBitsToFloat(l_color_r), uintBitsToFloat(l_color_g), uintBitsToFloat(l_color_b));

    return LightData(l_type, l_id, l_mask, int(_l_data_stride), l_color, uintBitsToFloat(_l_attenuation), l_position, uintBitsToFloat(_l_param_0), l_direction, uintBitsToFloat(_l_param_1), uintBitsToFloat(_l_param_2), uintBitsToFloat(_l_param_3), uintBitsToFloat(_l_shadow_bias), uintBitsToFloat(_l_shadow_normal_bias), uintBitsToFloat(_l_shadow_opacity));
}

LightProjRegion get_light_proj_region(const in ivec3 lights_size, const in int i) {
    int x = i % lights_size.x;
    int y = i / lights_size.x;

    uint p11 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 0), 0).r);
    uint p12 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 1), 0).r);
    uint p13 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 2), 0).r);
    uint p14 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 3), 0).r);
    uint p21 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 4), 0).r);
    uint p22 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 5), 0).r);
    uint p23 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 6), 0).r);
    uint p24 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 7), 0).r);
    uint p31 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 8), 0).r);
    uint p32 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 9), 0).r);
    uint p33 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 10), 0).r);
    uint p34 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 11), 0).r);
    uint p41 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 12), 0).r);
    uint p42 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 13), 0).r);
    uint p43 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 14), 0).r);
    uint p44 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 15), 0).r);
    uint r0 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 16), 0).r);
    uint r1 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 17), 0).r);
    uint r2 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 18), 0).r);
    uint r3 = uintBitsToFloat(texelFetch(lights, ivec3(x, y, 19), 0).r);

    return LightProjRegion(mat4(vec4(p11, p21, p31, p41), vec4(p12, p22, p32, p42), vec4(p13, p23, p33, p43), vec4(p14, p24, p34, p44)), vec4(r0, r1, r2, r3));
}

void main() {
    vec3 normal = normalize(v_normal);
    vec4 albedo = u_color;

    vec3 diffuse = vec3(0.0f);
    vec3 specular = vec3(0.0f);

    ivec3 lights_size = textureSize(lights, 0);
    int max_lights_count = lights_size.x * lights_size.y;

    for(int i = 0; i < 32; i++) {
        LightData light = get_light(lights_size, i);

        i += light.stride;

        if(light.type == 0u || (light.mask & layer) == 0u)
            continue;

        vec3 c_dir = camera_is_orthogonal ? normalize(mat3(camera_world) * vec3(0.0f, 0.0f, 1.0f)) : normalize(camera_world[3].xyz - v_world);

        if(light.type == 1u) {
	    	    // ambient light
            calc_light(light.type, normal, c_dir, normal, light.color, 1.0f, diffuse, specular);
        } else if(light.type == 2u) {
	    	    // directional light
            vec3 l_dir = normalize(light.position);
            calc_light(light.type, l_dir, c_dir, normal, light.color, 1.0f, diffuse, specular);
        } else if(light.type == 3u) {
	    	    // point light
            float l_distance = distance(light.position, v_world);
            vec3 l_dir = normalize(light.position - v_world);
            float near_distance = light.param_0;
            float far_distance = light.param_1;
            float distance_w = (l_distance - near_distance) / (far_distance - near_distance);
            float distance_strength = smoothstep(1.0f, 0.0f, distance_w);
            float l_atten = distance_strength / pow(max(l_distance, 1.0f), light.attenuation);
            calc_light(light.type, l_dir, c_dir, normal, light.color, l_atten, diffuse, specular);
        } else if(light.type == 4u) {
	    	    // spot light
            vec3 l_dir = normalize(light.position - v_world);
            float l_dot_dir = dot(l_dir, -normalize(light.direction));
            float l_distance = distance(light.position, v_world);
            float angle_strength = smoothstep(cos(light.param_0), cos(light.param_1), l_dot_dir);
            float near_distance = light.param_2;
            float far_distance = light.param_3;
            float distance_w = (l_distance - near_distance) / (far_distance - near_distance);
            float distance_strength = smoothstep(1.0f, 0.0f, distance_w);
            float l_atten = (angle_strength * distance_strength) / pow(max(l_distance, 1.0f), light.attenuation);
            calc_light(light.type, l_dir, c_dir, normal, light.color, l_atten, diffuse, specular);
        }
    }

    o_color = albedo * vec4(diffuse, 1.0f) + vec4(specular, 0.0f);
    o_normal = normal;
}