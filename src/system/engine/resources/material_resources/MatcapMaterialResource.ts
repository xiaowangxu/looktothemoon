import { RenderStateUniformType, RenderStateShaderType } from "@/system/sliverofstraw/RenderState";
import type { Config } from "../../ConfiguredObject";
import { MaterialResource, type MaterialReadOnlyUniforms } from "./MaterialResource";
import { PrimitiveFragmentPreZShader, PrimitiveFragmentPreZShaderUniforms, PrimitiveVertexShader, PrimitiveVertexShaderUniforms } from "./PrimitiveMaterialResource";
import type { TextureResource } from "../texture_resources/TextureResource";
import { Ref } from "@/system/utils/RefCounted";
import { MaterialModelWorldUniform } from "../../render_server/RenderServerMaterial";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { RenderServerDevice, RenderServerPlainColorTexture } from "../../render_server/RenderServer";
import type { UniformInitSet } from "../../render_server/RenderServerShader";
import { RenderServerGeometry } from "../../render_server/RenderServerGeometry";
import { Color } from "@/system/fivepebble/graphics/Color";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Epsilon } from "@/system/fivepebble/Scalar";
import { Cacher } from "@/system/utils/Cacher";

const MatcapVertexShader = new Cacher((config: Config) => {
    const code = `#version 300 es
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
    out vec3 v_normal_view;
    out vec3 v_lookat_view;
    
    void main() {
        mat4 _model_world = model_world * a_instance_transform;
        vec4 world = vec4(a_position, 1.0);
        mat4 model_view = camera_view * _model_world;
        
        gl_Position = camera_projection * model_view * world;
        v_normal = normalize(mat3(transpose(inverse(_model_world))) * a_normal);
        v_uv = a_uv;
        v_world = world.xyz;

        v_normal_view = normalize(transpose(inverse(mat3(model_view))) * v_normal);
        v_lookat_view = -normalize(vec3(model_view * world));
    }`;
    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Vertex, code).expect());
});

const MatcapFragmentShadeShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}

    uniform vec4 u_color;
    uniform sampler2D u_texture;
    
    in vec3 v_world;
    in vec3 v_normal;
    in vec2 v_uv;
    in vec3 v_normal_view;
    in vec3 v_lookat_view;

    ${RenderServerDevice.FrameOutputBufferCode}

    vec2 matcap_uv_compute(vec3 I, vec3 N) {
        /* Quick creation of an orthonormal basis */
        float a = 1.0 / (1.0 + I.z);
        float b = -I.x * I.y * a;
        vec3 b1 = vec3(1.0 - I.x * I.x * a, b, -I.x);
        vec3 b2 = vec3(b, 1.0 - I.y * I.y * a, -I.y);
        vec2 matcap_uv = vec2(dot(b1, N), dot(b2, N));
        return matcap_uv * 0.496 + 0.5;
    }

    void main() {
        o_normal = vec4(normalize(v_normal), 1.0);
        vec2 matcap_uv = matcap_uv_compute(normalize(v_lookat_view), normalize(v_normal_view));
        o_color = vec4(texture(u_texture, matcap_uv).rgb, 1.0) * u_color;
    }`;
    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
const MatcapFragmentShadeShaderUniforms = new Cacher((config: Config) => {
    return {
        u_texture: {
            type: RenderStateUniformType.Tex2D,
            default: {
                texture: config.render_server.get_PlainColorTexture(RenderServerPlainColorTexture.Empty),
            }
        },
        u_color: { type: RenderStateUniformType.Vec4, default: Color.new },
    } as UniformInitSet<WebGL2RenderState>;
});

const MatcapFragmentOitShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}

    uniform vec4 u_color;
    uniform sampler2D u_texture;
    
    in vec3 v_world;
    in vec3 v_normal;
    in vec2 v_uv;
    in vec3 v_normal_view;
    in vec3 v_lookat_view;

    ${RenderServerDevice.FrameOiTOutputBufferCode}

    vec2 matcap_uv_compute(vec3 I, vec3 N) {
        /* Quick creation of an orthonormal basis */
        float a = 1.0 / (1.0 + I.z);
        float b = -I.x * I.y * a;
        vec3 b1 = vec3(1.0 - I.x * I.x * a, b, -I.x);
        vec3 b2 = vec3(b, 1.0 - I.y * I.y * a, -I.y);
        vec2 matcap_uv = vec2(dot(b1, N), dot(b2, N));
        return matcap_uv * 0.496 + 0.5;
    }

    void main() {
        o_normal = vec4(normalize(v_normal), 1.0);
        vec2 matcap_uv = matcap_uv_compute(normalize(v_lookat_view), normalize(v_normal_view));
        vec4 color = vec4(texture(u_texture, matcap_uv).rgb, 1.0) * u_color;
        ${RenderServerDevice.OitOutputCode}
    }`;
    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
const MatcapFragmentOitShaderUniforms = new Cacher((config: Config) => {
    return {
        u_texture: {
            type: RenderStateUniformType.Tex2D,
            default: {
                texture: config.render_server.get_PlainColorTexture(RenderServerPlainColorTexture.Empty),
            }
        },
        u_color: { type: RenderStateUniformType.Vec4, default: Color.new },
    } as UniformInitSet<WebGL2RenderState>;
});

const MatcapShader = new Cacher((config: Config) => {
    const shader = config.render_server.create_Shader();
    shader.set_Shaders(
        MatcapVertexShader.get(config).expect,
        PrimitiveVertexShaderUniforms,
        {
            prez: {
                shader: PrimitiveFragmentPreZShader.get(config).expect,
                uniforms: PrimitiveFragmentPreZShaderUniforms,
            },
            shade: {
                shader: MatcapFragmentShadeShader.get(config).expect,
                uniforms: MatcapFragmentShadeShaderUniforms.get(config),
            },
            oit: {
                shader: MatcapFragmentOitShader.get(config).expect,
                uniforms: MatcapFragmentOitShaderUniforms.get(config),
            }
        }
    );
    return new Ref(shader);
});

export class MatcapMaterialResource extends MaterialResource {

    static readonly #uniforms: MaterialReadOnlyUniforms = {
        ...MaterialModelWorldUniform,
        u_texture: RenderStateUniformType.Tex2D,
        u_color: RenderStateUniformType.Vec4,
    };

    public get uniforms() { return MatcapMaterialResource.#uniforms; }

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

    public update_Material() {
        this.material.set_Material(MatcapShader.get(this.config).expect, MatcapMaterialResource.#uniforms);
        this.material.transparent = false;
    }

    protected dispose(): void {
        this._texture.clear();
        super.dispose();
    }
}