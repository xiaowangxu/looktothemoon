// import { Ref } from "@/system/utils/RefCounted";
// import { Geometry3DResource } from "./Geometry3DResource";
// import { WebGPURenderElementVector4Buffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementVectorBuffer";
// import { RenderServer } from "@/system/engine/render_server/RenderServer";
// import { RenderServerGeometryAttributeLayoutBuffer } from "@/system/engine/render_server/geometry/RenderServerGeometryDefination";
// import type { Color } from "@/system/fivepebble/graphics/Color";
// import type { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
// import { WebGPURenderElementMatrix4Buffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementMatrixBuffer";
// import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
// import { MultiGeometry3DResource } from "./MultiGeometry3DResource";
// import type { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
// import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";

// export class PointsGeometry3DResource extends Geometry3DResource {

//     // static readonly #const_matrxi4_default_transform_color: Matrix4 = Matrix4.create(
//     //     1, 0, 0, 0,
//     //     0, 1, 0, 0,
//     //     0, 0, 1, 0,
//     //     1, 1, 1, 1
//     // );
//     static readonly #tmp_vector4_0: Vector4 = Vector4.new;

//     private readonly position_size_color_buffer_ref: Ref<WebGPURenderElementVector4Buffer> = new Ref();

//     public get count() { return this.position_size_color_buffer_ref.expect.elements_count / 2; }

//     constructor() {
//         super();
//         this.set_Count(1);
//     }

//     public set_Count(count: number) {
//         if (count !== this.count) {
//             this.position_size_color_buffer_ref.value = new WebGPURenderElementVector4Buffer(
//                 RenderServer.render_state,
//                 WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst,
//                 count * 2
//             );
//             // for (let i = 0; i < count; i++) {
//             //     this.point_position_size_color_buffer_ref.expect.set_Data(MultiGeometry3DResource.#const_matrxi4_default_transform_color, i * 2 + 1);
//             // }
//             this.render_server_geometry.clear_Geometry();
//             this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Custom0, this.position_size_color_buffer_ref.expect.buffer);
//             this.render_server_geometry.set_InstanceCount(count);
//             Geometry3DResource.$tmp_box3_for_bbox.min.set(-10000, -10000, -10000);
//             Geometry3DResource.$tmp_box3_for_bbox.max.set(10000, 10000, 10000);
//             this.render_server_geometry.set_BBox(Geometry3DResource.$tmp_box3_for_bbox);
//         }
//     }

//     public set_PointPositionSizeColor(index: number, position?: Vector3, size?: number, color?: Color) {
//         const matrix = PointsGeometry3DResource.#tmp_vector4_0.set(position?.x, position?.y, position?.z, )
//         matrix.n41 = color?.x ?? 1;
//         matrix.n42 = color?.y ?? 1;
//         matrix.n43 = color?.z ?? 1;
//         matrix.n44 = color?.w ?? 1;
//         this.instance_transform_color_buffer_ref.expect.set_Data(matrix, index);
//     }

//     public commit() {
//         this.position_size_color_buffer_ref.expect.commit();
//     }

//     protected dispose(): void {
//         this.position_size_color_buffer_ref.clear();
//         super.dispose();
//     }
// }