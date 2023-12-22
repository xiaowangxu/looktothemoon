import { GeometryResource } from "./GeometryResource";
import { RenderServer } from "../../render_server/RenderServer";
import { RenderDeviceIndexAttributeBuffer, RenderDeviceVector2AttributeBuffer, RenderDeviceVector3AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { Vector3, vec3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { type Vector2, vec2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { box3 } from "@/system/fivepebble/geometries/Box3";
import { Tau } from '@/system/fivepebble/Scalar';

export class BoxGeometryResource extends GeometryResource {
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
            this.update_Geometry();
        }
    }
    public set height(height: number) {
        height = Math.max(height, 0);
        if (this._height !== height) {
            this._height = height;
            this.update_Geometry();
        }
    }
    public set depth(depth: number) {
        depth = Math.max(depth, 0);
        if (this._depth !== depth) {
            this._depth = depth;
            this.update_Geometry();
        }
    }

    constructor() {
        super();
        this.update_Geometry();
    }

    public set_Parameter(width?: number, height?: number, depth?: number) {
        let changed = false;
        if (width !== undefined) {
            width = Math.max(width, 0);
            if (this._width !== width) {
                changed ||= true;
                this._width = width;
            }
        }
        if (height !== undefined) {
            height = Math.max(height, 0);
            if (this._height !== height) {
                changed ||= true;
                this._height = height;
            }
        }
        if (depth !== undefined) {
            depth = Math.max(depth, 0);
            if (this._depth !== depth) {
                changed ||= true;
                this._depth = depth;
            }
        }
        if (changed) this.update_Geometry();
    }

    public update_Geometry() {
        const half_w = this.width / 2;
        const half_h = this.height / 2;
        const half_d = this.depth / 2;
        const position_buffer = new RenderDeviceVector3AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw,
            [
                // top
                vec3(half_w, half_h, half_d),
                vec3(half_w, half_h, -half_d),
                vec3(-half_w, half_h, half_d),
                vec3(-half_w, half_h, -half_d),
                // bottom
                vec3(half_w, -half_h, half_d),
                vec3(half_w, -half_h, -half_d),
                vec3(-half_w, -half_h, half_d),
                vec3(-half_w, -half_h, -half_d),
                // front
                vec3(half_w, -half_h, half_d),
                vec3(half_w, half_h, half_d),
                vec3(-half_w, -half_h, half_d),
                vec3(-half_w, half_h, half_d),
                // back
                vec3(half_w, -half_h, -half_d),
                vec3(half_w, half_h, -half_d),
                vec3(-half_w, -half_h, -half_d),
                vec3(-half_w, half_h, -half_d),
                // right
                vec3(half_w, -half_h, -half_d),
                vec3(half_w, half_h, -half_d),
                vec3(half_w, -half_h, half_d),
                vec3(half_w, half_h, half_d),
                // left
                vec3(-half_w, -half_h, -half_d),
                vec3(-half_w, half_h, -half_d),
                vec3(-half_w, -half_h, half_d),
                vec3(-half_w, half_h, half_d),
            ]);
        const normal_buffer = new RenderDeviceVector3AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw,
            [
                // top
                vec3(0, 1, 0),
                vec3(0, 1, 0),
                vec3(0, 1, 0),
                vec3(0, 1, 0),
                // bottom
                vec3(0, -1, 0),
                vec3(0, -1, 0),
                vec3(0, -1, 0),
                vec3(0, -1, 0),
                // front
                vec3(0, 0, 1),
                vec3(0, 0, 1),
                vec3(0, 0, 1),
                vec3(0, 0, 1),
                // back
                vec3(0, 0, -1),
                vec3(0, 0, -1),
                vec3(0, 0, -1),
                vec3(0, 0, -1),
                // right
                vec3(1, 0, 0),
                vec3(1, 0, 0),
                vec3(1, 0, 0),
                vec3(1, 0, 0),
                // left
                vec3(-1, 0, 0),
                vec3(-1, 0, 0),
                vec3(-1, 0, 0),
                vec3(-1, 0, 0),
            ]);
        const uv_buffer = new RenderDeviceVector2AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw,
            [
                // top
                vec2(1, 0),
                vec2(1, 1),
                vec2(0, 0),
                vec2(0, 1),
                // bottom
                vec2(1, 1),
                vec2(1, 0),
                vec2(0, 1),
                vec2(0, 0),
                // front
                vec2(1, 0),
                vec2(1, 1),
                vec2(0, 0),
                vec2(0, 1),
                // back
                vec2(1, 1),
                vec2(1, 0),
                vec2(0, 1),
                vec2(0, 0),
                // right
                vec2(1, 0),
                vec2(1, 1),
                vec2(0, 0),
                vec2(0, 1),
                // left
                vec2(0, 0),
                vec2(0, 1),
                vec2(1, 0),
                vec2(1, 1),
            ]);
        const index_buffer = new RenderDeviceIndexAttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw,
            [
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
            ]);
        this.geometry.set_Geometry(
            RenderStatePrimitiveType.Triangles,
            {
                position: position_buffer,
                normal: normal_buffer,
                uv: uv_buffer,
            },
            index_buffer,
            36,
            box3(vec3(-half_w, -half_h, -half_d), vec3(half_w, half_h, half_d))
        );
        this.geometry.add_Surface(0 * index_buffer.per_element_byte_count, 6);
        this.geometry.add_Surface(6 * index_buffer.per_element_byte_count, 6);
        this.geometry.add_Surface(12 * index_buffer.per_element_byte_count, 6);
        this.geometry.add_Surface(18 * index_buffer.per_element_byte_count, 6);
        this.geometry.add_Surface(24 * index_buffer.per_element_byte_count, 6);
        this.geometry.add_Surface(30 * index_buffer.per_element_byte_count, 6);
    }
}

