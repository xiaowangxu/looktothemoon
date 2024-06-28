import { Ref } from "@/system/utils/RefCounted";
import { WebGPURenderElementIndexBuffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementBuffer";
import { WebGPURenderElementVector2Buffer, WebGPURenderElementVector3Buffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementVectorBuffer";
import { RenderServer } from "../../../render_server/RenderServer";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderStatePrimitiveType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import { RenderServerGeometryAttributeLayoutBuffer } from "../../../render_server/geometry/RenderServerGeometryDefination";
import { Pi, Tau, clamp } from "@/system/fivepebble/Scalar";
import { Geometry3DResource } from "./Geometry3DResource";
import type { ResourceSetOptionAllAtOnce } from "../../Resource";

type SphereGeometry3DResourceOption = {
    radius?: number,
    theta?: number,
    theta_segments?: number,
    phi?: number,
    phi_segments?: number,
}

export class SphereGeometry3DResource extends Geometry3DResource implements ResourceSetOptionAllAtOnce<SphereGeometry3DResourceOption> {

    private readonly position_normal_buffer_ref: Ref<WebGPURenderElementVector3Buffer> = new Ref();
    private readonly uv_buffer_ref: Ref<WebGPURenderElementVector2Buffer> = new Ref();
    private readonly index_buffer_ref: Ref<WebGPURenderElementIndexBuffer> = new Ref();

    protected _radius: number = 0.5;
    protected _theta: number = Tau;
    protected _theta_segments: number = 64;
    protected _phi: number = Pi;
    protected _phi_segments: number = 32;

    public get radius() { return this._radius; }
    public get theta() { return this._theta; }
    public get theta_segments() { return this._theta_segments; }
    public get phi() { return this._phi; }
    public get phi_segments() { return this._phi_segments; }

    public set radius(radius: number) {
        radius = Math.max(radius, 0);
        if (this._radius !== radius) {
            this._radius = radius;
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
    public set theta_segments(theta_segments: number) {
        theta_segments = Math.max(Math.floor(theta_segments), 3);
        if (this._theta_segments !== theta_segments) {
            this._theta_segments = theta_segments;
            this.build();
        }
    }
    public set phi(phi: number) {
        phi = clamp(phi, 0, Pi);
        if (this._phi !== phi) {
            this._phi = phi;
            this.build();
        }
    }
    public set phi_segments(phi_segments: number) {
        phi_segments = Math.max(Math.floor(phi_segments), 2);
        if (this._phi_segments !== phi_segments) {
            this._phi_segments = phi_segments;
            this.build();
        }
    }

    public set option(option: SphereGeometry3DResourceOption) {
        let changed = false;
        if (option.radius !== undefined) {
            const radius = Math.max(option.radius, 0);
            if (this._radius !== radius) {
                changed = true;
                this._radius = radius;
            }
        }
        if (option.theta !== undefined) {
            const theta = clamp(option.theta, 0, Tau);
            if (this._theta !== theta) {
                changed = true;
                this._theta = theta;
            }
        }
        if (option.theta_segments !== undefined) {
            const theta_segments = Math.max(Math.floor(option.theta_segments), 3);
            if (this._theta_segments !== theta_segments) {
                changed = true;
                this._theta_segments = theta_segments;
            }
        }
        if (option.phi !== undefined) {
            const phi = clamp(option.phi, 0, Pi);
            if (this._phi !== phi) {
                changed = true;
                this._phi = phi;
            }
        }
        if (option.phi_segments !== undefined && option.phi_segments !== this._phi_segments) {
            const phi_segments = Math.max(Math.floor(option.phi_segments), 2);
            if (this._phi_segments !== phi_segments) {
                changed = true;
                this._phi_segments = phi_segments;
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
        const theta = this.theta;
        const theta_segments = this.theta_segments;
        const phi = this.phi;
        const phi_segments = this.phi_segments;

        const vertex_count = (theta_segments + 1) * (phi_segments + 1);

        const position_normal_buffer = new WebGPURenderElementVector3Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count* 2);
        const uv_buffer = new WebGPURenderElementVector2Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count);

        let vertex_idx = 0;
        for (let iy = 0; iy <= phi_segments; iy++) {
            const v = iy / phi_segments;
            for (let ix = 0; ix <= theta_segments; ix++) {
                const u = ix / theta_segments;
                const vec6_idx = vertex_idx * 6;
                const vec2_idx = vertex_idx * 2;
                // vertex
                const x = Math.cos(u * theta) * Math.sin(v * phi);
                const y = Math.cos(v * phi);
                const z = Math.sin(u * theta) * Math.sin(v * phi);
                position_normal_buffer.data[vec6_idx + 0] = x * -radius;
                position_normal_buffer.data[vec6_idx + 1] = y * radius;
                position_normal_buffer.data[vec6_idx + 2] = z * radius;
                // normal
                position_normal_buffer.data[vec6_idx + 3] = -x;
                position_normal_buffer.data[vec6_idx + 4] = y;
                position_normal_buffer.data[vec6_idx + 5] = z;
                // uv
                uv_buffer.data[vec2_idx + 0] = u;
                uv_buffer.data[vec2_idx + 1] = 1 - v;
                vertex_idx++;
            }
        }

        const index_count = (theta_segments * phi_segments - 1) * 6;

        const index_buffer = new WebGPURenderElementIndexBuffer(RenderServer.render_state, WebGPURenderStateBufferType.Index, WebGPURenderStateBufferUsage.CopyDst, index_count);

        let index_idx = 0;
        for (let iy = 0; iy < phi_segments; iy++) {
            for (let ix = 0; ix < theta_segments; ix++) {
                const idx = ix + 1 + iy * (theta_segments + 1);
                const a = idx;
                const b = idx - 1;
                const c = a + theta_segments;
                const d = c + 1;
                if (iy !== 0) {
                    index_buffer.data[index_idx++] = a;
                    index_buffer.data[index_idx++] = b;
                    index_buffer.data[index_idx++] = d;
                }
                if (iy !== phi_segments - 1) {
                    index_buffer.data[index_idx++] = d;
                    index_buffer.data[index_idx++] = b;
                    index_buffer.data[index_idx++] = c;
                }
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
        Geometry3DResource.$tmp_box3_for_bbox.min.set(-radius, -radius, -radius);
        Geometry3DResource.$tmp_box3_for_bbox.max.set(radius, radius, radius);
        this.render_server_geometry.set_BBox(Geometry3DResource.$tmp_box3_for_bbox);
    }

    protected dispose(): void {
        this.position_normal_buffer_ref.clear();
        this.uv_buffer_ref.clear();
        this.index_buffer_ref.clear();
        super.dispose();
    }
}