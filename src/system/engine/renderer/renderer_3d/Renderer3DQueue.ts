import { Matrix4 } from "../../../fivepebble/linear_algebra/Matrix4";
import { type RenderServerMaterial } from "../../render_server/RenderServerMaterial";
import type { WebGL2RenderStateVertexArray, WebGL2RenderStateVertexArrayView } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateVertexArray";

type SortDistanceIndexArray = Array<{ distance: number, index: number }>;

// #endregion
export class Renderer3DQueue {
    public readonly solid_max_count: number;
    public readonly solid_geometry_queue: Array<WebGL2RenderStateVertexArray | WebGL2RenderStateVertexArrayView | undefined>;
    public readonly solid_indexed_queue: Array<boolean>;
    public readonly solid_instance_count_queue: Array<number>;
    public readonly solid_material_queue: Array<RenderServerMaterial | undefined>;
    public readonly solid_transform_queue: Array<Matrix4>;
    public readonly solid_layer_queue: Array<number>;
    public readonly solid_sort_distance_index_queue: SortDistanceIndexArray;

    public readonly transparent_max_count: number;
    public readonly transparent_geometry_queue: Array<WebGL2RenderStateVertexArray | WebGL2RenderStateVertexArrayView | undefined>;
    public readonly transparent_indexed_queue: Array<boolean>;
    public readonly transparent_instance_count_queue: Array<number>;
    public readonly transparent_material_queue: Array<RenderServerMaterial | undefined>;
    public readonly transparent_transform_queue: Array<Matrix4>;
    public readonly transparent_layer_queue: Array<number>;
    public readonly transparent_sort_distance_index_queue: SortDistanceIndexArray;

    public addtion_sync_queue: Renderer3DQueue | undefined = undefined;

    private last_solid_pointer: number = -1;
    public solid_pointer: number = -1;
    public *get_SolidIterator() {
        const pointer = this.solid_pointer;
        for (let i = 0; i <= pointer; i++) {
            yield this.solid_sort_distance_index_queue[i].index;
        }
    }

    private last_transparent_pointer: number = -1;
    public transparent_pointer: number = -1;
    public *get_TransparentIterator() {
        const pointer = this.transparent_pointer;
        for (let i = 0; i <= pointer; i++) {
            yield this.transparent_sort_distance_index_queue[i].index;
        }
    }

    public get is_solid_full() { return this.solid_max_count <= 0 || this.solid_pointer >= this.solid_max_count; }
    public get is_transparent_full() { return this.transparent_max_count <= 0 || this.transparent_pointer >= this.transparent_max_count; }

    constructor(solid_preserved: number = 65536, transparent_preserved = 2048) {
        this.solid_max_count = solid_preserved;
        this.solid_geometry_queue = new Array(solid_preserved);
        this.solid_indexed_queue = new Array(solid_preserved);
        this.solid_instance_count_queue = new Array(solid_preserved);
        this.solid_material_queue = new Array(solid_preserved);
        this.solid_transform_queue = new Array(solid_preserved);
        this.solid_layer_queue = new Array(solid_preserved);
        this.solid_sort_distance_index_queue = new Array(solid_preserved);
        for (let i = 0; i < this.solid_max_count; i++) {
            this.solid_geometry_queue[i] = undefined;
            this.solid_indexed_queue[i] = false;
            this.solid_instance_count_queue[i] = 1;
            this.solid_material_queue[i] = undefined;
            this.solid_transform_queue[i] = Matrix4.new;
            this.solid_layer_queue[i] = 4294967295;
            this.solid_sort_distance_index_queue[i] = { distance: 0, index: i };
        }
        this.transparent_max_count = transparent_preserved;
        this.transparent_geometry_queue = new Array(transparent_preserved);
        this.transparent_indexed_queue = new Array(transparent_preserved);
        this.transparent_instance_count_queue = new Array(transparent_preserved);
        this.transparent_material_queue = new Array(transparent_preserved);
        this.transparent_transform_queue = new Array(transparent_preserved);
        this.transparent_layer_queue = new Array(transparent_preserved);
        this.transparent_sort_distance_index_queue = new Array(solid_preserved);
        for (let i = 0; i < this.transparent_max_count; i++) {
            this.transparent_geometry_queue[i] = undefined;
            this.transparent_indexed_queue[i] = false;
            this.transparent_instance_count_queue[i] = 1;
            this.transparent_material_queue[i] = undefined;
            this.transparent_transform_queue[i] = Matrix4.new;
            this.transparent_layer_queue[i] = 4294967295;
            this.transparent_sort_distance_index_queue[i] = { distance: 0, index: i };
        }
    }

