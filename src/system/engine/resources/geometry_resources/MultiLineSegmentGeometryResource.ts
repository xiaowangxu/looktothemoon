import { RenderDeviceAttributeBufferView, RenderDeviceFloatAttributeBuffer, RenderDeviceIndexAttributeBuffer, RenderDeviceVector2AttributeBuffer, RenderDeviceVector3AttributeBuffer, RenderDeviceVector4AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { Cacher } from "@/system/utils/Cacher";
import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { GeometryResource } from "./GeometryResource";
import { Ref } from "@/system/utils/RefCounted";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import type { WebGL2RenderStateBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateBuffer";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import type { Config } from "../../ConfiguredObject";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { RenderServerGeometry } from "../../render_server/RenderServerGeometry";

const PositionAttributeBuffer = new Cacher((config: Config) => {
    return new Ref(new RenderDeviceVector3AttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [
        Vector3.create(- 1, 2, 0),
        Vector3.create(1, 2, 0),
        Vector3.create(- 1, 1, 0),
        Vector3.create(1, 1, 0),
        Vector3.create(- 1, 0, 0),
        Vector3.create(1, 0, 0),
        Vector3.create(- 1, - 1, 0),
        Vector3.create(1, - 1, 0),
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
    private readonly points_start_attribute_buffer_ref: Ref<RenderDeviceAttributeBufferView<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly points_end_attribute_buffer_ref: Ref<RenderDeviceAttributeBufferView<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly colors_attribute_buffer_ref: Ref<RenderDeviceVector4AttributeBuffer<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly colors_start_attribute_buffer_ref: Ref<RenderDeviceAttributeBufferView<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly colors_end_attribute_buffer_ref: Ref<RenderDeviceAttributeBufferView<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly length_percentages_attribute_buffer_ref: Ref<RenderDeviceFloatAttributeBuffer<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly length_percentages_start_attribute_buffer_ref: Ref<RenderDeviceAttributeBufferView<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly length_percentages_end_attribute_buffer_ref: Ref<RenderDeviceAttributeBufferView<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly total_length_attribute_buffer_ref: Ref<RenderDeviceFloatAttributeBuffer<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();

    private readonly _base_bbox: Box3 = Box3.create(Vector3.create(0, 0, 0), Vector3.create(1, 0, 0));
    private readonly _bbox: Box3 = Box3.new;
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

        this.points_attribute_buffer_ref.value = new RenderDeviceVector3AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, [Vector3.create(0, 0, 0), Vector3.create(1, 0, 0)], 1);
        this.points_start_attribute_buffer_ref.value = new RenderDeviceAttributeBufferView(this.render_server, this.points_attribute_buffer_ref.expect, 1, 0);
        this.points_end_attribute_buffer_ref.value = new RenderDeviceAttributeBufferView(this.render_server, this.points_attribute_buffer_ref.expect, 1, 1);

        this.colors_attribute_buffer_ref.value = new RenderDeviceVector4AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, [Vector4.create(1, 1, 1, 1), Vector4.create(1, 1, 1, 1)], 1);
        this.colors_start_attribute_buffer_ref.value = new RenderDeviceAttributeBufferView(this.render_server, this.colors_attribute_buffer_ref.expect, 1, 0);
        this.colors_end_attribute_buffer_ref.value = new RenderDeviceAttributeBufferView(this.render_server, this.colors_attribute_buffer_ref.expect, 1, 1);

        this.length_percentages_attribute_buffer_ref.value = new RenderDeviceFloatAttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, [0, 1], 1);
        this.length_percentages_start_attribute_buffer_ref.value = new RenderDeviceAttributeBufferView(this.render_server, this.length_percentages_attribute_buffer_ref.expect, 1, 0);
        this.length_percentages_end_attribute_buffer_ref.value = new RenderDeviceAttributeBufferView(this.render_server, this.length_percentages_attribute_buffer_ref.expect, 1, 1);

        this.total_length_attribute_buffer_ref.value = new RenderDeviceFloatAttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, 8);
        this.geometry.set_Geometry(
            RenderStatePrimitiveType.Triangles,
            {
                position: PositionAttributeBuffer.get(this.config).expect,
                uv: UVAttributeBuffer.get(this.config).expect,
                start: {
                    attribute: this.points_start_attribute_buffer_ref.expect,
                    location: RenderServerGeometry.GeometryAttributeLocations.custom0,
                },
                end: {
                    attribute: this.points_end_attribute_buffer_ref.expect,
                    location: RenderServerGeometry.GeometryAttributeLocations.custom1,
                },
                percentage_start: {
                    attribute: this.length_percentages_start_attribute_buffer_ref.expect,
                    location: RenderServerGeometry.GeometryAttributeLocations.custom2,
                },
                percentage_end: {
                    attribute: this.length_percentages_end_attribute_buffer_ref.expect,
                    location: RenderServerGeometry.GeometryAttributeLocations.custom3,
                },
                length: {
                    attribute: this.total_length_attribute_buffer_ref.expect,
                    location: RenderServerGeometry.GeometryAttributeLocations.instance_transform,
                },
                color_start: {
                    attribute: this.colors_start_attribute_buffer_ref.expect,
                    location: RenderServerGeometry.GeometryAttributeLocations.instance_transform1,
                },
                color_end: {
                    attribute: this.colors_end_attribute_buffer_ref.expect,
                    location: RenderServerGeometry.GeometryAttributeLocations.instance_transform2,
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

    public get points_count() { return this.geometry.instance_count + 1; }

    public set_PointsCount(count: number, fill_default_color: boolean = true, commit_color: boolean = true) {
        count = Math.max(2, Math.floor(count));
        if (this.geometry.instance_count === count - 1) return;
        this.geometry.instance_count = count - 1;
        this.points_attribute_buffer_ref.expect.alloc_Data(count);
        this.colors_attribute_buffer_ref.expect.alloc_Data(count);
        this.length_percentages_attribute_buffer_ref.expect.alloc_Data(count);
        if (fill_default_color) {
            const identity = Vector4.create(1, 1, 1, 1);
            for (let i = 0; i < count; i++) {
                this.colors_attribute_buffer_ref.expect.update_Data(identity, i, false);
            }
            if (commit_color) {
                this.colors_attribute_buffer_ref.expect.commit_Data();
            }
        }
    }

    public set_Point(idx: number, point: Vector3, update_bbox: boolean = true, update_length_percentages: boolean = true, commit: boolean = true) {
        if (idx < 0 || idx >= this.points_count) return;
        this.points_attribute_buffer_ref.expect.update_Data(point, idx, commit);
        if (update_length_percentages) this.update_LengthPercentages();
        if (update_bbox) this.update_BBox();
    }

    public get_Point(idx: number, target: Vector3): Vector3 {
        if (idx < 0 || idx >= this.points_count) throw new Error('<MultiLineGeometryResource> get_Point: index out of bound');
        return this.points_attribute_buffer_ref.expect.get_Data(idx, target);
    }

    public commit_Points() {
        this.points_attribute_buffer_ref.expect.commit_Data();
    }

    public set_Color(idx: number, color: Vector4, commit: boolean = true) {
        if (idx < 0 || idx >= this.points_count) return;
        this.colors_attribute_buffer_ref.expect.update_Data(color, idx, commit);
    }

    public get_Color(idx: number, target: Vector4): Vector4 {
        if (idx < 0 || idx >= this.points_count) throw new Error('<MultiLineGeometryResource> get_Color: index out of bound');
        return this.colors_attribute_buffer_ref.expect.get_Data(idx, target);
    }

    public commit_Colors() {
        this.colors_attribute_buffer_ref.expect.commit_Data();
    }

    public update_LengthPercentages() {
        const points_count = this.points_count;
        const last_point = Vector3.new;
        const point = Vector3.new;
        this.points_attribute_buffer_ref.expect.get_Data(0, last_point);
        this.length_percentages_attribute_buffer_ref.expect.update_Data(0, 0, false);
        let total_length = 0;
        for (let i = 1; i < points_count; i++) {
            this.points_attribute_buffer_ref.expect.get_Data(i, point);
            const length = last_point.distance_to(point);
            total_length += length;
            this.length_percentages_attribute_buffer_ref.expect.update_Data(total_length, i, false);
            last_point.copy(point);
        }
        if (total_length !== 0) {
            for (let i = 0; i < points_count; i++) {
                const length = this.length_percentages_attribute_buffer_ref.expect.get_Data(i);
                this.length_percentages_attribute_buffer_ref.expect.update_Data(length / total_length, i, false);
            }
        }
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 0, false);
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 1, false);
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 2, false);
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 3, false);
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 4, false);
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 5, false);
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 6, false);
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 7, false);
        this.total_length_attribute_buffer_ref.expect.commit_Data();
        this.length_percentages_attribute_buffer_ref.expect.commit_Data();
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
        this._bbox.enlarge(this._base_bbox, this._bbox_margin);
        this.geometry.set_BBox(this._base_bbox);
    }

    protected dispose(): void {
        this.points_attribute_buffer_ref.clear();
        this.points_start_attribute_buffer_ref.clear();
        this.points_end_attribute_buffer_ref.clear();
        this.colors_attribute_buffer_ref.clear();
        this.colors_start_attribute_buffer_ref.clear();
        this.colors_end_attribute_buffer_ref.clear();
        this.length_percentages_attribute_buffer_ref.clear();
        this.length_percentages_start_attribute_buffer_ref.clear();
        this.length_percentages_end_attribute_buffer_ref.clear();
        this.total_length_attribute_buffer_ref.clear();
        super.dispose();
    }
}

