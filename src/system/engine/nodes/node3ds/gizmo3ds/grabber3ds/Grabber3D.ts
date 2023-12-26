import { SignalEmitter } from "@/system/utils/SignalEmitter";
import type { Viewport, CursorStyle } from "../../../Node";
import { FixSizeNode3D } from "../FixSizeNode3D";
import { MaterialResource, type MaterialReadOnlyUniforms } from "@/system/engine/resources/material_resources/MaterialResource";
import { RenderServerDevice, RenderServer, RenderServerPlainColorTexture } from "@/system/engine/render_server/RenderServer";
import { RenderServerGeometry } from "@/system/engine/render_server/RenderServerGeometry";
import type { UniformInitSet } from "@/system/engine/render_server/RenderServerShader";
import { PlainColorMaterialResource } from "@/system/engine/resources/material_resources/PrimitiveMaterialResource";
import { Epsilon } from "@/system/fivepebble/Scalar";
import { RenderStateUniformType, RenderStateShaderType } from "@/system/sliverofstraw/RenderState";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { vec4 } from "@/system/fivepebble/linear_algebra/Vector4";
import type { Color } from "@/system/fivepebble/graphics/Color";

export class GrabberElement<T> extends FixSizeNode3D {
    // signals
    public readonly signal_grab_start: SignalEmitter<(value: T, target: GrabberElement<T>) => void> = new SignalEmitter();
    public readonly signal_grabbing: SignalEmitter<(value: T, target: GrabberElement<T>) => void> = new SignalEmitter();
    public readonly signal_grab_end: SignalEmitter<(value: T, target: GrabberElement<T>) => void> = new SignalEmitter();

    private _enabled: boolean = true;
    public get enabled() { return this._enabled; }
    public set enabled(enabled: boolean) {
        if (this._enabled !== enabled) {
            this._enabled = enabled;
            this.on_EnabledChanged();
        }
    }

    private _visible: boolean = true;
    public get visible() { return this._visible; }
    public set visible(visible: boolean) {
        if (this._visible !== visible) {
            this._visible = visible;
            this.on_VisibleChanged();
        }
    }

    protected set_ViewportCursorStyle(viewport: Viewport, cursor_style: CursorStyle) {
        viewport.cursor_style = cursor_style;
    }

    protected on_EnabledChanged() {
        throw new Error('abstract method');
    }

    protected on_VisibleChanged() {
        throw new Error('abstract method');
    }
}

export class GrabberPlainColorMaterialResource extends MaterialResource {

    static #uniforms: MaterialReadOnlyUniforms = {
        model_world: RenderStateUniformType.Mat4,
        u_color: RenderStateUniformType.Vec4,
    };

    static #vertex_shader = `#version 300 es
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
    
    in vec3 v_world;
    in vec3 v_normal;
    in vec2 v_uv;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        o_color = u_color;
        o_normal = normalize(v_normal);
    }`;
    static #fragment_shade_uniforms: UniformInitSet<WebGL2RenderState> = {
        u_color: { type: RenderStateUniformType.Vec4, default: vec4(1, 1, 1, 1) },
    };
    static #fragment_oit_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}

    uniform vec4 u_color;
    
    in vec3 v_world;
    in vec3 v_normal;
    in vec2 v_uv;

    ${RenderServerDevice.FrameOiTOutputBufferCode}

    void main() {
        vec4 color = u_color;

        ${RenderServerDevice.OitOutputCode}
    }`;
    static #fragment_oit_uniforms: UniformInitSet<WebGL2RenderState> = {
        u_color: { type: RenderStateUniformType.Vec4, default: vec4(1, 1, 1, 1) },
    };

    public get uniforms() { return GrabberPlainColorMaterialResource.#uniforms; }

    private _color: Color = vec4(1, 1, 1, 1);
    public get color() { return this._color; }
    public set color(color: Color) {
        if (!this._color.equal(color)) {
            this._color = color;
            this.material.set_UniformOverride('u_color', this._color);
            this.material.is_transparent = this._color.a < (1.0 - Epsilon);
        }
    }

    constructor() {
        super();
        this.update_Material();
    }

    public update_Material() {
        const shader = RenderServer.create_Shader();
        const vertex_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Vertex, GrabberPlainColorMaterialResource.#vertex_shader).expect();
        const fragment_prez_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Fragment, GrabberPlainColorMaterialResource.#fragment_prez_shader).expect();
        const fragment_shade_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Fragment, GrabberPlainColorMaterialResource.#fragment_shade_shader).expect();
        const fragment_oit_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Fragment, GrabberPlainColorMaterialResource.#fragment_oit_shader).expect();
        shader.set_Shaders(
            vertex_shader,
            GrabberPlainColorMaterialResource.#vertex_uniforms,
            {
                prez: {
                    shader: fragment_prez_shader,
                    uniforms: GrabberPlainColorMaterialResource.#fragment_prez_uniforms,
                },
                shade: {
                    shader: fragment_shade_shader,
                    uniforms: GrabberPlainColorMaterialResource.#fragment_shade_uniforms,
                },
                oit: {
                    shader: fragment_oit_shader,
                    uniforms: GrabberPlainColorMaterialResource.#fragment_oit_uniforms,
                }
            }
        );
        this.material.set_Material(shader, GrabberPlainColorMaterialResource.#uniforms);
        this.material.is_transparent = false;
    }
}