export class TorusGeometryResource extends GeometryResource {
    protected _radius: number = 1;
    protected _tube_radius: number = 0.25;
    protected _segments: number = 32;
    protected _tube_segments: number = 32;

    public get radius() { return this._radius; }
    public get tube_radius() { return this._tube_radius; }
    public get segments() { return this._segments; }
    public get tube_segments() { return this._tube_segments; }

    public set radius(radius: number) {
        radius = Math.max(radius, 0);
        if (this._radius !== radius) {
            this._radius = radius;
            this.update_Geometry();
        }
    }
    public set tube_radius(tube_radius: number) {
        tube_radius = Math.max(tube_radius, 0);
        if (this._tube_radius !== tube_radius) {
            this._tube_radius = tube_radius;
            this.update_Geometry();
        }
    }
    public set segments(segments: number) {
        segments = Math.max(Math.floor(segments), 3);
        if (this._segments !== segments) {
            this._segments = segments;
            this.update_Geometry();
        }
    }
    public set tube_segments(tube_segments: number) {
        tube_segments = Math.max(Math.floor(tube_segments), 3);
        if (this._tube_segments !== tube_segments) {
            this._tube_segments = tube_segments;
            this.update_Geometry();
        }
    }

    constructor() {
        super();
        this.update_Geometry();
    }

    public set_Parameter(radius?: number, tube_radius?: number, segments?: number, tube_segments?: number) {
        let changed = false;
        if (radius !== undefined) {
            radius = Math.max(radius, 0);
            if (this._radius !== radius) {
                changed ||= true;
                this._radius = radius;
            }
        }
        if (tube_radius !== undefined) {
            tube_radius = Math.max(tube_radius, 0);
            if (this._tube_radius !== tube_radius) {
                changed ||= true;
                this._tube_radius = tube_radius;
            }
        }
        if (segments !== undefined) {
            segments = Math.max(Math.floor(segments), 3);
            if (this._segments !== segments) {
                changed ||= true;
                this._segments = segments;
            }
        }
        if (tube_segments !== undefined) {
            tube_segments = Math.max(Math.floor(tube_segments), 3);
            if (this._tube_segments !== tube_segments) {
                changed ||= true;
                this._tube_segments = tube_segments;
            }
        }
        if (changed) this.update_Geometry();
    }

