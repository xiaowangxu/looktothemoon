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

const Consts = `const float PI = 3.1415926535;
const float TAU = 6.283185307;
const float EPSILON = 0.00001;`

const NDFs = {
    // float ndf(l, n, v);
    BlinnPhong: `float ndf(in vec3 l, in vec3 v, in vec3 n, in float power, in float gloss) {
        vec3 h = normalize(l + v);
        float distribution = pow(max(dot(n, h), 0.0), gloss) * power;
        distribution *= (2.0 + power) / TAU;
        return distribution;
    }`,
    Phong: `float ndf(in vec3 l, in vec3 v, in vec3 n, in float power, in float gloss) {
        vec3 r = reflect(-l, n);
        float distribution = pow(max(dot(r, v), 0.0), gloss) * power;
        distribution *= (2.0 + power) / TAU;
        return distribution;
    }`,
    Beckmann: `float ndf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
        float roughness_sqr = roughness * roughness;
        vec3 h = normalize(l + v);
        float ndoth = max(dot(n, h), 0.0);
        float ndoth_sqr = ndoth * ndoth;
        return max(EPSILON, (1.0 / (PI * roughness_sqr * ndoth_sqr * ndoth_sqr)) * exp((ndoth_sqr - 1.0) / ( roughness_sqr * ndoth_sqr)));
    }`,
    Gaussian: `float ndf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
        float roughness_sqr = roughness * roughness;
        vec3 h = normalize(l + v);
        float ndoth = max(dot(n, h), 0.0);
	    float thetah = acos(ndoth);
        return exp(-thetah * thetah / roughness_sqr);
    }`,
    GGX: `float ndf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
        float roughness_sqr = roughness * roughness;
        vec3 h = normalize(l + v);
        float ndoth = max(dot(n, h), 0.0);
        float ndoth_sqr = ndoth * ndoth;
        float tan_ndoth_sqr = (1.0 - ndoth_sqr) / ndoth_sqr;
        return (1.0 / PI) * pow(roughness / max(ndoth_sqr * (roughness_sqr + tan_ndoth_sqr), EPSILON), 2.0);
    }`,
    TrowbridgeReitz: `float ndf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
        float roughness_sqr = roughness * roughness;
        vec3 h = normalize(l + v);
        float ndoth = max(dot(n, h), 0.0);
        float distribution = ndoth * ndoth * (roughness_sqr - 1.0) + 1.0;
        return roughness_sqr / (PI * distribution * distribution);
    }`,
    TrowbridgeReitzAnisotropic: `float ndf(in vec3 l, in vec3 v, in vec3 n, in float smomthness, in float anisotropic, in vec3 tangent, in vec3 bitangent) {
        vec3 h = normalize(l + v);
        float ndoth = max(dot(n, h), 0.0);
        float aspect = sqrt(1.0 - anisotropic * 0.9);
        float x = max(0.001, pow(1.0 - smomthness, 2.0) / aspect) * 5;
        float y = max(0.001, pow(1.0 - smomthness, 2.0) * aspect) * 5;
        return 1.0 / (PI * x * y * pow(pow(dot(h, tangent) / x, 2.0) + pow(dot(h, bitangent) / y, 2.0) + ndoth * ndoth), 2.0);
    }`,
}

