import { RenderServer, RenderServerSingleton } from "@/system/engine/render_server/RenderServer";
import { RenderServerGeometryAttributeLocation, RenderServerGeometryAttributeLayout } from "@/system/engine/render_server/geometry/RenderServerGeometryDefination";
import { RenderServerRenderMaterial, RenderServerRenderMaterialPass } from "@/system/engine/render_server/material/RenderServerRenderMaterial";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { WebGPURenderState } from "@/system/sliverofstraw/WebGPURenderState";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { WebGPURenderStateBufferUniformType } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { RefCacher, ReadonlyRef } from "@/system/utils/RefCounted";
import { MaterialResource } from "../../MaterialResource";
import { WebGPURenderStateAttributeType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";

const PolyLineMaterial3DResourceUniformLayout = new RefCacher(() => {
    const layout = RenderServer.render_state.create_UniformLayout();
    layout.add_BufferUniform(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 0, false);
    return layout;
});

const PolyLineMaterial3DResourceSolidPipelineCache = new RefCacher(() => {
    const pipeline_cache = RenderServerRenderMaterial.create_PipelineCache(hash => {
        const shader_code = `

            struct Attributes {
                @location(${RenderServerGeometryAttributeLocation.Position}) position: vec3f,
                @location(${RenderServerGeometryAttributeLocation.Normal}) normal: vec3f,
                @location(${RenderServerGeometryAttributeLocation.Uv}) uv: vec2f,
                @location(${RenderServerGeometryAttributeLocation.Custom0}) start: vec3f,
                @location(${RenderServerGeometryAttributeLocation.Custom1}) end: vec3f,
            };

            ${RenderServerSingleton.WorldUniformsStructCode}
            ${RenderServerSingleton.InstanceUniformsStructCode}

            struct VertexOutput {
                @builtin(position) position: vec4f,
                @location(0) normal: vec3f,
                @location(1) uv: vec2f,
            };

            struct Uniform {
                color: vec4f,
                width: f32,
            };

            ${RenderServerSingleton.WorldUniformsGroupBindingCode}
            ${RenderServerSingleton.InstanceUniformsGroupBindingCode}

            @group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(0) var<uniform> mat_uniform: Uniform;
        
            @vertex
            fn vs_main(attri: Attributes) -> VertexOutput {
                var out: VertexOutput;
                
                var screen = world_env_uniform_params.screen_size;
                var aspect = screen.x / screen.y;

                var _model_world = instance_uniform.transform;
                var model_view = world_env_uniform_camera_matrix.camera_view * _model_world;

                // camera space
                var start = model_view * vec4f(attri.start, 1.0);
                var end = model_view * vec4f(attri.end, 1.0);

                out.uv = attri.uv;

                // special case for perspective projection, and segments that terminate either in, or behind, the camera plane
                // clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
                // but we need to perform ndc-space calculations in the shader, so we must address this issue directly
                // perhaps there is a more elegant solution -- WestLangley

                var perspective = !bool(world_env_uniform_params.orthogonal); // 4th entry in the 3rd column

                if perspective {
                    if start.z < 0.0 && end.z >= 0.0 {
                        end = trimSegment(start, end);
                    }
                    else if end.z < 0.0 && start.z >= 0.0 {
                        end = trimSegment(end, start);
                    }
                }
            
                // clip space
                var clip_start = world_env_uniform_camera_matrix.camera_proj * start;
                var clip_end = world_env_uniform_camera_matrix.camera_proj * end;
            
                // ndc space
                var ndc_start = clip_start.xyz / clip_start.w;
                var ndc_end = clip_end.xyz / clip_end.w;
            
                // direction
                var dir = ndc_end.xy - ndc_start.xy;
            
                // account for clip-space aspect ratio
                dir.x *= aspect;
                dir = normalize(dir);
            
                var offset = vec2(dir.y, -dir.x);
            
                // undo aspect ratio adjustment
                dir.x /= aspect;
                offset.x /= aspect;
            
                // sign flip
                if attri.position.x < 0.0 {
                    offset *= -1.0;
                }
            
                // endcaps
                if attri.position.y < 0.0 {
                    offset += -dir;
                }
                else if attri.position.y > 1.0 {
                    offset += dir;
                }
            
                // adjust for linewidth
                var pixel_scale = 1.0;
                if true {
                    pixel_scale = world_env_uniform_params.pixel_ratio;
                }
                offset *= mat_uniform.width * pixel_scale;
            
                // adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
                offset /= screen.y;
            
                // select end
                var is_start = attri.position.y < 0.5;
                var clip = clip_end;
                if is_start {
                    clip = clip_start;
                }
            
                // back to clip space
                offset *= clip.w;

                out.position = vec4f(clip.xy + offset, clip.zw);
                out.normal = vec3f(0.0, 0.0, 1.0);

                return out;
            }

            fn trimSegment(start: vec4f, end: vec4f) -> vec4f {
                var a: f32 = world_env_uniform_camera_matrix.camera_proj[2][2]; // 3nd entry in 3th column
                var b: f32 = world_env_uniform_camera_matrix.camera_proj[3][2]; // 3nd entry in 4th column
                var nearEstimate: f32 = -0.5 * b / a;
                var alpha: f32 = (nearEstimate - start.z) / (end.z - start.z);
                return vec4f(mix(start.xyz, end.xyz, alpha), end.w);
            }
        
            struct FragmentOutput {
                @location(0) color: vec4f,
                @location(1) normal: vec4f,
            };
        
            @fragment
            fn fs_main(vary: VertexOutput) -> FragmentOutput {

                var out: FragmentOutput;

                if (abs(vary.uv.y) > 1.0) {
                    var a = vary.uv.x;
                    var b = vary.uv.y + 1.0;
                    if vary.uv.y > 0.0 {
                        b = vary.uv.y - 1.0;
                    }
                    if a * a + b * b > 1.0 {
                        discard;
                    }
                }
                
                out.color = mat_uniform.color;
                out.normal = vec4f(0.0, 0.0, 1.0, 1.0);
                return out;
            }
            `;
        const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
        const program = RenderServer.render_state.create_Program(shader, shader).expect();
        return program;
    }, RenderServerRenderMaterialPass.Solid, PolyLineMaterial3DResourceUniformLayout.get(), [
        ...RenderServerGeometryAttributeLayout,
        //  Custom0
        {
            stride: 12, // 3 * 4
            per_instance: true,
            rows: [
                {
                    location: RenderServerGeometryAttributeLocation.Custom0,
                    offset: 0,
                    type: WebGPURenderStateAttributeType.Vector3
                },
            ]
        },
        //  Custom1
        {
            stride: 12, // 3 * 4
            per_instance: true,
            rows: [
                {
                    location: RenderServerGeometryAttributeLocation.Custom1,
                    offset: 0,
                    type: WebGPURenderStateAttributeType.Vector3
                },
            ]
        },
    ]);
    return pipeline_cache;
});

export class PolyLineMaterial3DResource extends MaterialResource {

    static UniformMemoryLayout = WebGPURenderState.RenderStateMemoryLayout({
        type: 'struct',
        members: [
            WebGPURenderStateBufferUniformType.Vector4,
            WebGPURenderStateBufferUniformType.Float,
        ],
    });

    private readonly uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(PolyLineMaterial3DResourceUniformLayout.get()).expect());
    private readonly uniform_buffer_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, PolyLineMaterial3DResource.UniformMemoryLayout.size, false).expect());
    private readonly uniform_array_buffer = new ArrayBuffer(PolyLineMaterial3DResource.UniformMemoryLayout.size);

    private _color = Vector4.new;
    public get color() { return this._color.clone(); }
    public set color(color: Vector4) {
        this._color.copy(color);
        this.render_server_material.is_transparent = this._color.w < 1;
        this.update_UniformBuffer();
    }

    private _width = 2.0;
    public get width() { return this._width; }
    public set width(width: number) {
        width = Math.max(0, width);
        if (this._width !== width) {
            this._width = width;
            this.update_UniformBuffer();
        }
    }

    constructor() {
        super();
        this.uniform_group_ref.expect.set_BufferUniform(0, this.uniform_buffer_ref.expect);
        this.render_server_material.set_PipelineUniform(RenderServerRenderMaterialPass.Solid, PolyLineMaterial3DResourceSolidPipelineCache.get(), this.uniform_group_ref.expect);
        this.render_server_material.add_UniformBuffer(this.uniform_buffer_ref.expect, this.uniform_array_buffer);
        this.update_UniformBuffer();
    }

    private update_UniformBuffer() {
        const float32array0 = new Float32Array(this.uniform_array_buffer);
        float32array0[0] = this._color.x;
        float32array0[1] = this._color.y;
        float32array0[2] = this._color.z;
        float32array0[3] = this._color.w;
        float32array0[4] = this._width;
        this.render_server_material.trigger_UniformBufferChange(0);
    }

    protected dispose(): void {
        this.uniform_group_ref.clear();
        this.uniform_buffer_ref.clear();
        super.dispose();
    }
}