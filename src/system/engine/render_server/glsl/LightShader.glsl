#version 300 es
precision highp float;
precision highp usampler2DArray;
precision highp sampler2DArray;
precision highp sampler3D;

uniform usampler2DArray lights;
uniform sampler2DArray shadows;
uniform uint layer;

struct LightData{
    uint type;
    uint id;
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

void calc_light(const in uint light_type,const in vec3 light_direction,const in vec3 view_direction,const in vec3 normal,const in vec3 light_color,const in float light_attenuation,inout vec3 diffuse,inout vec3 specular){
    float light_strength=dot(normal,light_direction);
    if(light_strength>EPSILON){
        diffuse+=light_strength*light_color*light_attenuation;
        if(light_type!=1u){
            vec3 half_direction=normalize(light_direction+view_direction);
            float beckmann=beckmannDistribution(dot(normal,half_direction),.1);
            specular+=beckmann*light_color*light_attenuation;
        }
    }
}

mat4 get_light_projection(const in ivec3 lights_size,const in int i){
    int x=i%lights_size.x;
    int y=i/lights_size.x;
    
    float n11=uintBitsToFloat(texelFetch(lights,ivec3(x,y,0),0).r);
    float n12=uintBitsToFloat(texelFetch(lights,ivec3(x,y,1),0).r);
    float n13=uintBitsToFloat(texelFetch(lights,ivec3(x,y,2),0).r);
    float n14=uintBitsToFloat(texelFetch(lights,ivec3(x,y,3),0).r);
    float n21=uintBitsToFloat(texelFetch(lights,ivec3(x,y,4),0).r);
    float n22=uintBitsToFloat(texelFetch(lights,ivec3(x,y,5),0).r);
    float n23=uintBitsToFloat(texelFetch(lights,ivec3(x,y,6),0).r);
    float n24=uintBitsToFloat(texelFetch(lights,ivec3(x,y,7),0).r);
    float n31=uintBitsToFloat(texelFetch(lights,ivec3(x,y,8),0).r);
    float n32=uintBitsToFloat(texelFetch(lights,ivec3(x,y,9),0).r);
    float n33=uintBitsToFloat(texelFetch(lights,ivec3(x,y,10),0).r);
    float n34=uintBitsToFloat(texelFetch(lights,ivec3(x,y,11),0).r);
    float n41=uintBitsToFloat(texelFetch(lights,ivec3(x,y,12),0).r);
    float n42=uintBitsToFloat(texelFetch(lights,ivec3(x,y,13),0).r);
    float n43=uintBitsToFloat(texelFetch(lights,ivec3(x,y,14),0).r);
    float n44=uintBitsToFloat(texelFetch(lights,ivec3(x,y,15),0).r);
    
    return mat4(
        n11,n21,n31,n41,
        n12,n22,n32,n42,
        n13,n23,n33,n43,
        n14,n24,n34,n44
    );
}

LightData get_light(const in ivec3 lights_size,const in int i){
    int x=i%lights_size.x;
    int y=i/lights_size.x;
    
    uint l_type_id=texelFetch(lights,ivec3(x,y,0),0).r;
    uint l_pos_x=texelFetch(lights,ivec3(x,y,1),0).r;
    uint l_pos_y=texelFetch(lights,ivec3(x,y,2),0).r;
    uint l_pos_z=texelFetch(lights,ivec3(x,y,3),0).r;
    uint l_dir_x=texelFetch(lights,ivec3(x,y,4),0).r;
    uint l_dir_y=texelFetch(lights,ivec3(x,y,5),0).r;
    uint l_dir_z=texelFetch(lights,ivec3(x,y,6),0).r;
    uint l_color_r=texelFetch(lights,ivec3(x,y,7),0).r;
    uint l_color_g=texelFetch(lights,ivec3(x,y,8),0).r;
    uint l_color_b=texelFetch(lights,ivec3(x,y,9),0).r;
    uint _l_attenuation=texelFetch(lights,ivec3(x,y,10),0).r;
    uint l_mask=texelFetch(lights,ivec3(x,y,11),0).r;
    uint _l_param_0=texelFetch(lights,ivec3(x,y,12),0).r;
    uint _l_param_1=texelFetch(lights,ivec3(x,y,13),0).r;
    uint _l_param_2=texelFetch(lights,ivec3(x,y,14),0).r;
    uint _l_param_3=texelFetch(lights,ivec3(x,y,15),0).r;
    uint _l_shadow_bias=texelFetch(lights,ivec3(x,y,16),0).r;
    uint _l_shadow_normal_bias=texelFetch(lights,ivec3(x,y,17),0).r;
    uint _l_shadow_opacity=texelFetch(lights,ivec3(x,y,18),0).r;
    uint _l_data_stride=texelFetch(lights,ivec3(x,y,19),0).r;
    
    uint l_type=l_type_id&0xffffu;
    uint l_id=l_type_id>>16;
    vec3 l_position=vec3(uintBitsToFloat(l_pos_x),uintBitsToFloat(l_pos_y),uintBitsToFloat(l_pos_z));
    vec3 l_direction=vec3(uintBitsToFloat(l_dir_x),uintBitsToFloat(l_dir_y),uintBitsToFloat(l_dir_z));
    vec3 l_color=vec3(uintBitsToFloat(l_color_r),uintBitsToFloat(l_color_g),uintBitsToFloat(l_color_b));
    
    return LightData(l_type,l_id,l_mask,int(_l_data_stride),l_color,uintBitsToFloat(_l_attenuation),l_position,uintBitsToFloat(_l_param_0),l_direction,uintBitsToFloat(_l_param_1),uintBitsToFloat(_l_param_2),uintBitsToFloat(_l_param_3),uintBitsToFloat(_l_shadow_bias),uintBitsToFloat(_l_shadow_normal_bias),uintBitsToFloat(_l_shadow_opacity));
}

bool is_in_shadow(const in vec3 world_pos,const in mat4 projection,const in float bias){
    vec4 projected_pos=projection*vec4(world_pos,1.);
    projected_pos.xyz/=projected_pos.w;
    float current_depth=projected_pos.z-bias;
    bool in_range=projected_pos.x>=-1.&&projected_pos.x<=1.&&projected_pos.y>=-1.&&projected_pos.y<=1.;
    float projected_depth=texture(shadows,vec3(((projected_pos.xy)+vec2(1.))/2.,0.)).r*2.-1.;
    return(projected_depth<=current_depth);
}

float get_shadow(const in ivec3 lights_size,const in int idx,const in int count,const in float bias){
    bool in_shadow=false;
    for(int i=1;i<=count;i++){
        mat4 projection=get_light_projection(lights_size,idx+i);
        in_shadow=in_shadow||is_in_shadow(v_world,projection,bias);
    }
    return in_shadow?0.:1.;
}

void main(){
    vec3 normal=normalize(v_normal);
    vec4 albedo=u_color;
    
    vec3 diffuse=vec3(0.);
    vec3 specular=vec3(0.);
    
    ivec3 lights_size=textureSize(lights,0);
    int max_lights_count=lights_size.x*lights_size.y;
    const int MAX_COUNT=32;
    int max_count=min(max_lights_count,MAX_COUNT);
    vec3 c_dir=camera_is_orthogonal?normalize(mat3(camera_world)*vec3(0.f,0.f,1.f)):normalize(camera_world[3].xyz-v_world);
    
    for(int i=0;i<max_count;i++){
        LightData light=get_light(lights_size,i);
        if(light.type==0u)break;
        if((light.mask&layer)==0u){
            i+=light.stride;
            continue;
        }
        
        float shadow=1.;
        if(light.stride>0){
            shadow=get_shadow(lights_size,i,light.stride,light.shadow_bias);
        }
        light.attenuation*=mix(1.,shadow,light.shadow_opacity);
        i+=light.stride;
        
        if(light.type==1u){
            // ambient light
            calc_light(light.type,normal,c_dir,normal,light.color,light.attenuation,diffuse,specular);
        }else if(light.type==2u){
            // directional light
            vec3 l_dir=normalize(light.position);
            calc_light(light.type,l_dir,c_dir,normal,light.color,light.attenuation,diffuse,specular);
        }else if(light.type==3u){
            // point light
            float l_distance=distance(light.position,v_world);
            vec3 l_dir=normalize(light.position-v_world);
            float near_distance=light.param_0;
            float far_distance=light.param_1;
            float distance_w=(l_distance-near_distance)/(far_distance-near_distance);
            float distance_strength=smoothstep(1.f,0.f,distance_w);
            float l_atten=distance_strength/pow(max(l_distance,1.f),light.attenuation);
            calc_light(light.type,l_dir,c_dir,normal,light.color,l_atten,diffuse,specular);
        }else if(light.type==4u){
            // spot light
            vec3 l_dir=normalize(light.position-v_world);
            float l_dot_dir=dot(l_dir,-normalize(light.direction));
            float l_distance=distance(light.position,v_world);
            float angle_strength=smoothstep(cos(light.param_1),cos(light.param_0),l_dot_dir);
            float near_distance=light.param_2;
            float far_distance=light.param_3;
            float distance_w=(l_distance-near_distance)/(far_distance-near_distance);
            float distance_strength=smoothstep(1.f,0.f,distance_w);
            float l_atten=(angle_strength*distance_strength)/pow(max(l_distance,1.f),light.attenuation);
            calc_light(light.type,l_dir,c_dir,normal,light.color,l_atten,diffuse,specular);
        }
    }
    
    o_color=albedo*vec4(diffuse,1.)+vec4(specular,0.);
    o_normal=vec4(normal,1.);
}