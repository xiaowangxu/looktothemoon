import { GeometryResource } from "../GeometryResource";
import { RenderDeviceIndexAttributeBuffer, RenderDeviceVector2AttributeBuffer, RenderDeviceVector3AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/render_state/RenderState";
import { Pi, Tau, clamp } from '@/system/fivepebble/Scalar';
import type { ClassReader, ClassWriter } from "../../../classes/saver_loader/ClassWriterReader";
import type { Config } from "../../../ConfiguredObject";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Box3 } from "@/system/fivepebble/geometries/Box3";

export abstract class PrimitiveGeometryResource extends GeometryResource {

    static readonly $tmp_box3_for_bbox_0 = Box3.new;

    constructor(config: Config) {
        super(config);
        this.geometry_ref.value = this.render_server.create_Geometry();
    }

    public abstract build(): void;
}

export class TorusGeometryResource extends PrimitiveGeometryResource {
    public static class_name: string = 'TorusGeometryResource';

    protected _radius: number = 0.5;
    protected _tube_radius: number = 0.125;
    protected _segments: number = 32;
    protected _tube_segments: number = 32;
    protected _theta: number = Tau;

    public get radius() { return this._radius; }
    public get tube_radius() { return this._tube_radius; }
    public get segments() { return this._segments; }
    public get tube_segments() { return this._tube_segments; }
    public get theta() { return this._theta; }

    public set radius(radius: number) {
        radius = Math.max(radius, 0);
        if (this._radius !== radius) {
            this._radius = radius;
        }
    }
    public set tube_radius(tube_radius: number) {
        tube_radius = Math.max(tube_radius, 0);
        if (this._tube_radius !== tube_radius) {
            this._tube_radius = tube_radius;
        }
    }
    public set segments(segments: number) {
        segments = Math.max(Math.floor(segments), 3);
        if (this._segments !== segments) {
            this._segments = segments;
        }
    }
    public set tube_segments(tube_segments: number) {
        tube_segments = Math.max(Math.floor(tube_segments), 3);
        if (this._tube_segments !== tube_segments) {
            this._tube_segments = tube_segments;
        }
    }
    public set theta(theta: number) {
        theta = clamp(theta, 0, Tau);
        if (this._theta !== theta) {
            this._theta = theta;
        }
    }

    public build() {
        const radius = this.radius;
        const tube_radius = this.tube_radius;
        const segments = this.segments;
        const tube_segments = this.tube_segments;
        const theta = this.theta;

        const vertex_count = (segments + 1) * (tube_segments + 1);

        const position_buffer = new RenderDeviceVector3AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, vertex_count);
        const normal_buffer = new RenderDeviceVector3AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, vertex_count);
        const uv_buffer = new RenderDeviceVector2AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, vertex_count);

        for (let j = 0; j <= segments; j++) {
            for (let i = 0; i <= tube_segments; i++) {
                const idx = j * (tube_segments + 1) + i;
                const u = i / tube_segments * theta;
                const v = j / segments * Pi * 2;
                // vertex
                const vertex = Vector3.create(
                    (radius + tube_radius * Math.cos(v)) * Math.cos(u),
                    -tube_radius * Math.sin(v),
                    (radius + tube_radius * Math.cos(v)) * Math.sin(u),
                );
                position_buffer.data[idx * 3 + 0] = vertex.x;
                position_buffer.data[idx * 3 + 1] = vertex.y;
                position_buffer.data[idx * 3 + 2] = vertex.z;
                // normal
                const center = Vector3.create(radius * Math.cos(u), 0, radius * Math.sin(u));
                const normal = center.direction_to(center, vertex);
                normal_buffer.data[idx * 3 + 0] = normal.x;
                normal_buffer.data[idx * 3 + 1] = normal.y;
                normal_buffer.data[idx * 3 + 2] = normal.z;
                // uv
                uv_buffer.data[idx * 2 + 0] = i / tube_segments;
                uv_buffer.data[idx * 2 + 1] = j / segments;
            }
        }

        const index_count = segments * tube_segments * 6;

        const index_buffer = new RenderDeviceIndexAttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, index_count);

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
            Box3.create(
                Vector3.create(-outer_radius, -tube_radius, -outer_radius),
                Vector3.create(outer_radius, tube_radius, outer_radius),
            )
        );
    }

    // save / load

    public dump(writer: ClassWriter): void {
        writer.property('radius', this.radius);
        writer.property('tube_radius', this.tube_radius);
        writer.property('segments', this.segments);
        writer.property('tube_segments', this.tube_segments);
        writer.property('theta', this.theta);
    }

    public load(reader: ClassReader): void {
        this.radius = reader.get<number>('radius') ?? 0.5;
        this.tube_radius = reader.get<number>('tube_radius') ?? 0.125;
        this.segments = reader.get<number>('segments') ?? 32;
        this.tube_segments = reader.get<number>('tube_segments') ?? 32;
        this.theta = reader.get<number>('theta') ?? Tau;
        this.build();
    }
}

