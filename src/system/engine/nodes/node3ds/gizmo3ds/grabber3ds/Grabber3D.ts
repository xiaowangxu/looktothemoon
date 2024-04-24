import { SignalEmitter } from "@/system/utils/SignalEmitter";
import type { Viewport, CursorStyle } from "../../../Node";
import { FixSizeNode3D } from "../FixSizeNode3D";
import { MaterialResource, type MaterialReadOnlyUniforms } from "@/system/engine/resources/material_resources/MaterialResource";
import { RenderServerDevice } from "@/system/engine/render_server/RenderServer";
import type { UniformInitSet } from "@/system/engine/render_server/RenderServerShader";
import { Epsilon } from "@/system/fivepebble/Scalar";
import { RenderStateUniformType, RenderStateShaderType } from "@/system/sliverofstraw/render_state/RenderState";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { Color } from "@/system/fivepebble/graphics/Color";
import type { Config } from "@/system/engine/ConfiguredObject";
import { Node3D } from "../../Node3D";
import { PrimitiveFragmentPreZShader, PrimitiveFragmentPreZShaderUniforms, PrimitiveVertexShader, PrimitiveVertexShaderUniforms } from "@/system/engine/resources/material_resources/Primitives";
import { GlslPrimitives } from "@/system/engine/resources/material_resources/Primitives";

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

    protected on_EnabledChanged() {
        throw new Error('abstract method');
    }

    private _visible: boolean = true;
    public get visible() { return this._visible; }
    public set visible(visible: boolean) {
        if (this._visible !== visible) {
            this._visible = visible;
            this.on_VisibleChanged();
        }
    }

    protected on_VisibleChanged() {
        throw new Error('abstract method');
    }

    protected _layer: number = 0xffffffff;
    public get layer() { return this._layer; }
    public set layer(layer: number) {
        layer = layer & 0xffffffff;
        if (this._layer !== layer) {
            this._layer = layer;
            this.on_LayerChanged();
        }
    }

    protected on_LayerChanged() {
        throw new Error('abstract method');
    }

    protected _render_queue: number = 1;
    public get render_queue() { return this._render_queue; }
    public set render_queue(render_queue: number) {
        if (this._render_queue !== render_queue) {
            this._render_queue = render_queue;
            this.on_RenderQueueChanged();
        }
    }

    protected on_RenderQueueChanged() {
        throw new Error('abstract method');
    }

    protected set_ViewportCursorStyle(viewport: Viewport, cursor_style: CursorStyle) {
        viewport.set_CursorStyle(this.rid, cursor_style);
    }

    constructor(config: Config) {
        super(config);
        this.top_level = true;
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

    protected on_EnabledChanged() {
        throw new Error('abstract method');
    }

    private _visible: boolean = true;
    public get visible() { return this._visible; }
    public set visible(visible: boolean) {
        if (this._visible !== visible) {
            this._visible = visible;
            this.on_VisibleChanged();
        }
    }

    protected on_VisibleChanged() {
        throw new Error('abstract method');
    }

    protected _layer: number = 0xffffffff;
    public get layer() { return this._layer; }
    public set layer(layer: number) {
        layer = layer & 0xffffffff;
        if (this._layer !== layer) {
            this._layer = layer;
            this.on_LayerChanged();
        }
    }

    protected on_LayerChanged() {
        throw new Error('abstract method');
    }

    protected _render_queue: number = 1;
    public get render_queue() { return this._render_queue; }
    public set render_queue(render_queue: number) {
        if (this._render_queue !== render_queue) {
            this._render_queue = render_queue;
            this.on_RenderQueueChanged();
        }
    }

    protected on_RenderQueueChanged() {
        throw new Error('abstract method');
    }

    constructor(config: Config) {
        super(config);
        this.top_level = true;
    }
}

export class GrabberPlainColorMaterialResource extends MaterialResource {

    static readonly #uniforms: MaterialReadOnlyUniforms = {
        MODEL_WORLD: RenderStateUniformType.Matrix4,
        u_color: RenderStateUniformType.Vector4,
        u_hidden: RenderStateUniformType.Int,
    };

    static readonly #fragment_shade_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${GlslPrimitives.WorldUniforms}

    uniform vec4 u_color;
    uniform int u_hidden;
    uniform highp sampler2D u_scene_depth;
    
    ${GlslPrimitives.FragmentVertexEssentialIns}

    ${GlslPrimitives.FragmentFrameSolidOuts}

    void main() {
        ${GlslPrimitives.FragmentVertexEssentialCalculations}
        float depth = texture(u_scene_depth, gl_FragCoord.xy / SCREEN_SIZE).r;
        vec4 hidden_color = mix(u_color, vec4(0.5, 0.5, 0.5, 1.0), 0.75);
        bool not_hidden = depth >= gl_FragCoord.z;
        o_color = !(u_hidden == 1) || not_hidden ? u_color : hidden_color;
        o_normal = vec4(NORMAL_VIEW, 1.0);
    }`;
    static readonly #fragment_shade_uniforms: UniformInitSet<WebGL2RenderState> = {
        u_color: { type: RenderStateUniformType.Vector4, default: Color.new },
        u_hidden: { type: RenderStateUniformType.Int, default: 1 },
        u_scene_depth: { type: RenderStateUniformType.Int, default: 0 },
    };
    static readonly #fragment_oit_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${GlslPrimitives.WorldUniforms}

    uniform vec4 u_color;
    uniform int u_hidden;
    uniform highp sampler2D u_scene_depth;

    ${GlslPrimitives.FragmentVertexEssentialIns}

    ${GlslPrimitives.FragmentFrameTransparentOuts}

    void main() {
        ${GlslPrimitives.FragmentVertexEssentialCalculations}
        float depth = texture(u_scene_depth, gl_FragCoord.xy / SCREEN_SIZE).r;
        vec4 hidden_color = mix(u_color, vec4(0.5, 0.5, 0.5, u_color.a), 0.75);
        bool not_hidden = depth >= gl_FragCoord.z;
        vec4 COLOR = !(u_hidden == 1) || not_hidden ? u_color : hidden_color;
        o_normal = vec4(NORMAL_VIEW, 1.0);
        ${GlslPrimitives.FragmentFrameTransparentCalculation}
    }`;
    static readonly #fragment_oit_uniforms: UniformInitSet<WebGL2RenderState> = {
        u_color: { type: RenderStateUniformType.Vector4, default: Color.new },
        u_hidden: { type: RenderStateUniformType.Int, default: 1 },
        u_scene_depth: { type: RenderStateUniformType.Int, default: 0 },
    };

    public get uniforms() { return GrabberPlainColorMaterialResource.#uniforms; }

    private _color: Color = Color.new;
    public get color() { return this._color; }
    public set color(color: Color) {
        if (!this._color.equal(color)) {
            this._color = color;
            this.material.set_Uniform('u_color', this._color);
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
        const vertex_shader = PrimitiveVertexShader.get(this.config).expect;
        const fragment_prez_shader = PrimitiveFragmentPreZShader.get(this.config).expect;
        const fragment_shade_shader = render_server.render_state.create_Shader(RenderStateShaderType.Fragment, GrabberPlainColorMaterialResource.#fragment_shade_shader).expect();
        const fragment_oit_shader = render_server.render_state.create_Shader(RenderStateShaderType.Fragment, GrabberPlainColorMaterialResource.#fragment_oit_shader).expect();
        shader.set_Shaders(
            vertex_shader,
            PrimitiveVertexShaderUniforms,
            {
                prez: {
                    shader: fragment_prez_shader,
                    uniforms: PrimitiveFragmentPreZShaderUniforms,
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