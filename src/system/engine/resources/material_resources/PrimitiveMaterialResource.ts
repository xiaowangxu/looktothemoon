import { RenderStateShaderType, RenderStateUniformType } from "@/system/sliverofstraw/RenderState";
import { MaterialResource, type MaterialReadOnlyUniforms } from "./MaterialResource";
import { RenderServerDevice, RenderServerPlainColorTexture } from "../../render_server/RenderServer";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import type { UniformInitSet } from "../../render_server/RenderServerShader";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Vector4, vec4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { RenderServerGeometry } from "../../render_server/RenderServerGeometry";
import type { Color } from "@/system/fivepebble/graphics/Color";
import { Epsilon } from "@/system/fivepebble/Scalar";
import type { Config } from "../../ConfiguredObject";
import type { ClassWriter, ClassReader } from "../../classes/saver_loader/ClassWriterReader";

export class PlainColorMaterialResource extends MaterialResource {

    static #uniforms: MaterialReadOnlyUniforms = {
        model_world: RenderStateUniformType.Mat4,
        u_color: RenderStateUniformType.Vec4,
        u_texture: RenderStateUniformType.Tex2D,
    };

    static #vertex_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;
    
    ${RenderServerDevice.ConstantsCode}
    
    ${RenderServerDevice.WorldUniformsCode}
    
    ${RenderServerGeometry.GeometryAttributesCode}
    
    uniform mat4 model_world;
    
    out vec3 v_world;
    out vec3 v_normal;
    out vec2 v_uv;
    
    void main() {
        mat4 _model_world = model_world * a_instance_transform;
        vec4 world = _model_world * vec4(a_position, 1.0);
        gl_Position = camera_projection * camera_view * world;
        v_normal = normalize(mat3(transpose(inverse(_model_world))) * a_normal);
        v_uv = a_uv;
        v_world = world.xyz;
    }`;
    static #vertex_uniforms: UniformInitSet<WebGL2RenderState> = {
        model_world: { type: RenderStateUniformType.Mat4, default: Matrix4.make_Identity() },
    };
    static #fragment_prez_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}
    
    in vec3 v_world;
    in vec3 v_normal;
    in vec2 v_uv;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        o_normal = normalize(v_normal);
    }`;
    static #fragment_prez_uniforms: UniformInitSet<WebGL2RenderState> = {};
    static #fragment_shade_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}

    uniform vec4 u_color;
    uniform sampler2D u_texture;
    
    in vec3 v_world;
    in vec3 v_normal;
    in vec2 v_uv;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        o_color = texture(u_texture, v_uv) * u_color;
        o_normal = normalize(v_normal);
    }`;
    private fragment_shade_uniforms: UniformInitSet<WebGL2RenderState> = {
        u_color: { type: RenderStateUniformType.Vec4, default: vec4(1, 1, 1, 1) },
        u_texture: { type: RenderStateUniformType.Tex2D, default: { texture: this.render_server_3d.get_PlainColorTexture(RenderServerPlainColorTexture.White) } },
    };
    static #fragment_oit_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}

    uniform vec4 u_color;
    uniform sampler2D u_texture;
    
    in vec3 v_world;
    in vec3 v_normal;
    in vec2 v_uv;

    ${RenderServerDevice.FrameOiTOutputBufferCode}

    void main() {
        vec4 color = texture(u_texture, v_uv) * u_color;

        ${RenderServerDevice.OitOutputCode}
    }`;
    private fragment_oit_uniforms: UniformInitSet<WebGL2RenderState> = {
        u_color: { type: RenderStateUniformType.Vec4, default: vec4(1, 1, 1, 1) },
        u_texture: { type: RenderStateUniformType.Tex2D, default: { texture: this.render_server_3d.get_PlainColorTexture(RenderServerPlainColorTexture.White) } },
    };

    public get uniforms() { return PlainColorMaterialResource.#uniforms; }

    private _color: Color = new Vector4(1, 1, 1, 1);
    public get color() { return this._color; }
    public set color(color: Color) {
        if (!this._color.equal(color)) {
            this._color = color;
            this.material.set_UniformOverride('u_color', this._color);
            this.material.is_transparent = this._color.a < (1.0 - Epsilon);
        }
    }

    constructor(config: Config) {
        super(config);
        this.update_Material();
    }

    public update_Material() {
        const shader = this.render_server_3d.create_Shader();
        const vertex_shader = this.render_server_3d.render_state.create_Shader(RenderStateShaderType.Vertex, PlainColorMaterialResource.#vertex_shader).expect();
        const fragment_prez_shader = this.render_server_3d.render_state.create_Shader(RenderStateShaderType.Fragment, PlainColorMaterialResource.#fragment_prez_shader).expect();
        const fragment_shade_shader = this.render_server_3d.render_state.create_Shader(RenderStateShaderType.Fragment, PlainColorMaterialResource.#fragment_shade_shader).expect();
        const fragment_oit_shader = this.render_server_3d.render_state.create_Shader(RenderStateShaderType.Fragment, PlainColorMaterialResource.#fragment_oit_shader).expect();
        shader.set_Shaders(
            vertex_shader,
            PlainColorMaterialResource.#vertex_uniforms,
            {
                prez: {
                    shader: fragment_prez_shader,
                    uniforms: PlainColorMaterialResource.#fragment_prez_uniforms,
                },
                shade: {
                    shader: fragment_shade_shader,
                    uniforms: this.fragment_shade_uniforms,
                },
                oit: {
                    shader: fragment_oit_shader,
                    uniforms: this.fragment_oit_uniforms,
                }
            }
        );
        this.material.set_Material(shader, PlainColorMaterialResource.#uniforms);
        this.material.is_transparent = false;
    }
}

export class NormalMaterialResource extends MaterialResource {
    public static class_name: string = 'NormalMaterialResource';

    static #uniforms: MaterialReadOnlyUniforms = {
        model_world: RenderStateUniformType.Mat4,
        u_remap: RenderStateUniformType.Int,
    };

    static #vertex_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;
    
    ${RenderServerDevice.ConstantsCode}
    
    ${RenderServerDevice.WorldUniformsCode}
    
    ${RenderServerGeometry.GeometryAttributesCode}
    
    uniform mat4 model_world;
    
    out vec3 v_world;
    out vec3 v_normal;
    
    void main() {
        mat4 _model_world = model_world * a_instance_transform;
        vec4 world = _model_world * vec4(a_position, 1.0);
        gl_Position = camera_projection * inverse(camera_world) * world;
        v_normal = normalize(mat3(transpose(inverse(_model_world))) * a_normal);
        v_world = world.xyz;
    }`;
    static #vertex_uniforms: UniformInitSet<WebGL2RenderState> = {
        model_world: { type: RenderStateUniformType.Mat4, default: Matrix4.make_Identity() },
    };
    static #fragment_prez_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}
    
    in vec3 v_world;
    in vec3 v_normal;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        o_normal = normalize(v_normal);
    }`;
    static #fragment_prez_uniforms: UniformInitSet<WebGL2RenderState> = {};
    static #fragment_shade_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}

    uniform bool u_remap;

    in vec3 v_world;
    in vec3 v_normal;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        // camera_world: normalize(mat3(transpose(camera_world)) * normalize(v_normal))
        vec3 normal = normalize(v_normal);
        o_color = vec4(u_remap ? ((normal + 1.0) / 2.0) : normal, 1.0);
        o_normal = normal;
    }`;
    static #fragment_shade_uniforms: UniformInitSet<WebGL2RenderState> = {
        u_remap: { type: RenderStateUniformType.Int, default: 1 }
    };

    public get uniforms() { return NormalMaterialResource.#uniforms; }

    private _remap: boolean = true;
    public get remap() { return this._remap; }
    public set remap(remap: boolean) {
        if (this._remap !== remap) {
            this._remap = remap;
            this.material.set_UniformOverride('u_remap', this._remap ? 1 : 0);
        }
    }

    constructor(config: Config) {
        super(config);
        this.update_Material();
    }

    public update_Material() {
        const shader = this.render_server_3d.create_Shader();
        const vertex_shader = this.render_server_3d.render_state.create_Shader(RenderStateShaderType.Vertex, NormalMaterialResource.#vertex_shader).expect();
        const fragment_prez_shader = this.render_server_3d.render_state.create_Shader(RenderStateShaderType.Fragment, NormalMaterialResource.#fragment_prez_shader).expect();
        const fragment_shade_shader = this.render_server_3d.render_state.create_Shader(RenderStateShaderType.Fragment, NormalMaterialResource.#fragment_shade_shader).expect();
        shader.set_Shaders(
            vertex_shader,
            NormalMaterialResource.#vertex_uniforms,
            {
                prez: {
                    shader: fragment_prez_shader,
                    uniforms: NormalMaterialResource.#fragment_prez_uniforms,
                },
                shade: {
                    shader: fragment_shade_shader,
                    uniforms: NormalMaterialResource.#fragment_shade_uniforms,
                }
            }
        );
        this.material.set_Material(shader, NormalMaterialResource.#uniforms);
        this.material.is_transparent = false;
    }

    // save / load

    public dump(writer: ClassWriter): void {
        writer.property('remap', this.remap);
    }

    public load(reader: ClassReader): void {
        this.remap = reader.get<boolean>('remap') ?? true;
    }
}

export class UVMaterialResource extends MaterialResource {

    static #uniforms: MaterialReadOnlyUniforms = {
        model_world: RenderStateUniformType.Mat4,
    };

    static #vertex_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;
    
    ${RenderServerDevice.ConstantsCode}

    ${RenderServerDevice.WorldUniformsCode}
    
    ${RenderServerGeometry.GeometryAttributesCode}
    
    uniform mat4 model_world;
    
    out vec3 v_world;
    out vec3 v_normal;
    out vec2 v_uv;
    
    void main() {
        mat4 _model_world = model_world * a_instance_transform;
        vec4 world = _model_world * vec4(a_position, 1.0);
        gl_Position = camera_projection * inverse(camera_world) * world;
        v_normal = normalize(mat3(transpose(inverse(_model_world))) * a_normal);
        v_uv = a_uv;
        v_world = world.xyz;
    }`;
    static #vertex_uniforms: UniformInitSet<WebGL2RenderState> = {
        model_world: { type: RenderStateUniformType.Mat4, default: Matrix4.make_Identity() },
    };
    static #fragment_prez_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}
    
    in vec3 v_world;
    in vec3 v_normal;
    in vec2 v_uv;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        o_normal = normalize(v_normal);
    }`;
    static #fragment_prez_uniforms: UniformInitSet<WebGL2RenderState> = {};
    static #fragment_shade_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}

    in vec3 v_world;
    in vec3 v_normal;
    in vec2 v_uv;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        o_color = vec4(v_uv, 0.0, 1.0);
        o_normal = normalize(v_normal);
    }`;
    static #fragment_shade_uniforms: UniformInitSet<WebGL2RenderState> = {};

    public get uniforms() { return UVMaterialResource.#uniforms; }

    constructor(config: Config) {
        super(config);
        this.update_Material();
    }

    public update_Material() {
        const shader = this.render_server_3d.create_Shader();
        const vertex_shader = this.render_server_3d.render_state.create_Shader(RenderStateShaderType.Vertex, UVMaterialResource.#vertex_shader).expect();
        const fragment_prez_shader = this.render_server_3d.render_state.create_Shader(RenderStateShaderType.Fragment, UVMaterialResource.#fragment_prez_shader).expect();
        const fragment_shade_shader = this.render_server_3d.render_state.create_Shader(RenderStateShaderType.Fragment, UVMaterialResource.#fragment_shade_shader).expect();
        shader.set_Shaders(
            vertex_shader,
            UVMaterialResource.#vertex_uniforms,
            {
                prez: {
                    shader: fragment_prez_shader,
                    uniforms: UVMaterialResource.#fragment_prez_uniforms,
                },
                shade: {
                    shader: fragment_shade_shader,
                    uniforms: UVMaterialResource.#fragment_shade_uniforms,
                }
            }
        );
        this.material.set_Material(shader, UVMaterialResource.#uniforms);
        this.material.is_transparent = false;
    }
}

export class StandardMaterialResource extends MaterialResource {

    static #uniforms: MaterialReadOnlyUniforms = {
        model_world: RenderStateUniformType.Mat4,
        layer: RenderStateUniformType.Uint,
        u_color: RenderStateUniformType.Vec4,
    };

    static #vertex_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;
    
    ${RenderServerDevice.ConstantsCode}
    
    ${RenderServerDevice.WorldUniformsCode}
    
    ${RenderServerGeometry.GeometryAttributesCode}
    
    uniform mat4 model_world;
    
    out vec3 v_world;
    out vec3 v_normal;
    out vec2 v_uv;
    
    void main() {
        mat4 _model_world = model_world * a_instance_transform;
        vec4 world = _model_world * vec4(a_position, 1.0);
        gl_Position = camera_projection * camera_view * world;
        v_normal = normalize(mat3(transpose(inverse(_model_world))) * a_normal);
        v_uv = a_uv;
        v_world = world.xyz;
    }`;
    static #vertex_uniforms: UniformInitSet<WebGL2RenderState> = {
        model_world: { type: RenderStateUniformType.Mat4, default: Matrix4.make_Identity() },
    };
    static #fragment_prez_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}
    
    in vec3 v_world;
    in vec3 v_normal;
    in vec2 v_uv;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        o_normal = normalize(v_normal);
    }`;
    static #fragment_prez_uniforms: UniformInitSet<WebGL2RenderState> = {};
    static #fragment_shade_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.ConstantsCode}

    ${RenderServerDevice.WorldUniformsCode}

    uniform vec4 u_color;
    uniform usampler2DArray lights;
    uniform sampler2D sky;
    uniform uint layer;
    
    in vec3 v_world;
    in vec3 v_normal;
    in vec2 v_uv;

    ${RenderServerDevice.FrameOutputBufferCode}

    struct LightData {
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
    
    void calc_light(const in uint light_type, const in vec3 light_direction, const in vec3 view_direction, const in vec3 normal, const in vec3 light_color, const in float light_attenuation, inout vec3 diffuse, inout vec3 specular) {
        float light_strength = max(0.0, dot(normal, light_direction));
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

    void main() {
        vec3 normal = normalize(v_normal);
        // vec3 lookat_dir = camera_is_orthogonal ? normalize(mat3(camera_world) * vec3(0.0, 0.0, 1.0)) : normalize(camera_world[3].xyz - v_world);
        // vec3 reflected = reflect(-lookat_dir, normal);
        // vec4 albedo = skybox(sky, reflected);
        vec4 albedo = u_color;

        vec3 diffuse = vec3(0.0);
        vec3 specular = vec3(0.0);

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
                calc_light(light.type, normal, c_dir, normal, light.color, light.attenuation, diffuse, specular);
            } else if(light.type == 2u) {
	    	    // directional light
                vec3 l_dir = normalize(light.position);
                calc_light(light.type, l_dir, c_dir, normal, light.color, light.attenuation, diffuse, specular);
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

        o_color = albedo * vec4(diffuse, 1.0) + vec4(specular, 0.0);
        o_normal = normal;
    }`;
    static #fragment_shade_uniforms: UniformInitSet<WebGL2RenderState> = {
        layer: { type: RenderStateUniformType.Uint, default: 0xffffffff },
        lights: { type: RenderStateUniformType.Int, default: RenderServerDevice.LightsTextureUnit },
        u_color: { type: RenderStateUniformType.Vec4, default: vec4(1, 1, 1, 1) },
    };
    static #fragment_oit_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.ConstantsCode}

    ${RenderServerDevice.WorldUniformsCode}

    uniform vec4 u_color;
    uniform usampler2DArray lights;
    uniform sampler2D sky;
    uniform uint layer;
    
    in vec3 v_world;
    in vec3 v_normal;
    in vec2 v_uv;

    ${RenderServerDevice.FrameOiTOutputBufferCode}

    struct LightData {
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
    
    void calc_light(const in uint light_type, const in vec3 light_direction, const in vec3 view_direction, const in vec3 normal, const in vec3 light_color, const in float light_attenuation, inout vec3 diffuse, inout vec3 specular) {
        float light_strength = max(0.0, dot(normal, light_direction));
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

    void main() {
        vec3 normal = normalize(v_normal);
        // vec3 lookat_dir = camera_is_orthogonal ? normalize(mat3(camera_world) * vec3(0.0, 0.0, 1.0)) : normalize(camera_world[3].xyz - v_world);
        // vec3 reflected = reflect(-lookat_dir, normal);
        // vec4 albedo = skybox(sky, reflected);
        vec4 albedo = u_color;

        vec3 diffuse = vec3(0.0);
        vec3 specular = vec3(0.0);

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
                calc_light(light.type, normal, c_dir, normal, light.color, 1.0, diffuse, specular);
            } else if(light.type == 2u) {
	    	    // directional light
                vec3 l_dir = normalize(light.position);
                calc_light(light.type, l_dir, c_dir, normal, light.color, 1.0, diffuse, specular);
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

        vec4 color = albedo * vec4(diffuse, 1.0) + vec4(specular, 0.0);

        ${RenderServerDevice.OitOutputCode}
    }`;
    static #fragment_oit_uniforms: UniformInitSet<WebGL2RenderState> = {
        layer: { type: RenderStateUniformType.Uint, default: 0xffffffff },
        lights: { type: RenderStateUniformType.Int, default: RenderServerDevice.LightsTextureUnit },
        u_color: { type: RenderStateUniformType.Vec4, default: vec4(1, 1, 1, 1) },
    };

    public get uniforms() { return StandardMaterialResource.#uniforms; }

    private _color: Color = new Vector4(1, 1, 1, 1);
    public get color() { return this._color; }
    public set color(color: Color) {
        if (!this._color.equal(color)) {
            this._color = color;
            this.material.set_UniformOverride('u_color', this._color);
            this.material.is_transparent = this._color.a < (1.0 - Epsilon);
        }
    }

    constructor(config: Config) {
        super(config);
        this.update_Material();
    }

    public update_Material() {
        const shader = this.render_server_3d.create_Shader();
        const vertex_shader = this.render_server_3d.render_state.create_Shader(RenderStateShaderType.Vertex, StandardMaterialResource.#vertex_shader).expect();
        const fragment_prez_shader = this.render_server_3d.render_state.create_Shader(RenderStateShaderType.Fragment, StandardMaterialResource.#fragment_prez_shader).expect();
        const fragment_shade_shader = this.render_server_3d.render_state.create_Shader(RenderStateShaderType.Fragment, StandardMaterialResource.#fragment_shade_shader).expect();
        const fragment_oit_shader = this.render_server_3d.render_state.create_Shader(RenderStateShaderType.Fragment, StandardMaterialResource.#fragment_oit_shader).expect();
        shader.set_Shaders(
            vertex_shader,
            StandardMaterialResource.#vertex_uniforms,
            {
                prez: {
                    shader: fragment_prez_shader,
                    uniforms: StandardMaterialResource.#fragment_prez_uniforms,
                },
                shade: {
                    shader: fragment_shade_shader,
                    uniforms: StandardMaterialResource.#fragment_shade_uniforms,
                },
                oit: {
                    shader: fragment_oit_shader,
                    uniforms: StandardMaterialResource.#fragment_oit_uniforms,
                }
            }
        );
        this.material.set_Material(shader, StandardMaterialResource.#uniforms);
        this.material.is_transparent = false;
    }
}