export class CylinderGeometryResource extends PrimitiveGeometryResource {
    public static class_name: string = 'CylinderGeometryResource';

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
        }
    }
    public set bottom_radius(radius: number) {
        radius = Math.max(radius, 0);
        if (this._bottom_radius !== radius) {
            this._bottom_radius = radius;
        }
    }
    public set height(height: number) {
        height = Math.max(height, 0);
        if (this._height !== height) {
            this._height = height;
        }
    }
    public set segments(segments: number) {
        segments = Math.max(Math.floor(segments), 3);
        if (this._segments !== segments) {
            this._segments = segments;
        }
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

        const position_buffer = new RenderDeviceVector3AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, vertex_count);
        const normal_buffer = new RenderDeviceVector3AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, vertex_count);
        const uv_buffer = new RenderDeviceVector2AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, vertex_count);

        // position / normal

        let offset = 0;
        let length = top_side_count * 3;
        const position_top_side_buffer = new Float32Array(position_buffer.data.buffer, offset, length);
        const normal_top_side_buffer = new Float32Array(normal_buffer.data.buffer, offset, length);

        offset += length * Float32Array.BYTES_PER_ELEMENT;
        length = bottom_side_count * 3
        const position_bottom_side_buffer = new Float32Array(position_buffer.data.buffer, offset, length);
        const normal_bottom_side_buffer = new Float32Array(normal_buffer.data.buffer, offset, length);

        offset += length * Float32Array.BYTES_PER_ELEMENT;
        length = top_cap_count * 3
        const position_top_cap_buffer = new Float32Array(position_buffer.data.buffer, offset, length);
        const normal_top_cap_buffer = new Float32Array(normal_buffer.data.buffer, offset, length);

        offset += length * Float32Array.BYTES_PER_ELEMENT;
        length = bottom_cap_count * 3
        const position_bottom_cap_buffer = new Float32Array(position_buffer.data.buffer, offset, length);
        const normal_bottom_cap_buffer = new Float32Array(normal_buffer.data.buffer, offset, length);

        offset += length * Float32Array.BYTES_PER_ELEMENT;
        length = top_pole_count * 3
        const position_top_pole_buffer = new Float32Array(position_buffer.data.buffer, offset, length);
        const normal_top_pole_buffer = new Float32Array(normal_buffer.data.buffer, offset, length);

        offset += length * Float32Array.BYTES_PER_ELEMENT;
        length = bottom_pole_count * 3
        const position_bottom_pole_buffer = new Float32Array(position_buffer.data.buffer, offset, length);
        const normal_bottom_pole_buffer = new Float32Array(normal_buffer.data.buffer, offset, length);

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

            const vec3_idx = i * 3;
            const vec2_idx = i * 2;

            position_top_cap_buffer[vec3_idx + 0] = position_top_side_buffer[vec3_idx + 0] = x * top_radius;
            position_top_cap_buffer[vec3_idx + 1] = position_top_side_buffer[vec3_idx + 1] = half_height;
            position_top_cap_buffer[vec3_idx + 2] = position_top_side_buffer[vec3_idx + 2] = z * top_radius;
            position_bottom_cap_buffer[vec3_idx + 0] = position_bottom_side_buffer[vec3_idx + 0] = x * bottom_radius;
            position_bottom_cap_buffer[vec3_idx + 1] = position_bottom_side_buffer[vec3_idx + 1] = -half_height;
            position_bottom_cap_buffer[vec3_idx + 2] = position_bottom_side_buffer[vec3_idx + 2] = z * bottom_radius;

            normal_bottom_side_buffer[vec3_idx + 0] = normal_top_side_buffer[vec3_idx + 0] = x / normal_length;
            normal_bottom_side_buffer[vec3_idx + 1] = normal_top_side_buffer[vec3_idx + 1] = slope / normal_length;
            normal_bottom_side_buffer[vec3_idx + 2] = normal_top_side_buffer[vec3_idx + 2] = z / normal_length;
            normal_bottom_cap_buffer[vec3_idx + 0] = normal_top_cap_buffer[vec3_idx + 0] = 0;
            normal_bottom_cap_buffer[vec3_idx + 2] = normal_top_cap_buffer[vec3_idx + 2] = 0;
            normal_top_cap_buffer[vec3_idx + 1] = 1;
            normal_bottom_cap_buffer[vec3_idx + 1] = -1;

            const u = 1 - i / segments;
            uv_top_side_buffer[vec2_idx + 0] = u;
            uv_top_side_buffer[vec2_idx + 1] = 1;
            uv_bottom_cap_buffer[vec2_idx + 0] = uv_top_cap_buffer[vec2_idx + 0] = uv_bottom_side_buffer[vec2_idx + 0] = u;
            uv_bottom_cap_buffer[vec2_idx + 1] = uv_top_cap_buffer[vec2_idx + 1] = uv_bottom_side_buffer[vec2_idx + 1] = 0;

            if (i < segments) {
                position_top_pole_buffer[vec3_idx + 0] = 0;
                position_top_pole_buffer[vec3_idx + 1] = half_height;
                position_top_pole_buffer[vec3_idx + 2] = 0;
                position_bottom_pole_buffer[vec3_idx + 0] = 0;
                position_bottom_pole_buffer[vec3_idx + 1] = -half_height;
                position_bottom_pole_buffer[vec3_idx + 2] = 0;

                normal_bottom_pole_buffer[vec3_idx + 0] = normal_top_pole_buffer[vec3_idx + 0] = 0;
                normal_bottom_pole_buffer[vec3_idx + 2] = normal_top_pole_buffer[vec3_idx + 2] = 0;
                normal_top_pole_buffer[vec3_idx + 1] = 1;
                normal_bottom_pole_buffer[vec3_idx + 1] = -1;

                uv_bottom_pole_buffer[vec2_idx + 0] = uv_top_pole_buffer[vec2_idx + 0] = u;
                uv_bottom_pole_buffer[vec2_idx + 1] = uv_top_pole_buffer[vec2_idx + 1] = 1;
            }
        }

        const side_index_count = segments * 6;
        const top_cap_indx_count = segments * 3;
        const bottom_cap_indx_count = segments * 3;
        const index_count = side_index_count + top_cap_indx_count + bottom_cap_indx_count;

        const index_buffer = new RenderDeviceIndexAttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, index_count);

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

        position_buffer.commit_Data();
        normal_buffer.commit_Data();
        uv_buffer.commit_Data();
        index_buffer.commit_Data();

        const max_radius = Math.max(top_radius, bottom_radius);

        this.geometry.set_Geometry(
            RenderStatePrimitiveType.Triangles,
            {
                position: position_buffer,
                normal: normal_buffer,
                uv: uv_buffer,
            },
            index_buffer,
            index_count,
            Box3.create(
                Vector3.create(-max_radius, -half_height, -max_radius),
                Vector3.create(max_radius, half_height, max_radius),
            )
        );
        this.geometry.add_Surface(0, segments * 6);
        this.geometry.add_Surface(segments * 6 * index_buffer.per_element_byte_count, segments * 3);
        this.geometry.add_Surface(segments * 9 * index_buffer.per_element_byte_count, segments * 3);
    }

    // save / load

    public dump(writer: ClassWriter): void {
        writer.property('top_radius', this.top_radius);
        writer.property('bottom_radius', this.bottom_radius);
        writer.property('height', this.height);
        writer.property('segments', this.segments);
    }

    public load(reader: ClassReader): void {
        this.top_radius = reader.get<number>('top_radius') ?? 0.5;
        this.bottom_radius = reader.get<number>('bottom_radius') ?? 0.5;
        this.height = reader.get<number>('height') ?? 1;
        this.segments = reader.get<number>('segments') ?? 32;
        this.build();
    }
}

