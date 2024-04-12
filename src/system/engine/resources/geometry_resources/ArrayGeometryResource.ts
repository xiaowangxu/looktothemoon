import { RenderStateBufferUsage, type RenderState, type RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { type RenderServerGeometryArray } from "../../render_server/RenderServerGeometry";
import { GeometryResource } from "./GeometryResource";
import { PackedArray, type PackedIndexArray } from "../../classes/value_wrappers/PackedArray";
import type { Box3 } from "@/system/fivepebble/geometries/Box3";
import type { ClassReader, ClassWriter } from "../../classes/saver_loader/ClassWriterReader";
import { RenderDeviceAttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import type { Config } from "../../ConfiguredObject";
import type { ClassSaver } from "../../classes/saver_loader/ClassSaverLoader";
import type { Rid } from "../../Rid";

export type ArrayGeometryResourceArray<RS extends RenderState<RS>> = {
    [key in string]:
    PackedArray |
    {
        attribute: PackedArray,
        location: number,
    } | undefined
};

export class ArrayGeometryResource extends GeometryResource {
    public static class_name: string = 'ArrayGeometryResource';

    constructor(config: Config) {
        super(config);
        this.geometry_ref.value = this.render_server.create_Geometry();
    }

    public clear_Geometry() {
        this.geometry.clear_Geometry();
    }

    public clear_Surface(index: number) {
        this.geometry.clear_Surface(index);
    }

    public set_Geometry(primitive_type: RenderStatePrimitiveType, array: ArrayGeometryResourceArray<WebGL2RenderState>, index?: PackedIndexArray, vertex_count?: number, usage?: RenderStateBufferUsage, bbox?: Box3, default_instance_transform_attribute: boolean = true) {
        const rs_usage = usage ?? RenderStateBufferUsage.StaticDraw;
        const rs_array: RenderServerGeometryArray<WebGL2RenderState> = {};
        for (const [key, val] of Object.entries(array)) {
            if (val === undefined) continue;
            if (val instanceof PackedArray) {
                rs_array[key] = val.get_RenderDeviceAttributeBuffer(this.render_server, rs_usage);
            }
            else {
                rs_array[key] = {
                    attribute: val.attribute.get_RenderDeviceAttributeBuffer(this.render_server, rs_usage),
                    location: val.location,
                };
            }
        }
        this.geometry.set_Geometry(primitive_type, rs_array, index?.get_RenderDeviceAttributeBuffer(this.render_server, rs_usage), vertex_count, bbox, default_instance_transform_attribute);
    }

    public add_Surface(offset: number, length: number) {
        this.geometry.add_Surface(offset, length);
    }

    public set_BBox(bbox: Box3) {
        this.geometry.set_BBox(bbox);
    }

    public update_Array(key: string, array: PackedArray, offset: number = 0, commit: boolean = true) {
        const attribute_buffer = this.geometry.get_AttributeBuffer(key);
        if (attribute_buffer !== undefined) {
            attribute_buffer.update_Data(array.data, offset, commit);
        }
    }

    // save / load

    public dump(writer: ClassWriter): void {
        throw new Error('<ArrayGeometryResource> dump: better not use ArrayGeometry\'s dump method for data generation, use ArrayGeometryResource.dump_Data instead');
    }

    public load(reader: ClassReader): void {
        const primitive_type = reader.get<RenderStatePrimitiveType>('primitive_type');
        const vertex_count = reader.get<number>('vertex_count');
        const usage = reader.get<RenderStateBufferUsage>('usage');
        const bbox = reader.get<Box3>('bbox');
        const attr_buf: Map<string, PackedArray> | undefined = reader.get('array');
        const attr_loc: Map<string, number> | undefined = reader.get('locations');
        if (bbox !== undefined && vertex_count !== undefined && primitive_type !== undefined && attr_buf !== undefined) {
            const array: ArrayGeometryResourceArray<WebGL2RenderState> = {};
            for (const [key, val] of attr_buf.entries()) {
                array[key] = (attr_loc?.has(key) ?? false) ? {
                    attribute: val,
                    location: attr_loc!.get(key)!
                } : val;
            }
            const index = reader.get<PackedIndexArray>('index');
            this.set_Geometry(primitive_type, array, index, vertex_count, usage, bbox);
            const surfaces = reader.get<number[]>('surfaces');
            if (surfaces) {
                const length = surfaces.length;
                for (let i = 0; i < length;) {
                    const offset = surfaces[i++];
                    const count = surfaces[i++];
                    this.add_Surface(offset, count);
                }
            }
        }
    }

    public static dump_Data(
        class_saver: ClassSaver,
        rid: Rid,
        primitive_type: RenderStatePrimitiveType,
        array: ArrayGeometryResourceArray<WebGL2RenderState>,
        index: PackedIndexArray | undefined,
        vertex_count: number | undefined,
        usage: RenderStateBufferUsage,
        bbox: Box3,
        surfaces: number[] | undefined,
        unique?: boolean,
        external?: string
    ) {
        const refid = class_saver.create_Data(rid, ArrayGeometryResource.class_name, unique, external);

        class_saver.add_Property(refid, 'primitive_type', primitive_type);

        const attr_buf: Map<string, PackedArray> = new Map();
        const attr_loc: Map<string, number> = new Map();
        for (const [key, val] of Object.entries(array)) {
            if (val === undefined) continue;
            if (val instanceof PackedArray) {
                attr_buf.set(key, val);
            }
            else {
                attr_buf.set(key, val.attribute);
                attr_loc.set(key, val.location);
            }
        }
        class_saver.add_Property(refid, 'array', attr_buf);
        class_saver.add_Property(refid, 'locations', attr_loc);

        class_saver.add_Property(refid, 'index', index);
        class_saver.add_Property(refid, 'vertex_count', vertex_count);
        class_saver.add_Property(refid, 'usage', usage === RenderStateBufferUsage.StaticDraw ? undefined : usage);
        class_saver.add_Property(refid, 'surfaces', surfaces);
        class_saver.add_Property(refid, 'bbox', bbox);
        return refid;
    }
}