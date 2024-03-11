import { Epsilon } from "@/system/fivepebble/Scalar";
import { RenderStateUniformType, RenderStateShaderType } from "@/system/sliverofstraw/RenderState";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { RenderServerDevice } from "../../render_server/RenderServer";
import { RenderServerGeometry } from "../../render_server/RenderServerGeometry";
import type { UniformInitSet } from "../../render_server/RenderServerShader";
import { MaterialResource, type MaterialReadOnlyUniforms } from "./MaterialResource";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Color } from "@/system/fivepebble/graphics/Color";
import type { Config } from "../../ConfiguredObject";
import { Cacher } from "@/system/utils/Cacher";
import { Ref } from "@/system/utils/RefCounted";

export const MultiLineVertexShader = new Cacher((config: Config) => {
    const code = `#version 300 es
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
    out vec2 v_start;
    out float v_length;
    out vec2 v_direction;
    
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
        v_start = (ndcStart.xy + vec2(1.0)) / 2.0 * screen_size;
        vec2 v_end = (ndcEnd.xy + vec2(1.0)) / 2.0 * screen_size;
        vec2 start_to_end = v_end - v_start;
        v_length = length(start_to_end);
        v_direction = normalize(start_to_end);
    
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
    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Vertex, code).expect());
});
export const MultiLineVertexShaderUniforms: UniformInitSet<WebGL2RenderState> = {
    model_world: { type: RenderStateUniformType.Mat4, default: Matrix4.new },
    u_linewidth: { type: RenderStateUniformType.Float, default: 2 },
    u_consider_pixel_ratio: { type: RenderStateUniformType.Int, default: 1 },
};

export const MultiLineFragmentPreZShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}

    uniform vec4 u_color;
    uniform int u_dashed;
    
    in vec2 v_uv;
    in vec2 v_start;
    in float v_length;
    in vec2 v_direction;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        if (abs(v_uv.y) > 1.0f) {
            float a = v_uv.x;
            float b = (v_uv.y > 0.0f) ? v_uv.y - 1.0f : v_uv.y + 1.0f;
            float len2 = a * a + b * b;
            if (len2 > 1.0f) discard;
        }
        if (bool(u_dashed)) {
            vec2 direction = gl_FragCoord.xy - v_start;
            float project_length = dot(v_direction, direction);
            float uv_y = clamp(project_length / v_length, 0.0, 1.0);
            float length = v_length * (uv_y - 0.5);
            if (fract(mod(length, 100.0) / 100.0) > 0.5) discard;
        }
        o_normal = vec4(0.0, 0.0, 1.0, 1.0);
    }`;
    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
export const MultiLineFragmentPreZShaderUniforms: UniformInitSet<WebGL2RenderState> = {
    u_dashed: { type: RenderStateUniformType.Int, default: 0 },
};

export const MultiLineFragmentShadeShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}

    uniform vec4 u_color;
    uniform int u_dashed;
    
    in vec2 v_uv;
    in vec2 v_start;
    in float v_length;
    in vec2 v_direction;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        if (abs(v_uv.y) > 1.0f) {
            float a = v_uv.x;
            float b = (v_uv.y > 0.0f) ? v_uv.y - 1.0f : v_uv.y + 1.0f;
            float len2 = a * a + b * b;
            if (len2 > 1.0f) discard;
        }
        if (bool(u_dashed)) {
            vec2 direction = gl_FragCoord.xy - v_start;
            float project_length = dot(v_direction, direction);
            float uv_y = clamp(project_length / v_length, 0.0, 1.0);
            float length = v_length * (uv_y - 0.5);
            if (fract(mod(length, 100.0) / 100.0) > 0.5) discard;
        }
        o_color = u_color; // vec4(uv_y, 0.0, 0.0, 1.0);
        o_normal = vec4(0.0, 0.0, 1.0, 1.0);
    }`;
    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
export const MultiLineFragmentShadeShaderUniforms: UniformInitSet<WebGL2RenderState> = {
    u_color: { type: RenderStateUniformType.Vec4, default: Color.new },
    u_dashed: { type: RenderStateUniformType.Int, default: 0 },
};

export const MultiLineFragmentOitShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}

    uniform vec4 u_color;
    uniform int u_dashed;
    
    in vec2 v_uv;
    in vec2 v_start;
    in float v_length;
    in vec2 v_direction;

    ${RenderServerDevice.FrameOiTOutputBufferCode}

    void main() {
        if (abs(v_uv.y) > 1.0f) {
            float a = v_uv.x;
            float b = (v_uv.y > 0.0f) ? v_uv.y - 1.0f : v_uv.y + 1.0f;
            float len2 = a * a + b * b;
            if (len2 > 1.0f) discard;
        }
        if (bool(u_dashed)) {
            vec2 direction = gl_FragCoord.xy - v_start;
            float project_length = dot(v_direction, direction);
            float uv_y = clamp(project_length / v_length, 0.0, 1.0);
            float length = v_length * (uv_y - 0.5);
            if (fract(mod(length, 100.0) / 100.0) > 0.5) discard;
        }
        vec4 color = u_color; // vec4(uv_y, 0.0, 0.0, 1.0);
        o_normal = vec4(0.0, 0.0, 1.0, 1.0);
        ${RenderServerDevice.OitOutputCode}
    }`;
    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
export const MultiLineFragmentOitShaderUniforms: UniformInitSet<WebGL2RenderState> = {
    u_color: { type: RenderStateUniformType.Vec4, default: Color.new },
    u_dashed: { type: RenderStateUniformType.Int, default: 0 },
};

export class MultiLineMaterialResource extends MaterialResource {

    static readonly #uniforms: MaterialReadOnlyUniforms = {
        model_world: RenderStateUniformType.Mat4,
        u_color: RenderStateUniformType.Vec4,
        u_linewidth: RenderStateUniformType.Float,
        u_consider_pixel_ratio: RenderStateUniformType.Int,
        u_dashed: RenderStateUniformType.Int,
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
        const vertex_shader = MultiLineVertexShader.get(this.config).expect;
        const fragment_prez_shader = MultiLineFragmentPreZShader.get(this.config).expect;
        const fragment_shade_shader = MultiLineFragmentShadeShader.get(this.config).expect;
        const fragment_oit_shader = MultiLineFragmentOitShader.get(this.config).expect;
        shader.set_Shaders(
            vertex_shader,
            MultiLineVertexShaderUniforms,
            {
                prez: {
                    shader: fragment_prez_shader,
                    uniforms: MultiLineFragmentPreZShaderUniforms,
                },
                shade: {
                    shader: fragment_shade_shader,
                    uniforms: MultiLineFragmentShadeShaderUniforms,
                },
                oit: {
                    shader: fragment_oit_shader,
                    uniforms: MultiLineFragmentOitShaderUniforms,
                }
            }
        );
        this.material.set_Material(shader, MultiLineMaterialResource.#uniforms);
        this.material.transparent = false;
    }
}