export class SphereGeometryResource extends PrimitiveGeometryResource {
    public static class_name: string = 'SphereGeometryResource';

    protected _radius: number = 0.5;
    protected _theta: number = Tau;
    protected _theta_segments: number = 32;
    protected _phi: number = Pi;
    protected _phi_segments: number = 16;

    public get radius() { return this._radius; }
    public get theta() { return this._theta; }
    public get theta_segments() { return this._theta_segments; }
    public get phi() { return this._phi; }
    public get phi_segments() { return this._phi_segments; }

    public set radius(radius: number) {
        radius = Math.max(radius, 0);
        if (this._radius !== radius) {
            this._radius = radius;
        }
    }
    public set theta(theta: number) {
        theta = clamp(theta, 0, Tau);
        if (this._theta !== theta) {
            this._theta = theta;
        }
    }
    public set theta_segments(theta_segments: number) {
        theta_segments = Math.max(Math.floor(theta_segments), 3);
        if (this._theta_segments !== theta_segments) {
            this._theta_segments = theta_segments;
        }
    }
    public set phi(phi: number) {
        phi = clamp(phi, 0, Pi);
        if (this._phi !== phi) {
            this._phi = phi;
        }
    }
    public set phi_segments(phi_segments: number) {
        phi_segments = Math.max(Math.floor(phi_segments), 2);
        if (this._phi_segments !== phi_segments) {
            this._phi_segments = phi_segments;
        }
    }

