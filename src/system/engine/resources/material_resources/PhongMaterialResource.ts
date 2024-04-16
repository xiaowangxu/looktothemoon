import { RenderStateUniformType, RenderStateShaderType } from "@/system/sliverofstraw/RenderState";
import type { Config } from "../../ConfiguredObject";
import { MaterialResource, type MaterialReadOnlyUniforms } from "./MaterialResource";
import type { TextureResource } from "../texture_resources/TextureResource";
import { Ref } from "@/system/utils/RefCounted";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { RenderServerPlainColorTexture } from "../../render_server/RenderServer";
import type { UniformInitSet } from "../../render_server/RenderServerShader";
import { Color } from "@/system/fivepebble/graphics/Color";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Epsilon } from "@/system/fivepebble/Scalar";
import { Cacher } from "@/system/utils/Cacher";
import { GlslPrimitives, MaterialLightDataTextureUniformsDef, MaterialNormalTextureUniformsDef, PrimitiveFragmentPreZShader, PrimitiveFragmentPreZShaderUniforms, PrimitiveMaterialUniforms, PrimitiveVertexShader, PrimitiveVertexShaderUniforms, ShaderLightDataTextureUniformsDef, ShaderNormalTextureUniformsDef, set_MaterialNormalTexture } from "./Primitives";

const PhongFragmentShadeShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${GlslPrimitives.WorldUniforms}
    ${GlslPrimitives.Constants}

    ${GlslPrimitives.ShaderNormalTextureUniforms}

    uniform vec4 u_color;
    uniform sampler2D u_texture;
    
    ${GlslPrimitives.FragmentVertexEssentialIns}

    ${GlslPrimitives.FragmentFrameSolidOuts}

    ${GlslPrimitives.FragmentLightDataUniformStruct}

    float ndf_blinnphong(in vec3 l, in vec3 v, in vec3 n, in float power, in float gloss) {
        vec3 h = normalize(l + v);
        float distribution = pow(max(dot(n, h), 0.0), gloss) * power;
        distribution *= (2.0 + power) / TAU;
        return distribution;
    }

    vec4 sample_Sky(sampler2D sky, vec3 normal) {
        float theta = atan(normal.z, normal.x);
        float gamma = acos(normal.y);
        return texture(sky, vec2(theta / TAU + 0.5, gamma / PI));
    }

    ${GlslPrimitives.FragmentLightFunction(`
        float strength = dot(NORMAL, DIRECTION);
        if (strength < 1e-6) return;
        DIFFUSE = strength * COLOR * ATTENUATION;
        if (TYPE != 1u) {
            SPECULAR = ndf_blinnphong(DIRECTION, VIEW, NORMAL, 2.0, 500.0) * COLOR * ATTENUATION;
        }
    `)}

    void main() {
        ${GlslPrimitives.FragmentVertexEssentialCalculations}
        ${GlslPrimitives.FragmentTangentAndTBNCalculations}
        ${GlslPrimitives.FragmentNormalTextureCalculations}
        vec4 ALBEDO = u_color;// * sample_Sky(SKY, reflect(-LOOKAT, NORMAL));
        ${GlslPrimitives.FragmentLightCalculations()}
        o_color = COLOR;
        o_normal = vec4(NORMAL_VIEW, 1.0);
    }`;

    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
const PhongFragmentShadeShaderUniforms = new Cacher((config: Config) => {
    return {
        u_texture: {
            type: RenderStateUniformType.Tex2D,
            default: {
                texture: config.render_server.get_PlainColorTexture(RenderServerPlainColorTexture.White),
            }
        },
        u_color: { type: RenderStateUniformType.Vec4, default: Color.new },
        ...ShaderLightDataTextureUniformsDef,
        ...ShaderNormalTextureUniformsDef,
    } as UniformInitSet<WebGL2RenderState>;
});

const PhongFragmentOitShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${GlslPrimitives.WorldUniforms}

    uniform vec4 u_color;
    uniform sampler2D u_texture;
    
    ${GlslPrimitives.FragmentVertexEssentialIns}

    ${GlslPrimitives.FragmentFrameTransparentOuts}

    void main() {
        ${GlslPrimitives.FragmentVertexEssentialCalculations}
        o_normal = vec4(NORMAL_VIEW, 1.0);
        vec4 COLOR = vec4(texture(u_texture, v_UV).rgb, 1.0) * u_color;
        ${GlslPrimitives.FragmentFrameTransparentCalculation}
    }`;

    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
const PhongFragmentOitShaderUniforms = new Cacher((config: Config) => {
    return {
        u_texture: {
            type: RenderStateUniformType.Tex2D,
            default: {
                texture: config.render_server.get_PlainColorTexture(RenderServerPlainColorTexture.White),
            }
        },
        u_color: { type: RenderStateUniformType.Vec4, default: Color.new },
    } as UniformInitSet<WebGL2RenderState>;
});

const PhongShader = new Cacher((config: Config) => {
    const shader = config.render_server.create_Shader();
    shader.set_Shaders(
        PrimitiveVertexShader.get(config).expect,
        PrimitiveVertexShaderUniforms,
        {
            prez: {
                shader: PrimitiveFragmentPreZShader.get(config).expect,
                uniforms: PrimitiveFragmentPreZShaderUniforms,
            },
            shade: {
                shader: PhongFragmentShadeShader.get(config).expect,
                uniforms: PhongFragmentShadeShaderUniforms.get(config),
            },
            // oit: {
            //     shader: PhongFragmentOitShader.get(config).expect,
            //     uniforms: PhongFragmentOitShaderUniforms.get(config),
            // }
        }
    );
    return new Ref(shader);
});

export class PhongMaterialResource extends MaterialResource {

    static readonly #uniforms: MaterialReadOnlyUniforms = {
        ...PrimitiveMaterialUniforms,
        ...MaterialLightDataTextureUniformsDef,
        u_texture: RenderStateUniformType.Tex2D,
        u_color: RenderStateUniformType.Vec4,
        ...MaterialNormalTextureUniformsDef,
    };

    public get uniforms() { return PhongMaterialResource.#uniforms; }

    private _color: Color = new Vector4(1, 1, 1, 1);
    public get color() { return this._color; }
    public set color(color: Color) {
        if (!this._color.equal(color)) {
            this._color.copy(color);
            this.material.set_Uniform('u_color', this._color);
            this.material.transparent = this._color.a < (1.0 - Epsilon);
        }
    }

    private _texture: Ref<TextureResource> = new Ref();
    public get texture() { return this._texture.value; }
    public set texture(texture: TextureResource | undefined) {
        if (this._texture.value !== texture) {
            this._texture.value = texture;
            this.set_Uniform('u_texture', this._texture.value?.texture);
        }
    }

    private _normal_texture: Ref<TextureResource> = new Ref();
    public get normal_texture() { return this._normal_texture.value; }
    public set normal_texture(normal_texture: TextureResource | undefined) {
        if (this._normal_texture.value !== normal_texture) {
            this._normal_texture.value = normal_texture;
            console.log(this);
            set_MaterialNormalTexture(this, this._normal_texture.value);
        }
    }

    constructor(config: Config) {
        super(config);
        this.material_ref.value = this.render_server.create_Material();
        this.update_Material();
    }

    protected update_Material() {
        this.material.set_Material(PhongShader.get(this.config).expect, PhongMaterialResource.#uniforms);
        this.material.transparent = false;
    }

    protected dispose(): void {
        this._texture.clear();
        super.dispose();
    }
}