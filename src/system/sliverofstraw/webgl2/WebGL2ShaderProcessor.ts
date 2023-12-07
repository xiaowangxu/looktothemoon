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
    code: string
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

void main() {
    // code
${code.split('\n').map(c => `    ${c}`).join('\n')}
}`;
    }
}