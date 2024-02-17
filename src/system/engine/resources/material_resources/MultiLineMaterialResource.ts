import { Epsilon } from "@/system/fivepebble/Scalar";
import { RenderStateUniformType, RenderStateShaderType } from "@/system/sliverofstraw/RenderState";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { RenderServerDevice } from "../../render_server/RenderServer";
import { RenderServerGeometry } from "../../render_server/RenderServerGeometry";
import type { UniformInitSet } from "../../render_server/RenderServerShader";
import { MaterialResource, type MaterialReadOnlyUniforms } from "./MaterialResource";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Vector4, vec4 } from "@/system/fivepebble/linear_algebra/Vector4";
import type { Color } from "@/system/fivepebble/graphics/Color";
import type { Config } from "../../ConfiguredObject";

export class MultiLineMaterialResource extends MaterialResource {

    static #uniforms: MaterialReadOnlyUniforms = {
        model_world: RenderStateUniformType.Mat4,
        u_color: RenderStateUniformType.Vec4,
        u_linewidth: RenderStateUniformType.Float,
        u_consider_pixel_ratio: RenderStateUniformType.Int,
    };

    static #vertex_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;
    
    ${RenderServerDevice.ConstantsCode}
    
    ${RenderServerDevice.WorldUniformsCode}
    
    ${RenderServerGeometry.GeometryAttributesCode}
    layout(location = 10) in vec3 a_start;
    layout(location = 11) in vec3 a_end;
    
    uniform mat4 model_world;

    uniform float u_linewidth;
    uniform int u_consider_pixel_ratio;
    
    out vec2 v_uv;
    
    void trimSegment(const in vec4 start, inout vec4 end) {
        // trim end segment so it terminates between the camera plane and the near plane
        // conservative estimate of the near plane
        float a = camera_projection[2][2]; // 3nd entry in 3th column
        float b = camera_projection[3][2]; // 3nd entry in 4th column
        float nearEstimate = -0.5 * b / a;
        float alpha = (nearEstimate - start.z) / (end.z - start.z);
        end.xyz = mix(start.xyz, end.xyz, alpha);
    }
    
    void main() {
        vec2 screen = screen_size;
        float aspect = screen.x / screen.y;
    
        mat4 _model_world = model_world;
        mat4 model_view = camera_view * _model_world;
    
        // camera space
        vec4 start = model_view * vec4(a_start, 1.0f);
        vec4 end = model_view * vec4(a_end, 1.0f);
    
        v_uv = a_uv;
    
        // special case for perspective projection, and segments that terminate either in, or behind, the camera plane
        // clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
        // but we need to perform ndc-space calculations in the shader, so we must address this issue directly
        // perhaps there is a more elegant solution -- WestLangley
    
        bool perspective = !camera_is_orthogonal; // 4th entry in the 3rd column
    
        if(perspective) {
            if(start.z < 0.0f && end.z >= 0.0f) {
                trimSegment(start, end);
            } else if(end.z < 0.0f && start.z >= 0.0f) {
                trimSegment(end, start);
            }
        }
    
        // clip space
        vec4 clip_start = camera_projection * start;
        vec4 clip_end = camera_projection * end;
    
        // ndc space
        vec3 ndcStart = clip_start.xyz / clip_start.w;
        vec3 ndcEnd = clip_end.xyz / clip_end.w;
    
        // direction
        vec2 dir = ndcEnd.xy - ndcStart.xy;
    
        // account for clip-space aspect ratio
        dir.x *= aspect;
        dir = normalize(dir);
    
        vec2 offset = vec2(dir.y, -dir.x);
    
        // undo aspect ratio adjustment
        dir.x /= aspect;
        offset.x /= aspect;
    
        // sign flip
        if(a_position.x < 0.0f)
            offset *= -1.0f;
    
        // endcaps
        if(a_position.y < 0.0f) {
            offset += -dir;
        } else if(a_position.y > 1.0f) {
            offset += dir;
        }
    
        // adjust for linewidth
        offset *= u_linewidth * (bool(u_consider_pixel_ratio) ? pixel_ratio : 1.0);
    
        // adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
        offset /= screen.y;
    
        // select end
        vec4 clip = (a_position.y < 0.5) ? clip_start : clip_end;
    
        // back to clip space
        offset *= clip.w;
    
        clip.xy += offset;
    
        gl_Position = clip;
    
        // vec4 mvPosition = (a_position.y < 0.5) ? start : end; // this is an approximation
    }`;
    static #vertex_uniforms: UniformInitSet<WebGL2RenderState> = {
        model_world: { type: RenderStateUniformType.Mat4, default: Matrix4.make_Identity() },
        u_linewidth: { type: RenderStateUniformType.Float, default: 2 },
        u_consider_pixel_ratio: { type: RenderStateUniformType.Int, default: 1 },
    };
    static #fragment_prez_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}
    
    in vec2 v_uv;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        o_normal = vec4(0.0, 0.0, 1.0, 1.0);
    }`;
    static #fragment_prez_uniforms: UniformInitSet<WebGL2RenderState> = {};
    static #fragment_shade_shader = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}

    uniform vec4 u_color;
    
    in vec2 v_uv;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        if(abs(v_uv.y) > 1.0f) {
            float a = v_uv.x;
            float b = (v_uv.y > 0.0f) ? v_uv.y - 1.0f : v_uv.y + 1.0f;
            float len2 = a * a + b * b;
            if(len2 > 1.0f)
                discard;
        }
        o_color = u_color;
        o_normal = vec4(0.0, 0.0, 1.0, 1.0);
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
    
    in vec2 v_uv;
    
    ${RenderServerDevice.FrameOiTOutputBufferCode}

    void main() {
        if(abs(v_uv.y) > 1.0f) {
            float a = v_uv.x;
            float b = (v_uv.y > 0.0f) ? v_uv.y - 1.0f : v_uv.y + 1.0f;
            float len2 = a * a + b * b;
            if(len2 > 1.0f)
                discard;
        }
        vec4 color = u_color;
        
        ${RenderServerDevice.OitOutputCode}
    }`;
    static #fragment_oit_uniforms: UniformInitSet<WebGL2RenderState> = {
        u_color: { type: RenderStateUniformType.Vec4, default: vec4(1, 1, 1, 1) },
    };

    public get uniforms() { return MultiLineMaterialResource.#uniforms; }

    private _color: Color = new Vector4(1, 1, 1, 1);
    public get color() { return this._color; }
    public set color(color: Color) {
        if (!this._color.equal(color)) {
            this._color = color;
            this.material.set_UniformOverride('u_color', this._color);
            this.material.transparent = this._color.a < (1.0 - Epsilon);
        }
    }

    private _line_width: number = 2;
    public get line_width() { return this._line_width; }
    public set line_width(line_width: number) {
        line_width = Math.max(0, line_width);
        if (this._line_width !== line_width) {
            this._line_width = line_width;
            this.material.set_UniformOverride('u_linewidth', this._line_width);
        }
    }

    private _consider_pixel_ratio: boolean = true;
    public get consider_pixel_ratio() { return this._consider_pixel_ratio; }
    public set consider_pixel_ratio(consider_pixel_ratio: boolean) {
        if (this._consider_pixel_ratio !== consider_pixel_ratio) {
            this._consider_pixel_ratio = consider_pixel_ratio;
            this.material.set_UniformOverride('u_consider_pixel_ratio', this._consider_pixel_ratio ? 1 : 0);
        }
    }

    constructor(config: Config) {
        super(config);
        this.material_ref.value = this.render_server.create_Material();
        this.update_Material();
    }

    public update_Material() {
        const shader = this.render_server.create_Shader();
        const vertex_shader = this.render_server.render_state.create_Shader(RenderStateShaderType.Vertex, MultiLineMaterialResource.#vertex_shader).expect();
        const fragment_prez_shader = this.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, MultiLineMaterialResource.#fragment_prez_shader).expect();
        const fragment_shade_shader = this.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, MultiLineMaterialResource.#fragment_shade_shader).expect();
        const fragment_oit_shader = this.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, MultiLineMaterialResource.#fragment_oit_shader).expect();
        shader.set_Shaders(
            vertex_shader,
            MultiLineMaterialResource.#vertex_uniforms,
            {
                prez: {
                    shader: fragment_prez_shader,
                    uniforms: MultiLineMaterialResource.#fragment_prez_uniforms,
                },
                shade: {
                    shader: fragment_shade_shader,
                    uniforms: MultiLineMaterialResource.#fragment_shade_uniforms,
                },
                oit: {
                    shader: fragment_oit_shader,
                    uniforms: MultiLineMaterialResource.#fragment_oit_uniforms,
                }
            }
        );
        this.material.set_Material(shader, MultiLineMaterialResource.#uniforms);
        this.material.transparent = false;
    }
}