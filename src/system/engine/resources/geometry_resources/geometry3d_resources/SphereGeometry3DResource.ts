import { Ref } from "@/system/utils/RefCounted";
import { WebGPURenderElementIndexBuffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementBuffer";
import { WebGPURenderElementVector2Buffer, WebGPURenderElementVector3Buffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementVectorBuffer";
import { RenderServer } from "../../../render_server/RenderServer";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderStatePrimitiveType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import { RenderServerGeometryAttributeLayoutBuffer } from "../../../render_server/geometry/RenderServerGeometryDefination";
import { Pi, Tau } from "@/system/fivepebble/Scalar";
import { clamp } from "@vueuse/core";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Geometry3DResource } from "./Geometry3DResource";

export class SphereGeometry3DResource extends Geometry3DResource {

    private readonly position_buffer_ref: Ref<WebGPURenderElementVector3Buffer> = new Ref();
    private readonly normal_buffer_ref: Ref<WebGPURenderElementVector3Buffer> = new Ref();
    private readonly uv_buffer_ref: Ref<WebGPURenderElementVector2Buffer> = new Ref();
    private readonly index_buffer_ref: Ref<WebGPURenderElementIndexBuffer> = new Ref();

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

        const position_buffer = new WebGPURenderElementVector3Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count);
        const normal_buffer = new WebGPURenderElementVector3Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count);
        const uv_buffer = new WebGPURenderElementVector2Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, vertex_count);

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


        const index_count =  (theta_segments * phi_segments - 1) * 6;
        
        const index_buffer = new WebGPURenderElementIndexBuffer(RenderServer.render_state, WebGPURenderStateBufferType.Index, WebGPURenderStateBufferUsage.CopyDst, index_count);

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

        position_buffer.commit(true);
        normal_buffer.commit(true);
        uv_buffer.commit(true);
        index_buffer.commit(true);

        // build geometry
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
        Geometry3DResource.$tmp_box3_for_bbox.min.set(-radius, -radius, -radius);
        Geometry3DResource.$tmp_box3_for_bbox.max.set(radius, radius, radius);
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