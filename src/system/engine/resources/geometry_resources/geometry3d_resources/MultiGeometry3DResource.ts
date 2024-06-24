import { Ref } from "@/system/utils/RefCounted";
import { WebGPURenderElementMatrix4Buffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementMatrixBuffer";
import { RenderServer } from "../../../render_server/RenderServer";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import type { Color } from "@/system/fivepebble/graphics/Color";
import { RenderServerGeometryAttributeLayoutBuffer } from "../../../render_server/geometry/RenderServerGeometryDefination";
import { Geometry3DResource } from "./Geometry3DResource";

type BaseGeometry3DResource = Exclude<Geometry3DResource, MultiGeometry3DResource>;

export class MultiGeometry3DResource extends Geometry3DResource {

    static readonly #const_matrxi4_default_transform_color: Matrix4 = Matrix4.create(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        1, 1, 1, 1
    );
    static readonly #tmp_matrix4_0: Matrix4 = Matrix4.new;

    private readonly base_geometry_3d_resource_ref: Ref<BaseGeometry3DResource> = new Ref();
    public get base_geometry() { return this.base_geometry_3d_resource_ref.value; }
    public set base_geometry(base_geometry: BaseGeometry3DResource | undefined) {
        this.base_geometry_3d_resource_ref.value = base_geometry;
        this.render_server_geometry.set_BaseGeometry(base_geometry?.render_server_geometry, true, true);
    }

    private readonly instance_transform_color_buffer_ref: Ref<WebGPURenderElementMatrix4Buffer> = new Ref();

    public get count() { return this.instance_transform_color_buffer_ref.expect.elements_count; }

    constructor() {
        super();
        this.set_Count(1);
    }

    public set_Count(count: number) {
        if (this.base_geometry_3d_resource_ref.is_empty || count !== this.count) {
            this.instance_transform_color_buffer_ref.value = new WebGPURenderElementMatrix4Buffer(
                RenderServer.render_state,
                WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst,
                count
            );
            for (let i = 0; i < count; i++) {
                this.instance_transform_color_buffer_ref.expect.set_Data(MultiGeometry3DResource.#const_matrxi4_default_transform_color, i);
            }
            this.render_server_geometry.clear_Geometry();
            this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.InstanceTransformColor, this.instance_transform_color_buffer_ref.expect.buffer);
            this.render_server_geometry.set_InstanceCount(count);
            Geometry3DResource.$tmp_box3_for_bbox.min.set(-10000, -10000, -10000);
            Geometry3DResource.$tmp_box3_for_bbox.max.set(10000, 10000, 10000);
            this.render_server_geometry.set_BBox(Geometry3DResource.$tmp_box3_for_bbox);
        }
    }

    public set_TransformColor(index: number, transform: Matrix4, color?: Color) {
        const matrix = MultiGeometry3DResource.#tmp_matrix4_0.copy(transform);
        matrix.n41 = color?.x ?? 1;
        matrix.n42 = color?.y ?? 1;
        matrix.n43 = color?.z ?? 1;
        matrix.n44 = color?.w ?? 1;
        this.instance_transform_color_buffer_ref.expect.set_Data(matrix, index);
    }

    public commit() {
        this.instance_transform_color_buffer_ref.expect.commit();
    }

    protected dispose(): void {
        this.instance_transform_color_buffer_ref.clear();
        this.base_geometry_3d_resource_ref.clear();
        super.dispose();
    }
}