const GSFs = {
    // float gsf(l, n, v);
    Implicit: `float gsf(in vec3 l, in vec3 v, in vec3 n) {
        float ndotl = max(dot(n, l), 0.0);
        float ndotv = max(dot(n, v), 0.0);
        return ndotl * ndotv;       
    }`,
    AshikhminShirley: `float gsf(in vec3 l, in vec3 v, in vec3 n) {
        float ndotl = max(dot(n, l), 0.0);
        float ndotv = max(dot(n, v), 0.0);
        vec3 h = normalize(l + v);
        float ldoth = max(dot(l, h), 0.0);
        return ndotl * ndotv/ (ldoth * max(ndotl, ndotv));
    }`,
    AshikhminPremoze: `float gsf(in vec3 l, in vec3 v, in vec3 n) {
        float ndotl = max(dot(n, l), 0.0);
        float ndotv = max(dot(n, v), 0.0);
        float ndotl_ndotv = ndotl * ndotv;
        return ndotl_ndotv / (ndotl + ndotv - ndotl_ndotv);
    }`,
    Duer: `float gsf(in vec3 l, in vec3 v, in vec3 n) {
        vec3 lpv = l + v;
        return dot(lpv, lpv) * pow(dot(lpv, n), -4.0);
    }`,
    Neumann: `float gsf(in vec3 l, in vec3 v, in vec3 n) {
        float ndotl = max(dot(n, l), 0.0);
        float ndotv = max(dot(n, v), 0.0);
        return (ndotl * ndotv) / max(ndotl, ndotv);
    }`,
    Kelemen: `float gsf(in vec3 l, in vec3 v, in vec3 n) {
        float ndotl = max(dot(n, l), 0.0);
        float ndotv = max(dot(n, v), 0.0);
        vec3 h = normalize(l + v);
        float vdoth = max(dot(v, h), 0.0);
        return (ndotl * ndotv) / (vdoth * vdoth);
    }`,
    CookTorrance: `float gsf(in vec3 l, in vec3 v, in vec3 n) {
        float ndotl = max(dot(n, l), 0.0);
        float ndotv = max(dot(n, v), 0.0);
        vec3 h = normalize(l + v);
        float ndoth = max(dot(n, h), 0.0);
        float vdoth = max(dot(v, h), 0.0);
        return min(1.0, min(2.0 * ndoth * ndotv / vdoth, 2.0 * ndoth * ndotl / vdoth));
    }`,
    Ward: `float gsf(in vec3 l, in vec3 v, in vec3 n) {
        float ndotl = max(dot(n, l), 0.0);
        float ndotv = max(dot(n, v), 0.0);
        return pow( ndotl * ndotv, 0.5);
    }`,
    Walter: `float gsf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
        float ndotl = max(dot(n, l), 0.0);
        float ndotv = max(dot(n, v), 0.0);
        float roughness_sqr = roughness * roughness;
        float ndotl_sqr = ndotl * ndotl;
        float ndotv_sqr = ndotv * ndotv;
        float smith_l = 2.0 / (1.0 + sqrt(1.0 + roughness_sqr * (1.0 - ndotl_sqr) / (ndotl_sqr)));
        float smith_v = 2.0 / (1.0 + sqrt(1.0 + roughness_sqr * (1.0 - ndotv_sqr) / (ndotv_sqr)));
	    return smith_l * smith_v;
    }`,
    SmithBeckmann: `float gsf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
        float ndotl = max(dot(n, l), 0.0);
        float ndotv = max(dot(n, v), 0.0);
        float roughness_sqr = roughness * roughness;
        float ndotl_sqr = ndotl * ndotl;
        float ndotv_sqr = ndotv * ndotv;
        float calulation_l = ndotl / (roughness_sqr * sqrt(1.0 - ndotl_sqr));
        float calulation_v = ndotv / (roughness_sqr * sqrt(1.0 - ndotv_sqr));
        float smith_l = calulation_l < 1.6 ? (((3.535 * calulation_l) + (2.181 * calulation_l * calulation_l)) / (1.0 + (2.276 * calulation_l) + (2.577 * calulation_l * calulation_l))) : 1.0;
        float smith_v = calulation_v < 1.6 ? (((3.535 * calulation_v) + (2.181 * calulation_v * calulation_v)) / (1.0 + (2.276 * calulation_v) + (2.577 * calulation_v * calulation_v))) : 1.0;
	    return smith_l * smith_v;
    }`,
    GGX: `float gsf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
        float ndotl = max(dot(n, l), 0.0);
        float ndotv = max(dot(n, v), 0.0);
        float roughness_sqr = roughness * roughness;
        float ndotl_sqr = ndotl * ndotl;
        float ndotv_sqr = ndotv * ndotv;
        float smith_l = (2.0 * ndotl)/ (ndotl + sqrt(roughness_sqr + (1.0 - roughness_sqr) * ndotl_sqr));
        float smith_v = (2.0 * ndotv)/ (ndotv + sqrt(roughness_sqr + (1.0 - roughness_sqr) * ndotv_sqr));
	    return smith_l * smith_v;
    }`,
}

