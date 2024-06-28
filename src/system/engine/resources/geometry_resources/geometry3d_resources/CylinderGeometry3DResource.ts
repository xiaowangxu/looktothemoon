import { Ref } from "@/system/utils/RefCounted";
import { WebGPURenderElementIndexBuffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementBuffer";
import { WebGPURenderElementVector2Buffer, WebGPURenderElementVector3Buffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementVectorBuffer";
import { RenderServer } from "../../../render_server/RenderServer";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderStatePrimitiveType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import { RenderServerGeometryAttributeLayoutBuffer } from "../../../render_server/geometry/RenderServerGeometryDefination";
import { Tau } from "@/system/fivepebble/Scalar";
import { Geometry3DResource } from "./Geometry3DResource";
import type { ResourceSetOptionAllAtOnce } from "../../Resource";

export type CylinderGeometry3DResourceOption = {
    top_radius?: number,
    bottom_radius?: number,
    height?: number,
    segments?: number,
}

export class CylinderGeometry3DResource extends Geometry3DResource implements ResourceSetOptionAllAtOnce<CylinderGeometry3DResourceOption> {

    private readonly position_normal_buffer_ref: Ref<WebGPURenderElementVector3Buffer> = new Ref();
    private readonly uv_buffer_ref: Ref<WebGPURenderElementVector2Buffer> = new Ref();
    private readonly index_buffer_ref: Ref<WebGPURenderElementIndexBuffer> = new Ref();

    protected _top_radius: number = 0.5;
    protected _bottom_radius: number = 0.5;
    protected _height: number = 1;
    protected _segments: number = 32;

    public get top_radius() { return this._top_radius; }
    public get bottom_radius() { return this._bottom_radius; }
    public get height() { return this._height; }
    public get segments() { return this._segments; }

    public set top_radius(radius: number) {
        radius = Math.max(radius, 0);
        if (this._top_radius !== radius) {
            this._top_radius = radius;
            this.build();
        }
    }
    public set bottom_radius(radius: number) {
        radius = Math.max(radius, 0);
        if (this._bottom_radius !== radius) {
            this._bottom_radius = radius;
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
    public set segments(segments: number) {
        segments = Math.max(Math.floor(segments), 3);
        if (this._segments !== segments) {
            this._segments = segments;
            this.build();
        }
    }

    public set option(option: CylinderGeometry3DResourceOption) {
        let changed = false;
        if (option.top_radius !== undefined) {
            const top_radius = Math.max(option.top_radius, 0);
            if (this._top_radius !== top_radius) {
                changed = true;
                this._top_radius = top_radius;
            }
        }
        if (option.bottom_radius !== undefined) {
            const bottom_radius = Math.max(option.bottom_radius, 0);
            if (this._bottom_radius !== bottom_radius) {
                changed = true;
                this._bottom_radius = bottom_radius;
            }
        }
        if (option.height !== undefined) {
            const height = Math.max(option.height, 0);
            if (this._height !== height) {
                changed = true;
                this._height = height;
            }
        }
        if (option.segments !== undefined) {
            const segments = Math.max(Math.floor(option.segments), 3);
            if (this._segments !== segments) {
                changed = true;
                this._segments = segments;
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
        const segments = this.segments;
        const top_radius = this.top_radius;
        const bottom_radius = this.bottom_radius;
        const height = this.height;
        const half_height = height / 2;

        const ring_count = segments + 1;
        const top_side_count = ring_count;
        const bottom_side_count = ring_count;
        const top_cap_count = ring_count;
        const bottom_cap_count = ring_count;
        const top_pole_count = segments;
        const bottom_pole_count = segments;

        const vertex_count = top_side_count + bottom_side_count + top_cap_count + bottom_cap_count + top_pole_count + bottom_pole_count;

        const position_normal_buffer = new WebGPURenderElementVector3Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count * 2);
        const uv_buffer = new WebGPURenderElementVector2Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count);

        // position / normal

        let offset = 0;
        let length = top_side_count * 3;
        const position_top_side_buffer = new Float32Array(position_normal_buffer.data.buffer, offset * 2, length * 2);

        offset += length * Float32Array.BYTES_PER_ELEMENT;
        length = bottom_side_count * 3
        const position_bottom_side_buffer = new Float32Array(position_normal_buffer.data.buffer, offset * 2, length * 2);

        offset += length * Float32Array.BYTES_PER_ELEMENT;
        length = top_cap_count * 3
        const position_top_cap_buffer = new Float32Array(position_normal_buffer.data.buffer, offset * 2, length * 2);

        offset += length * Float32Array.BYTES_PER_ELEMENT;
        length = bottom_cap_count * 3
        const position_bottom_cap_buffer = new Float32Array(position_normal_buffer.data.buffer, offset * 2, length * 2);

        offset += length * Float32Array.BYTES_PER_ELEMENT;
        length = top_pole_count * 3
        const position_top_pole_buffer = new Float32Array(position_normal_buffer.data.buffer, offset * 2, length * 2);

        offset += length * Float32Array.BYTES_PER_ELEMENT;
        length = bottom_pole_count * 3
        const position_bottom_pole_buffer = new Float32Array(position_normal_buffer.data.buffer, offset * 2, length * 2);

        // uv

        offset = 0;
        length = top_side_count * 2;
        const uv_top_side_buffer = new Float32Array(uv_buffer.data.buffer, offset, length);

        offset += length * Float32Array.BYTES_PER_ELEMENT;
        length = bottom_side_count * 2
        const uv_bottom_side_buffer = new Float32Array(uv_buffer.data.buffer, offset, length);

        offset += length * Float32Array.BYTES_PER_ELEMENT;
        length = top_cap_count * 2
        const uv_top_cap_buffer = new Float32Array(uv_buffer.data.buffer, offset, length);

        offset += length * Float32Array.BYTES_PER_ELEMENT;
        length = bottom_cap_count * 2
        const uv_bottom_cap_buffer = new Float32Array(uv_buffer.data.buffer, offset, length);

        offset += length * Float32Array.BYTES_PER_ELEMENT;
        length = top_pole_count * 2
        const uv_top_pole_buffer = new Float32Array(uv_buffer.data.buffer, offset, length);

        offset += length * Float32Array.BYTES_PER_ELEMENT;
        length = bottom_pole_count * 2
        const uv_bottom_pole_buffer = new Float32Array(uv_buffer.data.buffer, offset, length);

        const slope = height === 0 ? 0 : ((bottom_radius - top_radius) / height);
        const normal_length = 1 + slope * slope;

        for (let i = 0; i <= segments; i++) {
            const t = i / segments * Tau;
            const x = Math.cos(t);
            const z = Math.sin(t);

            const vec6_idx = i * 6;
            const vec2_idx = i * 2;

            position_top_cap_buffer[vec6_idx + 0] = position_top_side_buffer[vec6_idx + 0] = x * top_radius;
            position_top_cap_buffer[vec6_idx + 1] = position_top_side_buffer[vec6_idx + 1] = half_height;
            position_top_cap_buffer[vec6_idx + 2] = position_top_side_buffer[vec6_idx + 2] = z * top_radius;
            position_bottom_cap_buffer[vec6_idx + 0] = position_bottom_side_buffer[vec6_idx + 0] = x * bottom_radius;
            position_bottom_cap_buffer[vec6_idx + 1] = position_bottom_side_buffer[vec6_idx + 1] = -half_height;
            position_bottom_cap_buffer[vec6_idx + 2] = position_bottom_side_buffer[vec6_idx + 2] = z * bottom_radius;

            position_bottom_side_buffer[vec6_idx + 3] = position_top_side_buffer[vec6_idx + 3] = x / normal_length;
            position_bottom_side_buffer[vec6_idx + 4] = position_top_side_buffer[vec6_idx + 4] = slope / normal_length;
            position_bottom_side_buffer[vec6_idx + 5] = position_top_side_buffer[vec6_idx + 5] = z / normal_length;
            position_bottom_cap_buffer[vec6_idx + 3] = position_top_cap_buffer[vec6_idx + 3] = 0;
            position_bottom_cap_buffer[vec6_idx + 4] = position_top_cap_buffer[vec6_idx + 4] = 0;
            position_top_cap_buffer[vec6_idx + 5] = 1;
            position_bottom_cap_buffer[vec6_idx + 5] = -1;

            const u = 1 - i / segments;
            uv_top_side_buffer[vec2_idx + 0] = u;
            uv_top_side_buffer[vec2_idx + 1] = 1;
            uv_bottom_cap_buffer[vec2_idx + 0] = uv_top_cap_buffer[vec2_idx + 0] = uv_bottom_side_buffer[vec2_idx + 0] = u;
            uv_bottom_cap_buffer[vec2_idx + 1] = uv_top_cap_buffer[vec2_idx + 1] = uv_bottom_side_buffer[vec2_idx + 1] = 0;

            if (i < segments) {
                position_top_pole_buffer[vec6_idx + 0] = 0;
                position_top_pole_buffer[vec6_idx + 1] = half_height;
                position_top_pole_buffer[vec6_idx + 2] = 0;
                position_bottom_pole_buffer[vec6_idx + 0] = 0;
                position_bottom_pole_buffer[vec6_idx + 1] = -half_height;
                position_bottom_pole_buffer[vec6_idx + 2] = 0;

                position_bottom_pole_buffer[vec6_idx + 3] = position_top_pole_buffer[vec6_idx + 3] = 0;
                position_bottom_pole_buffer[vec6_idx + 4] = position_top_pole_buffer[vec6_idx + 4] = 0;
                position_top_pole_buffer[vec6_idx + 5] = 1;
                position_bottom_pole_buffer[vec6_idx + 5] = -1;

                uv_bottom_pole_buffer[vec2_idx + 0] = uv_top_pole_buffer[vec2_idx + 0] = u;
                uv_bottom_pole_buffer[vec2_idx + 1] = uv_top_pole_buffer[vec2_idx + 1] = 1;
            }
        }

        const side_index_count = segments * 6;
        const top_cap_indx_count = segments * 3;
        const bottom_cap_indx_count = segments * 3;
        const index_count = side_index_count + top_cap_indx_count + bottom_cap_indx_count;

        const index_buffer = new WebGPURenderElementIndexBuffer(RenderServer.render_state, WebGPURenderStateBufferType.Index, WebGPURenderStateBufferUsage.CopyDst, index_count);

        const index_side_buffer = new Uint32Array(index_buffer.data.buffer, 0, side_index_count);
        const index_top_cap_buffer = new Uint32Array(index_buffer.data.buffer, side_index_count * Uint32Array.BYTES_PER_ELEMENT, top_cap_indx_count);
        const index_bottom_cap_buffer = new Uint32Array(index_buffer.data.buffer, (side_index_count + top_cap_indx_count) * Uint32Array.BYTES_PER_ELEMENT, bottom_cap_indx_count);

        for (let i = 0; i < segments; i++) {
            const index_side_idx = i * 6;
            index_side_buffer[index_side_idx + 0] = i;
            index_side_buffer[index_side_idx + 4] = index_side_buffer[index_side_idx + 1] = i + 1;
            index_side_buffer[index_side_idx + 3] = index_side_buffer[index_side_idx + 2] = i + ring_count;
            index_side_buffer[index_side_idx + 5] = i + 1 + ring_count;

            const index_top_cap_idx = i * 3;
            index_top_cap_buffer[index_top_cap_idx + 0] = i + ring_count * 2;
            index_top_cap_buffer[index_top_cap_idx + 1] = i + ring_count * 4;
            index_top_cap_buffer[index_top_cap_idx + 2] = i + ring_count * 2 + 1;

            index_bottom_cap_buffer[index_top_cap_idx + 0] = i + ring_count * 3;
            index_bottom_cap_buffer[index_top_cap_idx + 1] = i + ring_count * 3 + 1;
            index_bottom_cap_buffer[index_top_cap_idx + 2] = i + ring_count * 4 + segments;
        }

        position_normal_buffer.commit(true);
        uv_buffer.commit(true);
        index_buffer.commit(true);

        // build geometry
        this.position_normal_buffer_ref.value = position_normal_buffer;
        this.uv_buffer_ref.value = uv_buffer;
        this.index_buffer_ref.value = index_buffer;

        this.render_server_geometry.clear_Geometry();
        this.render_server_geometry.set_IndexBuffer(this.index_buffer_ref.expect.buffer);
        this.render_server_geometry.set_VertexLength(index_count);
        this.render_server_geometry.set_PrimitiveType(WebGPURenderStatePrimitiveType.Triangles);
        this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.PositionNormal, this.position_normal_buffer_ref.expect.buffer);
        this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Uv, this.uv_buffer_ref.expect.buffer);

        this.render_server_geometry.add_Surface(0, segments * 6);
        this.render_server_geometry.add_Surface(segments * 6, segments * 3);
        this.render_server_geometry.add_Surface(segments * 9, segments * 3);

        const max_radius = Math.max(top_radius, bottom_radius);
        Geometry3DResource.$tmp_box3_for_bbox.min.set(-max_radius, -half_height, -max_radius);
        Geometry3DResource.$tmp_box3_for_bbox.max.set(max_radius, half_height, max_radius);
        this.render_server_geometry.set_BBox(Geometry3DResource.$tmp_box3_for_bbox);
    }

    protected dispose(): void {
        this.position_normal_buffer_ref.clear();
        this.uv_buffer_ref.clear();
        this.index_buffer_ref.clear();
        super.dispose();
    }
}