    public build(): void {
        const radius = this.radius;
        const theta = this.theta;
        const theta_segments = this.theta_segments;
        const phi = this.phi;
        const phi_segments = this.phi_segments;

        const vertex_count = (theta_segments + 1) * (phi_segments + 1);

        const position_buffer = new RenderDeviceVector3AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, vertex_count);
        const normal_buffer = new RenderDeviceVector3AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, vertex_count);
        const uv_buffer = new RenderDeviceVector2AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, vertex_count);

        for (let iy = 0; iy <= phi_segments; iy++) {
            const v = iy / phi_segments;
            for (let ix = 0; ix <= theta_segments; ix++) {
                const u = ix / theta_segments;
                const idx = iy * (theta_segments + 1) + ix;
                const vec3_idx = idx * 3;
                const vec2_idx = idx * 2;
                // vertex
                const x = Math.cos(u * theta) * Math.sin(v * phi);
                const y = Math.cos(v * phi);
                const z = Math.sin(u * theta) * Math.sin(v * phi);
                position_buffer.data[vec3_idx + 0] = x * -radius;
                position_buffer.data[vec3_idx + 1] = y * radius;
                position_buffer.data[vec3_idx + 2] = z * radius;
                // normal
                normal_buffer.data[vec3_idx + 0] = -x;
                normal_buffer.data[vec3_idx + 1] = y;
                normal_buffer.data[vec3_idx + 2] = z;
                // uv
                uv_buffer.data[vec2_idx + 0] = u;
                uv_buffer.data[vec2_idx + 1] = 1 - v;
            }
        }

        position_buffer.commit_Data();
        normal_buffer.commit_Data();
        uv_buffer.commit_Data();

        const index_buffer = new RenderDeviceIndexAttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, (theta_segments * phi_segments - 1) * 6);

        let i = 0;
        for (let iy = 0; iy < phi_segments; iy++) {
            for (let ix = 0; ix < theta_segments; ix++) {
                const idx = ix + 1 + iy * (theta_segments + 1);
                const a = idx;
                const b = idx - 1;
                const c = a + theta_segments;
                const d = c + 1;
                if (iy !== 0) {
                    index_buffer.data[i++] = a;
                    index_buffer.data[i++] = b;
                    index_buffer.data[i++] = d;
                }
                if (iy !== phi_segments - 1) {
                    index_buffer.data[i++] = d;
                    index_buffer.data[i++] = b;
                    index_buffer.data[i++] = c;
                }
            }
        }

        index_buffer.commit_Data();

        this.geometry.set_Geometry(
            RenderStatePrimitiveType.Triangles,
            {
                position: position_buffer,
                normal: normal_buffer,
                uv: uv_buffer,
            },
            index_buffer,
            index_buffer.item_count,
            Box3.create(
                Vector3.create(-radius, -radius, -radius),
                Vector3.create(radius, radius, radius),
            )
        );
    }

    // save / load

    public dump(writer: ClassWriter): void {
        writer.property('radius', this.radius);
        writer.property('theta', this.theta);
        writer.property('theta_segments', this.theta_segments);
        writer.property('phi', this.phi);
        writer.property('phi_segments', this.phi_segments);
    }

    public load(reader: ClassReader): void {
        this.radius = reader.get<number>('radius') ?? 0.5;
        this.theta = reader.get<number>('theta') ?? Tau;
        this.theta_segments = reader.get<number>('theta_segments') ?? 32;
        this.phi = reader.get<number>('phi') ?? Pi;
        this.phi_segments = reader.get<number>('phi_segments') ?? 16;
        this.build();
    }
}

