import { Ref } from "@/system/utils/RefCounted";
import { WebGPURenderElementIndexBuffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementBuffer";
import { WebGPURenderElementVector2Buffer, WebGPURenderElementVector3Buffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementVectorBuffer";
import { RenderServer } from "../../../render_server/RenderServer";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderStatePrimitiveType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import { RenderServerGeometryAttributeLayoutBuffer } from "../../../render_server/geometry/RenderServerGeometryDefination";
import { Geometry3DResource } from "./Geometry3DResource";
import type { ResourceSetOptionAllAtOnce } from "../../Resource";

export enum PlaneGeometryDirection {
    YPositive, YNegative,
    XPositive, XNegative,
    ZPositive, ZNegative,
}

export type PlaneGeometry3DResourceOption = {
    width?: number,
    depth?: number,
    width_segments?: number,
    depth_segments?: number,
    direction?: PlaneGeometryDirection,
}

export class PlaneGeometry3DResource extends Geometry3DResource implements ResourceSetOptionAllAtOnce<PlaneGeometry3DResourceOption> {

    private readonly position_normal_buffer_ref: Ref<WebGPURenderElementVector3Buffer> = new Ref();
    private readonly uv_buffer_ref: Ref<WebGPURenderElementVector2Buffer> = new Ref();
    private readonly index_buffer_ref: Ref<WebGPURenderElementIndexBuffer> = new Ref();

    protected _width: number = 1;
    protected _depth: number = 1;
    protected _width_segments: number = 1;
    protected _depth_segments: number = 1;
    protected _direction: PlaneGeometryDirection = PlaneGeometryDirection.YPositive;

    public get width() { return this._width; }
    public get depth() { return this._depth; }
    public get width_segments() { return this._width_segments; }
    public get depth_segments() { return this._depth_segments; }
    public get direction() { return this._direction; }

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
    public set direction(direction: PlaneGeometryDirection) {
        if (this._direction !== direction) {
            this._direction = direction;
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
        if (option.direction !== undefined) {
            if (this._direction !== option.direction) {
                changed = true;
                this._direction = option.direction;
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
        const direction = this.direction;

        const vertex_count = (width_segments + 1) * (depth_segments + 1);

        const position_normal_buffer = new WebGPURenderElementVector3Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count * 2);
        const uv_buffer = new WebGPURenderElementVector2Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count);

        const width_half = width / 2;
        const depth_half = depth / 2;

        const width_segments_1 = width_segments + 1;
        const depth_segments_1 = depth_segments + 1;

        const segment_width = width / width_segments;
        const segment_depth = depth / depth_segments;

        const normal_negate = direction === PlaneGeometryDirection.XNegative || direction === PlaneGeometryDirection.YNegative || direction === PlaneGeometryDirection.ZNegative;

        let vertex_idx = 0;
        for (let iy = 0; iy < depth_segments_1; iy++) {
            const y = iy * segment_depth - depth_half;
            for (let ix = 0; ix < width_segments_1; ix++) {
                const x = ix * segment_width - width_half;
                const vec6_idx = vertex_idx * 6;
                const vec2_idx = vertex_idx * 2;
                // position
                switch (direction) {
                    case PlaneGeometryDirection.YPositive:
                    case PlaneGeometryDirection.YNegative: {
                        position_normal_buffer.data[vec6_idx + 0] = x;
                        position_normal_buffer.data[vec6_idx + 1] = 0;
                        position_normal_buffer.data[vec6_idx + 2] = -y;
                        break;
                    }
                    case PlaneGeometryDirection.XPositive:
                    case PlaneGeometryDirection.XNegative: {
                        position_normal_buffer.data[vec6_idx + 0] = 0;
                        position_normal_buffer.data[vec6_idx + 1] = -y;
                        position_normal_buffer.data[vec6_idx + 2] = x;
                        break;
                    }
                    case PlaneGeometryDirection.ZPositive:
                    case PlaneGeometryDirection.ZNegative: {
                        position_normal_buffer.data[vec6_idx + 0] = x;
                        position_normal_buffer.data[vec6_idx + 1] = -y;
                        position_normal_buffer.data[vec6_idx + 2] = 0;
                        break;
                    }
                }
                // normal
                switch (direction) {
                    case PlaneGeometryDirection.YPositive:
                    case PlaneGeometryDirection.YNegative: {
                        position_normal_buffer.data[vec6_idx + 3] = normal_negate ? 0 : 0;
                        position_normal_buffer.data[vec6_idx + 4] = normal_negate ? -1 : 1;
                        position_normal_buffer.data[vec6_idx + 5] = normal_negate ? 0 : 0;
                        break;
                    }
                    case PlaneGeometryDirection.XPositive:
                    case PlaneGeometryDirection.XNegative: {
                        position_normal_buffer.data[vec6_idx + 3] = normal_negate ? -1 : 1;
                        position_normal_buffer.data[vec6_idx + 4] = normal_negate ? 0 : 0;
                        position_normal_buffer.data[vec6_idx + 5] = normal_negate ? 0 : 0;
                        break;
                    }
                    case PlaneGeometryDirection.ZPositive:
                    case PlaneGeometryDirection.ZNegative: {
                        position_normal_buffer.data[vec6_idx + 3] = normal_negate ? 0 : 0;
                        position_normal_buffer.data[vec6_idx + 4] = normal_negate ? 0 : 0;
                        position_normal_buffer.data[vec6_idx + 5] = normal_negate ? -1 : 1;
                        break;
                    }
                }
                // uv
                switch (direction) {
                    case PlaneGeometryDirection.YPositive: {
                        uv_buffer.data[vec2_idx + 0] = (ix / width_segments);
                        uv_buffer.data[vec2_idx + 1] = iy / depth_segments;
                        break;
                    }
                    case PlaneGeometryDirection.XPositive:
                    case PlaneGeometryDirection.ZNegative: {
                        uv_buffer.data[vec2_idx + 0] = 1 - (ix / width_segments);
                        uv_buffer.data[vec2_idx + 1] = 1 - (iy / depth_segments);
                        break;
                    }
                    case PlaneGeometryDirection.ZPositive:
                        {
                            uv_buffer.data[vec2_idx + 0] = ix / width_segments;
                            uv_buffer.data[vec2_idx + 1] = 1 - (iy / depth_segments);
                            break;
                        }
                    case PlaneGeometryDirection.YNegative:
                    case PlaneGeometryDirection.XNegative: {
                        uv_buffer.data[vec2_idx + 0] = ix / width_segments;
                        uv_buffer.data[vec2_idx + 1] = 1 - (iy / depth_segments);
                        break;
                    }
                }
                vertex_idx++;
            }
        }

        const index_count = (width_segments * depth_segments) * 6;

        const index_buffer = new WebGPURenderElementIndexBuffer(RenderServer.render_state, WebGPURenderStateBufferType.Index, WebGPURenderStateBufferUsage.CopyDst, index_count);

        const clockwise = direction === PlaneGeometryDirection.XNegative || direction === PlaneGeometryDirection.YNegative || direction === PlaneGeometryDirection.ZPositive;

        let index_idx = 0;
        for (let iy = 0; iy < depth_segments; iy++) {
            for (let ix = 0; ix < width_segments; ix++) {
                const a = ix + width_segments_1 * iy;
                const b = ix + width_segments_1 * (iy + 1);
                const c = (ix + 1) + width_segments_1 * (iy + 1);
                const d = (ix + 1) + width_segments_1 * iy;
                const idx = index_idx * 6;
                if (clockwise) {
                    index_buffer.data[idx + 0] = a;
                    index_buffer.data[idx + 1] = b;
                    index_buffer.data[idx + 2] = d;
                    index_buffer.data[idx + 3] = b;
                    index_buffer.data[idx + 4] = c;
                    index_buffer.data[idx + 5] = d;
                }
                else {
                    index_buffer.data[idx + 0] = a;
                    index_buffer.data[idx + 1] = d;
                    index_buffer.data[idx + 2] = b;
                    index_buffer.data[idx + 3] = b;
                    index_buffer.data[idx + 4] = d;
                    index_buffer.data[idx + 5] = c;
                }
                index_idx++;
            }
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
        Geometry3DResource.$tmp_box3_for_bbox.min.set(-width_half, 0, -depth_half);
        Geometry3DResource.$tmp_box3_for_bbox.max.set(width_half, 0, depth_half);
        this.render_server_geometry.set_BBox(Geometry3DResource.$tmp_box3_for_bbox);
    }

    protected dispose(): void {
        this.position_normal_buffer_ref.clear();
        this.uv_buffer_ref.clear();
        this.index_buffer_ref.clear();
        super.dispose();
    }
}