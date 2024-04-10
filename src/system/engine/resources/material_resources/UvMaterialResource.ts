import { RenderStateShaderType } from "@/system/sliverofstraw/RenderState";
import type { Config } from "../../ConfiguredObject";
import { MaterialResource, type MaterialReadOnlyUniforms } from "./MaterialResource";
import { Ref } from "@/system/utils/RefCounted";
import { MaterialModelWorldUniform } from "../../render_server/RenderServerMaterial";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { RenderServerDevice } from "../../render_server/RenderServer";
import type { UniformInitSet } from "../../render_server/RenderServerShader";
import { Cacher } from "@/system/utils/Cacher";
import { GlslPrimitives, PrimitiveFragmentPreZShader, PrimitiveFragmentPreZShaderUniforms, PrimitiveVertexShader, PrimitiveVertexShaderUniforms } from "./Primitives";

const UvFragmentShadeShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${GlslPrimitives.WorldUniforms}
    
    ${GlslPrimitives.FragmentVertexEssentialIns}

    ${GlslPrimitives.FragmentFrameSolidOuts}

    void main() {
        ${GlslPrimitives.FragmentVertexEssentialCalculations}
        o_normal = vec4(NORMAL_VIEW, 1.0);
        o_color = vec4(v_UV, 0.0, 1.0);
    }`;

    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
const UvFragmentShadeShaderUniforms = {} as UniformInitSet<WebGL2RenderState>;

const UvShader = new Cacher((config: Config) => {
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
                shader: UvFragmentShadeShader.get(config).expect,
                uniforms: UvFragmentShadeShaderUniforms,
            },
        }
    );
    return new Ref(shader);
});

export class UvMaterialResource extends MaterialResource {

    static readonly #uniforms: MaterialReadOnlyUniforms = {
        ...MaterialModelWorldUniform,
    };

    public get uniforms() { return UvMaterialResource.#uniforms; }

    constructor(config: Config) {
        super(config);
        this.material_ref.value = this.render_server.create_Material();
        this.update_Material();
    }

    protected update_Material() {
        this.material.set_Material(UvShader.get(this.config).expect, UvMaterialResource.#uniforms);
        this.material.transparent = false;
    }

    protected dispose(): void {
        super.dispose();
    }
}