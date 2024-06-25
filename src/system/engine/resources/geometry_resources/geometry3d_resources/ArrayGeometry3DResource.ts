import type { Box3 } from "@/system/fivepebble/geometries/Box3";
import { Geometry3DResource } from "./Geometry3DResource";
import type { WebGPURenderElementVertexArrayBuffer } from "@/system/sliverofstraw/render_element_object/vertex_array/WebGPURenderElementVertexArray";
import { WebGPURenderStatePrimitiveType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import { RenderServerGeometryAttributeLayoutBuffer } from "@/system/engine/render_server/geometry/RenderServerGeometryDefination";
import type { ClassSaver } from "@/system/engine/classes/saver_loader/ClassSaverLoader";
import type { Rid } from "@/system/engine/Rid";
import { PackedIndexArray, PackedArray } from "@/system/engine/classes/value_wrappers/PackedArray";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import type { ClassReader } from "@/system/engine/classes/saver_loader/ClassWriterReader";
import { RenderServer } from "@/system/engine/render_server/RenderServer";

export class ArrayGeometry3DResource extends Geometry3DResource {

    static class_name: string = 'ArrayGeometry3DResource' as const;

    constructor() {
        super();
    }

    public clear_Geometry() {
        this.render_server_geometry.clear_Geometry(true);
    }

    public set_IndexBuffer(buffer: WebGPURenderElementVertexArrayBuffer) {
        this.render_server_geometry.set_IndexBuffer(buffer);
    }

    public set_VertexLength(length: number) {
        this.render_server_geometry.set_VertexLength(length);
    }

    public set_PrimitiveType(type: WebGPURenderStatePrimitiveType) {
        this.render_server_geometry.set_PrimitiveType(type);
    }

    public set_AttributeBuffer(attribute: RenderServerGeometryAttributeLayoutBuffer, buffer: WebGPURenderElementVertexArrayBuffer) {
        this.render_server_geometry.set_AttributeBuffer(attribute, buffer);
    }

    public add_Surface(offset: number, length: number) {
        this.render_server_geometry.add_Surface(offset, length);
    }

    public set_BBox(box3: Box3) {
        this.render_server_geometry.set_BBox(box3);
    }

    protected dispose(): void {
        super.dispose();
    }

    // saver loader

    public static dump_Data(
        class_saver: ClassSaver,
        rid: Rid,
        primitive_type: WebGPURenderStatePrimitiveType,
        usage: WebGPURenderStateBufferUsage,
        attributes: { attribute: RenderServerGeometryAttributeLayoutBuffer, buffer: PackedArray | undefined }[],
        index: PackedIndexArray | undefined,
        vertex_length: number | undefined,
        bbox: Box3,
        surfaces?: { offset: number, length: number }[],
        unique?: boolean,
        external?: string
    ) {
        const refid = class_saver.create_Data(rid, ArrayGeometry3DResource.class_name, unique, external);

        const attr_buffs: Map<number, PackedArray> = new Map();
        const attr_attrs: Map<number, RenderServerGeometryAttributeLayoutBuffer> = new Map();
        let idx = 0;
        for (const { attribute, buffer } of attributes) {
            if (buffer === undefined) continue;
            attr_buffs.set(idx, buffer);
            attr_attrs.set(idx, attribute);
            idx++;
        }

        class_saver.add_Property(refid, 'primitive_type', primitive_type);
        class_saver.add_Property(refid, 'usage', usage);
        class_saver.add_Property(refid, 'index', index);
        class_saver.add_Property(refid, 'attributes', attr_attrs);
        class_saver.add_Property(refid, 'buffers', attr_buffs);
        class_saver.add_Property(refid, 'vertex_length', vertex_length);
        class_saver.add_Property(refid, 'surfaces', surfaces === undefined ? undefined : surfaces.map(i => [i.offset, i.length]).flat(1));
        class_saver.add_Property(refid, 'bbox', bbox);

        return refid;
    }

    public load(reader: ClassReader): void {
        const primitive_type = reader.get<WebGPURenderStatePrimitiveType>('primitive_type');
        const usage = reader.get<WebGPURenderStateBufferUsage>('usage');
        const index = reader.get<PackedIndexArray>('index');
        const attr_attrs = reader.get<Map<number, RenderServerGeometryAttributeLayoutBuffer>>('attributes');
        const attr_buffs = reader.get<Map<number, PackedArray>>('buffers');
        const vertex_length = reader.get<number>('vertex_length');
        const surfaces = reader.get<number[]>('surfaces');
        const bbox = reader.get<Box3>('bbox');

        if (primitive_type === undefined || usage === undefined || vertex_length === undefined) throw new Error(`<ArrayGeometry3DResource> load: ArrayGeometry's data is not complete`);

        this.render_server_geometry.clear_Geometry();
        this.render_server_geometry.set_PrimitiveType(primitive_type);
        this.render_server_geometry.set_VertexLength(vertex_length);

        if (index !== undefined) {
            this.render_server_geometry.set_IndexBuffer(index.get_RenderStateBuffer(RenderServer.render_state, WebGPURenderStateBufferType.Index, usage));
        }

        if (attr_attrs !== undefined && attr_buffs !== undefined) {
            for (const [index, attribute] of attr_attrs) {
                const buffer = attr_buffs.get(index);
                if (buffer !== undefined) {
                    this.render_server_geometry.set_AttributeBuffer(attribute, buffer.get_RenderStateBuffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, usage));
                }
            }
        }

        if (surfaces !== undefined && surfaces.length % 2 === 0) {
            const surface_count = surfaces.length / 2;
            for (let i = 0; i < surface_count; i++) {
                const offset = surfaces[i * 2];
                const length = surfaces[i * 2 + 1];
                this.render_server_geometry.add_Surface(offset, length);
            }
        }

        if (bbox !== undefined) {
            this.render_server_geometry.set_BBox(bbox);
        }
        else {
            Geometry3DResource.$tmp_box3_for_bbox.min.set(0, 0, 0);
            Geometry3DResource.$tmp_box3_for_bbox.max.set(0, 0, 0);
            this.render_server_geometry.set_BBox(Geometry3DResource.$tmp_box3_for_bbox);
        }
    }
}