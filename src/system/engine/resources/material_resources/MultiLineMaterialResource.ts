import { Epsilon, clamp } from "@/system/fivepebble/Scalar";
import { RenderStateUniformType, RenderStateShaderType } from "@/system/sliverofstraw/RenderState";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { RenderServerDevice } from "../../render_server/RenderServer";
import { RenderServerGeometry, RenderServerGeometryAttributeLocations } from "../../render_server/RenderServerGeometry";
import type { UniformInitSet } from "../../render_server/RenderServerShader";
import { MaterialResource, type MaterialReadOnlyUniforms } from "./MaterialResource";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Color } from "@/system/fivepebble/graphics/Color";
import type { Config } from "../../ConfiguredObject";
import { Cacher } from "@/system/utils/Cacher";
import { Ref } from "@/system/utils/RefCounted";

export const MultiLineSegmentVertexShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;
    
    ${RenderServerDevice.ConstantsCode}
    
    ${RenderServerDevice.WorldUniformsCode}
    
    layout(location = 0) in vec3 a_position;
    layout(location = 5) in vec2 a_uv;
    layout(location = ${RenderServerGeometryAttributeLocations.custom0}) in vec3 a_start;
    layout(location = ${RenderServerGeometryAttributeLocations.custom1}) in vec3 a_end;
    layout(location = ${RenderServerGeometryAttributeLocations.custom2}) in float a_length_percentage_start;
    layout(location = ${RenderServerGeometryAttributeLocations.custom3}) in float a_length_percentage_end;
    layout(location = ${RenderServerGeometryAttributeLocations.instance_transform}) in float a_total_length;
    layout(location = ${RenderServerGeometryAttributeLocations.instance_transform1}) in vec4 a_color_start;
    layout(location = ${RenderServerGeometryAttributeLocations.instance_transform2}) in vec4 a_color_end;
    
    uniform mat4 model_world;

    uniform float u_linewidth;
    uniform int u_consider_pixel_ratio;
    
    out vec2 v_uv;
    out vec3 v_normal;
    out vec2 v_screen_start;
    out float v_screen_length;
    out vec4 v_project_position;
    out float v_segment_percentage;
    out float v_length_percentage;
    out float v_length;
    out vec4 v_color;
    
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
        float scalex = length(model_world[0].xyz);
        float scaley = length(model_world[1].xyz);
        float scalez = length(model_world[2].xyz);
        float scale = max(scalex, max(scaley, scalez));
        v_length = a_total_length * scale / (bool(u_consider_pixel_ratio) ? pixel_ratio : 1.0);
        
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
        v_screen_start = (ndcStart.xy + vec2(1.0)) / 2.0 * screen_size;
        vec2 v_end = (ndcEnd.xy + vec2(1.0)) / 2.0 * screen_size;
        vec2 start_to_end = v_end - v_screen_start;
        v_screen_length = length(start_to_end);
    
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
        bool is_start = a_position.y < 0.5;
        v_segment_percentage = float(!is_start);
        vec4 clip = is_start ? clip_start : clip_end;
        v_length_percentage = is_start ? a_length_percentage_start : a_length_percentage_end;
        v_color = is_start ? a_color_start : a_color_end;
        v_project_position = clip;
    
        // back to clip space
        offset *= clip.w;
    
        clip.xy += offset;
    
        gl_Position = clip;
    
        v_normal = camera_is_orthogonal ? normalize(mat3(camera_world) * vec3(0.0, 0.0, 1.0)) : normalize(camera_world[3].xyz - (is_start ? a_start : a_end));
    }`;
    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Vertex, code).expect());
});
export const MultiLineSegmentVertexShaderUniforms: UniformInitSet<WebGL2RenderState> = {
    model_world: { type: RenderStateUniformType.Mat4, default: Matrix4.new },
    u_linewidth: { type: RenderStateUniformType.Float, default: 2 },
    u_consider_pixel_ratio: { type: RenderStateUniformType.Int, default: 1 },
};

export const MultiLineSegmentFragmentPreZShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}
    ${RenderServerDevice.ConstantsCode}

    uniform uint u_dashed;
    uniform float u_dash_scale;
    uniform float u_dash_offset;
    uniform float u_dash_gap;
    
    in vec2 v_uv;
    in vec3 v_normal;
    in float v_length_percentage;
    in float v_length;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        if (abs(v_uv.y) > 1.0f) {
            float a = v_uv.x;
            float b = (v_uv.y > 0.0f) ? v_uv.y - 1.0f : v_uv.y + 1.0f;
            if (a * a + b * b > 1.0f) discard;
        }
        if (bool(u_dashed)) {
            float percentage = fract(v_length_percentage * v_length * u_dash_scale);
            float segment_percentage = mod(percentage + u_dash_offset, 1.0);
            if (segment_percentage >= u_dash_gap || segment_percentage < EPSILON) discard;
        }
        o_normal = vec4(normalize(v_normal), 1.0);
    }`;
    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
