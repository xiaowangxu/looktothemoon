import { RenderStateShaderType, RenderStateUniformType } from "@/system/sliverofstraw/RenderState";
import type { RenderServerMaterialUniforms } from "../../render_server/RenderServerMaterial";
import { MaterialResource } from "./MaterialResource";
import { RenderServer, RenderServerDevice, RenderServerPlainColorTexture } from "../../render_server/RenderServer";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import type { UniformInitSet } from "../../render_server/RenderServerShader";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { vec4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { RenderServerGeometry } from "../../render_server/RenderServerGeometry";
import { Color } from "@/system/fivepebble/graphics/Color";

export class PlainColorMaterialResource extends MaterialResource {

    static #uniforms: RenderServerMaterialUniforms = {
        model_world: RenderStateUniformType.Mat4,
        u_color: RenderStateUniformType.Vec4,
        u_texture: RenderStateUniformType.Tex2D,
    };

    static #vertex_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;
    
    const float PI = 3.1415926535;
    const float TAU = 6.283185307;
    const float EPSILON = 0.00001;
    
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
    static #fragment_shade_uniforms: UniformInitSet<WebGL2RenderState> = {
        u_color: { type: RenderStateUniformType.Vec4, default: vec4(1, 1, 1, 1) },
        u_texture: { type: RenderStateUniformType.Tex2D, default: { texture: RenderServer.get_PlainColorTexture(RenderServerPlainColorTexture.White) } },
    };

    public get uniforms() { return PlainColorMaterialResource.#uniforms; }

    private readonly _color: Color = new Color(1, 1, 1, 1);

    public get color() { return this._color.clone(); }
    public set color(color: Color) {
        if (!this._color.equal(color)) {
            this._color.copy(color);
            this.material.set_UniformOverride('u_color', this._color.clone());
        }
    }

    constructor() {
        super();
        this.update_Material();
    }

    public update_Material() {
        const shader = RenderServer.create_Shader();
        const vertex_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Vertex, PlainColorMaterialResource.#vertex_shader).expect();
        const fragment_prez_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Fragment, PlainColorMaterialResource.#fragment_prez_shader).expect();
        const fragment_shade_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Fragment, PlainColorMaterialResource.#fragment_shade_shader).expect();
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
                    uniforms: PlainColorMaterialResource.#fragment_shade_uniforms,
                }
            }
        );
        this.material.set_Material(shader, PlainColorMaterialResource.#uniforms);
    }
}

export class NormalMaterialResource extends MaterialResource {

    static #uniforms: RenderServerMaterialUniforms = {
        model_world: RenderStateUniformType.Mat4,
    };

    static #vertex_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;
    
    const float PI = 3.1415926535;
    const float TAU = 6.283185307;
    const float EPSILON = 0.00001;
    
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

    in vec3 v_world;
    in vec3 v_normal;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        vec3 normal = normalize(v_normal);
        o_color = vec4((normal + 1.0) / 2.0, 1.0);
        o_normal = normal;
    }`;
    static #fragment_shade_uniforms: UniformInitSet<WebGL2RenderState> = {};

    public get uniforms() { return NormalMaterialResource.#uniforms; }

    constructor() {
        super();
        this.update_Material();
    }

    public update_Material() {
        const shader = RenderServer.create_Shader();
        const vertex_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Vertex, NormalMaterialResource.#vertex_shader).expect();
        const fragment_prez_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Fragment, NormalMaterialResource.#fragment_prez_shader).expect();
        const fragment_shade_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Fragment, NormalMaterialResource.#fragment_shade_shader).expect();
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
    }
}