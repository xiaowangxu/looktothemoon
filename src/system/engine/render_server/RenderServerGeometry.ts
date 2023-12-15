import { RenderDeviceObject } from "@/system/sliverofstraw/RenderDeviceObject";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { type RenderServerDevice } from "./RenderServer";
import type { WebGL2RenderStateVertexArray, WebGL2RenderStateVertexArrayView } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateVertexArray";
import type { RenderStateBuffer } from "@/system/sliverofstraw/render_state_objects/RenderStateBuffer";
import type { WebGL2RenderStateBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateBuffer";
import { Ref, RefArray } from "@/system/utils/RefCounted";
import { type RenderDeviceIndexAttributeBuffer, RenderDeviceAttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { type RenderState, type RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { Box3 } from "@/system/fivepebble/geometries/Box3";

const RenderServerGeometryAttributeLoctions = {
    position: 0,
    normal: 1,
    tangent: 2,
    color: 3,
    uv: 4,
    uv2: 5,
    instance_matrix: 6,
    instance_matrix1: 7,
    instance_matrix2: 8,
    instance_matrix3: 9,
};

type RenderServerGeometryArray<RS extends RenderState<RS>, Buffer extends RenderStateBuffer<RS> = RenderStateBuffer<RS>> = {
    [key in string]:
    RenderDeviceAttributeBuffer<RS, Buffer> |
    {
        attribute: RenderDeviceAttributeBuffer<RS, Buffer>,
        location: Exclude<number, (typeof RenderServerGeometryAttributeLoctions)[keyof typeof RenderServerGeometryAttributeLoctions]>
    }
};

export class RenderServerGeometry extends RenderDeviceObject<WebGL2RenderState> {
    protected readonly vertex_array_attributes_map: Map<string, { attribute: Ref<RenderDeviceAttributeBuffer<WebGL2RenderState>>, location: number }> = new Map();
    protected readonly vertex_array_ref: Ref<WebGL2RenderStateVertexArray> = new Ref();
    protected readonly vertex_array_index_ref: Ref<RenderDeviceIndexAttributeBuffer<WebGL2RenderState>> = new Ref();
    protected readonly vertex_array_groups_ref: RefArray<WebGL2RenderStateVertexArrayView> = new RefArray();
    protected _bbox: Box3 = new Box3();

    public get vertex_array() { return this.vertex_array_ref.expect; }

    public get is_indexed() { return !this.vertex_array_index_ref.is_empty; }
    public get has_geometry() { return !this.vertex_array_ref.is_empty; }
    public get has_surface() { return !this.vertex_array_ref.is_empty; }
    public get surface_count() {
        const length = this.vertex_array_groups_ref.length;
        if (length <= 0) return this.vertex_array_ref.is_empty ? 0 : 1;
        return length;
    }
    public get bbox() { return this._bbox; }

    constructor(render_device: RenderServerDevice) {
        super(render_device);
    }

    public clear_Geometry() {
        this.vertex_array_groups_ref.clear();
        this.vertex_array_ref.clear();
        for (const attri of this.vertex_array_attributes_map.values()) {
            attri.attribute.clear();
        }
        this.vertex_array_attributes_map.clear();
        this.vertex_array_index_ref.clear();
    }

    public clear_Surface(index: number) {
        this.vertex_array_groups_ref.remove(index);
    }

    public set_Geometry(primitive_type: RenderStatePrimitiveType, array: RenderServerGeometryArray<WebGL2RenderState>, index?: RenderDeviceIndexAttributeBuffer<WebGL2RenderState>, vertex_count?: number) {
        if (this.has_geometry) {
            this.clear_Geometry();
        }
        const count = index?.element_count ?? vertex_count;
        if (count === undefined) throw new Error('<RenderServerGeometry> set_Geometry: vertex count is known');
        const vertex_array = this.render_state.create_VertexArray(primitive_type, 0, count).expect();
        for (const [name, attribute] of Object.entries(array)) {
            if (attribute instanceof RenderDeviceAttributeBuffer) {
                // is system buffer
                const location: number | undefined = (RenderServerGeometryAttributeLoctions as Record<string, number>)[name];
                if (location === undefined) throw new Error('<RenderServerGeometry> set_Geometry: attribute\'s location is not system determinded');
                this.vertex_array_attributes_map.set(name, { attribute: new Ref(attribute), location });
                attribute.bound_VertexArray(vertex_array, location);
                attribute.toggle_VertexArray(vertex_array, location, true);
            }
            else {
                const { attribute: _attribute, location } = attribute;
                this.vertex_array_attributes_map.set(name, { attribute: new Ref(_attribute), location });
                this.render_state.set_VertexArrayAttributeBuffer(vertex_array, location, _attribute.buffer as WebGL2RenderStateBuffer);
            }
        }
        if (index !== undefined) {
            this.vertex_array_index_ref.value = index;
            this.render_state.set_VertexArrayIndexBuffer(vertex_array, index.buffer as WebGL2RenderStateBuffer);
        }
        this.vertex_array_ref.value = vertex_array;
    }

    public add_Surface(offset: number, length: number) {
        if (!this.has_geometry) throw new Error('<RenderServerGeometry> add_Surface: no geometry existed');
        const vertex_array_view = this.render_state.create_VertexArrayView(this.vertex_array_ref.expect, offset, length).expect();
        this.vertex_array_groups_ref.push(vertex_array_view);
    }

    public set_BBox(bbox: Box3) {
        this._bbox = bbox;
    }

    public dispose(): void {
        this.clear_Geometry();
    }
}