    public update_Geometry() {
        const radius = this.radius;
        const tube_radius = this.tube_radius;
        const segments = this.segments;
        const tube_segments = this.tube_segments;
        const arc = Tau;

        const vertex_count = (segments + 1) * (tube_segments + 1);

        const position_buffer = new RenderDeviceVector3AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, vertex_count);
        const normal_buffer = new RenderDeviceVector3AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, vertex_count);
        const uv_buffer = new RenderDeviceVector2AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, vertex_count);

        for (let j = 0; j <= segments; j++) {
            for (let i = 0; i <= tube_segments; i++) {
                const idx = j * (tube_segments + 1) + i;
                const u = i / tube_segments * arc;
                const v = j / segments * Math.PI * 2;
                // vertex
                const vertex = vec3(
                    (radius + tube_radius * Math.cos(v)) * Math.cos(u),
                    (radius + tube_radius * Math.cos(v)) * Math.sin(u),
                    tube_radius * Math.sin(v),
                );
                position_buffer.data[idx * 3 + 0] = vertex.x;
                position_buffer.data[idx * 3 + 1] = vertex.y;
                position_buffer.data[idx * 3 + 2] = vertex.z;
                // normal
                const center = vec3(radius * Math.cos(u), radius * Math.sin(u), 0);
                const normal = center.direction_to(vertex);
                normal_buffer.data[idx * 3 + 0] = normal.x;
                normal_buffer.data[idx * 3 + 1] = normal.y;
                normal_buffer.data[idx * 3 + 2] = normal.z;
                // uv
                uv_buffer.data[idx * 2 + 0] = i / tube_segments;
                uv_buffer.data[idx * 2 + 1] = j / segments;
            }
        }

        const index_count = segments * tube_segments * 6;

        const index_buffer = new RenderDeviceIndexAttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, index_count);

        // generate indices
        for (let j = 1; j <= segments; j++) {
            for (let i = 1; i <= tube_segments; i++) {
                const idx = (j - 1) * tube_segments + (i - 1);
                // indices
                const a = (tube_segments + 1) * j + i - 1;
                const b = (tube_segments + 1) * (j - 1) + i - 1;
                const c = (tube_segments + 1) * (j - 1) + i;
                const d = (tube_segments + 1) * j + i;
                // faces
                index_buffer.data[idx * 6 + 0] = a;
                index_buffer.data[idx * 6 + 1] = b;
                index_buffer.data[idx * 6 + 2] = d;
                index_buffer.data[idx * 6 + 3] = b;
                index_buffer.data[idx * 6 + 4] = c;
                index_buffer.data[idx * 6 + 5] = d;
            }
        }

        position_buffer.commit_Data();
        normal_buffer.commit_Data();
        uv_buffer.commit_Data();
        index_buffer.commit_Data();

        // build geometry

        const outer_radius = radius + tube_radius;

        this.geometry.set_Geometry(
            RenderStatePrimitiveType.Triangles,
            {
                position: position_buffer,
                normal: normal_buffer,
                uv: uv_buffer,
            },
            index_buffer,
            index_count,
            box3(
                vec3(-outer_radius, -outer_radius, -tube_radius),
                vec3(outer_radius, outer_radius, tube_radius),
            )
        );
    }
}

export class CylinderGeometryResource extends GeometryResource {
    protected _radius: number = 0.5;
    protected _height: number = 1;
    protected _segments: number = 32;

    public get radius() { return this._radius; }
    public get height() { return this._height; }
    public get segments() { return this._segments; }

    public set radius(radius: number) {
        radius = Math.max(radius, 0);
        if (this._radius !== radius) {
            this._radius = radius;
            this.update_Geometry();
        }
    }
    public set height(height: number) {
        height = Math.max(height, 0);
        if (this._height !== height) {
            this._height = height;
            this.update_Geometry();
        }
    }
    public set segments(segments: number) {
        segments = Math.max(Math.floor(segments), 3);
        if (this._segments !== segments) {
            this._segments = segments;
            this.update_Geometry();
        }
    }

