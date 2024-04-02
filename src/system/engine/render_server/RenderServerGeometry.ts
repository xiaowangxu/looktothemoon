import { RenderDeviceObject } from "@/system/sliverofstraw/RenderDeviceObject";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { type RenderServerDevice } from "./RenderServer";
import type { WebGL2RenderStateVertexArray, WebGL2RenderStateVertexArrayView } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateVertexArray";
import type { RenderStateBuffer } from "@/system/sliverofstraw/render_state_objects/RenderStateBuffer";
import type { WebGL2RenderStateBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateBuffer";
import { Ref, RefArray } from "@/system/utils/RefCounted";
import { type RenderDeviceIndexAttributeBuffer, RenderDeviceAttributeBuffer, RenderDeviceAttributeBufferView } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { RenderStatePrimitiveType, type RenderState } from "@/system/sliverofstraw/RenderState";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import { SignalEmitter } from "@/system/utils/SignalEmitter";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";

export const RenderServerGeometryAttributeLocations = {
    position: 0,
    normal: 1,
    tangent: 2,
    bitangent: 3,
    color: 4,
    uv: 5,
    uv2: 6,
    instance_transform: 7,
    instance_transform1: 8,
    instance_transform2: 9,
    instance_transform3: 10,
    InternalMax: 11,
    custom0: 11,
    custom1: 12,
    custom2: 13,
    custom3: 14,
    custom4: 15,
    TotalMax: 15,
};

export type RenderServerGeometryArray<RS extends RenderState<RS>, Buffer extends RenderStateBuffer<RS> = RenderStateBuffer<RS>> = {
    [key in string]:
    RenderDeviceAttributeBuffer<RS, Buffer> |
    {
        attribute: RenderDeviceAttributeBuffer<RS, Buffer>,
        location: number,
    }
};

type IndexAttributeBuffer = RenderDeviceIndexAttributeBuffer<WebGL2RenderState> | RenderDeviceAttributeBufferView<WebGL2RenderState, RenderStateBuffer<WebGL2RenderState>, RenderDeviceIndexAttributeBuffer<WebGL2RenderState>>;

export class RenderServerGeometry extends RenderDeviceObject<WebGL2RenderState> {

    public static readonly GeometryAttributesCode = `layout(location = 0) in vec3 a_position;
    layout(location = 1) in vec3 a_normal;
    layout(location = 2) in vec3 a_tangent;
    layout(location = 3) in vec3 a_bitangent;
    layout(location = 4) in vec3 a_color;
    layout(location = 5) in vec2 a_uv;
    layout(location = 6) in vec2 a_uv2;
    layout(location = 7) in mat4 a_instance_transform;`;

    protected vertex_array_attributes_map: Map<string, { attribute: Ref<RenderDeviceAttributeBuffer<WebGL2RenderState>>, location: number }> = new Map();
    protected readonly vertex_array_ref: Ref<WebGL2RenderStateVertexArray> = new Ref();
    protected vertex_array_index_ref: Ref<IndexAttributeBuffer> = new Ref();
    protected readonly vertex_array_groups_ref: RefArray<WebGL2RenderStateVertexArrayView> = new RefArray();

    public get_Geometry() { return this.vertex_array_ref.value; }
    public get_Surface(index: number) { return this.vertex_array_groups_ref.get(index, false); }

    public get is_indexed() { return !this.vertex_array_index_ref.is_empty; }
    public get has_geometry() { return !this.vertex_array_ref.is_empty; }
    public get has_surface() { return this.vertex_array_groups_ref.length > 0; }
    public get surface_count() { return this.vertex_array_groups_ref.length; }

    protected _bbox: Box3 = Box3.new;
    public get bbox() { return this._bbox; }

    protected _bbox_pixel_enlargement: number = 0;
    public get bbox_pixel_enlargement() { return this._bbox_pixel_enlargement; }

    private _vertex_count: number | undefined;
    public get vertex_count() { return this._vertex_count; }
    private _primitive_type: RenderStatePrimitiveType | undefined;
    public get primitive_type() { return this._primitive_type; }

    public instance_count: number = 1;

    // signal
    public readonly singal_bbox_changed: SignalEmitter<(bbox: Box3) => void> = new SignalEmitter();

    constructor(render_device: RenderServerDevice) {
        super(render_device);
    }

    public get_AttributeBuffers() {
        if (!this.has_geometry) return {};
        const ans: RenderServerGeometryArray<WebGL2RenderState> = {};
        for (const [name, attr] of this.vertex_array_attributes_map.entries()) {
            // ignore default matrix
            if (attr.attribute.expect === (this.render_device as RenderServerDevice).identity_transform_attribute_buffer) continue;
            if ((RenderServerGeometryAttributeLocations as Record<string, number>)[name] !== undefined) {
                ans[name] = attr.attribute.expect;
            }
            else {
                ans[name] = { attribute: attr.attribute.expect, location: attr.location as never };
            }
        }
        return ans;
    }

    public get_Surfaces() {
        if (!this.has_surface) return [];
        const ans: { offset: number, length: number }[] = [];
        for (const vertex_array_view of this.vertex_array_groups_ref.value) {
            if (vertex_array_view !== undefined) {
                ans.push({
                    offset: vertex_array_view.offset,
                    length: vertex_array_view.count,
                });
            }
        }
        return ans;
    }

    public get_AttributeBuffer(name: string) {
        return this.vertex_array_attributes_map.get(name)?.attribute.expect;
    }

    public get_AttributeBufferLocation(name: string) {
        return this.vertex_array_attributes_map.get(name)?.location;
    }

    public get_IndexAttributeBuffer() {
        return this.vertex_array_index_ref.value;
    }

    private clear_GeometryInternal() {
        this.vertex_array_groups_ref.clear();
        this.vertex_array_ref.clear();
        for (const attri of this.vertex_array_attributes_map.values()) {
            attri.attribute.clear();
        }
        this.vertex_array_attributes_map.clear();
        this.vertex_array_index_ref.clear();
    }

    static readonly #zero_vec3: Vector3 = new Vector3(0, 0, 0);

    public clear_Geometry() {
        this.clear_GeometryInternal();
        this._bbox.set(RenderServerGeometry.#zero_vec3, RenderServerGeometry.#zero_vec3);
        this.singal_bbox_changed.trigger(this._bbox);
    }

    public clear_Surface(index: number) {
        this.vertex_array_groups_ref.remove(index);
    }

    public set_Geometry(primitive_type: RenderStatePrimitiveType, array: RenderServerGeometryArray<WebGL2RenderState>, index?: IndexAttributeBuffer, vertex_count?: number, bbox?: Box3, default_instance_transform_attribute: boolean = true) {
        const count = vertex_count ?? index?.element_count;
        if (count === undefined) throw new Error('<RenderServerGeometry> set_Geometry: vertex count is known');
        const vertex_array = this.render_state.create_VertexArray(primitive_type, 0, count).expect();
        this._primitive_type = primitive_type;
        this._vertex_count = count;
        const vertex_array_attributes_map = new Map();
        for (const [name, attribute] of Object.entries(array)) {
            if (attribute instanceof RenderDeviceAttributeBuffer) {
                // is system buffer
                const location: number | undefined = (RenderServerGeometryAttributeLocations as Record<string, number>)[name];
                if (location === undefined) throw new Error('<RenderServerGeometry> set_Geometry: attribute\'s location is not system determinded');
                vertex_array_attributes_map.set(name, { attribute: new Ref(attribute), location });
                attribute.bound_VertexArray(vertex_array, location);
                attribute.toggle_VertexArray(vertex_array, location, true);
            }
            else {
                const { attribute: _attribute, location } = attribute;
                vertex_array_attributes_map.set(name, { attribute: new Ref(_attribute), location });
                _attribute.bound_VertexArray(vertex_array, location);
                _attribute.toggle_VertexArray(vertex_array, location, true);
            }
        }
        if (default_instance_transform_attribute && array.instance_transform === undefined) {
            const location = RenderServerGeometryAttributeLocations.instance_transform;
            const attribute = (this.render_device as RenderServerDevice).identity_transform_attribute_buffer;
            vertex_array_attributes_map.set('instance_transform', { attribute: new Ref(attribute), location });
            attribute.bound_VertexArray(vertex_array, location);
            attribute.toggle_VertexArray(vertex_array, location, true);
        }
        const vertex_array_index_ref: Ref<IndexAttributeBuffer> = new Ref();
        if (index !== undefined) {
            vertex_array_index_ref.value = index;
            this.render_state.set_VertexArrayIndexBuffer(vertex_array, index.buffer as WebGL2RenderStateBuffer);
        }
        this.clear_GeometryInternal();
        this.vertex_array_attributes_map = vertex_array_attributes_map;
        this.vertex_array_index_ref = vertex_array_index_ref;
        this.vertex_array_ref.value = vertex_array;
        if (bbox !== undefined) {
            this.set_BBox(bbox);
        }
        else {
            this._bbox.set(RenderServerGeometry.#zero_vec3, RenderServerGeometry.#zero_vec3);
            this.singal_bbox_changed.trigger(this._bbox);
        }
    }

    public add_Surface(offset: number, length: number) {
        if (!this.has_geometry) throw new Error('<RenderServerGeometry> add_Surface: no geometry existed');
        const vertex_array_view = this.render_state.create_VertexArrayView(this.vertex_array_ref.expect, offset, length).expect();
        this.vertex_array_groups_ref.push(vertex_array_view);
    }

    public set_BBox(bbox: Box3) {
        this._bbox.copy(bbox);
        this.singal_bbox_changed.trigger(this._bbox);
    }

    public set_BBoxPixelEnlargement(amount: number) {
        this._bbox_pixel_enlargement = Math.max(0, Math.min(65536, amount));
    }

    public dispose(): void {
        this.clear_GeometryInternal();
        this.singal_bbox_changed.clear();
    }
}