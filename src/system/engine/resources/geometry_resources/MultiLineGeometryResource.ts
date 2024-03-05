import { RenderDeviceAttributeBufferView, RenderDeviceIndexAttributeBuffer, RenderDeviceVector2AttributeBuffer, RenderDeviceVector3AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { Cacher } from "@/system/utils/Cacher";
import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { Vector3, vec3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { GeometryResource } from "./GeometryResource";
import { Ref } from "@/system/utils/RefCounted";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import type { WebGL2RenderStateBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateBuffer";
import { Box3, box3 } from "@/system/fivepebble/geometries/Box3";
import type { Config } from "../../ConfiguredObject";
import { RenderServerGeometryAttributeLoctions } from "../../render_server/RenderServerGeometry";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";

const PositionAttributeBuffer = new Cacher((config: Config) => {
    return new Ref(new RenderDeviceVector3AttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [
        vec3(- 1, 2, 0),
        vec3(1, 2, 0),
        vec3(- 1, 1, 0),
        vec3(1, 1, 0),
        vec3(- 1, 0, 0),
        vec3(1, 0, 0),
        vec3(- 1, - 1, 0),
        vec3(1, - 1, 0),
    ]));
});

const UVAttributeBuffer = new Cacher((config: Config) => {
    return new Ref(new RenderDeviceVector2AttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [
        Vector2.create(- 1, 2),
        Vector2.create(1, 2),
        Vector2.create(- 1, 1),
        Vector2.create(1, 1),
        Vector2.create(- 1, - 1),
        Vector2.create(1, - 1),
        Vector2.create(- 1, - 2),
        Vector2.create(1, - 2),
    ]));
});

const IndexAttributeBuffer = new Cacher((config: Config) => {
    return new Ref(new RenderDeviceIndexAttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [0, 2, 1, 2, 3, 1, 2, 4, 3, 4, 5, 3, 4, 6, 5, 6, 7, 5]));
});

export class MultiLineGeometryResource extends GeometryResource {

    private readonly points_attribute_buffer_ref: Ref<RenderDeviceVector3AttributeBuffer<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly start_attribute_buffer_ref: Ref<RenderDeviceAttributeBufferView<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly end_attribute_buffer_ref: Ref<RenderDeviceAttributeBufferView<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();

    private readonly _base_bbox: Box3 = box3(vec3(0, 0, 0), vec3(1, 0, 0));
    private readonly _bbox: Box3 = box3();
    private _bbox_margin: number = 0.1;
    public get bbox_margin() { return this._bbox_margin; }
    public set bbox_margin(bbox_margin: number) {
        if (this._bbox_margin !== bbox_margin) {
            this._bbox_margin = bbox_margin;
            this.update_EnlargedBBox();
        }
    }

    constructor(config: Config) {
        super(config);
        this.geometry_ref.value = this.render_server.create_Geometry();
        this.points_attribute_buffer_ref.value = new RenderDeviceVector3AttributeBuffer(this.render_server, RenderStateBufferUsage.DynamicDraw, [vec3(0, 0, 0), vec3(1, 0, 0)], 1);
        this.start_attribute_buffer_ref.value = new RenderDeviceAttributeBufferView(this.render_server, this.points_attribute_buffer_ref.expect, 1, 0);
        this.end_attribute_buffer_ref.value = new RenderDeviceAttributeBufferView(this.render_server, this.points_attribute_buffer_ref.expect, 1, 1);
        this.geometry.set_Geometry(
            RenderStatePrimitiveType.Triangles,
            {
                position: PositionAttributeBuffer.get(this.config).expect,
                uv: UVAttributeBuffer.get(this.config).expect,
                start: {
                    attribute: this.start_attribute_buffer_ref.expect,
                    location: RenderServerGeometryAttributeLoctions.custom0,
                },
                end: {
                    attribute: this.end_attribute_buffer_ref.expect,
                    location: RenderServerGeometryAttributeLoctions.custom1,
                }
            },
            IndexAttributeBuffer.get(this.config).expect,
            undefined,
            undefined,
            false
        );
        this.geometry.instance_count = 1;
        this.update_BBox();
    }

    public set_PointCount(count: number) {
        count = Math.max(2, Math.floor(count));
        if (this.geometry.instance_count === count - 1) return;
        this.geometry.instance_count = count - 1;
        this.points_attribute_buffer_ref.expect.alloc_Data(count);
    }

    public set_Point(idx: number, point: Vector3, update_bbox: boolean = true, commit: boolean = true) {
        if (idx < 0 || idx >= this.geometry.instance_count + 1) return;
        this.points_attribute_buffer_ref.expect.update_Data(point, idx, commit);
        if (update_bbox) this.update_BBox();
    }

    public commit_Points() {
        this.points_attribute_buffer_ref.expect.commit_Data();
    }

    public update_BBox() {
        const data = this.points_attribute_buffer_ref.expect.data;
        let min_x = data[0], min_y = data[1], min_z = data[2];
        let max_x = min_x, max_y = min_y, max_z = min_z;
        for (let i = 3; i < data.length;) {
            const x = data[i++];
            const y = data[i++];
            const z = data[i++];
            min_x = Math.min(min_x, x);
            max_x = Math.max(max_x, x);
            min_y = Math.min(min_y, y);
            max_y = Math.max(max_y, y);
            min_z = Math.min(min_z, z);
            max_z = Math.max(max_z, z);
        }
        this._base_bbox.min.set(min_x, min_y, min_z);
        this._base_bbox.max.set(max_x, max_y, max_z);
        this.update_EnlargedBBox();
    }

    private update_EnlargedBBox() {
        this._bbox.enlarges(this._base_bbox, this._bbox_margin);
        this.geometry.set_BBox(this._bbox);
    }

    protected dispose(): void {
        this.points_attribute_buffer_ref.clear();
        this.start_attribute_buffer_ref.clear();
        this.end_attribute_buffer_ref.clear();
        super.dispose();
    }
}