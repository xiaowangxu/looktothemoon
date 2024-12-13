import { ReadonlyRef, RefCacher, RefMap } from "@/system/utils/RefCounted";
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
import type { WebGPURenderStateComputePipeline } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateComputePipeline";

const RenderServerLightClusterUniformLayout = new RefCacher(() => {
    const layout = RenderServer.render_state.create_UniformLayout();
    layout.add_BufferUniform(WebGPURenderStateShaderType.Compute, 0, false);
    layout.add_BufferUniform(WebGPURenderStateShaderType.Compute, 1, false);
    layout.add_Storage(true, WebGPURenderStateShaderType.Compute, 2, false);
    layout.add_Storage(false, WebGPURenderStateShaderType.Compute, 3, false);
    return layout;
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

    private static ClusterBitmaskPipelineCache = new RefMap<number, WebGPURenderStateComputePipeline>();
    private static ClusterDataPipelineCache = new RefMap<number, WebGPURenderStateComputePipeline>();

    protected static get_ComputeBitmaskPipeline(light_count: number) {
        const key = light_count / 32;
        if (RenderServerLightClusterData.ClusterBitmaskPipelineCache.has(key)) return RenderServerLightClusterData.ClusterBitmaskPipelineCache.get(key)!;
        else {
            const shader_code = `
        
            ${RenderServerSingleton.WorldUniformsStructCode}
        
            ${RenderServerSingleton.WorldUniformsGroupBindingCode}
        
            ${RenderServerSingleton.LightDataUniformsStructCode}
            
            @group(1) @binding(0) var<uniform> cluster_uniform: LightClusterUniform;
            @group(1) @binding(1) var<uniform> light_uniform: LightUniform;
            @group(1) @binding(2) var<storage, read> lights: array<LightDataUniform>;
            @group(1) @binding(3) var<storage, read_write> bitmasks: array<u32>;
        
            const SLICE_COUNT = ${key}u;
            
            @compute
            @workgroup_size(SLICE_COUNT, 1, 1) 
            fn cs_main(@builtin(workgroup_id) id: vec3u, @builtin(local_invocation_id) slice_id: vec3u) {
                let light_count = light_uniform.count;
                
                let slice = slice_id.x;
                var light_id = slice * 32u;
                var bitmask = 0u;
                var i = 0u;

                for (; i < 32u && light_id < light_count;) {
                    let light = lights[light_id];
                    let t: u32 = light.visible_queue_type & 0xff;
                    let visible: bool = (light.visible_queue_type & 0x80000000) != 0u;
                    let attenuation = light.direction_attenuation.w;
                    let direction = light.direction_attenuation.xyz;
                    let position = light.position.xyz;
        
                    bitmask |= 1u << i;

                    light_id++; i++;
                }

                
                let cluster_id = id.z * (cluster_uniform.width_count * cluster_uniform.height_count) + id.y * cluster_uniform.width_count + id.x;
                let index_id = cluster_id * SLICE_COUNT + slice;

                bitmasks[index_id] = bitmask;
            }

            `;
            const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Compute, shader_code).expect();
            const program = RenderServer.render_state.create_Program(shader, undefined).expect();
            const pipeline = RenderServer.render_state.create_ComputePipeline(
                program,
                [RenderServer.world_env_uniform_layout, RenderServerLightClusterUniformLayout.get()],
            ).expect();
            // mannually release shader and program
            shader.release();
            program.release();
            RenderServerLightClusterData.ClusterBitmaskPipelineCache.set(key, pipeline);
            return pipeline;
        }
    }

    protected static get_ComputeDataPipeline(light_count: number) {
        const key = light_count / 32;
        if (RenderServerLightClusterData.ClusterDataPipelineCache.has(key)) return RenderServerLightClusterData.ClusterDataPipelineCache.get(key)!;
        else {
            const shader_code = `

            ${RenderServerSingleton.WorldUniformsStructCode}
        
            ${RenderServerSingleton.WorldUniformsGroupBindingCode}
        
            ${RenderServerSingleton.LightDataUniformsStructCode}
            
            @group(1) @binding(0) var<uniform> cluster_uniform: LightClusterUniform;
            @group(1) @binding(1) var<uniform> light_uniform: LightUniform;
            @group(1) @binding(2) var<storage, read> bitmasks: array<u32>;
            @group(1) @binding(3) var<storage, read_write> clusters: array<u32>;

            const SLICE_COUNT = ${key}u;

            var<workgroup> counts: array<u32, SLICE_COUNT>;
            
            @compute
            @workgroup_size(SLICE_COUNT, 1, 1) 
            fn cs_main(@builtin(workgroup_id) id: vec3u, @builtin(local_invocation_id) slice_id: vec3u) {
                let cluster_id = id.z * (cluster_uniform.width_count * cluster_uniform.height_count) + id.y * cluster_uniform.width_count + id.x;                
        
                let slice = slice_id.x;
                let bitmask_id = cluster_id * SLICE_COUNT + slice;
                
                var lights = array<u32, 32>();
                var count: u32 = 0;
                let bitmask = bitmasks[bitmask_id];
                let slice_light_id = slice * 32u;
                for (var j = 0u; j < 32u; j++) {
                    let light_id = slice_light_id + j;
                    if (bitmask & (1u << j)) != 0u {
                        lights[count] = light_id;
                        count++;
                    }
                }
                counts[slice] = count;

                workgroupBarrier();

                var offset = 0u;
                for (var i = 0u; i < slice; i++) {
                    offset += counts[i];
                }

                let cluster_count = cluster_uniform.cluster_count;
                var left_over = min(count, select(0u, cluster_count - offset,  offset < cluster_count));
                let index_id = cluster_id * (cluster_count + 1);

                for (var i = 0u; i < left_over; i++) {
                    clusters[index_id + 1 + offset + i] = lights[i];
                }
                
                if slice == (SLICE_COUNT - 1) {
                    clusters[index_id] = clamp(offset + count, 0, cluster_count);
                }
            }
        
            `;
            const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Compute, shader_code).expect();
            const program = RenderServer.render_state.create_Program(shader, undefined).expect();
            const pipeline = RenderServer.render_state.create_ComputePipeline(
                program,
                [RenderServer.world_env_uniform_layout, RenderServerLightClusterUniformLayout.get()],
            ).expect();
            // mannually release shader and program
            shader.release();
            program.release();
            RenderServerLightClusterData.ClusterDataPipelineCache.set(key, pipeline);
            return pipeline;
        }
    }

    protected readonly uniform_buffer_ref = new ReadonlyRef(
        RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, RenderServerLightClusterData.UniformMemoryLayout.size).expect()
    );
    protected readonly uniform_array_buffer = new ArrayBuffer(RenderServerLightClusterData.UniformMemoryLayout.size);

    protected readonly cluster_bitmask_buffer_ref: ReadonlyRef<WebGPURenderElementUintBuffer>;
    protected readonly cluster_data_buffer_ref: ReadonlyRef<WebGPURenderElementUintBuffer>;

    public get uniform_buffer() { return this.uniform_buffer_ref.expect; }
    public get cluster_buffer() { return this.cluster_data_buffer_ref.expect.buffer; }

    protected readonly compute_bitmask_pipeline_ref: ReadonlyRef<WebGPURenderStateComputePipeline>;
    protected readonly compute_bitmask_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServerLightClusterUniformLayout.get()).expect());

    protected readonly compute_data_pipeline_ref: ReadonlyRef<WebGPURenderStateComputePipeline>;
    protected readonly compute_data_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServerLightClusterUniformLayout.get()).expect());

    constructor(width_count: number = 32, height_count: number = 16, depth_count: number = 32, cluster_count: number = 32, light_count: number = 1024) {
        super();
        if (light_count % 32 !== 0) throw new Error('<RenderServerLightClusterData> constructor: light count should be multiples of 32');
        const uint32array = new Uint32Array(this.uniform_array_buffer);
        uint32array[0] = width_count;
        uint32array[1] = height_count;
        uint32array[2] = depth_count;
        uint32array[3] = cluster_count;
        this.compute_bitmask_pipeline_ref = new ReadonlyRef(RenderServerLightClusterData.get_ComputeBitmaskPipeline(light_count));
        this.compute_data_pipeline_ref = new ReadonlyRef(RenderServerLightClusterData.get_ComputeDataPipeline(light_count));
        this.cluster_bitmask_buffer_ref = new ReadonlyRef(new WebGPURenderElementUintBuffer(RenderServer.render_state, WebGPURenderStateBufferType.Storage, WebGPURenderStateBufferUsage.CopySrc, width_count * height_count * depth_count * (light_count / 32)));
        this.cluster_data_buffer_ref = new ReadonlyRef(new WebGPURenderElementUintBuffer(RenderServer.render_state, WebGPURenderStateBufferType.Storage, WebGPURenderStateBufferUsage.CopySrc, width_count * height_count * depth_count * (cluster_count + 1)));
        this.compute_bitmask_uniform_group_ref.expect.set_BufferUniform(0, this.uniform_buffer);
        this.compute_bitmask_uniform_group_ref.expect.set_Storage(3, this.cluster_bitmask_buffer_ref.expect.buffer);
        this.compute_data_uniform_group_ref.expect.set_BufferUniform(0, this.uniform_buffer);
        this.compute_data_uniform_group_ref.expect.set_Storage(2, this.cluster_bitmask_buffer_ref.expect.buffer);
        this.compute_data_uniform_group_ref.expect.set_Storage(3, this.cluster_data_buffer_ref.expect.buffer);
    }

    public compute(encoder: GPUCommandEncoder, camera: Camera3, light_data: RenderServerLightData, world_uniform_group: WebGPURenderStateUniformGroup) {
        const uint32array = new Uint32Array(this.uniform_array_buffer);
        const float32array = new Float32Array(this.uniform_array_buffer);
        float32array[4] = camera.near;
        float32array[5] = camera.far;
        this.uniform_buffer_ref.expect.update_Data(0, this.uniform_array_buffer);

        this.compute_bitmask_uniform_group_ref.expect.set_BufferUniform(1, light_data.light_count_buffer);
        this.compute_bitmask_uniform_group_ref.expect.set_Storage(2, light_data.light_data_buffer);
        this.compute_data_uniform_group_ref.expect.set_BufferUniform(1, light_data.light_count_buffer);

        const pass = encoder.beginComputePass();

        // bitmask
        pass.setPipeline(this.compute_bitmask_pipeline_ref.expect.pipeline);
        pass.setBindGroup(RenderServerSingleton.WorldEnvUniformBindGroupIndex, world_uniform_group.binding_group);
        pass.setBindGroup(1, this.compute_bitmask_uniform_group_ref.expect.binding_group);
        pass.dispatchWorkgroups(uint32array[0], uint32array[1], uint32array[2]);
        // data
        pass.setPipeline(this.compute_data_pipeline_ref.expect.pipeline);
        pass.setBindGroup(RenderServerSingleton.WorldEnvUniformBindGroupIndex, world_uniform_group.binding_group);
        pass.setBindGroup(1, this.compute_data_uniform_group_ref.expect.binding_group);
        pass.dispatchWorkgroups(uint32array[0], uint32array[1], uint32array[2]);

        pass.end();
    }

    public dispose(): void {
        this.compute_bitmask_pipeline_ref.clear();
        this.compute_bitmask_uniform_group_ref.clear();
        this.compute_data_pipeline_ref.clear();
        this.compute_data_uniform_group_ref.clear();
        this.uniform_buffer_ref.clear();
        this.cluster_data_buffer_ref.clear();
    }
}