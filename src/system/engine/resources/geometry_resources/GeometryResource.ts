import { Ref } from "@/system/utils/RefCounted";
import type { RenderServerGeometry } from "../../render_server/RenderServerGeometry";
import { Resource } from "../Resource";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import { RenderDeviceMatrix4AttributeBuffer, RenderDeviceVector3AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import type { WebGL2RenderStateBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateBuffer";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import type { Config } from "../../ConfiguredObject";
import { triangle3, type Triangle3 } from "@/system/fivepebble/geometries/Triangle3";
import { vec3 } from "@/system/fivepebble/linear_algebra/Vector3";

export abstract class GeometryResource extends Resource {
    protected readonly geometry_ref: Ref<RenderServerGeometry> = new Ref();

    public get geometry() { return this.geometry_ref.expect; }

    public get render_server() { return this.config.render_server; }

    constructor(config: Config) {
        super(config);
    }

    // experimental
    public get_TriFaces() {
        if (this.geometry.primitive_type !== RenderStatePrimitiveType.Triangles) return undefined;
        const position = this.geometry.get_AttributeBuffer('position');
        if (position === undefined || !(position instanceof RenderDeviceVector3AttributeBuffer)) return;
        const point = position.data;
        if (this.geometry.is_indexed) {
            const index = this.geometry.get_IndexAttributeBuffer()!.data;
            if (!(index instanceof Uint32Array)) return undefined;
            const tri: Triangle3[] = [];
            for (let i = 0; i < index.length; i += 3) {
                const base0 = index[i] * 3;
                const base1 = index[i + 1] * 3;
                const base2 = index[i + 2] * 3;
                const x0 = point[base0 + 0], y0 = point[base0 + 1], z0 = point[base0 + 2];
                const x1 = point[base1 + 0], y1 = point[base1 + 1], z1 = point[base1 + 2];
                const x2 = point[base2 + 0], y2 = point[base2 + 1], z2 = point[base2 + 2];
                tri.push(triangle3(vec3(x0, y0, z0), vec3(x1, y1, z1), vec3(x2, y2, z2)));
            }
            return tri;
        }
        else {
            const index = this.geometry.vertex_count!;
            const tri: Triangle3[] = [];
            for (let i = 0; i < index; i += 3) {
                const base0 = i * 3;
                const base1 = (i + 1) * 3;
                const base2 = (i + 2) * 3;
                const x0 = point[base0 + 0], y0 = point[base0 + 1], z0 = point[base0 + 2];
                const x1 = point[base1 + 0], y1 = point[base1 + 1], z1 = point[base1 + 2];
                const x2 = point[base2 + 0], y2 = point[base2 + 1], z2 = point[base2 + 2];
                tri.push(triangle3(vec3(x0, y0, z0), vec3(x1, y1, z1), vec3(x2, y2, z2)));
            }
            return tri;
        }
    }

    protected dispose(): void {
        console.log(">>> dispose <GeometryResource>", this.rid);
        this.geometry_ref.clear();
    }
}

export class MultiGeometryResource extends GeometryResource {
    private readonly _bbox: Box3 = new Box3();

    private readonly override_geometry_ref: Ref<GeometryResource> = new Ref();

    private readonly instance_transform_attribute_buffer_ref: Ref<RenderDeviceMatrix4AttributeBuffer<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();

    constructor(config: Config) {
        super(config);
        this.geometry_ref.value = this.render_server.create_Geometry();
        this.geometry.instance_count = 0;
        this.instance_transform_attribute_buffer_ref.value = new RenderDeviceMatrix4AttributeBuffer(this.render_server, RenderStateBufferUsage.DynamicDraw, undefined, 1);
    }

    public set_OverrideGeometry(geometry: GeometryResource) {
        if (geometry instanceof MultiGeometryResource) throw new Error('<MultiGeometryResource> set_OverrideGeometry: base geometry should not be another MultiGeometryResource');
        if (!geometry.geometry.has_geometry) throw new Error('<MultiGeometryResource> set_OverrideGeometry: base geometry does not have a geometry, maybe it is not properly initialized');
        this.override_geometry_ref.value = geometry;
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
        if (this.geometry.instance_count === count) return;
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
        console.log(">>> dispose <MultiGeometryResource>", this.rid);
        this.instance_transform_attribute_buffer_ref.clear();
        this.override_geometry_ref.clear();
        super.dispose();
    }
}