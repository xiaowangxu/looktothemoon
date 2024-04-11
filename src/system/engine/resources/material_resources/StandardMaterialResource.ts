import { RenderStateUniformType, RenderStateShaderType } from "@/system/sliverofstraw/RenderState";
import type { Config } from "../../ConfiguredObject";
import { MaterialResource, type MaterialReadOnlyUniforms } from "./MaterialResource";
import type { TextureResource } from "../texture_resources/TextureResource";
import { Ref } from "@/system/utils/RefCounted";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import type { UniformInitSet } from "../../render_server/RenderServerShader";
import { Color } from "@/system/fivepebble/graphics/Color";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Epsilon } from "@/system/fivepebble/Scalar";
import { Cacher } from "@/system/utils/Cacher";
import { GlslPrimitives, MaterialNormalTextureUniformsDef, PrimitiveMaterialUniforms, ShaderNormalTextureUniformsDef, set_MaterialNormalTexture} from "./Primitives";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { RenderServerDevice } from "../../render_server/RenderServer";

const PrimitiveVertexShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;
    
    ${GlslPrimitives.Constants}
    
    ${GlslPrimitives.WorldUniforms}
    
    ${GlslPrimitives.VertexBuiltinAttributes}
    
    ${GlslPrimitives.VertexEssentialOuts}

    void main() {
        ${GlslPrimitives.VertexEssentialCalculations}
    }`;
    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Vertex, code).expect());
});
const PrimitiveVertexShaderUniforms: UniformInitSet<WebGL2RenderState> = {
    model_world: { type: RenderStateUniformType.Mat4, default: Matrix4.new },
};

export class StandardMaterialResource extends MaterialResource {
    public static class_name: string = 'StandardMaterialResource';

    static readonly #uniforms: MaterialReadOnlyUniforms = {
        ...PrimitiveMaterialUniforms,
        u_color: RenderStateUniformType.Vec4,
        ...MaterialNormalTextureUniformsDef,
    };

    static readonly #fragment_shade_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${GlslPrimitives.Constants}

    ${GlslPrimitives.WorldUniforms}

    ${GlslPrimitives.ShaderNormalTextureUniforms}

    uniform vec4 u_color;
    uniform usampler2DArray lights;
    uniform sampler2D sky;
    uniform uint layer;
    
    ${GlslPrimitives.FragmentVertexEssentialIns}

    ${GlslPrimitives.FragmentFrameSolidOuts}

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

    vec4 sample_Sky(sampler2D sky, vec3 normal) {
        float theta = atan(normal.z, normal.x);
        float gamma = acos(normal.y);
        return texture(sky, vec2(theta / TAU + 0.5, gamma / PI));
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
    
        uint l_type = l_type_id & 0xffffu;
        uint l_id = l_type_id >> 16;
        vec3 l_position = vec3(uintBitsToFloat(l_pos_x), uintBitsToFloat(l_pos_y), uintBitsToFloat(l_pos_z));
        vec3 l_direction = vec3(uintBitsToFloat(l_dir_x), uintBitsToFloat(l_dir_y), uintBitsToFloat(l_dir_z));
        vec3 l_color = vec3(uintBitsToFloat(l_color_r), uintBitsToFloat(l_color_g), uintBitsToFloat(l_color_b));
    
        return LightData(l_type, l_id, l_mask, int(_l_data_stride), l_color, uintBitsToFloat(_l_attenuation), l_position, uintBitsToFloat(_l_param_0), l_direction, uintBitsToFloat(_l_param_1), uintBitsToFloat(_l_param_2), uintBitsToFloat(_l_param_3), uintBitsToFloat(_l_shadow_bias), uintBitsToFloat(_l_shadow_normal_bias), uintBitsToFloat(_l_shadow_opacity));
    }
    
    // light function
    float beckmannDistribution(float x, float roughness) {
        float NdotH = max(x, 0.0001);
        float cos2Alpha = NdotH * NdotH;
        float tan2Alpha = (cos2Alpha - 1.0) / cos2Alpha;
        float roughness2 = roughness * roughness;
        float denom = 3.141592653589793 * roughness2 * cos2Alpha * cos2Alpha;
        return exp(tan2Alpha / roughness2) / denom;
    }
    
    void calc_light(const in uint light_type, const in vec3 light_direction, const in vec3 view_direction, const in vec3 normal, const in vec3 light_color, const in float light_attenuation, inout vec3 diffuse, inout vec3 specular) {
        float light_strength = dot(normal, light_direction);
        if (light_strength > EPSILON) {
            diffuse += light_strength * light_color * light_attenuation;
            if (light_type != 1u) {
                vec3 half_direction = normalize(light_direction + view_direction);  
                float beckmann = beckmannDistribution(dot(normal, half_direction), 0.4);
                specular += beckmann * light_color * light_attenuation;
            }
        }
    }

    void main() {
        ${GlslPrimitives.FragmentVertexEssentialCalculations}
        ${GlslPrimitives.FragmentNormalTextureCalculations}

        vec4 albedo = u_color;
        vec3 diffuse = vec3(0.0);
        vec3 specular = vec3(0.0);

        ivec3 lights_size = textureSize(lights, 0);
        int max_lights_count = lights_size.x * lights_size.y;
        const int MAX_COUNT = 128;
        int max_count = min(max_lights_count, MAX_COUNT);

        for(int i = 0; i < max_count; i++) {
            LightData light = get_light(lights_size, i);
            i += light.stride;
            if(light.type == 0u) break;
            if((light.mask & layer) == 0u) continue;
        
            if(light.type == 1u) {
	    	    // ambient light
                calc_light(light.type, NORMAL_VIEW, LOOKAT_VIEW, NORMAL_VIEW, light.color, light.attenuation, diffuse, specular);
            }
            else if(light.type == 2u) {
                // directional light
                vec3 LDIR_VIEW = normalize(v_NORMAL_VIEW_MATRIX * light.direction);
                calc_light(light.type, LDIR_VIEW, LOOKAT_VIEW, NORMAL_VIEW, light.color, light.attenuation, diffuse, specular);
            } 
            else if(light.type == 3u) {
	    	    // point light
                float l_distance = distance(light.position, v_VERTEX);
                vec3 LDIR_VIEW = normalize(v_NORMAL_VIEW_MATRIX *  normalize(light.position - v_VERTEX));
                float near_distance = light.param_0;
                float far_distance = light.param_1;
                float distance_w = (l_distance - near_distance) / (far_distance - near_distance);
                float distance_strength = smoothstep(1.0f, 0.0f, distance_w);
                float l_atten = distance_strength / pow(max(l_distance, 1.0f), light.attenuation);
                calc_light(light.type, LDIR_VIEW, LOOKAT_VIEW, NORMAL_VIEW, light.color, l_atten, diffuse, specular);
            } 
            else if(light.type == 4u) {
	    	    // spot light
                vec3 l_dir = normalize(light.position - v_VERTEX);
                float l_dot_dir = dot(l_dir, -normalize(light.direction));
                float l_distance = distance(light.position, v_VERTEX);
                float angle_strength = smoothstep(cos(light.param_1), cos(light.param_0), l_dot_dir);
                float near_distance = light.param_2;
                float far_distance = light.param_3;
                float distance_w = (l_distance - near_distance) / (far_distance - near_distance);
                float distance_strength = smoothstep(1.0f, 0.0f, distance_w);
                float l_atten = (angle_strength * distance_strength) / pow(max(l_distance, 1.0f), light.attenuation);
                vec3 LDIR_VIEW = normalize(v_NORMAL_VIEW_MATRIX * l_dir);
                calc_light(light.type, LDIR_VIEW, LOOKAT_VIEW, NORMAL_VIEW, light.color, l_atten, diffuse, specular);
            }
        }

        o_color = albedo * vec4(diffuse, 1.0) + vec4(specular, 0.0);
        o_normal = vec4(NORMAL_VIEW, 1.0);
    }`;
    static readonly #fragment_shade_uniforms: UniformInitSet<WebGL2RenderState> = {
        layer: { type: RenderStateUniformType.Uint, default: 0xffffffff },
        lights: { type: RenderStateUniformType.Int, default: RenderServerDevice.LightsTextureUnit },
        sky: { type: RenderStateUniformType.Int, default: RenderServerDevice.SkyTextureUnit },
        u_color: { type: RenderStateUniformType.Vec4, default: Color.new },
        ...ShaderNormalTextureUniformsDef,
    };

    public get uniforms() { return StandardMaterialResource.#uniforms; }

    private _color: Color = new Vector4(1, 1, 1, 1);
    public get color() { return this._color; }
    public set color(color: Color) {
        if (!this._color.equal(color)) {
            this._color.copy(color);
            this.material.set_Uniform('u_color', this._color);
            this.material.transparent = this._color.a < (1.0 - Epsilon);
        }
    }

    private _normal_texture: Ref<TextureResource> = new Ref();
    public get normal_texture() { return this._normal_texture.value; }
    public set normal_texture(normal_texture: TextureResource | undefined) {
        if (this._normal_texture.value !== normal_texture) {
            this._normal_texture.value = normal_texture;
            set_MaterialNormalTexture(this, this._normal_texture.value);
        }
    }

    constructor(config: Config) {
        super(config);
        this.material_ref.value = this.render_server.create_Material();
        this.update_Material();
    }

    public update_Material() {
        const shader = this.render_server.create_Shader();
        const vertex_shader = PrimitiveVertexShader.get(this.config).expect;
        // const fragment_prez_shader = PrimitiveFragmentPreZShader.get(this.config).expect;
        const fragment_shade_shader = this.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, StandardMaterialResource.#fragment_shade_shader).expect();
        // const fragment_oit_shader = this.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, StandardMaterialResource.#fragment_oit_shader).expect();
        shader.set_Shaders(
            vertex_shader,
            PrimitiveVertexShaderUniforms,
            {
                // prez: {
                //     shader: fragment_prez_shader,
                //     uniforms: PrimitiveFragmentPreZShaderUniforms,
                // },
                shade: {
                    shader: fragment_shade_shader,
                    uniforms: StandardMaterialResource.#fragment_shade_uniforms,
                },
                // oit: {
                //     shader: fragment_oit_shader,
                //     uniforms: StandardMaterialResource.#fragment_oit_uniforms,
                // }
            }
        );
        this.material.set_Material(shader, StandardMaterialResource.#uniforms);
        this.material.transparent = false;
    }
}
