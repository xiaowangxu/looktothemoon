import { ReadonlyRef, RefCacher } from "@/system/utils/RefCounted";
import { RenderServerObjectRefCounted } from "../RenderServerObject";
import { RenderServer, RenderServerSingleton } from "../RenderServer";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import type { RenderServerLightData } from "./RenderServerLightData";
import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { WebGPURenderStateBufferUniformType } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { WebGPURenderState } from "@/system/sliverofstraw/WebGPURenderState";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import { WebGPURenderElementUintBuffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementBuffer";
import type { WebGPURenderStateUniformGroup } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformGroup";

const RenderServerLightClusterDataUniformLayout = new RefCacher(() => {
    const layout = RenderServer.render_state.create_UniformLayout();
    layout.add_BufferUniform(WebGPURenderStateShaderType.Compute, 0, false);
    layout.add_BufferUniform(WebGPURenderStateShaderType.Compute, 1, false);
    layout.add_Storage(true, WebGPURenderStateShaderType.Compute, 2, false);
    layout.add_Storage(false, WebGPURenderStateShaderType.Compute, 3, false);
    return layout;
});

const RenderServerLightClusterDataPipeline = new RefCacher(() => {

    const shader_code = `

    ${RenderServerSingleton.WorldUniformsStructCode}

    ${RenderServerSingleton.WorldUniformsGroupBindingCode}

    ${RenderServerSingleton.LightDataUniformsStructCode}
    
    @group(1) @binding(0) var<uniform> cluster_uniform: LightClusterUniform;
    @group(1) @binding(1) var<uniform> light_uniform: LightUniform;
    @group(1) @binding(2) var<storage, read> lights: array<LightDataUniform>;
    @group(1) @binding(3) var<storage, read_write> clusters: array<u32>;

    struct Box3 {
        min: vec3f,
        max: vec3f,
    }

    const EYE_POS = vec3f(0.0);
    
    @compute
    @workgroup_size(1) 
    fn cs_main(@builtin(global_invocation_id) id: vec3u) {
        let cluster_id = id.z * (cluster_uniform.width_count * cluster_uniform.height_count) + id.y * cluster_uniform.width_count + id.x;
        let index_id = cluster_id * (cluster_uniform.cluster_count + 1);
        var count: u32 = 0;
        // if id.x >= 12 && id.x <= 20 && id.y >= 5 && id.y <= 10 {
            for (var i: u32 = 0; i < light_uniform.count && count < cluster_uniform.cluster_count; i++) {
                let light = lights[i];
                let t: u32 = light.visible_queue_type & 0xff;
                let visible: bool = (light.visible_queue_type & 0x80000000) != 0u;
                let attenuation = light.direction_attenuation.w;
                let direction = light.direction_attenuation.xyz;
                let position = light.position.xyz;

                // if t == 3u { continue; }

                clusters[index_id + 1 + count] = i;
                count += 1; 
            }
        // }
        clusters[index_id] = count;
    }

    fn is_point_inside_box3(box3: Box3, point: vec3f) -> bool {
        return box3.min.x <= point.x && point.x <= box3.max.x &&
               box3.min.y <= point.y && point.y <= box3.max.y &&
               box3.min.z <= point.z && point.z <= box3.max.z ;
    }

    fn line_intersection_to_z_plane(a: vec3f, b: vec3f, z: f32) -> vec3f {
        let normal = vec3f(0.0, 0.0, 1.0);
        let ab = b - a;
        let t = (z - dot(normal, a)) / dot(normal, ab);
        return a + t * ab;
    }

    fn clip_to_view(clip : vec4f) -> vec4f {
        let view = world_env_uniform_camera_matrix.camera_inv_proj * clip;
        return view / view.w;
    }

    fn screen_to_view(screen : vec4f) -> vec4f {
        let clip = vec4f(vec2f(screen.x, 1.0 - screen.y) * 2.0 - vec2f(1.0), screen.z, screen.w);
        return clip_to_view(clip);
    }
    `;

    const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Compute, shader_code).expect();
    const program = RenderServer.render_state.create_Program(shader, undefined).expect();

    const pipeline = RenderServer.render_state.create_ComputePipeline(
        program,
        [RenderServer.world_env_uniform_layout, RenderServerLightClusterDataUniformLayout.get()],
    ).expect();

    // mannually release shader and program
    shader.release();
    program.release();

    return pipeline;
});