    public add(vertex_array: WebGL2RenderStateVertexArray | WebGL2RenderStateVertexArrayView, material: RenderServerMaterial, indexed: boolean, instance_count: number, transform: Matrix4, layer: number, sort_distance: number) {
        const is_transparent = material.transparent;
        if (!is_transparent) {
            this.solid_pointer++;
            if (this.is_solid_full) return;
            this.solid_geometry_queue[this.solid_pointer] = vertex_array;
            this.solid_indexed_queue[this.solid_pointer] = indexed;
            this.solid_instance_count_queue[this.solid_pointer] = instance_count;
            this.solid_material_queue[this.solid_pointer] = material;
            this.solid_transform_queue[this.solid_pointer].copy(transform);
            this.solid_layer_queue[this.solid_pointer] = layer;
            const sort_distance_index = this.solid_sort_distance_index_queue[this.solid_pointer];
            sort_distance_index.distance = sort_distance;
            sort_distance_index.index = this.solid_pointer;
        }
        else {
            this.transparent_pointer++;
            if (this.is_transparent_full) return;
            this.transparent_geometry_queue[this.transparent_pointer] = vertex_array;
            this.transparent_indexed_queue[this.transparent_pointer] = indexed;
            this.transparent_instance_count_queue[this.transparent_pointer] = instance_count;
            this.transparent_material_queue[this.transparent_pointer] = material;
            this.transparent_transform_queue[this.transparent_pointer].copy(transform);
            this.transparent_layer_queue[this.transparent_pointer] = layer;
            const sort_distance_index = this.transparent_sort_distance_index_queue[this.transparent_pointer];
            sort_distance_index.distance = sort_distance;
            sort_distance_index.index = this.transparent_pointer;
        }
        if (this.addtion_sync_queue !== undefined) {
            this.addtion_sync_queue.add(vertex_array, material, indexed, instance_count, transform, layer, sort_distance);
        }
    }

    protected static quick_sort_partition(array: SortDistanceIndexArray, low: number, high: number): number {
        // Divides array into two partitions
        // Pivot value
        const pivot = array[low].distance // Choose the first element as the pivot
        // Left index
        let i = low - 1;
        // Right index
        let j = high + 1;
        while (true) {
            // Move the left index to the right at least once and while the element at
            // the left index is less than the pivot
            do { ++i; } while (array[i].distance < pivot);
            // Move the right index to the left at least once and while the element at
            // the right index is greater than the pivot
            do { --j; } while (array[j].distance > pivot);
            // If the indices crossed, return
            if (i >= j) return j;
            // Swap the elements at the left and right indices
            const tmp_distance = array[i].distance;
            const tmp_index = array[i].index;
            array[i].distance = array[j].distance;
            array[i].index = array[j].index;
            array[j].distance = tmp_distance;
            array[j].index = tmp_index;
        }
    }

    protected static quick_sort(array: SortDistanceIndexArray, low: number, high: number) {
        if (low >= 0 && high >= 0 && low < high) {
            const pivot = Renderer3DQueue.quick_sort_partition(array, low, high);
            Renderer3DQueue.quick_sort(array, low, pivot); // Note: the pivot is now included
            Renderer3DQueue.quick_sort(array, pivot + 1, high);
        }
    }

    protected static sort(array: SortDistanceIndexArray, length: number) {
        Renderer3DQueue.quick_sort(array, 0, length - 1);
    }

    public sort() {
        if (this.solid_pointer >= 0) {
            Renderer3DQueue.sort(this.solid_sort_distance_index_queue, this.solid_pointer + 1);
        }
        if (this.transparent_pointer >= 0) {
            Renderer3DQueue.sort(this.transparent_sort_distance_index_queue, this.transparent_pointer + 1);
        }
    }

    public reset() {
        // solid
        if (this.last_solid_pointer > this.solid_pointer) {
            this.solid_geometry_queue.fill(undefined, this.solid_pointer + 1, this.last_solid_pointer + 1);
            this.solid_material_queue.fill(undefined, this.solid_pointer + 1, this.last_solid_pointer + 1);
        }
        this.last_solid_pointer = this.solid_pointer;
        this.solid_pointer = -1;
        // transparent
        if (this.last_transparent_pointer > this.transparent_pointer) {
            this.transparent_geometry_queue.fill(undefined, this.transparent_pointer + 1, this.last_transparent_pointer + 1);
            this.transparent_material_queue.fill(undefined, this.transparent_pointer + 1, this.last_transparent_pointer + 1);
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
        this.solid_geometry_queue.fill(undefined, 0, this.solid_max_count);
        this.solid_material_queue.fill(undefined, 0, this.solid_max_count);
        this.transparent_geometry_queue.fill(undefined, 0, this.transparent_max_count);
        this.transparent_material_queue.fill(undefined, 0, this.transparent_max_count);
    }
}
