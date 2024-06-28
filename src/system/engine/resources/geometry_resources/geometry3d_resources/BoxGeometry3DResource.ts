import { ReadonlyRef } from "@/system/utils/RefCounted";
import { WebGPURenderElementIndexBuffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementBuffer";
import { WebGPURenderElementVector2Buffer, WebGPURenderElementVector3Buffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementVectorBuffer";
import { RenderServer } from "../../../render_server/RenderServer";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderStatePrimitiveType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import { RenderServerGeometryAttributeLayoutBuffer } from "../../../render_server/geometry/RenderServerGeometryDefination";
import { Geometry3DResource } from "./Geometry3DResource";
import type { ResourceSetOptionAllAtOnce } from "../../Resource";

type BoxGeometry3DResourceOption = {
    width?: number,
    height?: number,
    depth?: number,
}

export class BoxGeometry3DResource extends Geometry3DResource implements ResourceSetOptionAllAtOnce<BoxGeometry3DResourceOption> {

    private readonly position_normal_buffer_ref: ReadonlyRef<WebGPURenderElementVector3Buffer> = new ReadonlyRef(new WebGPURenderElementVector3Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, 48));
    private readonly uv_buffer_ref: ReadonlyRef<WebGPURenderElementVector2Buffer> = new ReadonlyRef(new WebGPURenderElementVector2Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, 24));
    private readonly index_buffer_ref: ReadonlyRef<WebGPURenderElementIndexBuffer> = new ReadonlyRef(new WebGPURenderElementIndexBuffer(RenderServer.render_state, WebGPURenderStateBufferType.Index, WebGPURenderStateBufferUsage.None, [
        // top
        0, 1, 2, 2, 1, 3,
        // bottom
        4, 6, 5, 5, 6, 7,
        // front
        8, 9, 10, 10, 9, 11,
        // back
        12, 14, 13, 13, 14, 15,
        // right
        16, 17, 18, 18, 17, 19,
        // left
        20, 22, 21, 21, 22, 23,

    ]));

    protected _width: number = 1;
    protected _height: number = 1;
    protected _depth: number = 1;

    public get width() { return this._width; }
    public get height() { return this._height; }
    public get depth() { return this._depth; }

    public set width(width: number) {
        width = Math.max(width, 0);
        if (this._width !== width) {
            this._width = width;
            this.build();
        }
    }
    public set height(height: number) {
        height = Math.max(height, 0);
        if (this._height !== height) {
            this._height = height;
            this.build();
        }
    }
    public set depth(depth: number) {
        depth = Math.max(depth, 0);
        if (this._depth !== depth) {
            this._depth = depth;
            this.build();
        }
    }

    public set option(option: BoxGeometry3DResourceOption) {
        let changed = false;
        if (option.width !== undefined) {
            const width = Math.max(option.width, 0);
            if (this._width !== width) {
                changed = true;
                this._width = width;
            }
        }
        if (option.height !== undefined) {
            const height = Math.max(option.height, 0);
            if (this._height !== height) {
                changed = true;
                this._height = height;
            }
        }
        if (option.depth !== undefined) {
            const depth = Math.max(option.depth, 0);
            if (this._depth !== depth) {
                changed = true;
                this._depth = depth;
            }
        }
        if (changed) {
            this.build();
        }
    }

    constructor() {
        super();
        this.render_server_geometry.clear_Geometry();
        this.render_server_geometry.set_IndexBuffer(this.index_buffer_ref.expect.buffer);
        this.render_server_geometry.set_VertexLength(36);
        this.render_server_geometry.set_PrimitiveType(WebGPURenderStatePrimitiveType.Triangles);
        this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.PositionNormal, this.position_normal_buffer_ref.expect.buffer);
        this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Uv, this.uv_buffer_ref.expect.buffer);
        this.render_server_geometry.add_Surface(0, 6);
        this.render_server_geometry.add_Surface(6, 6);
        this.render_server_geometry.add_Surface(12, 6);
        this.render_server_geometry.add_Surface(18, 6);
        this.render_server_geometry.add_Surface(24, 6);
        this.render_server_geometry.add_Surface(30, 6);
        this.build();
    }

    public build() {
        const half_w = this.width / 2;
        const half_h = this.height / 2;
        const half_d = this.depth / 2;
        this.position_normal_buffer_ref.expect.set_Data(
            new Float32Array([
                // top
                half_w, half_h, half_d, 0, 1, 0,
                half_w, half_h, -half_d, 0, 1, 0,
                -half_w, half_h, half_d, 0, 1, 0,
                -half_w, half_h, -half_d, 0, 1, 0,
                // bottom
                half_w, -half_h, half_d, 0, -1, 0,
                half_w, -half_h, -half_d, 0, -1, 0,
                -half_w, -half_h, half_d, 0, -1, 0,
                -half_w, -half_h, -half_d, 0, -1, 0,
                // front
                half_w, -half_h, half_d, 0, 0, 1,
                half_w, half_h, half_d, 0, 0, 1,
                -half_w, -half_h, half_d, 0, 0, 1,
                -half_w, half_h, half_d, 0, 0, 1,
                // back
                half_w, -half_h, -half_d, 0, 0, -1,
                half_w, half_h, -half_d, 0, 0, -1,
                -half_w, -half_h, -half_d, 0, 0, -1,
                -half_w, half_h, -half_d, 0, 0, -1,
                // right
                half_w, -half_h, -half_d, 1, 0, 0,
                half_w, half_h, -half_d, 1, 0, 0,
                half_w, -half_h, half_d, 1, 0, 0,
                half_w, half_h, half_d, 1, 0, 0,
                // left
                -half_w, -half_h, -half_d, -1, 0, 0,
                -half_w, half_h, -half_d, -1, 0, 0,
                -half_w, -half_h, half_d, -1, 0, 0,
                -half_w, half_h, half_d, -1, 0, 0,
            ]), 0
        );
        this.position_normal_buffer_ref.expect.commit();
        this.uv_buffer_ref.expect.set_Data(
            new Float32Array([
                // top
                1, 0,
                1, 1,
                0, 0,
                0, 1,
                // bottom
                1, 1,
                1, 0,
                0, 1,
                0, 0,
                // front
                1, 0,
                1, 1,
                0, 0,
                0, 1,
                // back
                0, 0,
                0, 1,
                1, 0,
                1, 1,
                // right
                1, 0,
                1, 1,
                0, 0,
                0, 1,
                // left
                0, 0,
                0, 1,
                1, 0,
                1, 1,
            ]), 0
        );
        this.uv_buffer_ref.expect.commit();
        Geometry3DResource.$tmp_box3_for_bbox.min.set(-half_w, -half_h, -half_d);
        Geometry3DResource.$tmp_box3_for_bbox.max.set(half_w, half_h, half_d);
        this.render_server_geometry.set_BBox(Geometry3DResource.$tmp_box3_for_bbox);
    }

    protected dispose(): void {
        this.position_normal_buffer_ref.clear();
        this.uv_buffer_ref.clear();
        this.index_buffer_ref.clear();
        super.dispose();
    }
}