export const MultiLineSegmentFragmentPreZShaderUniforms: UniformInitSet<WebGL2RenderState> = {
    u_dashed: { type: RenderStateUniformType.Uint, default: 0 },
    u_dash_scale: { type: RenderStateUniformType.Float, default: 1.0 },
    u_dash_offset: { type: RenderStateUniformType.Float, default: 0.0 },
    u_dash_gap: { type: RenderStateUniformType.Float, default: 0.6 },
};

export const MultiLineSegmentFragmentShadeShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}
    ${RenderServerDevice.ConstantsCode}

    uniform vec4 u_color;
    uniform uint u_dashed;
    uniform float u_dash_scale;
    uniform float u_dash_offset;
    uniform float u_dash_gap;
    uniform uint u_vertex_color;
    
    in vec2 v_uv;
    in vec4 v_color;
    in vec3 v_normal;
    in float v_length_percentage;
    in float v_length;

    ${RenderServerDevice.FrameOutputBufferCode}

    void main() {
        if (abs(v_uv.y) > 1.0f) {
            float a = v_uv.x;
            float b = (v_uv.y > 0.0f) ? v_uv.y - 1.0f : v_uv.y + 1.0f;
            if (a * a + b * b > 1.0f) discard;
        }
        if (bool(u_dashed)) {
            float percentage = fract(v_length_percentage * v_length * u_dash_scale);
            float segment_percentage = mod(percentage + u_dash_offset, 1.0);
            if (segment_percentage >= u_dash_gap || segment_percentage < EPSILON) discard;
        }
        o_color = u_color * mix(vec4(1.0), v_color, float(u_vertex_color));
        o_normal = vec4(normalize(v_normal), 1.0);
    }`;
    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
export const MultiLineSegmentFragmentShadeShaderUniforms: UniformInitSet<WebGL2RenderState> = {
    u_color: { type: RenderStateUniformType.Vec4, default: Color.new },
    u_dashed: { type: RenderStateUniformType.Uint, default: 0 },
    u_dash_scale: { type: RenderStateUniformType.Float, default: 1.0 },
    u_dash_offset: { type: RenderStateUniformType.Float, default: 0.0 },
    u_dash_gap: { type: RenderStateUniformType.Float, default: 0.6 },
    u_vertex_color: { type: RenderStateUniformType.Uint, default: 1 },
};

export const MultiLineSegmentFragmentOitShader = new Cacher((config: Config) => {
    const code = `#version 300 es
    precision highp float;
    precision highp usampler2DArray;
    precision highp sampler3D;

    ${RenderServerDevice.WorldUniformsCode}
    ${RenderServerDevice.ConstantsCode}

    uniform vec4 u_color;
    uniform uint u_dashed;
    uniform float u_dash_scale;
    uniform float u_dash_offset;
    uniform float u_dash_gap;
    uniform uint u_vertex_color;
    
    in vec2 v_uv;
    in vec4 v_color;
    in vec3 v_normal;
    in float v_length_percentage;
    in float v_length;

    ${RenderServerDevice.FrameOiTOutputBufferCode}

    void main() {
        if (abs(v_uv.y) > 1.0f) {
            float a = v_uv.x;
            float b = (v_uv.y > 0.0f) ? v_uv.y - 1.0f : v_uv.y + 1.0f;
            if (a * a + b * b > 1.0f) discard;
        }
        if (bool(u_dashed)) {
            float percentage = fract(v_length_percentage * v_length * u_dash_scale);
            float segment_percentage = mod(percentage + u_dash_offset, 1.0);
            if (segment_percentage >= u_dash_gap || segment_percentage < EPSILON) discard;
        }
        vec4 color = u_color * mix(vec4(1.0), v_color, float(u_vertex_color));
        o_normal = vec4(normalize(v_normal), 1.0);
        ${RenderServerDevice.OitOutputCode}
    }`;
    return new Ref(config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect());
});
export const MultiLineSegmentFragmentOitShaderUniforms: UniformInitSet<WebGL2RenderState> = {
    u_color: { type: RenderStateUniformType.Vec4, default: Color.new },
    u_dashed: { type: RenderStateUniformType.Uint, default: 0 },
    u_dash_scale: { type: RenderStateUniformType.Float, default: 1.0 },
    u_dash_offset: { type: RenderStateUniformType.Float, default: 0.0 },
    u_dash_gap: { type: RenderStateUniformType.Float, default: 0.6 },
    u_vertex_color: { type: RenderStateUniformType.Uint, default: 1 },
};

export class MultiLineSegmentMaterialResource extends MaterialResource {

    static readonly #uniforms: MaterialReadOnlyUniforms = {
        model_world: RenderStateUniformType.Mat4,
        u_color: RenderStateUniformType.Vec4,
        u_linewidth: RenderStateUniformType.Float,
        u_consider_pixel_ratio: RenderStateUniformType.Int,
        u_dashed: RenderStateUniformType.Uint,
        u_dash_scale: RenderStateUniformType.Float,
        u_dash_offset: RenderStateUniformType.Float,
        u_dash_gap: RenderStateUniformType.Float,
        u_vertex_color: RenderStateUniformType.Uint,
    };

    public get uniforms() { return MultiLineSegmentMaterialResource.#uniforms; }

    private _color: Color = new Vector4(1, 1, 1, 1);
    public get color() { return this._color; }
    public set color(color: Color) {
        if (!this._color.equal(color)) {
            this._color = color;
            this.material.set_Uniform('u_color', this._color);
            this.material.transparent = this._color.a < (1.0 - Epsilon);
        }
    }

    private _line_width: number = 2;
    public get line_width() { return this._line_width; }
    public set line_width(line_width: number) {
        line_width = Math.max(0, line_width);
        if (this._line_width !== line_width) {
            this._line_width = line_width;
            this.material.set_Uniform('u_linewidth', this._line_width);
        }
    }

    private _dashed: boolean = false;
    public get dashed() { return this._dashed; }
    public set dashed(dashed: boolean) {
        if (this._dashed !== dashed) {
            this._dashed = dashed;
            this.material.set_Uniform('u_dashed', this._dashed ? 1 : 0);
        }
    }

    private _dash_gap: number = 0.6;
    public get dash_gap() { return this._dash_gap; }
    public set dash_gap(dash_gap: number) {
        dash_gap = clamp(dash_gap, 0, 1);
        if (this._dash_gap !== dash_gap) {
            this._dash_gap = dash_gap;
            this.material.set_Uniform('u_dash_gap', this._dash_gap);
        }
    }

    private _dash_scale: number = 1.0;
    public get dash_scale() { return this._dash_scale; }
    public set dash_scale(dash_scale: number) {
        dash_scale = Math.max(dash_scale, 0);
        if (this._dash_scale !== dash_scale) {
            this._dash_scale = dash_scale;
            this.material.set_Uniform('u_dash_scale', this._dash_scale);
        }
    }

    private _dash_offset: number = 0.0;
    public get dash_offset() { return this._dash_offset; }
    public set dash_offset(dash_offset: number) {
        dash_offset = clamp(dash_offset, 0, 1);
        if (this._dash_offset !== dash_offset) {
            this._dash_offset = dash_offset;
            this.material.set_Uniform('u_dash_offset', this._dash_offset);
        }
    }

    private _consider_pixel_ratio: boolean = true;
    public get consider_pixel_ratio() { return this._consider_pixel_ratio; }
    public set consider_pixel_ratio(consider_pixel_ratio: boolean) {
        if (this._consider_pixel_ratio !== consider_pixel_ratio) {
            this._consider_pixel_ratio = consider_pixel_ratio;
            this.material.set_Uniform('u_consider_pixel_ratio', this._consider_pixel_ratio ? 1 : 0);
        }
    }

    private _vertex_color: boolean = true;
    public get vertex_color() { return this._vertex_color; }
    public set vertex_color(vertex_color: boolean) {
        if (this._vertex_color !== vertex_color) {
            this._vertex_color = vertex_color;
            this.material.set_Uniform('u_vertex_color', this._vertex_color ? 1 : 0);
        }
    }

    constructor(config: Config) {
        super(config);
        this.material_ref.value = this.render_server.create_Material();
        this.update_Material();
    }

    public update_Material() {
        const shader = this.render_server.create_Shader();
        const vertex_shader = MultiLineSegmentVertexShader.get(this.config).expect;
        const fragment_prez_shader = MultiLineSegmentFragmentPreZShader.get(this.config).expect;
        const fragment_shade_shader = MultiLineSegmentFragmentShadeShader.get(this.config).expect;
        const fragment_oit_shader = MultiLineSegmentFragmentOitShader.get(this.config).expect;
        shader.set_Shaders(
            vertex_shader,
            MultiLineSegmentVertexShaderUniforms,
            {
                prez: {
                    shader: fragment_prez_shader,
                    uniforms: MultiLineSegmentFragmentPreZShaderUniforms,
                },
                shade: {
                    shader: fragment_shade_shader,
                    uniforms: MultiLineSegmentFragmentShadeShaderUniforms,
                },
                oit: {
                    shader: fragment_oit_shader,
                    uniforms: MultiLineSegmentFragmentOitShaderUniforms,
                }
            }
        );
        this.material.set_Material(shader, MultiLineSegmentMaterialResource.#uniforms);
        this.material.transparent = false;
    }
}