export class MultiSegmentGeometryResource extends GeometryResource {

    private readonly points_attribute_buffer_ref: Ref<RenderDeviceVector3AttributeBuffer<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly points_start_attribute_buffer_ref: Ref<RenderDeviceAttributeBufferView<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly points_end_attribute_buffer_ref: Ref<RenderDeviceAttributeBufferView<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly colors_attribute_buffer_ref: Ref<RenderDeviceVector4AttributeBuffer<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly colors_start_attribute_buffer_ref: Ref<RenderDeviceAttributeBufferView<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly colors_end_attribute_buffer_ref: Ref<RenderDeviceAttributeBufferView<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly length_percentages_attribute_buffer_ref: Ref<RenderDeviceFloatAttributeBuffer<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly length_percentages_start_attribute_buffer_ref: Ref<RenderDeviceAttributeBufferView<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly length_percentages_end_attribute_buffer_ref: Ref<RenderDeviceAttributeBufferView<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly total_length_attribute_buffer_ref: Ref<RenderDeviceFloatAttributeBuffer<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();

    private readonly _base_bbox: Box3 = Box3.create(Vector3.create(0, 0, 0), Vector3.create(1, 0, 0));
    private readonly _bbox: Box3 = Box3.new;
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

        this.points_attribute_buffer_ref.value = new RenderDeviceVector3AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, [Vector3.create(0, 0, 0), Vector3.create(1, 0, 0)], 1);
        this.points_start_attribute_buffer_ref.value = new RenderDeviceAttributeBufferView(this.render_server, this.points_attribute_buffer_ref.expect, 2, 0);
        this.points_end_attribute_buffer_ref.value = new RenderDeviceAttributeBufferView(this.render_server, this.points_attribute_buffer_ref.expect, 2, 1);

        this.colors_attribute_buffer_ref.value = new RenderDeviceVector4AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, [Vector4.create(1, 1, 1, 1), Vector4.create(1, 1, 1, 1)], 1);
        this.colors_start_attribute_buffer_ref.value = new RenderDeviceAttributeBufferView(this.render_server, this.colors_attribute_buffer_ref.expect, 2, 0);
        this.colors_end_attribute_buffer_ref.value = new RenderDeviceAttributeBufferView(this.render_server, this.colors_attribute_buffer_ref.expect, 2, 1);

        this.length_percentages_attribute_buffer_ref.value = new RenderDeviceFloatAttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, [0, 1], 1);
        this.length_percentages_start_attribute_buffer_ref.value = new RenderDeviceAttributeBufferView(this.render_server, this.length_percentages_attribute_buffer_ref.expect, 2, 0);
        this.length_percentages_end_attribute_buffer_ref.value = new RenderDeviceAttributeBufferView(this.render_server, this.length_percentages_attribute_buffer_ref.expect, 2, 1);

        this.total_length_attribute_buffer_ref.value = new RenderDeviceFloatAttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw, 8);
        this.geometry.set_Geometry(
            RenderStatePrimitiveType.Triangles,
            {
                position: PositionAttributeBuffer.get(this.config).expect,
                uv: UVAttributeBuffer.get(this.config).expect,
                start: {
                    attribute: this.points_start_attribute_buffer_ref.expect,
                    location: RenderServerGeometry.GeometryAttributeLocations.custom0,
                },
                end: {
                    attribute: this.points_end_attribute_buffer_ref.expect,
                    location: RenderServerGeometry.GeometryAttributeLocations.custom1,
                },
                percentage_start: {
                    attribute: this.length_percentages_start_attribute_buffer_ref.expect,
                    location: RenderServerGeometry.GeometryAttributeLocations.custom2,
                },
                percentage_end: {
                    attribute: this.length_percentages_end_attribute_buffer_ref.expect,
                    location: RenderServerGeometry.GeometryAttributeLocations.custom3,
                },
                length: {
                    attribute: this.total_length_attribute_buffer_ref.expect,
                    location: RenderServerGeometry.GeometryAttributeLocations.instance_transform,
                },
                color_start: {
                    attribute: this.colors_start_attribute_buffer_ref.expect,
                    location: RenderServerGeometry.GeometryAttributeLocations.instance_transform1,
                },
                color_end: {
                    attribute: this.colors_end_attribute_buffer_ref.expect,
                    location: RenderServerGeometry.GeometryAttributeLocations.instance_transform2,
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

    public get points_count() { return this.geometry.instance_count * 2; }

    public set_PointsCount(count: number, fill_default_color: boolean = true, commit_color: boolean = true) {
        count = Math.max(2, Math.floor(count));
        if (count % 2 !== 0) throw new Error('<MultiSegmentGeometryResource> set_PointsCount: point count is not even')
        if (this.geometry.instance_count === count / 2) return;
        this.geometry.instance_count = count / 2;
        this.points_attribute_buffer_ref.expect.alloc_Data(count);
        this.colors_attribute_buffer_ref.expect.alloc_Data(count);
        this.length_percentages_attribute_buffer_ref.expect.alloc_Data(count);
        if (fill_default_color) {
            const identity = Vector4.create(1, 1, 1, 1);
            for (let i = 0; i < count; i++) {
                this.colors_attribute_buffer_ref.expect.update_Data(identity, i, false);
            }
            if (commit_color) {
                this.colors_attribute_buffer_ref.expect.commit_Data();
            }
        }
    }

    public set_Point(idx: number, point: Vector3, update_bbox: boolean = true, update_length_percentages: boolean = true, commit: boolean = true) {
        if (idx < 0 || idx >= this.points_count) return;
        this.points_attribute_buffer_ref.expect.update_Data(point, idx, commit);
        if (update_length_percentages) this.update_LengthPercentages();
        if (update_bbox) this.update_BBox();
    }

    public get_Point(idx: number, target: Vector3): Vector3 {
        if (idx < 0 || idx >= this.points_count) throw new Error('<MultiLineGeometryResource> get_Point: index out of bound');
        return this.points_attribute_buffer_ref.expect.get_Data(idx, target);
    }

    public commit_Points() {
        this.points_attribute_buffer_ref.expect.commit_Data();
    }

    public set_Color(idx: number, color: Vector4, commit: boolean = true) {
        if (idx < 0 || idx >= this.points_count) return;
        this.colors_attribute_buffer_ref.expect.update_Data(color, idx, commit);
    }

    public get_Color(idx: number, target: Vector4): Vector4 {
        if (idx < 0 || idx >= this.points_count) throw new Error('<MultiLineGeometryResource> get_Color: index out of bound');
        return this.colors_attribute_buffer_ref.expect.get_Data(idx, target);
    }

    public commit_Colors() {
        this.colors_attribute_buffer_ref.expect.commit_Data();
    }

    public update_LengthPercentages() {
        const points_count = this.points_count;
        const point_0 = Vector3.new;
        const point_1 = Vector3.new;
        let total_length = 0;
        for (let i = 0; i < points_count; i += 2) {
            this.points_attribute_buffer_ref.expect.get_Data(i, point_0);
            this.points_attribute_buffer_ref.expect.get_Data(i + 1, point_1);
            const length = point_0.distance_to(point_1);
            total_length += length;
            this.length_percentages_attribute_buffer_ref.expect.update_Data(total_length, i / 2, false);
        }
        if (total_length !== 0) {
            const segment_count = points_count / 2;
            for (let i = 0; i < segment_count; i++) {
                const length = this.length_percentages_attribute_buffer_ref.expect.get_Data(i);
                this.length_percentages_attribute_buffer_ref.expect.update_Data(length / total_length, i, false);
            }
        }
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 0, false);
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 1, false);
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 2, false);
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 3, false);
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 4, false);
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 5, false);
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 6, false);
        this.total_length_attribute_buffer_ref.expect.update_Data(total_length, 7, false);
        this.total_length_attribute_buffer_ref.expect.commit_Data();
        this.length_percentages_attribute_buffer_ref.expect.commit_Data();
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
        this._bbox.enlarge(this._base_bbox, this._bbox_margin);
        this.geometry.set_BBox(this._base_bbox);
    }

    protected dispose(): void {
        this.points_attribute_buffer_ref.clear();
        this.points_start_attribute_buffer_ref.clear();
        this.points_end_attribute_buffer_ref.clear();
        this.colors_attribute_buffer_ref.clear();
        this.colors_start_attribute_buffer_ref.clear();
        this.colors_end_attribute_buffer_ref.clear();
        this.length_percentages_attribute_buffer_ref.clear();
        this.length_percentages_start_attribute_buffer_ref.clear();
        this.length_percentages_end_attribute_buffer_ref.clear();
        this.total_length_attribute_buffer_ref.clear();
        super.dispose();
    }
}