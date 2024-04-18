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
import { GlslPrimitives, MaterialNormalTextureUniformsDef, PrimitiveMaterialUniforms, ShaderNormalTextureUniformsDef, set_MaterialNormalTexture } from "./Primitives";
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
    MODEL_WORLD: { type: RenderStateUniformType.Matrix4, default: Matrix4.new },
};

export class StandardMaterialResource extends MaterialResource {
    public static class_name: string = 'StandardMaterialResource';

    static readonly #uniforms: MaterialReadOnlyUniforms = {
        ...PrimitiveMaterialUniforms,
        u_color: RenderStateUniformType.Vector4,
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
    
    ${GlslPrimitives.FragmentVertexEssentialIns}

    ${GlslPrimitives.FragmentFrameSolidOuts}

    ${GlslPrimitives.FragmentLightDataUniformStruct}
    
    // light function
    float beckmannDistribution(float x, float roughness) {
        float NdotH = max(x, 0.0001);
        float cos2Alpha = NdotH * NdotH;
        float tan2Alpha = (cos2Alpha - 1.0) / cos2Alpha;
        float roughness2 = roughness * roughness;
        float denom = PI * roughness2 * cos2Alpha * cos2Alpha;
        return exp(tan2Alpha / roughness2) / denom;
    }
    
    ${GlslPrimitives.FragmentLightFunction(`
        float strength = dot(NORMAL, DIRECTION);
        if (strength < 1e-6) return;
        DIFFUSE = strength * COLOR * ATTENUATION;
        if (TYPE != 1u) {
            vec3 h = normalize(DIRECTION + VIEW);  
            float beckmann = beckmannDistribution(dot(NORMAL, h), 0.2);
            SPECULAR = beckmann * COLOR * ATTENUATION;
        }
    `)}

    void main() {
        ${GlslPrimitives.FragmentVertexEssentialCalculations}
        ${GlslPrimitives.FragmentNormalTextureCalculations}
        vec4 ALBEDO = u_color;
        ${GlslPrimitives.FragmentLightCalculations()}
        o_color = COLOR;
        o_normal = vec4(NORMAL_VIEW, 1.0);
    }`;
    static readonly #fragment_shade_uniforms: UniformInitSet<WebGL2RenderState> = {
        LAYER: { type: RenderStateUniformType.Uint, default: 0xffffffff },
        lights: { type: RenderStateUniformType.Int, default: RenderServerDevice.LightsTextureUnit },
        sky: { type: RenderStateUniformType.Int, default: RenderServerDevice.SkyTextureUnit },
        u_color: { type: RenderStateUniformType.Vector4, default: Color.new },
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
