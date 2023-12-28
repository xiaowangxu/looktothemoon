import { Ref } from "@/system/utils/RefCounted";
import type { RenderServerGeometry } from "../../render_server/RenderServerGeometry";
import { Resource } from "../Resource";
import { RenderServer3D } from "../../render_server/RenderServer";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import { RenderDeviceMatrix4AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import type { WebGL2RenderStateBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateBuffer";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { RenderStateBufferUsage } from "@/system/sliverofstraw/RenderState";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";

export abstract class GeometryResource extends Resource {
    private readonly geometry_ref: Ref<RenderServerGeometry> = new Ref();

    public get geometry() { return this.geometry_ref.expect; }

    constructor() {
        super();
        this.geometry_ref.value = RenderServer3D.create_Geometry();
    }

    protected dispose(): void {
        this.geometry_ref.clear();
    }
}

export class MultiGeometryResource extends GeometryResource {

    private readonly _bbox: Box3 = new Box3();

    private readonly instance_transform_attribute_buffer_ref: Ref<RenderDeviceMatrix4AttributeBuffer<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();

    constructor() {
        super();
        this.geometry.instance_count = 0;
        this.instance_transform_attribute_buffer_ref.value = new RenderDeviceMatrix4AttributeBuffer(RenderServer3D, RenderStateBufferUsage.DynamicDraw, undefined, 1);
    }

    public set_OverrideGeometry(geometry: GeometryResource) {
        if (!geometry.geometry.has_geometry) throw new Error('<MultiGeometryResource> set_OverrideGeometry: base geometry does not have a geometry, maybe it is not properly initialized');
        const attributes = geometry.geometry.get_AttributeBuffers()!;
        const index = geometry.geometry.get_IndexAttributeBuffer()!;
        const vertex_count = geometry.geometry.vertex_count!;
        const primitive_type = geometry.geometry.primitive_type!;
        attributes.instance_transform = this.instance_transform_attribute_buffer_ref.expect;
        this._bbox.copy(geometry.geometry.bbox);
        this.geometry.set_Geometry(
            primitive_type,
            attributes,
            index,
            vertex_count,
        );
        for (const { offset, length } of geometry.geometry.get_Surfaces()) {
            this.geometry.add_Surface(offset, length);
        }
        this.geometry.set_BBox(this._bbox);
    }

    public set_InstanceCount(count: number, fill_default: boolean = true, commit: boolean = true) {
        count = Math.max(0, Math.floor(count));
        this.geometry.instance_count = count;
        this.instance_transform_attribute_buffer_ref.expect.alloc_Data(count);
        if (fill_default) {
            const identity = Matrix4.make_Identity();
            for (let i = 0; i < count; i++) {
                this.instance_transform_attribute_buffer_ref.expect.update_Data(identity, i, false);
            }
            if (commit) {
                this.instance_transform_attribute_buffer_ref.expect.commit_Data();
            }
        }
    }

    public set_InstanceTransform(idx: number, transform: Matrix4, commit: boolean = true) {
        if (idx < 0 || idx >= this.geometry.instance_count) return;
        this.instance_transform_attribute_buffer_ref.expect.update_Data(transform, idx, commit);
    }

    public commit_InstanceTransforms() {
        this.instance_transform_attribute_buffer_ref.expect.commit_Data();
    }

    protected dispose(): void {
        this.instance_transform_attribute_buffer_ref.clear();
        super.dispose();
    }
}