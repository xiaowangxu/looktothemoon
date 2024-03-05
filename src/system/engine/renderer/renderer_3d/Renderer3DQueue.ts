import { Matrix4 } from "../../../fivepebble/linear_algebra/Matrix4";
import { type RenderServerMaterial } from "../../render_server/RenderServerMaterial";
import type { WebGL2RenderStateVertexArray, WebGL2RenderStateVertexArrayView } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateVertexArray";

// #endregion
export class Renderer3DQueue {
    public readonly solid_max_count: number;
    public readonly solid_geometry_queue: Array<WebGL2RenderStateVertexArray | WebGL2RenderStateVertexArrayView | undefined>;
    public readonly solid_indexed_queue: Array<boolean>;
    public readonly solid_instance_count_queue: Array<number>;
    public readonly solid_material_queue: Array<RenderServerMaterial | undefined>;
    public readonly solid_transform_queue: Array<Matrix4>;
    public readonly solid_layer_queue: Array<number>;

    public readonly transparent_max_count: number;
    public readonly transparent_geometry_queue: Array<WebGL2RenderStateVertexArray | WebGL2RenderStateVertexArrayView | undefined>;
    public readonly transparent_indexed_queue: Array<boolean>;
    public readonly transparent_instance_count_queue: Array<number>;
    public readonly transparent_material_queue: Array<RenderServerMaterial | undefined>;
    public readonly transparent_transform_queue: Array<Matrix4>;
    public readonly transparent_layer_queue: Array<number>;

    private last_solid_pointer: number = -1;
    public solid_pointer: number = -1;

    private last_transparent_pointer: number = -1;
    public transparent_pointer: number = -1;

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
        for (let i = 0; i < this.solid_max_count; i++) {
            this.solid_geometry_queue[i] = undefined;
            this.solid_indexed_queue[i] = false;
            this.solid_instance_count_queue[i] = 1;
            this.solid_material_queue[i] = undefined;
            this.solid_transform_queue[i] = Matrix4.new;
            this.solid_layer_queue[i] = 4294967295;
        }
        this.transparent_max_count = transparent_preserved;
        this.transparent_geometry_queue = new Array(transparent_preserved);
        this.transparent_indexed_queue = new Array(transparent_preserved);
        this.transparent_instance_count_queue = new Array(transparent_preserved);
        this.transparent_material_queue = new Array(transparent_preserved);
        this.transparent_transform_queue = new Array(transparent_preserved);
        this.transparent_layer_queue = new Array(transparent_preserved);
        for (let i = 0; i < this.transparent_max_count; i++) {
            this.transparent_geometry_queue[i] = undefined;
            this.transparent_indexed_queue[i] = false;
            this.transparent_instance_count_queue[i] = 1;
            this.transparent_material_queue[i] = undefined;
            this.transparent_transform_queue[i] = Matrix4.new;
            this.transparent_layer_queue[i] = 4294967295;
        }
    }

    public add(vertex_array: WebGL2RenderStateVertexArray | WebGL2RenderStateVertexArrayView, material: RenderServerMaterial, indexed: boolean, instance_count: number, transform: Matrix4, layer: number) {
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
