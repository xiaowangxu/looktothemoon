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
import { GlslPrimitives, PrimitiveFragmentPreZShader, PrimitiveFragmentPreZShaderUniforms, PrimitiveMaterialUniforms, PrimitiveVertexShader, PrimitiveVertexShaderUniforms } from "./Primitives";

const PlainFragmentShadeShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${GlslPrimitives.WorldUniforms}

    uniform vec4 u_color;
    uniform sampler2D u_texture;
    
    ${GlslPrimitives.FragmentVertexEssentialIns}

    ${GlslPrimitives.FragmentFrameSolidOuts}

    void main() {
        ${GlslPrimitives.FragmentVertexEssentialCalculations}
        o_normal = vec4(NORMAL_VIEW, 1.0);
        o_color = vec4(texture(u_texture, v_UV).rgb, 1.0) * u_color;
    }`;

    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
const PlainFragmentShadeShaderUniforms = new Cacher((config: Config) => {
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

const PlainFragmentOitShader = new Cacher((config: Config) => {
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
const PlainFragmentOitShaderUniforms = new Cacher((config: Config) => {
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

const PlainShader = new Cacher((config: Config) => {
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
                shader: PlainFragmentShadeShader.get(config).expect,
                uniforms: PlainFragmentShadeShaderUniforms.get(config),
            },
            oit: {
                shader: PlainFragmentOitShader.get(config).expect,
                uniforms: PlainFragmentOitShaderUniforms.get(config),
            }
        }
    );
    return new Ref(shader);
});

export class PlainMaterialResource extends MaterialResource {

    static readonly #uniforms: MaterialReadOnlyUniforms = {
        ...PrimitiveMaterialUniforms,
        u_texture: RenderStateUniformType.Tex2D,
        u_color: RenderStateUniformType.Vec4,
    };

    public get uniforms() { return PlainMaterialResource.#uniforms; }

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

    constructor(config: Config) {
        super(config);
        this.material_ref.value = this.render_server.create_Material();
        this.update_Material();
    }

    protected update_Material() {
        this.material.set_Material(PlainShader.get(this.config).expect, PlainMaterialResource.#uniforms);
        this.material.transparent = false;
    }

    protected dispose(): void {
        this._texture.clear();
        super.dispose();
    }
}