export class RenderServerLightClusterData extends RenderServerObjectRefCounted {

    static UniformMemoryLayout = WebGPURenderState.RenderStateMemoryLayout({
        type: 'struct',
        members: [
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Float,
            WebGPURenderStateBufferUniformType.Float,
        ],
    } as const);

    protected readonly uniform_buffer_ref = new ReadonlyRef(
        RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, RenderServerLightClusterData.UniformMemoryLayout.size).expect()
    );
    protected readonly uniform_array_buffer = new ArrayBuffer(RenderServerLightClusterData.UniformMemoryLayout.size);

    protected readonly cluster_buffer_ref: ReadonlyRef<WebGPURenderElementUintBuffer>;
    protected readonly cluster_buffer_copy_ref: ReadonlyRef<WebGPURenderElementUintBuffer>;

    public get uniform_buffer() { return this.uniform_buffer_ref.expect; }
    public get cluster_buffer() { return this.cluster_buffer_ref.expect.buffer; }
    public get cluster_buffer_copy() { return this.cluster_buffer_copy_ref.expect.buffer; }

    protected readonly compute_pipeline_ref = new ReadonlyRef(RenderServerLightClusterDataPipeline.get());
    protected readonly compute_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServerLightClusterDataUniformLayout.get()).expect());

    constructor(width_count: number = 32, height_count: number = 16, depth_count: number = 32, cluster_count: number = 32) {
        super();
        const uint32array = new Uint32Array(this.uniform_array_buffer);
        uint32array[0] = width_count;
        uint32array[1] = height_count;
        uint32array[2] = depth_count;
        uint32array[3] = cluster_count;
        this.cluster_buffer_ref = new ReadonlyRef(new WebGPURenderElementUintBuffer(RenderServer.render_state, WebGPURenderStateBufferType.Storage, WebGPURenderStateBufferUsage.CopySrc, width_count * height_count * depth_count * (cluster_count + 1)));
        this.cluster_buffer_copy_ref = new ReadonlyRef(new WebGPURenderElementUintBuffer(RenderServer.render_state, WebGPURenderStateBufferType.NotSpecified, WebGPURenderStateBufferUsage.CopyDst | WebGPURenderStateBufferUsage.MapRead, width_count * height_count * depth_count * (cluster_count + 1)));
        this.compute_uniform_group_ref.expect.set_BufferUniform(0, this.uniform_buffer);
        this.compute_uniform_group_ref.expect.set_Storage(3, this.cluster_buffer);
    }

    public compute(encoder: GPUCommandEncoder, camera: Camera3, light_data: RenderServerLightData, world_uniform_group: WebGPURenderStateUniformGroup) {
        const uint32array = new Uint32Array(this.uniform_array_buffer);
        const float32array = new Float32Array(this.uniform_array_buffer);
        float32array[4] = camera.near;
        float32array[5] = camera.far;
        this.uniform_buffer_ref.expect.update_Data(0, this.uniform_array_buffer);
        this.compute_uniform_group_ref.expect.set_BufferUniform(1, light_data.light_count_buffer);
        this.compute_uniform_group_ref.expect.set_Storage(2, light_data.light_data_buffer);
        const pass = encoder.beginComputePass();
        pass.setPipeline(this.compute_pipeline_ref.expect.pipeline);
        pass.setBindGroup(RenderServerSingleton.WorldEnvUniformBindGroupIndex, world_uniform_group.binding_group);
        pass.setBindGroup(1, this.compute_uniform_group_ref.expect.binding_group);
        pass.dispatchWorkgroups(uint32array[0], uint32array[1], uint32array[2]);
        pass.end();
    }

    public dispose(): void {
        this.compute_pipeline_ref.clear();
        this.compute_uniform_group_ref.clear();
        this.uniform_buffer_ref.clear();
        this.cluster_buffer_ref.clear();
        this.cluster_buffer_copy_ref.clear();
    }
}