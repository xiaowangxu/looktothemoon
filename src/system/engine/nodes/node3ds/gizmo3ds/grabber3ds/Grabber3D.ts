import { SignalEmitter } from "@/system/utils/SignalEmitter";
import type { Viewport, CursorStyle } from "../../../Node";
import { FixSizeNode3D } from "../FixSizeNode3D";
import { MaterialResource, type MaterialReadOnlyUniforms } from "@/system/engine/resources/material_resources/MaterialResource";
import { RenderServerDevice } from "@/system/engine/render_server/RenderServer";
import { RenderServerGeometry } from "@/system/engine/render_server/RenderServerGeometry";
import type { UniformInitSet } from "@/system/engine/render_server/RenderServerShader";
import { Epsilon } from "@/system/fivepebble/Scalar";
import { RenderStateUniformType, RenderStateShaderType } from "@/system/sliverofstraw/RenderState";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { vec4 } from "@/system/fivepebble/linear_algebra/Vector4";
import type { Color } from "@/system/fivepebble/graphics/Color";
import type { Config } from "@/system/engine/ConfiguredObject";
import { Node3D } from "../../Node3D";

export class GrabberElement3D<T> extends FixSizeNode3D {
    // signals
    public readonly signal_grab_start: SignalEmitter<(value: T, target: GrabberElement3D<T>) => void> = new SignalEmitter();
    public readonly signal_grabbing: SignalEmitter<(value: T, target: GrabberElement3D<T>) => void> = new SignalEmitter();
    public readonly signal_grab_end: SignalEmitter<(value: T, target: GrabberElement3D<T>) => void> = new SignalEmitter();

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
    
    constructor(config: Config) {
        super(config);
        this.top_level = true;
        this.unit_pixel_count = 75;
    }
}

export class Grabber3D<T> extends Node3D {
    public readonly signal_grab_start: SignalEmitter<(value: T) => void> = new SignalEmitter();
    public readonly signal_grabbing: SignalEmitter<(value: T) => void> = new SignalEmitter();
    public readonly signal_grab_end: SignalEmitter<(value: T) => void> = new SignalEmitter();

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

    protected on_EnabledChanged() {
        throw new Error('abstract method');
    }

    protected on_VisibleChanged() {
        throw new Error('abstract method');
    }

    constructor(config: Config) {
        super(config);
        this.top_level = true;
    }
}

export class GrabberPlainColorMaterialResource extends MaterialResource {

    static #uniforms: MaterialReadOnlyUniforms = {
        model_world: RenderStateUniformType.Mat4,
        u_color: RenderStateUniformType.Vec4,
        u_hidden: RenderStateUniformType.Int,
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
    uniform int u_hidden;
    uniform highp sampler2DShadow u_scene_depth;
    
    in vec3 v_world;
    in vec3 v_normal;
    in vec2 v_uv;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        float depth = texture(u_scene_depth, vec3(gl_FragCoord.xy / screen_size, gl_FragCoord.z));
        vec4 hidden_color = mix(u_color, vec4(0.5, 0.5, 0.5, 1.0), 0.75);
        bool not_hidden = depth >= gl_FragCoord.z;
        o_color = !(u_hidden == 1) || not_hidden ? u_color : hidden_color;
        o_normal = normalize(v_normal);
    }`;
    static #fragment_shade_uniforms: UniformInitSet<WebGL2RenderState> = {
        u_color: { type: RenderStateUniformType.Vec4, default: vec4(1, 1, 1, 1) },
        u_scene_depth: { type: RenderStateUniformType.Int, default: 0 },
        u_hidden: { type: RenderStateUniformType.Int, default: 0 },
    };
    static #fragment_oit_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}

    uniform vec4 u_color;
    uniform int u_hidden;
    uniform highp sampler2DShadow u_scene_depth;
    
    in vec3 v_world;
    in vec3 v_normal;
    in vec2 v_uv;

    ${RenderServerDevice.FrameOiTOutputBufferCode}

    void main() {
        float depth = texture(u_scene_depth, vec3(gl_FragCoord.xy / screen_size, gl_FragCoord.z));
        vec4 hidden_color = mix(u_color, vec4(0.5, 0.5, 0.5, u_color.a), 0.75);
        bool not_hidden = depth >= gl_FragCoord.z;
        vec4 color = !(u_hidden == 1) || not_hidden ? u_color : hidden_color;

        ${RenderServerDevice.OitOutputCode}
    }`;
    static #fragment_oit_uniforms: UniformInitSet<WebGL2RenderState> = {
        u_color: { type: RenderStateUniformType.Vec4, default: vec4(1, 1, 1, 1) },
        u_hidden: { type: RenderStateUniformType.Int, default: 0 },
        u_scene_depth: { type: RenderStateUniformType.Int, default: 0 },
    };

    public get uniforms() { return GrabberPlainColorMaterialResource.#uniforms; }

    private _color: Color = vec4(1, 1, 1, 1);
    public get color() { return this._color; }
    public set color(color: Color) {
        if (!this._color.equal(color)) {
            this._color = color;
            this.material.set_UniformOverride('u_color', this._color);
            this.material.transparent = this._color.a < (1.0 - Epsilon);
        }
    }

    constructor(config: Config) {
        super(config);
        this.material_ref.value = this.render_server.create_Material();
        this.update_Material();
    }

    public update_Material() {
        const render_server = this.config.render_server;
        const shader = render_server.create_Shader();
        const vertex_shader = render_server.render_state.create_Shader(RenderStateShaderType.Vertex, GrabberPlainColorMaterialResource.#vertex_shader).expect();
        const fragment_prez_shader = render_server.render_state.create_Shader(RenderStateShaderType.Fragment, GrabberPlainColorMaterialResource.#fragment_prez_shader).expect();
        const fragment_shade_shader = render_server.render_state.create_Shader(RenderStateShaderType.Fragment, GrabberPlainColorMaterialResource.#fragment_shade_shader).expect();
        const fragment_oit_shader = render_server.render_state.create_Shader(RenderStateShaderType.Fragment, GrabberPlainColorMaterialResource.#fragment_oit_shader).expect();
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
        this.material.transparent = false;
    }
}