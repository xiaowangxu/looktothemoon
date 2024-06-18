import { Ref } from "@/system/utils/RefCounted";
import { WebGPURenderElementIndexBuffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementBuffer";
import { WebGPURenderElementVector2Buffer, WebGPURenderElementVector3Buffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementVectorBuffer";
import { RenderServer } from "../../../render_server/RenderServer";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderStatePrimitiveType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import { RenderServerGeometryAttributeLayoutBuffer } from "../../../render_server/geometry/RenderServerGeometryDefination";
import { Pi, Tau, clamp } from "@/system/fivepebble/Scalar";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Geometry3DResource } from "./Geometry3DResource";
import type { ResourceSetOptionAllAtOnce } from "../../Resource";

type TorusGeometry3DResourceOption = {
    radius?: number,
    tube_radius?: number,
    segments?: number,
    tube_segments?: number,
    theta?: number,
}

export class TorusGeometry3DResource extends Geometry3DResource implements ResourceSetOptionAllAtOnce<TorusGeometry3DResourceOption> {

    private readonly position_buffer_ref: Ref<WebGPURenderElementVector3Buffer> = new Ref();
    private readonly normal_buffer_ref: Ref<WebGPURenderElementVector3Buffer> = new Ref();
    private readonly uv_buffer_ref: Ref<WebGPURenderElementVector2Buffer> = new Ref();
    private readonly index_buffer_ref: Ref<WebGPURenderElementIndexBuffer> = new Ref();

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
            this.build();
        }
    }
    public set tube_radius(tube_radius: number) {
        tube_radius = Math.max(tube_radius, 0);
        if (this._tube_radius !== tube_radius) {
            this._tube_radius = tube_radius;
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
    public set tube_segments(tube_segments: number) {
        tube_segments = Math.max(Math.floor(tube_segments), 3);
        if (this._tube_segments !== tube_segments) {
            this._tube_segments = tube_segments;
            this.build();
        }
    }
    public set theta(theta: number) {
        theta = clamp(theta, 0, Tau);
        if (this._theta !== theta) {
            this._theta = theta;
            this.build();
        }
    }

    public set option(option: TorusGeometry3DResourceOption) {
        let changed = false;
        if (option.radius !== undefined) {
            const radius = Math.max(option.radius, 0);
            if (this._radius !== radius) {
                changed = true;
                this._radius = radius;
            }
        }
        if (option.tube_radius !== undefined) {
            const tube_radius = Math.max(option.tube_radius, 0);
            if (this._tube_radius !== tube_radius) {
                changed = true;
                this._tube_radius = tube_radius;
            }
        }
        if (option.segments !== undefined) {
            const segments = Math.max(Math.floor(option.segments), 3);
            if (this._segments !== segments) {
                changed = true;
                this._segments = segments;
            }
        }
        if (option.tube_segments !== undefined) {
            const tube_segments = Math.max(Math.floor(option.tube_segments), 3);
            if (this._tube_segments !== tube_segments) {
                changed = true;
                this._tube_segments = tube_segments;
            }
        }
        if (option.theta !== undefined) {
            const theta = clamp(option.theta, 0, Tau);
            if (this._theta !== theta) {
                changed = true;
                this._theta = theta;
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
        const radius = this.radius;
        const tube_radius = this.tube_radius;
        const segments = this.segments;
        const tube_segments = this.tube_segments;
        const theta = this.theta;

        const vertex_count = (segments + 1) * (tube_segments + 1);

        const position_buffer = new WebGPURenderElementVector3Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count);
        const normal_buffer = new WebGPURenderElementVector3Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count);
        const uv_buffer = new WebGPURenderElementVector2Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count);

        let vertex_idx = 0;
        for (let j = 0; j <= segments; j++) {
            for (let i = 0; i <= tube_segments; i++) {
                const u = i / tube_segments * theta;
                const v = j / segments * Pi * 2;
                const vec3_idx = vertex_idx * 3;
                const vec2_idx = vertex_idx * 2;
                // vertex
                const vertex = Vector3.create(
                    (radius + tube_radius * Math.cos(v)) * Math.cos(u),
                    -tube_radius * Math.sin(v),
                    (radius + tube_radius * Math.cos(v)) * Math.sin(u),
                );
                position_buffer.data[vec3_idx + 0] = vertex.x;
                position_buffer.data[vec3_idx + 1] = vertex.y;
                position_buffer.data[vec3_idx + 2] = vertex.z;
                // normal
                const center = Vector3.create(radius * Math.cos(u), 0, radius * Math.sin(u));
                const normal = center.direction_to(center, vertex);
                normal_buffer.data[vec3_idx + 0] = normal.x;
                normal_buffer.data[vec3_idx + 1] = normal.y;
                normal_buffer.data[vec3_idx + 2] = normal.z;
                // uv
                uv_buffer.data[vec2_idx + 0] = i / tube_segments;
                uv_buffer.data[vec2_idx + 1] = j / segments;
                vertex_idx++;
            }
        }

        const index_count = segments * tube_segments * 6;

        const index_buffer = new WebGPURenderElementIndexBuffer(RenderServer.render_state, WebGPURenderStateBufferType.Index, WebGPURenderStateBufferUsage.CopyDst, index_count);

        // generate indices
        let index_idx = 0;
        for (let j = 1; j <= segments; j++) {
            for (let i = 1; i <= tube_segments; i++) {
                // indices
                const a = (tube_segments + 1) * j + i - 1;
                const b = (tube_segments + 1) * (j - 1) + i - 1;
                const c = (tube_segments + 1) * (j - 1) + i;
                const d = (tube_segments + 1) * j + i;
                // faces
                const idx = index_idx * 6;
                index_buffer.data[idx + 0] = a;
                index_buffer.data[idx + 1] = b;
                index_buffer.data[idx + 2] = d;
                index_buffer.data[idx + 3] = b;
                index_buffer.data[idx + 4] = c;
                index_buffer.data[idx + 5] = d;
                index_idx++;
            }
        }

        position_buffer.commit(true);
        normal_buffer.commit(true);
        uv_buffer.commit(true);
        index_buffer.commit(true);

        // build geometry
        const outer_radius = radius + tube_radius;

        this.position_buffer_ref.value = position_buffer;
        this.normal_buffer_ref.value = normal_buffer;
        this.uv_buffer_ref.value = uv_buffer;
        this.index_buffer_ref.value = index_buffer;

        this.render_server_geometry.clear_Geometry();
        this.render_server_geometry.set_IndexBuffer(this.index_buffer_ref.expect.buffer);
        this.render_server_geometry.set_VertexLength(index_count);
        this.render_server_geometry.set_PrimitiveType(WebGPURenderStatePrimitiveType.Triangles);
        this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Position, this.position_buffer_ref.expect.buffer);
        this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Normal, this.normal_buffer_ref.expect.buffer);
        this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Uv, this.uv_buffer_ref.expect.buffer);
        Geometry3DResource.$tmp_box3_for_bbox.min.set(-outer_radius, -tube_radius, -outer_radius);
        Geometry3DResource.$tmp_box3_for_bbox.max.set(outer_radius, tube_radius, outer_radius);
        this.render_server_geometry.set_BBox(Geometry3DResource.$tmp_box3_for_bbox);
    }

    protected dispose(): void {
        this.position_buffer_ref.clear();
        this.normal_buffer_ref.clear();
        this.uv_buffer_ref.clear();
        this.index_buffer_ref.clear();
        super.dispose();
    }
}