const FNLs = {
    Schlick: `vec3 fnl(in vec3 l, in vec3 v, in vec3 n, in vec3 ior) {
        vec3 h = normalize(l + v);
        float ldoth = max(dot(l, h), 0.0);
        vec3 f0 = vec3(
            pow(ior.r - 1.0, 2.0) / pow(ior.r + 1.0, 2.0),
            pow(ior.g - 1.0, 2.0) / pow(ior.g + 1.0, 2.0),
            pow(ior.b - 1.0, 2.0) / pow(ior.b + 1.0, 2.0)
        );
        // SchlickFresnel
        float x = clamp(1.0 - ldoth, 0.0, 1.0);
        float x2 = x * x;
        return f0 + (1.0 - f0) * x2 * x2 * x;
    }`
}

export function process_WebGL2ShaderCode(
    type: RenderStateShaderType,
    attributes: { [name: string]: { type: RenderStateUniformType, location?: number } } | undefined,
    uniforms: { [name: string]: { type: RenderStateUniformType } } | undefined,
    varyings: { [name: string]: { type: RenderStateUniformType } } | undefined,
    outputs: { [name: string]: { type: RenderStateUniformType, location: number } } | undefined,
    code: string,
    light?: string,
    extras?: string,
) {
    const header = `#version 300 es
precision highp float;
precision highp usampler2DArray;
precision highp sampler3D;

${Consts}

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

// extras
${extras ?? ''}

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

// skybox_sample
vec4 skybox(sampler2D sky, vec3 normal, float lod) {
    float theta = atan(normal.z, normal.x);
    float gamma = acos(normal.y);
    return texture(sky, vec2(theta / TAU + 0.5, gamma / PI), lod);
}

// light function : ndf
${NDFs.GGX}

// light function : gsf
${GSFs.GGX}

// light function : fnl
${FNLs.Schlick}

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
${(light ?? 
`float light_strength = dot(normal, light_direction);
if (light_strength > 0.0) {
    diffuse += light_strength * light_color * light_attenuation;
    if (light_type != uint(2)) {
        vec3 half_direction = normalize(light_direction + view_direction);  
        float beckmann = beckmannDistribution(dot(normal, half_direction), 0.01);
        specular += beckmann * light_color * light_attenuation;
    }
}`
// `float roughness = 0.2; //(sin(time / 3.0) + 1.0) / 2.0 + 0.0001;
// float metalic = 1.0;
// if (light_type == uint(1)) {
//     // diffuse += light_color * light_attenuation * (1.0 - metalic);
// }
// else {
//     float ndotl = max(dot(normal, light_direction), 0.0);
//     float ndotv = max(dot(normal, view_direction), 0.0);
//     if (ndotl > 0.0) {
//         float specular_ndf = ndf(light_direction, view_direction, normal, roughness);
//         float specular_gsf = gsf(light_direction, view_direction, normal, roughness);
//         vec3 specular_fnl = fnl(light_direction, view_direction, normal, vec3(0.44400, 0.52700,	1.09400));
//         vec3 ks = specular_fnl;
//         vec3 kd = vec3(1.0) - ks;
//         kd *= 1.0 - metalic;     
//         diffuse += kd * ndotl * light_color * light_attenuation;
//         specular += (specular_ndf * specular_gsf * specular_fnl) / max(4.0 * ndotv, EPSILON) * light_color * light_attenuation;
//     }
// }`
).split('\n').map(c => `    ${c}`).join('\n')}
}

// extras
${extras ?? ''}

void main() {
    // code
${code.split('\n').map(c => `    ${c}`).join('\n')}
}`;
    }
}