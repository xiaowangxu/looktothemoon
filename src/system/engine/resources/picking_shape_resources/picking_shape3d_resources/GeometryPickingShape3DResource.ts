import { Ref } from "@/system/utils/RefCounted";
import type { Geometry3DResource } from "../../geometry_resources/geometry3d_resources/Geometry3DResource";
import { Bvh3PickingShape3DResource } from "./Bvh3PickingShape3DResource";
import { WebGPURenderStatePrimitiveType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import type { WebGPURenderElementVector2Buffer, WebGPURenderElementVector3Buffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementVectorBuffer";
import type { WebGPURenderElementIndexBuffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementBuffer";
import type { AABB, BvhIndexShape } from "@/system/fivepebble/bvh/BvhLike";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import type { Box3 } from "@/system/fivepebble/geometries/Box3";
import { Bvh3Strategy, IndexBvh3, type BaseBvh3 } from "@/system/fivepebble/bvh/Bvh3";
import type { Line3 } from "@/system/fivepebble/geometries/Line3";
import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { Triangle3 } from "@/system/fivepebble/geometries/Triangle3";

export interface GeometryPickingShape3D extends Geometry3DResource {
    get primitive_type(): WebGPURenderStatePrimitiveType;
    get vertex_length(): number;
    get position_normal(): WebGPURenderElementVector3Buffer;
    get uv(): WebGPURenderElementVector2Buffer | undefined;
    get index(): WebGPURenderElementIndexBuffer | undefined;
}

export class GeometryPickingShape3DResource extends Bvh3PickingShape3DResource<IndexBvh3> implements BvhIndexShape<Vector3, Matrix3> {

    static readonly #tmp_point_0 = Vector3.new;
    static readonly #tmp_point_1 = Vector3.new;
    static readonly #tmp_point_2 = Vector3.new;
    static readonly #tmp_normal_0 = Vector3.new;
    static readonly #tmp_normal_1 = Vector3.new;
    static readonly #tmp_normal_2 = Vector3.new;
    static readonly #tmp_triangle_0 = Triangle3.new;

    public static class_name: string = 'GeometryPickingShape3DResource';

    public preserve_global_transform: boolean = false;

    private readonly base_geometry_3d_resource_ref: Ref<GeometryPickingShape3D> = new Ref();
    public get base_geometry() { return this.base_geometry_3d_resource_ref.value; }
    public set base_geometry(base_geometry: GeometryPickingShape3D | undefined) {
        this.set_BaseGeometry(base_geometry);
    }

    public set_BaseGeometry(base_geometry: GeometryPickingShape3D | undefined) {
        if (!this.base_geometry_3d_resource_ref.is_empty) {
            this.base_geometry_3d_resource_ref.expect.render_server_geometry.singal_bbox_changed.disconnect(this.on_base_geometry_bbox_changed);
        }
        this.base_geometry_3d_resource_ref.value = base_geometry;
        if (!this.base_geometry_3d_resource_ref.is_empty) {
            this.base_geometry_3d_resource_ref.expect.render_server_geometry.singal_bbox_changed.connect(this.on_base_geometry_bbox_changed);
        }
        this.update_Bvh();
    }

    public count: number = 0;
    protected readonly position_normal_ref: Ref<WebGPURenderElementVector3Buffer> = new Ref();
    protected readonly uv_ref: Ref<WebGPURenderElementVector2Buffer> = new Ref();
    protected readonly index_ref: Ref<WebGPURenderElementIndexBuffer> = new Ref();

    protected clear_BaseGeometry() {
        if (!this.base_geometry_3d_resource_ref.is_empty) {
            this.base_geometry_3d_resource_ref.expect.render_server_geometry.singal_bbox_changed.connect(this.on_base_geometry_bbox_changed);
        }
        this.count = 0;
        this.position_normal_ref.clear();
        this.uv_ref.clear();
        this.index_ref.clear();
        this.base_geometry_3d_resource_ref.clear();
        this.bvh.clear();
    }

    private on_base_geometry_bbox_changed = () => { this.update_Bvh(); }
    public update_Bvh() {
        if (this.base_geometry_3d_resource_ref.is_empty) this.clear_BaseGeometry();
        else {
            const geometry = this.base_geometry_3d_resource_ref.expect;
            if (geometry.primitive_type !== WebGPURenderStatePrimitiveType.Triangles) {
                this.clear_BaseGeometry();
                throw new Error(`<> update_Bvh: only Geometry3DResources with primitive type of Triangles are supported`);
            }
            else {
                this.position_normal_ref.value = geometry.position_normal;
                this.uv_ref.value = geometry.uv;
                this.index_ref.value = geometry.index;
                const vertex_length = geometry.vertex_length;
                this.count = vertex_length / 3;
                this.bvh.build(this);
            }
        }
    }

    protected get_FacePointNormals(index: number) {
        let p0_index;
        let p1_index;
        let p2_index;
        if (!this.index_ref.is_empty) {
            const index_buffer = this.index_ref.expect;
            const i = (index * 3);
            p0_index = index_buffer.get_Data(i);
            p1_index = index_buffer.get_Data(i + 1);
            p2_index = index_buffer.get_Data(i + 2);
        }
        else {
            p0_index = (index * 3);
            p1_index = p0_index + 1;
            p2_index = p0_index + 2;
        }
        const position_normal_buffer = this.position_normal_ref.expect;
        const p0 = p0_index * 2;
        const p1 = p1_index * 2;
        const p2 = p2_index * 2;
        position_normal_buffer.get_Data(p0, GeometryPickingShape3DResource.#tmp_point_0);
        position_normal_buffer.get_Data(p1, GeometryPickingShape3DResource.#tmp_point_1);
        position_normal_buffer.get_Data(p2, GeometryPickingShape3DResource.#tmp_point_2);
        position_normal_buffer.get_Data(p0 + 1, GeometryPickingShape3DResource.#tmp_normal_0);
        position_normal_buffer.get_Data(p1 + 1, GeometryPickingShape3DResource.#tmp_normal_1);
        position_normal_buffer.get_Data(p2 + 1, GeometryPickingShape3DResource.#tmp_normal_2);
    }

    get_AABB(index: number, target: Box3): Box3 {
        this.get_FacePointNormals(index);
        const p0 = GeometryPickingShape3DResource.#tmp_point_0;
        const p1 = GeometryPickingShape3DResource.#tmp_point_1;
        const p2 = GeometryPickingShape3DResource.#tmp_point_2;
        target.min.set(
            Math.min(p0.x, p1.x, p2.x),
            Math.min(p0.y, p1.y, p2.y),
            Math.min(p0.z, p1.z, p2.z),
        );
        target.max.set(
            Math.max(p0.x, p1.x, p2.x),
            Math.max(p0.y, p1.y, p2.y),
            Math.max(p0.z, p1.z, p2.z),
        );
        return target;
    }

    protected bvh: IndexBvh3 = new IndexBvh3();

    protected interset_Line(index: number, line: Line3, position: Vector3, normal: Vector3, uv: Vector2): boolean {
        this.get_FacePointNormals(index);
        const triangle = GeometryPickingShape3DResource.#tmp_triangle_0.set(
            GeometryPickingShape3DResource.#tmp_point_0,
            GeometryPickingShape3DResource.#tmp_point_1,
            GeometryPickingShape3DResource.#tmp_point_2,
        );
        const pos = triangle.intersect_Line(line, position);
        if (pos === undefined) return false;
        normal.copy(GeometryPickingShape3DResource.#tmp_normal_0);
        return true;
    }

    protected dispose(): void {
        this.clear_BaseGeometry();
    }
}