    constructor() {
        super();
        this.update_Geometry();
    }

    public set_Parameter(radius?: number, height?: number, segments?: number) {
        let changed = false;
        if (radius !== undefined) {
            radius = Math.max(radius, 0);
            if (this._radius !== radius) {
                changed ||= true;
                this._radius = radius;
            }
        }
        if (height !== undefined) {
            height = Math.max(height, 0);
            if (this._height !== height) {
                changed ||= true;
                this._height = height;
            }
        }
        if (segments !== undefined) {
            segments = Math.max(Math.floor(segments), 3);
            if (this._segments !== segments) {
                changed ||= true;
                this._segments = segments;
            }
        }
        if (changed) this.update_Geometry();
    }

    public update_Geometry() {
        const segments = this.segments;
        const radius = this.radius;
        const height = this.height;
        const half_height = height / 2;

        const ring_count = segments + 1;
        const vertex_count = ring_count * 2 * 2 + 2;

        const position_buffer = new RenderDeviceVector3AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, vertex_count);
        const normal_buffer = new RenderDeviceVector3AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, vertex_count);
        const uv_buffer = new RenderDeviceVector2AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, vertex_count);

        for (let i = 0; i <= segments; i++) {
            const t = i / segments * Tau;
            const x = Math.cos(t);
            const z = Math.sin(t);

            const top_vec3_idx = i * 3;
            const bottom_vec3_idx = (i + ring_count) * 3;

            // position
            position_buffer.data[top_vec3_idx + 0] = x * radius;
            position_buffer.data[top_vec3_idx + 1] = half_height;
            position_buffer.data[top_vec3_idx + 2] = z * radius;
            position_buffer.data[bottom_vec3_idx + 0] = x * radius;
            position_buffer.data[bottom_vec3_idx + 1] = -half_height;
            position_buffer.data[bottom_vec3_idx + 2] = z * radius;
            // normal
            normal_buffer.data[top_vec3_idx + 0] = x;
            normal_buffer.data[top_vec3_idx + 1] = 0;
            normal_buffer.data[top_vec3_idx + 2] = z;
            normal_buffer.data[bottom_vec3_idx + 0] = x;
            normal_buffer.data[bottom_vec3_idx + 1] = 0;
            normal_buffer.data[bottom_vec3_idx + 2] = z;

            const top_cap_vec3_idx = (i + ring_count * 2) * 3;
            const bottom_cap_vec3_idx = (i + ring_count * 3) * 3;

            normal_buffer.data[top_cap_vec3_idx + 0] = 0;
            normal_buffer.data[top_cap_vec3_idx + 1] = 1;
            normal_buffer.data[top_cap_vec3_idx + 2] = 0;
            normal_buffer.data[bottom_cap_vec3_idx + 0] = 0;
            normal_buffer.data[bottom_cap_vec3_idx + 1] = -1;
            normal_buffer.data[bottom_cap_vec3_idx + 2] = 0;
            // uv
            const u = 1 - i / segments;
            uv_buffer.data[i * 2 + 0] = u;
            uv_buffer.data[i * 2 + 1] = 1;
            uv_buffer.data[(i + ring_count) * 2 + 0] = u;
            uv_buffer.data[(i + ring_count) * 2 + 1] = 0;
        }

        // set top / bottom cap
        const mid_pole_idx = ring_count * 4;

        const mid_pole_vec3_idx = mid_pole_idx * 3;
        const mid_pole_vec2_idx = mid_pole_idx * 2;

        position_buffer.data[mid_pole_vec3_idx + 0] = 0;
        position_buffer.data[mid_pole_vec3_idx + 1] = half_height;
        position_buffer.data[mid_pole_vec3_idx + 2] = 0;
        position_buffer.data[mid_pole_vec3_idx + 3] = 0;
        position_buffer.data[mid_pole_vec3_idx + 4] = -half_height;
        position_buffer.data[mid_pole_vec3_idx + 5] = 0;
        normal_buffer.data[mid_pole_vec3_idx + 0] = 0;
        normal_buffer.data[mid_pole_vec3_idx + 1] = 1;
        normal_buffer.data[mid_pole_vec3_idx + 2] = 0;
        normal_buffer.data[mid_pole_vec3_idx + 3] = 0;
        normal_buffer.data[mid_pole_vec3_idx + 4] = -1;
        normal_buffer.data[mid_pole_vec3_idx + 5] = 0;
        uv_buffer.data[mid_pole_vec2_idx + 0] = 0;
        uv_buffer.data[mid_pole_vec2_idx + 1] = 1;
        uv_buffer.data[mid_pole_vec2_idx + 2] = 0;
        uv_buffer.data[mid_pole_vec2_idx + 3] = 1;

        const ring_vec3_com_count = ring_count * 3;
        const ring_vec2_com_count = ring_count * 2;

        position_buffer.data.set(new Float32Array(position_buffer.data.buffer, 0, ring_vec3_com_count), ring_vec2_com_count * 3);
        position_buffer.data.set(new Float32Array(position_buffer.data.buffer, ring_vec3_com_count * Float32Array.BYTES_PER_ELEMENT, ring_vec3_com_count), ring_vec3_com_count * 3);
        uv_buffer.data.set(new Float32Array(uv_buffer.data.buffer, 0, ring_vec2_com_count), ring_vec2_com_count * 2);
        uv_buffer.data.set(new Float32Array(uv_buffer.data.buffer, ring_vec2_com_count * Float32Array.BYTES_PER_ELEMENT, ring_vec2_com_count), ring_vec3_com_count * 2);

        const index_count = segments * 6 * 2;

        const index_buffer = new RenderDeviceIndexAttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, index_count);

        for (let i = 0; i < segments; i++) {
            const top_idx = i;
            const bottom_idx = top_idx + ring_count;
            const top_next_idx = top_idx + 1;
            const bottom_next_idx = top_next_idx + ring_count;

            const idx = i * 6;

            index_buffer.data[idx + 0] = bottom_idx;
            index_buffer.data[idx + 1] = top_idx;
            index_buffer.data[idx + 2] = bottom_next_idx;
            index_buffer.data[idx + 3] = bottom_next_idx;
            index_buffer.data[idx + 4] = top_idx;
            index_buffer.data[idx + 5] = top_next_idx;
        }

        // cap

        for (let i = 0; i < segments; i++) {
            const top_idx = i + ring_count * 2;
            const bottom_idx = top_idx + ring_count;
            const top_next_idx = top_idx + 1;
            const bottom_next_idx = top_next_idx + ring_count;

            const idx = segments * 6 + i * 3;

            index_buffer.data[idx + 0] = top_next_idx;
            index_buffer.data[idx + 1] = top_idx;
            index_buffer.data[idx + 2] = mid_pole_idx;
            index_buffer.data[idx + segments * 3 + 0] = bottom_idx;
            index_buffer.data[idx + segments * 3 + 1] = bottom_next_idx;
            index_buffer.data[idx + segments * 3 + 2] = mid_pole_idx + 1;
        }

        position_buffer.commit_Data();
        normal_buffer.commit_Data();
        uv_buffer.commit_Data();
        index_buffer.commit_Data();

        this.geometry.set_Geometry(
            RenderStatePrimitiveType.Triangles,
            {
                position: position_buffer,
                normal: normal_buffer,
                uv: uv_buffer,
            },
            index_buffer,
            index_count,
            box3(
                vec3(-radius, -half_height, -radius),
                vec3(radius, half_height, radius),
            )
        );
        this.geometry.add_Surface(0, segments * 6);
        this.geometry.add_Surface(segments * 6 * index_buffer.per_element_byte_count, segments * 3);
        this.geometry.add_Surface(segments * 9 * index_buffer.per_element_byte_count, segments * 3);
    }
}