export class PlaneGeometryResource extends PrimitiveGeometryResource {
    public static class_name: string = 'PlaneGeometryResource';

    protected _width: number = 1;
    protected _height: number = 1;

    public get width() { return this._width; }
    public get height() { return this._height; }

    public set width(width: number) {
        width = Math.max(width, 0);
        if (this._width !== width) {
            this._width = width;
        }
    }
    public set height(height: number) {
        height = Math.max(height, 0);
        if (this._height !== height) {
            this._height = height;
        }
    }

    public build() {
        const half_w = this.width / 2;
        const half_h = this.height / 2;
        const position_buffer = new RenderDeviceVector3AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw,
            new Float32Array([
                half_w, half_h, 0,
                -half_w, half_h, 0,
                -half_w, -half_h, 0,
                half_w, -half_h, 0,
            ]));
        const normal_buffer = new RenderDeviceVector3AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw,
            new Float32Array([
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
            ]));
        const uv_buffer = new RenderDeviceVector2AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw,
            new Float32Array([
                1, 1,
                0, 1,
                0, 0,
                1, 0,
            ]));
        const index_buffer = new RenderDeviceIndexAttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw,
            new Uint32Array([
                // top
                0, 1, 2, 0, 2, 3,
            ]));
        this.geometry.set_Geometry(
            RenderStatePrimitiveType.Triangles,
            {
                position: position_buffer,
                normal: normal_buffer,
                uv: uv_buffer,
            },
            index_buffer,
            6,
            Box3.create(Vector3.create(-half_w, -half_h, 0), Vector3.create(half_w, half_h, 0))
        );
    }

    // save / load

    public dump(writer: ClassWriter): void {
        writer.property('width', this.width);
        writer.property('height', this.height);
    }

    public load(reader: ClassReader): void {
        this.width = reader.get<number>('width') ?? 1;
        this.height = reader.get<number>('height') ?? 1;
        this.build();
    }
}