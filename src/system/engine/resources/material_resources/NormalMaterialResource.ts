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

const NormalFragmentShadeShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}
    
    ${GlslPrimitives.FragmentVertexEssentialIns}

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        ${GlslPrimitives.FragmentVertexEssentialCalculations}
        o_normal = vec4(NORMAL_VIEW, 1.0);
        o_color = vec4((NORMAL_VIEW + 1.0) / 2.0, 1.0);
    }`;

    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
const NormalFragmentShadeShaderUniforms = {} as UniformInitSet<WebGL2RenderState>;

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
        ...MaterialModelWorldUniform,
    };

    public get uniforms() { return NormalMaterialResource.#uniforms; }

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
        super.dispose();
    }
}