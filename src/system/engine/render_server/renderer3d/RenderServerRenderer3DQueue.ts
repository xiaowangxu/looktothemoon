import type { WebGPURenderElementVertexArray } from "@/system/sliverofstraw/render_element_object/vertex_array/WebGPURenderElementVertexArray";
import type { WebGPURenderElementVertexArrayView } from "@/system/sliverofstraw/render_element_object/vertex_array/WebGPURenderElementVertexArrayView";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage, type WebGPURenderStateBuffer } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { ReadonlyRef } from "@/system/utils/RefCounted";
import type { Disposable } from "@/system/utils/Type";
import { RenderServer, RenderServerSingleton } from "../RenderServer";
import type { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import type { RenderServerMaterial } from "../material/RenderServerMaterial";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";

type RenderServerRenderer3DQueueVeretxArray = WebGPURenderElementVertexArray | WebGPURenderElementVertexArrayView;

export class RenderServerRenderer3DQueue implements Disposable {

    static readonly #const_instance_uniform_buffer_member_size = RenderServerSingleton.InstanceUniformMemoryLayout.size;
    static readonly #const_instance_uniform_buffer_element_stride = RenderServerSingleton.InstanceUniformMemoryLayout.size / 4;

    protected readonly solid_capcity: number;
    public solid_vertex_array: (RenderServerRenderer3DQueueVeretxArray | undefined)[];
    public solid_material: (RenderServerMaterial | undefined)[];
    protected readonly solid_instance_uniform_buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;
    public get solid_instance_uniform_buffer() { return this.solid_instance_uniform_buffer_ref.expect; }
    public readonly solid_instance_uniform_array_buffer: ArrayBuffer;
    public readonly solid_instance_uniform_transform_array: Float32Array;
    public readonly solid_instance_uniform_params_array: Uint32Array;

    protected readonly transparent_capcity: number;
    public transparent_vertex_array: (RenderServerRenderer3DQueueVeretxArray | undefined)[];
    public transparent_material: (RenderServerMaterial | undefined)[];
    protected readonly transparent_instance_uniform_buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;
    public get transparent_instance_uniform_buffer() { return this.transparent_instance_uniform_buffer_ref.expect; }
    public readonly transparent_instance_uniform_array_buffer: ArrayBuffer;
    public readonly transparent_instance_uniform_transform_array: Float32Array;
    public readonly transparent_instance_uniform_params_array: Uint32Array;

    public addtion_sync_queue: RenderServerRenderer3DQueue | undefined = undefined;

    private last_solid_pointer: number = -1;
    public solid_pointer: number = -1;

    private last_transparent_pointer: number = -1;
    public transparent_pointer: number = -1;

    public get is_solid_full() { return this.solid_capcity <= 0 || this.solid_pointer >= this.solid_capcity; }
    public get is_transparent_full() { return this.transparent_capcity <= 0 || this.transparent_pointer >= this.transparent_capcity; }

    constructor(solid_capcity: number = 65536, transparent_capcity: number = 65536) {
        //#region Solid
        this.solid_capcity = solid_capcity;
        this.solid_vertex_array = new Array(this.solid_capcity).fill(undefined);
        this.solid_material = new Array(this.solid_capcity).fill(undefined);
        this.solid_instance_uniform_buffer_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, RenderServerRenderer3DQueue.#const_instance_uniform_buffer_member_size * this.solid_capcity).expect());
        this.solid_instance_uniform_array_buffer = new ArrayBuffer(this.solid_instance_uniform_buffer_ref.expect.length);
        this.solid_instance_uniform_transform_array = new Float32Array(this.solid_instance_uniform_array_buffer);
        this.solid_instance_uniform_params_array = new Uint32Array(this.solid_instance_uniform_array_buffer);
        //#endregion
        //#region Transparent
        this.transparent_capcity = transparent_capcity;
        this.transparent_vertex_array = new Array(this.transparent_capcity).fill(undefined);
        this.transparent_material = new Array(this.transparent_capcity).fill(undefined);
        this.transparent_instance_uniform_buffer_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, RenderServerRenderer3DQueue.#const_instance_uniform_buffer_member_size * this.transparent_capcity).expect());
        this.transparent_instance_uniform_array_buffer = new ArrayBuffer(this.transparent_instance_uniform_buffer_ref.expect.length);
        this.transparent_instance_uniform_transform_array = new Float32Array(this.transparent_instance_uniform_array_buffer);
        this.transparent_instance_uniform_params_array = new Uint32Array(this.transparent_instance_uniform_array_buffer);
        //#endregion
    }

    public add(vertex_array: RenderServerRenderer3DQueueVeretxArray, material: RenderServerMaterial, instance_count: number, transform: Matrix4, normal: Matrix3, layer: number, sort_distance: number) {
        const is_transparent = material.is_transparent;
        if (!is_transparent) {
            const index = ++this.solid_pointer;
            if (this.is_solid_full) return;
            this.solid_vertex_array[index] = vertex_array;
            this.solid_material[index] = material;
            this.set_InstanceUniform(false, index, transform, normal, layer, instance_count);
            // const sort_distance_index = this.solid_sort_distance_index_queue[this.solid_pointer];
            // sort_distance_index.distance = sort_distance;
            // sort_distance_index.index = this.solid_pointer;
        }
        else {
            const index = ++this.transparent_pointer;
            if (this.is_transparent_full) return;
            this.transparent_vertex_array[index] = vertex_array;
            this.transparent_material[index] = material;
            this.set_InstanceUniform(true, index, transform, normal, layer, instance_count);
            // const sort_distance_index = this.transparent_sort_distance_index_queue[this.transparent_pointer];
            // sort_distance_index.distance = sort_distance;
            // sort_distance_index.index = this.transparent_pointer;
        }
        if (this.addtion_sync_queue !== undefined) {
            this.addtion_sync_queue.add(vertex_array, material, instance_count, transform, normal, layer, sort_distance);
        }
    }

    public set_InstanceUniform(transparent: boolean, index: number, transform: Matrix4, normal: Matrix3, layer: number, instance_count: number) {
        const transform_array = transparent ? this.transparent_instance_uniform_transform_array : this.solid_instance_uniform_transform_array;
        const params_array = transparent ? this.transparent_instance_uniform_params_array : this.solid_instance_uniform_params_array;
        let transform_index = index * RenderServerRenderer3DQueue.#const_instance_uniform_buffer_element_stride;
        let params_index = transform_index + 28;
        transform_array[transform_index++] = transform.n11;
        transform_array[transform_index++] = transform.n21;
        transform_array[transform_index++] = transform.n31;
        transform_array[transform_index++] = transform.n41;
        transform_array[transform_index++] = transform.n12;
        transform_array[transform_index++] = transform.n22;
        transform_array[transform_index++] = transform.n32;
        transform_array[transform_index++] = transform.n42;
        transform_array[transform_index++] = transform.n13;
        transform_array[transform_index++] = transform.n23;
        transform_array[transform_index++] = transform.n33;
        transform_array[transform_index++] = transform.n43;
        transform_array[transform_index++] = transform.n14;
        transform_array[transform_index++] = transform.n24;
        transform_array[transform_index++] = transform.n34;
        transform_array[transform_index++] = transform.n44;
        transform_array[transform_index++] = normal.n11;
        transform_array[transform_index++] = normal.n21;
        transform_array[transform_index++] = normal.n31;
        transform_array[transform_index++] = 0;
        transform_array[transform_index++] = normal.n12;
        transform_array[transform_index++] = normal.n22;
        transform_array[transform_index++] = normal.n32;
        transform_array[transform_index++] = 0;
        transform_array[transform_index++] = normal.n13;
        transform_array[transform_index++] = normal.n23;
        transform_array[transform_index++] = normal.n33;
        transform_array[transform_index++] = 0;
        params_array[params_index++] = layer;
        params_array[params_index++] = instance_count;
    }

    public get_InstanceCount(transparent: boolean, index: number) {
        return transparent ?
            this.transparent_instance_uniform_params_array[index * RenderServerRenderer3DQueue.#const_instance_uniform_buffer_element_stride + 29] :
            this.solid_instance_uniform_params_array[index * RenderServerRenderer3DQueue.#const_instance_uniform_buffer_element_stride + 29];
    }

    public commit_InstanceUniformBuffers() {
        if (this.solid_pointer >= 0) this.solid_instance_uniform_buffer.update_Data(0, this.solid_instance_uniform_array_buffer, 0, (this.solid_pointer + 1) * RenderServerRenderer3DQueue.#const_instance_uniform_buffer_member_size);
        if (this.transparent_pointer >= 0) this.transparent_instance_uniform_buffer.update_Data(0, this.transparent_instance_uniform_array_buffer, 0, (this.transparent_pointer + 1) * RenderServerRenderer3DQueue.#const_instance_uniform_buffer_member_size);
    }

    public reset() {
        if (this.last_solid_pointer > this.solid_pointer) {
            this.solid_vertex_array.fill(undefined, this.solid_pointer + 1, this.last_solid_pointer + 1);
            this.solid_material.fill(undefined, this.solid_pointer + 1, this.last_solid_pointer + 1);
        }
        this.last_solid_pointer = this.solid_pointer;
        this.solid_pointer = -1;
        if (this.last_transparent_pointer > this.transparent_pointer) {
            this.transparent_vertex_array.fill(undefined, this.transparent_pointer + 1, this.last_transparent_pointer + 1);
            this.transparent_material.fill(undefined, this.transparent_pointer + 1, this.last_transparent_pointer + 1);
        }
        this.last_transparent_pointer = this.transparent_pointer;
        this.transparent_pointer = -1;
    }

    public clear() {
        this.last_solid_pointer = this.solid_pointer;
        this.last_transparent_pointer = this.transparent_pointer;
        this.solid_pointer = -1;
        this.transparent_pointer = -1;
        this.reset();
    }

    public dispose() {
        this.solid_instance_uniform_buffer_ref.clear();
        this.transparent_instance_uniform_buffer_ref.clear();
        this.solid_vertex_array = undefined!;
        this.solid_material = undefined!;
        this.transparent_vertex_array = undefined!;
        this.transparent_material = undefined!;
    }
}
