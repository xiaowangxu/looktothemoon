import { Frustum3 } from "@/system/fivepebble/graphics/Frustum3";
import type { World3D } from "../../worlds/world3ds/World3D";
import { RenderServerObjectRefCounted } from "../RenderServerObject";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import type { RenderServerViewport } from "../viewport/RenderServerViewport";
import { RenderServerRenderer3DQueue } from "./RenderServerRenderer3DQueue";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { VisualWorld3DMesh } from "../../worlds/world3ds/VisualWorld3D";
import { WebGPURenderStateMultiSampleCount, type WebGPURenderStateMultiSampleTexture } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateMultiSampleTexture";
import type { WebGPURenderStateTextureView } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureView";
import { ReadonlyRef, Ref, RefCacher } from "@/system/utils/RefCounted";
import { RenderServer, RenderServerSingleton } from "../RenderServer";
import { WebGPURenderStateTextureUsage, WebGPURenderStateTextureFormat } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTexture";
import { WebGPURenderElementFrameBuffer } from "@/system/sliverofstraw/render_element_object/frame_buffer/WebGPURenderElementFrameBuffer";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { RenderServerMaterial, RenderServerMaterialPass } from "../material/RenderServerMaterial";
import { WebGPURenderStateDepthCompareFunc, WebGPURenderStatePrimitiveType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import { WebGPURenderElementVertexArray } from "@/system/sliverofstraw/render_element_object/vertex_array/WebGPURenderElementVertexArray";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { RenderServerGeometryAttributeLocation } from "../geometry/RenderServerGeometryDefination";
import { WebGPURenderStateAttributeType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";

const FullScreenTriangleVertexArray = new RefCacher(() => {
    const vertex_array = new WebGPURenderElementVertexArray(RenderServer.render_state, WebGPURenderStatePrimitiveType.Triangles, 0, 3);
    const { buffer, data } = RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.None, 24, true).expect();
    const pos_array = new Float32Array(data);
    pos_array[0] = 0;
    pos_array[1] = 4;
    pos_array[2] = 0;
    pos_array[3] = 0;
    pos_array[4] = 4;
    pos_array[5] = 0;
    buffer.unmap();
    vertex_array.set_Buffer(0, buffer);
    return vertex_array;
});

const FullScreenBackgroundPipeline = new RefCacher(() => {
    
    const shader_code = `

    struct Attributes {
        @location(${RenderServerGeometryAttributeLocation.Position}) position: vec2f,
    };

    struct WorldEnvUniformCameraMatrix {
        camera_world: mat4x4f,
        camera_view: mat4x4f,
        camera_proj: mat4x4f,
        camera_inv_proj: mat4x4f,
        camera_norview: mat3x3f,
    }

    struct WorldEnvUniformParams {
        screen_size: vec2f,
        time: f32,
        orthogonal: u32,
        pixel_ratio: f32,
    }
    
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(1) uv: vec2f,
    };

    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(0) var<uniform> world_env_uniform_camera_matrix: WorldEnvUniformCameraMatrix; 
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(1) var<uniform> world_env_uniform_params: WorldEnvUniformParams;
    
    @vertex
    fn vs_main(attri: Attributes) -> VertexOutput {
        var out: VertexOutput;
        out.position = vec4f(attri.position - vec2f(1.0), 1.0, 1.0);
	    out.uv = attri.position / 2.0;
        return out;
    }

    struct FragmentOutput {
        @location(0) color: vec4f,
        @location(1) normal: vec4f,
    };
    
    @fragment
    fn fs_main(vary: VertexOutput) -> FragmentOutput {
        var out: FragmentOutput;
        var y = vary.uv.y / 5.0 + 0.1;
        out.color = vec4f(0.2, 0.2, 0.2, 1.0);
        out.normal = vec4f(0.0, 0.0, 1.0, 1.0);
        return out;
    }
    `;

    const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
    const program = RenderServer.render_state.create_Program(shader, shader).expect();
    
    const pipeline = RenderServer.render_state.create_RenderPipeline(
        program,
        RenderServerMaterial.ProgramStatePipelineTemplates[RenderServerMaterialPass.Solid],
        RenderServerMaterial.OutputStatePipelineTemplates[RenderServerMaterialPass.Solid],
        [RenderServer.world_env_uniform_layout],
        [
            {
                stride: 8, // 2 * 4
                per_instance: false,
                rows: [{
                    location: 0,
                    offset: 0,
                    type: WebGPURenderStateAttributeType.Vector2
                }]
            },
        ]
    ).expect();

    // mannually release shader and program
    shader.release();
    program.release();

    return pipeline;
});

export class RenderServerRenderer3D extends RenderServerObjectRefCounted {

    static #tmp_frustum_0 = Frustum3.new;
    static #tmp_vector_0 = Vector2.new;
    static #tmp_instance_uniform_group_dynamic_offsets = [0];

    protected readonly queue_0 = new RenderServerRenderer3DQueue();
    protected readonly queue_1 = new RenderServerRenderer3DQueue();

    //#region full screen triangle

    protected readonly full_screen_triangle_vertex_array_ref = new ReadonlyRef(FullScreenTriangleVertexArray.get());
    protected readonly full_screen_background_pipeline_ref = new ReadonlyRef(FullScreenBackgroundPipeline.get());

    //#endregion

    //#region queue instance uniform groups

    protected readonly queue_0_solid_instance_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.instance_uniform_layout).expect());
    protected readonly queue_0_solid_instance_uniform_buffer_view_ref = new ReadonlyRef(RenderServer.render_state.create_BufferView(this.queue_0.solid_instance_uniform_buffer, 0, RenderServerSingleton.InstanceUniformMemoryLayout.size).expect());
    protected readonly queue_1_solid_instance_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.instance_uniform_layout).expect());
    protected readonly queue_1_solid_instance_uniform_buffer_view_ref = new ReadonlyRef(RenderServer.render_state.create_BufferView(this.queue_1.solid_instance_uniform_buffer, 0, RenderServerSingleton.InstanceUniformMemoryLayout.size).expect());

    protected readonly queue_0_transparent_instance_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.instance_uniform_layout).expect());
    protected readonly queue_0_transparent_instance_uniform_buffer_view_ref = new ReadonlyRef(RenderServer.render_state.create_BufferView(this.queue_0.transparent_instance_uniform_buffer, 0, RenderServerSingleton.InstanceUniformMemoryLayout.size).expect());
    protected readonly queue_1_transparent_instance_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.instance_uniform_layout).expect());
    protected readonly queue_1_transparent_instance_uniform_buffer_view_ref = new ReadonlyRef(RenderServer.render_state.create_BufferView(this.queue_1.transparent_instance_uniform_buffer, 0, RenderServerSingleton.InstanceUniformMemoryLayout.size).expect());

    //#endregion

    //#region frame buffer / textures

    protected readonly texture_size = Vector2.create(-1, -1);

    protected readonly solid_color_texture_ref = new Ref<WebGPURenderStateMultiSampleTexture>();
    protected readonly solid_normal_texture_ref = new Ref<WebGPURenderStateMultiSampleTexture>();
    protected readonly solid_depth_texture_ref = new Ref<WebGPURenderStateMultiSampleTexture>();

    protected readonly solid_color_texture_view_ref = new Ref<WebGPURenderStateTextureView>();
    protected readonly solid_normal_texture_view_ref = new Ref<WebGPURenderStateTextureView>();
    protected readonly solid_depth_texture_view_ref = new Ref<WebGPURenderStateTextureView>();

    protected readonly solid_frame_buffer_ref = new ReadonlyRef(new WebGPURenderElementFrameBuffer(RenderServer.render_state));

    //#endregion

    constructor() {
        super();
        this.queue_0_solid_instance_uniform_group_ref.expect.set_BufferUniform(0, this.queue_0_solid_instance_uniform_buffer_view_ref.expect);
        this.queue_1_solid_instance_uniform_group_ref.expect.set_BufferUniform(0, this.queue_1_solid_instance_uniform_buffer_view_ref.expect);
        this.queue_0_transparent_instance_uniform_group_ref.expect.set_BufferUniform(0, this.queue_0_transparent_instance_uniform_buffer_view_ref.expect);
        this.queue_1_transparent_instance_uniform_group_ref.expect.set_BufferUniform(0, this.queue_1_transparent_instance_uniform_buffer_view_ref.expect);
    }

    public resize(width: number, height: number) {
        if (this.texture_size.x !== width || this.texture_size.y !== height) {
            this.texture_size.set(width, height);
            this.solid_color_texture_ref.value = RenderServer.render_state.create_MultiSampleTexture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.RGBA16F, width, height, WebGPURenderStateMultiSampleCount.MS4).expect();
            this.solid_normal_texture_ref.value = RenderServer.render_state.create_MultiSampleTexture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.RGBA16F, width, height, WebGPURenderStateMultiSampleCount.MS4).expect();
            this.solid_depth_texture_ref.value = RenderServer.render_state.create_MultiSampleTexture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.D32F, width, height, WebGPURenderStateMultiSampleCount.MS4).expect();
            this.solid_color_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.solid_color_texture_ref.expect).expect();
            this.solid_normal_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.solid_normal_texture_ref.expect).expect();
            this.solid_depth_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.solid_depth_texture_ref.expect).expect();
            return true;
        }
        return false;
    }

    public reset_FrameBuffer(viewport: RenderServerViewport) {
        this.solid_frame_buffer_ref.expect.clear_Attachments();
        this.solid_frame_buffer_ref.expect.clear_DepthStencilAttachment();
        this.solid_frame_buffer_ref.expect.add_Attachment(this.solid_color_texture_view_ref.expect, true, Vector4.create(0.2, 0.2, 0.2, 1), true, viewport.canvas_texture_view);
        this.solid_frame_buffer_ref.expect.add_Attachment(this.solid_normal_texture_view_ref.expect, true, Vector4.create(0, 0, 0, 1), true);
        this.solid_frame_buffer_ref.expect.set_DepthStencilAttachment(this.solid_depth_texture_view_ref.expect, true, 1, true);
    }

    private last_viewport_id: number = 0;

    public render(world: World3D, camera: Camera3, viewport: RenderServerViewport, time: number, once: boolean) {

        //#region constants

        const camera_world = camera.global_transform;
        const camera_projection = camera.projection;
        const camera_is_orthogonal = camera.is_orthogonal;
        const camera_frustum = camera.get_Frustum(RenderServerRenderer3D.#tmp_frustum_0);

        //#endregion

        //#region Resize Reset FrameBuffer

        viewport.set_PixelRatio();
        const texture_size = viewport.get_Size(RenderServerRenderer3D.#tmp_vector_0);
        if (this.resize(texture_size.x, texture_size.y) || viewport.id !== this.last_viewport_id) {
            this.reset_FrameBuffer(viewport);
        }
        this.last_viewport_id = viewport.id;
        viewport.update_Size();
        this.solid_frame_buffer_ref.expect.refresh_CanvasTextureView();

        //#endregion

        //#region setup global uniforms

        viewport.set_WorldEnvUniform(camera_world, camera_projection, camera_is_orthogonal, time);

        //#endregion

        //#region render queue

        const visual_world_meshes = world.visual_world.meshes;
        const screen_size = viewport.get_RawSize(RenderServerRenderer3D.#tmp_vector_0);
        this.fill_Queue(visual_world_meshes, camera, camera_frustum, screen_size);
        this.queue_0.commit_InstanceUniformBuffers();
        this.queue_1.commit_InstanceUniformBuffers();

        //#endregion

        //#region render

        const encoder = RenderServer.render_state.device.createCommandEncoder();
        this.render_Queue0Solid(encoder, viewport);
        RenderServer.render_state.device.queue.submit([encoder.finish()]);

        //#endregion

        //#region cleanup

        if (once) {
            this.queue_0.clear();
            this.queue_1.clear();
        }

        //#endregion
    }

    protected fill_Queue(meshes: Iterable<VisualWorld3DMesh>, camera: Camera3, camera_frustum: Frustum3, screen_size: Vector2) {
        let total_objects_count = 0;
        let rendered_objects_count = 0;
        this.queue_0.reset();
        this.queue_1.reset();
        for (const mesh of meshes) {
            total_objects_count++;
            const render_queue = mesh.render_queue;
            const queue = render_queue === 0 ? this.queue_0 : this.queue_1;
            if (queue !== undefined) {
                // if (editor_highlighted && mesh.editor_highlighted) {
                //     queue.addtion_sync_queue = this.render_queue_highlight;
                // }
                if (mesh.fill_RenderQueue(queue, camera, camera_frustum, screen_size)) {
                    rendered_objects_count++;
                }
                // queue.addtion_sync_queue = undefined;
            }
        }
    }

    //#region queue 0

    protected render_Queue0Solid(encoder: GPUCommandEncoder, viewport: RenderServerViewport) {
        
        const render_pass = encoder.beginRenderPass(this.solid_frame_buffer_ref.expect.frame_buffer_desc);
        render_pass.setBindGroup(RenderServerSingleton.WorldEnvUniformBindGroupIndex, viewport.world_env_uniform_group.binding_group);
        render_pass.setBindGroup(RenderServerSingleton.LightsUniformBindGroupIndex, viewport.lights_uniform_group.binding_group);
        const dynamic_offsets = RenderServerRenderer3D.#tmp_instance_uniform_group_dynamic_offsets;
        for (let i = 0; i <= this.queue_0.solid_pointer; i++) {
            const vertex_array = this.queue_0.solid_vertex_array[i]!;
            const material = this.queue_0.solid_material[i]!;
            material.update_UniformBuffers();
            const pipeline_uniform = material.get_PipelineUniform(RenderServerMaterialPass.Solid, vertex_array, this.solid_frame_buffer_ref.expect, WebGPURenderStateDepthCompareFunc.LessEqual);
            if (pipeline_uniform === undefined) continue;
            const { pipeline, uniform } = pipeline_uniform;
            if (uniform !== undefined) {
                render_pass.setBindGroup(RenderServerSingleton.UniformBindGroupIndex, uniform.binding_group);
            }
            const instance_count = this.queue_0.get_InstanceCount(false, i);
            dynamic_offsets[0] = i * RenderServerSingleton.InstanceUniformMemoryLayout.size;
            render_pass.setBindGroup(RenderServerSingleton.InstanceUniformBindGroupIndex, this.queue_0_solid_instance_uniform_group_ref.expect.binding_group, dynamic_offsets);
            render_pass.setPipeline(pipeline.pipeline);
            vertex_array.bind_Buffers(render_pass);
            vertex_array.draw(render_pass, instance_count);
        }

        // background
        render_pass.setPipeline(this.full_screen_background_pipeline_ref.expect.pipeline);
        this.full_screen_triangle_vertex_array_ref.expect.bind_Buffers(render_pass);
        this.full_screen_triangle_vertex_array_ref.expect.draw(render_pass);

        render_pass.end();
    }

    //#endregion

    public dispose(): void {
        this.queue_0.dispose();
        this.queue_1.dispose();

        this.full_screen_triangle_vertex_array_ref.clear();
        this.full_screen_background_pipeline_ref.clear();

        this.solid_color_texture_ref.clear();
        this.solid_normal_texture_ref.clear();
        this.solid_depth_texture_ref.clear();
        
        this.solid_color_texture_view_ref.clear();
        this.solid_normal_texture_view_ref.clear();
        this.solid_depth_texture_view_ref.clear();

        this.solid_frame_buffer_ref.clear();

        this.queue_0_solid_instance_uniform_group_ref.clear();
        this.queue_0_solid_instance_uniform_buffer_view_ref.clear();
        this.queue_1_solid_instance_uniform_group_ref.clear();
        this.queue_1_solid_instance_uniform_buffer_view_ref.clear();
        this.queue_0_transparent_instance_uniform_group_ref.clear();
        this.queue_0_transparent_instance_uniform_buffer_view_ref.clear();
        this.queue_1_transparent_instance_uniform_group_ref.clear();
        this.queue_1_transparent_instance_uniform_buffer_view_ref.clear();
    }
}