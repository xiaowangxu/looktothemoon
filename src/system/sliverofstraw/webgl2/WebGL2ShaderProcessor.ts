import { RenderStateShaderType, RenderStateValueType } from "../RenderState";

function get_ShaderMemberType(data_type: RenderStateValueType) {
    switch (data_type) {
        case RenderStateValueType.Float: return 'float';
        case RenderStateValueType.Int: return 'int';
        case RenderStateValueType.Vec2: return 'vec2';
        case RenderStateValueType.Vec3: return 'vec3';
        case RenderStateValueType.Vec4: return 'vec4';
        case RenderStateValueType.Mat3: return 'mat3';
        case RenderStateValueType.Mat4: return 'mat4';
        case RenderStateValueType.Tex2D: return 'sampler2D';
        default: {
            const n: never = data_type;
            return n;
        }
    }
}

export function process_WebGL2ShaderCode(
    type: RenderStateShaderType,
    attributes: { [name: string]: { type: RenderStateValueType, location?: number } } | undefined,
    uniforms: { [name: string]: { type: RenderStateValueType } } | undefined,
    varyings: { [name: string]: { type: RenderStateValueType } } | undefined,
    outputs: { [name: string]: { type: RenderStateValueType, location: number } } | undefined,
    code: string
) {
    const header = `#version 300 es
precision highp float;

uniform WorldUniforms {
    mat4 model_world;
    mat4 camera_world;
    mat4 camera_view;
    mat4 camera_projection;
    vec2 screen_size;
    float time;
};`;
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