import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { RenderStateShaderType, RenderStateUniformType } from "@/system/sliverofstraw/RenderState";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { Cacher } from "@/system/utils/Cacher";
import type { Config } from "../../ConfiguredObject";
import type { UniformInitSet } from "../../render_server/RenderServerShader";
import { GlslPrimitives, PrimitiveMaterialUniforms } from "./Primitives";
import { Ref } from "@/system/utils/RefCounted";
import { MaterialResource, type MaterialReadOnlyUniforms } from "./MaterialResource";

export const BillboardVertexShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;
    
    ${GlslPrimitives.Constants}
    
    ${GlslPrimitives.WorldUniforms}
    
    ${GlslPrimitives.VertexBuiltinAttributes}

    uniform mat4 model_world;

    out vec3 v_NORMAL_VIEW;
    out vec3 v_LOOKAT_VIEW;
    out vec2 v_UV;
    
    void main() {
        mat4 _model_world = model_world * a_instance_transform;
        mat4 _model_view = camera_view * _model_world;

        vec4 world = _model_world * vec4(0.0, 0.0, 0.0, 1.0); // WORLD SPACE
        vec4 world_in_view = camera_view * world;           // IN CAMERA SPACE
        vec4 clip = camera_projection * world_in_view;      // IN CLIP SPACE

        const float width = 20.0;
        vec2 offset = vec2(width * 2.0) / screen_size * pixel_ratio;

        clip.xyz /= clip.w;
        clip.w = 1.0;
        clip.xy += offset * a_position.xy;

        gl_Position = clip;

        v_NORMAL_VIEW = vec3(0.0, 0.0, 1.0);
        v_LOOKAT_VIEW = vec3(0.0, 0.0, 1.0);
        v_UV = a_position.xy + vec2(0.5);
    }`;

    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Vertex, code).expect());
});
export const BillboardVertexShaderUniforms: Readonly<UniformInitSet<WebGL2RenderState>> = {
    model_world: { type: RenderStateUniformType.Mat4, default: Matrix4.new },
};

export const BillboardFragmentShadeShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${GlslPrimitives.WorldUniforms}

    in vec3 v_NORMAL_VIEW;
    in vec3 v_LOOKAT_VIEW;
    in vec2 v_UV;

    ${GlslPrimitives.FragmentFrameSolidOuts}

    void main() {
        float dist = distance(v_UV, vec2(0.5)) * 2.0;
        vec3 color = mix(vec3(1.0, 0.2140411404715882, 0.0), vec3(0.04), smoothstep(0.6, 0.55, dist));
        o_color = vec4(color, 1.0);
        o_normal = vec4(v_NORMAL_VIEW, 1.0);
    }`;

    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
export const BillboardFragmentShadeShaderUniforms: Readonly<UniformInitSet<WebGL2RenderState>> = {};

const BillboardShader = new Cacher((config: Config) => {
    const shader = config.render_server.create_Shader();
    shader.set_Shaders(
        BillboardVertexShader.get(config).expect,
        BillboardVertexShaderUniforms,
        {
            // prez: {
            //     shader: PrimitiveFragmentPreZShader.get(config).expect,
            //     uniforms: PrimitiveFragmentPreZShaderUniforms,
            // },
            shade: {
                shader: BillboardFragmentShadeShader.get(config).expect,
                uniforms: BillboardFragmentShadeShaderUniforms,
            },
            // oit: {
            //     shader: PlainFragmentOitShader.get(config).expect,
            //     uniforms: PlainFragmentOitShaderUniforms.get(config),
            // }
        }
    );
    return new Ref(shader);
});

export class BillboardMaterialResource extends MaterialResource {

    static readonly #uniforms: MaterialReadOnlyUniforms = {
        ...PrimitiveMaterialUniforms,
    };

    public get uniforms() { return BillboardMaterialResource.#uniforms; }

    constructor(config: Config) {
        super(config);
        this.material_ref.value = this.render_server.create_Material();
        this.update_Material();
    }

    protected update_Material() {
        this.material.set_Material(BillboardShader.get(this.config).expect, BillboardMaterialResource.#uniforms);
        this.material.transparent = false;
    }

    protected dispose(): void {
        super.dispose();
    }
}