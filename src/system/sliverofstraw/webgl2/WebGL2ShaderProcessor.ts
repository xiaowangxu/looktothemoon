import { RenderStateShaderType, RenderStateUniformType } from "../RenderState";

function get_ShaderMemberType(data_type: RenderStateUniformType) {
    switch (data_type) {
        case RenderStateUniformType.Uint: return 'uint';
        case RenderStateUniformType.Int: return 'int';
        case RenderStateUniformType.Float: return 'float';
        case RenderStateUniformType.Vec2: return 'vec2';
        case RenderStateUniformType.Vec3: return 'vec3';
        case RenderStateUniformType.Vec4: return 'vec4';
        case RenderStateUniformType.Mat3: return 'mat3';
        case RenderStateUniformType.Mat4: return 'mat4';
        case RenderStateUniformType.Tex2D: return 'sampler2D';
        case RenderStateUniformType.Tex3D: return 'sampler3D';
        case RenderStateUniformType.Tex2DArray: return 'sampler2DArray';
        default: {
            const n: never = data_type;
            return n;
        }
    }
}

export function process_WebGL2ShaderCode(
    type: RenderStateShaderType,
    attributes: { [name: string]: { type: RenderStateUniformType, location?: number } } | undefined,
    uniforms: { [name: string]: { type: RenderStateUniformType } } | undefined,
    varyings: { [name: string]: { type: RenderStateUniformType } } | undefined,
    outputs: { [name: string]: { type: RenderStateUniformType, location: number } } | undefined,
    code: string,
    light?: string,
) {
    const header = `#version 300 es
precision highp float;
precision highp usampler2DArray;
precision highp sampler3D;

uniform WorldUniforms {
    mat4 camera_world;
    mat4 camera_projection;
    vec2 screen_size;
    float time;
    bool camera_is_orthogonal;
};

uniform mat4 model_world;
uniform uint light_mask;
uniform usampler2DArray lights;`;
    if (type === RenderStateShaderType.Vertex) {
        const attrs = Object.entries(attributes ?? {}).map(([name, { type, location }]) => `${location === undefined ? '' : `layout(location = ${location}) `}in ${get_ShaderMemberType(type)} ${name};`);
        const unifs = Object.entries(uniforms ?? {}).map(([name, { type }]) => `uniform ${get_ShaderMemberType(type)} ${name};`);
        const varys = Object.entries(varyings ?? {}).map(([name, { type }]) => `out ${get_ShaderMemberType(type)} ${name};`);
        return `${header}
        
// attributes
${attrs.join('\n')}

// uniforms
${unifs.join('\n')}

// varyings
${varys.join('\n')}

void main() {
    // code
${code.split('\n').map(c => `    ${c}`).join('\n')}
}`;
    }
    else {
        const unifs = Object.entries(uniforms ?? {}).map(([name, { type }]) => `uniform ${get_ShaderMemberType(type)} ${name};`);
        const varys = Object.entries(varyings ?? {}).map(([name, { type }]) => `in ${get_ShaderMemberType(type)} ${name};`);
        const outps = Object.entries(outputs ?? {}).map(([name, { type, location }]) => `${location === undefined ? '' : `layout(location = ${location}) `}out ${get_ShaderMemberType(type)} ${name};`);
        return `${header}
        
// uniforms
${unifs.join('\n')}

// varyings
${varys.join('\n')}

// outputs
${outps.join('\n')}

// light function
float beckmannDistribution(float x, float roughness) {
    float NdotH = max(x, 0.0001);
    float cos2Alpha = NdotH * NdotH;
    float tan2Alpha = (cos2Alpha - 1.0) / cos2Alpha;
    float roughness2 = roughness * roughness;
    float denom = 3.141592653589793 * roughness2 * cos2Alpha * cos2Alpha;
    return exp(tan2Alpha / roughness2) / denom;
}

void light(uint light_type, in vec3 light_direction, in vec3 view_direction, in vec3 normal, in vec3 light_color, in float light_attenuation, inout vec3 diffuse, inout vec3 specular) {
    // code
${(light ?? `float light_strength = dot(normal, light_direction);
if (light_strength > 0.0) {
    diffuse += light_strength * light_color * light_attenuation;
    vec3 half_direction = normalize(light_direction + view_direction);  
    float beckmann = beckmannDistribution(dot(normal, half_direction), (sin(time) + 1.0) / 5.0 + 0.01);
    specular += beckmann * light_color * light_attenuation; // pow(dot(normal, half_direction), 500.0) * light_color * light_attenuation;
}
`).split('\n').map(c => `    ${c}`).join('\n')}
}

void main() {
    // code
${code.split('\n').map(c => `    ${c}`).join('\n')}
}`;
    }
}