import { RenderStateShaderType } from "@/system/sliverofstraw/render_state/RenderState";
import type { Config } from "../../ConfiguredObject";
import { MaterialResource, type MaterialReadOnlyUniforms } from "./MaterialResource";
import { Ref } from "@/system/utils/RefCounted";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import type { UniformInitSet } from "../../render_server/RenderServerShader";
import { Cacher } from "@/system/utils/Cacher";
import { GlslPrimitives, MaterialNormalTextureUniformsDef, PrimitiveFragmentPreZShader, PrimitiveFragmentPreZShaderUniforms, PrimitiveMaterialUniforms, PrimitiveVertexShader, PrimitiveVertexShaderUniforms, ShaderNormalTextureUniformsDef, set_MaterialNormalTexture } from "./Primitives";
import type { TextureResource } from "../texture_resources/TextureResource";

const NormalFragmentShadeShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${GlslPrimitives.WorldUniforms}

    ${GlslPrimitives.ShaderNormalTextureUniforms}
    
    ${GlslPrimitives.FragmentVertexEssentialIns}

    ${GlslPrimitives.FragmentFrameSolidOuts}

    void main() {
        ${GlslPrimitives.FragmentVertexEssentialCalculations}
        ${GlslPrimitives.FragmentNormalTextureCalculations}
        o_normal = vec4(NORMAL_VIEW, 1.0);
        o_color = vec4((NORMAL_VIEW + 1.0) / 2.0, 1.0);
    }`;

    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
const NormalFragmentShadeShaderUniforms = ShaderNormalTextureUniformsDef;

const NormalShader = new Cacher((config: Config) => {
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
                shader: NormalFragmentShadeShader.get(config).expect,
                uniforms: NormalFragmentShadeShaderUniforms,
            },
        }
    );
    return new Ref(shader);
});

export class NormalMaterialResource extends MaterialResource {

    static readonly #uniforms: MaterialReadOnlyUniforms = {
        ...PrimitiveMaterialUniforms,
        ...MaterialNormalTextureUniformsDef,
    };

    public get uniforms() { return NormalMaterialResource.#uniforms; }

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

    protected update_Material() {
        this.material.set_Material(NormalShader.get(this.config).expect, NormalMaterialResource.#uniforms);
        this.material.transparent = false;
    }

    protected dispose(): void {
        this._normal_texture.clear();
        super.dispose();
    }
}