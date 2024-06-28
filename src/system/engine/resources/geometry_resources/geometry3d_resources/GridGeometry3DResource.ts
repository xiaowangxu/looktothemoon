
import { Ref } from "@/system/utils/RefCounted";
import { WebGPURenderElementIndexBuffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementBuffer";
import { WebGPURenderElementVector2Buffer, WebGPURenderElementVector3Buffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementVectorBuffer";
import { RenderServer } from "../../../render_server/RenderServer";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderStatePrimitiveType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import { RenderServerGeometryAttributeLayoutBuffer } from "../../../render_server/geometry/RenderServerGeometryDefination";
import { Geometry3DResource } from "./Geometry3DResource";
import type { ResourceSetOptionAllAtOnce } from "../../Resource";
import type { PlaneGeometry3DResourceOption } from "./PlaneGeometry3DResource";

export class GridGeometry3DResource extends Geometry3DResource implements ResourceSetOptionAllAtOnce<PlaneGeometry3DResourceOption> {

    private readonly position_buffer_ref: Ref<WebGPURenderElementVector3Buffer> = new Ref();
    private readonly normal_buffer_ref: Ref<WebGPURenderElementVector3Buffer> = new Ref();
    private readonly uv_buffer_ref: Ref<WebGPURenderElementVector2Buffer> = new Ref();

    protected _width: number = 10;
    protected _depth: number = 10;
    protected _width_segments: number = 10;
    protected _depth_segments: number = 10;

    public get width() { return this._width; }
    public get depth() { return this._depth; }
    public get width_segments() { return this._width_segments; }
    public get depth_segments() { return this._depth_segments; }

    public set width(width: number) {
        width = Math.max(width, 0);
        if (this._width !== width) {
            this._width = width;
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
    public set width_segments(width_segments: number) {
        width_segments = Math.max(Math.floor(width_segments), 1);
        if (this._width_segments !== width_segments) {
            this._width_segments = width_segments;
            this.build();
        }
    }
    public set depth_segments(depth_segments: number) {
        depth_segments = Math.max(Math.floor(depth_segments), 1);
        if (this._depth_segments !== depth_segments) {
            this._depth_segments = depth_segments;
            this.build();
        }
    }

    public set option(option: PlaneGeometry3DResourceOption) {
        let changed = false;
        if (option.width !== undefined) {
            const width = Math.max(option.width, 0);
            if (this._width !== width) {
                changed = true;
                this._width = width;
            }
        }
        if (option.depth !== undefined) {
            const depth = Math.max(option.depth, 0);
            if (this._depth !== depth) {
                changed = true;
                this._depth = depth;
            }
        }
        if (option.width_segments !== undefined) {
            const width_segments = Math.max(Math.floor(option.width_segments), 1);
            if (this._width_segments !== width_segments) {
                changed = true;
                this._width_segments = width_segments;
            }
        }
        if (option.depth_segments !== undefined) {
            const depth_segments = Math.max(Math.floor(option.depth_segments), 1);
            if (this._depth_segments !== depth_segments) {
                changed = true;
                this._depth_segments = depth_segments;
            }
        }
        if (changed) {
            this.build();
        }
    }

    constructor() {
        super();
        this.build();
    }

    public build() {
        const width = this.width;
        const depth = this.depth;
        const width_segments = this.width_segments;
        const depth_segments = this.depth_segments;

        const vertex_count = (width_segments + depth_segments + 2) * 2;

        const position_buffer = new WebGPURenderElementVector3Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count);
        const normal_buffer = new WebGPURenderElementVector3Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count);
        const uv_buffer = new WebGPURenderElementVector2Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count);

        const width_half = width / 2;
        const depth_half = depth / 2;

        const width_segments_1 = width_segments + 1;
        const depth_segments_1 = depth_segments + 1;

        const segment_width = width / width_segments;
        const segment_depth = depth / depth_segments;

        let vertex_idx = 0;
        for (let iy = 0; iy < depth_segments_1; iy++) {
            const y = iy * segment_depth - depth_half;
            const uv_y = iy / depth_segments;
            let vec3_idx = vertex_idx * 3;
            let vec2_idx = vertex_idx * 2;
            // position
            position_buffer.data[vec3_idx + 0] = -width_half;
            position_buffer.data[vec3_idx + 1] = 0;
            position_buffer.data[vec3_idx + 2] = -y;
            // normal
            normal_buffer.data[vec3_idx + 0] = 0;
            normal_buffer.data[vec3_idx + 1] = 1;
            normal_buffer.data[vec3_idx + 2] = 0;
            // uv
            uv_buffer.data[vec2_idx + 0] = 0;
            uv_buffer.data[vec2_idx + 1] = uv_y;
            vertex_idx++;
            vec3_idx = vertex_idx * 3;
            vec2_idx = vertex_idx * 2;
            // position
            position_buffer.data[vec3_idx + 0] = width_half;
            position_buffer.data[vec3_idx + 1] = 0;
            position_buffer.data[vec3_idx + 2] = -y;
            // normal
            normal_buffer.data[vec3_idx + 0] = 0;
            normal_buffer.data[vec3_idx + 1] = 1;
            normal_buffer.data[vec3_idx + 2] = 0;
            // uv
            uv_buffer.data[vec2_idx + 0] = 1;
            uv_buffer.data[vec2_idx + 1] = uv_y;
            vertex_idx++;
        }

        for (let ix = 0; ix < width_segments_1; ix++) {
            const x = ix * segment_width - width_half;
            const uv_x = 1 - ix / width_segments;
            let vec3_idx = vertex_idx * 3;
            let vec2_idx = vertex_idx * 2;
            // position
            position_buffer.data[vec3_idx + 0] = -x;
            position_buffer.data[vec3_idx + 1] = 0;
            position_buffer.data[vec3_idx + 2] = -depth_half;
            // normal
            normal_buffer.data[vec3_idx + 0] = 0;
            normal_buffer.data[vec3_idx + 1] = 1;
            normal_buffer.data[vec3_idx + 2] = 0;
            // uv
            uv_buffer.data[vec2_idx + 0] = uv_x;
            uv_buffer.data[vec2_idx + 1] = 1;
            vertex_idx++;
            vec3_idx = vertex_idx * 3;
            vec2_idx = vertex_idx * 2;
            // position
            position_buffer.data[vec3_idx + 0] = -x;
            position_buffer.data[vec3_idx + 1] = 0;
            position_buffer.data[vec3_idx + 2] = depth_half;
            // normal
            normal_buffer.data[vec3_idx + 0] = 0;
            normal_buffer.data[vec3_idx + 1] = 1;
            normal_buffer.data[vec3_idx + 2] = 0;
            // uv
            uv_buffer.data[vec2_idx + 0] = uv_x;
            uv_buffer.data[vec2_idx + 1] = 0;
            vertex_idx++;
        }

        position_buffer.commit(true);
        normal_buffer.commit(true);
        uv_buffer.commit(true);

        // build geometry
        this.position_buffer_ref.value = position_buffer;
        this.normal_buffer_ref.value = normal_buffer;
        this.uv_buffer_ref.value = uv_buffer;

        this.render_server_geometry.clear_Geometry();
        this.render_server_geometry.set_VertexLength(vertex_count);
        this.render_server_geometry.set_PrimitiveType(WebGPURenderStatePrimitiveType.Lines);
        this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Position, this.position_buffer_ref.expect.buffer);
        this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Normal, this.normal_buffer_ref.expect.buffer);
        this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Uv, this.uv_buffer_ref.expect.buffer);
        Geometry3DResource.$tmp_box3_for_bbox.min.set(-width_half, 0, -depth_half);
        Geometry3DResource.$tmp_box3_for_bbox.max.set(width_half, 0, depth_half);
        this.render_server_geometry.set_BBox(Geometry3DResource.$tmp_box3_for_bbox);
    }

    protected dispose(): void {
        this.position_buffer_ref.clear();
        this.normal_buffer_ref.clear();
        this.uv_buffer_ref.clear();
        super.dispose();
    }
}