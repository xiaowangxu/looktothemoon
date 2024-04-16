import { RenderDeviceIndexAttributeBuffer, RenderDeviceVector2AttributeBuffer, RenderDeviceVector3AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import type { ClassReader, ClassWriter } from "../../../classes/saver_loader/ClassWriterReader";
import type { Config } from "../../../ConfiguredObject";
import { Ref } from "@/system/utils/RefCounted";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { PrimitiveGeometryResource } from "./PrimitiveGeometryResource";

export class BoxGeometryResource extends PrimitiveGeometryResource {
    public static class_name: string = 'BoxGeometryResource';

    private readonly position_buffer_ref: Ref<RenderDeviceVector3AttributeBuffer<WebGL2RenderState>> = new Ref(new RenderDeviceVector3AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw));
    private readonly normal_buffer_ref: Ref<RenderDeviceVector3AttributeBuffer<WebGL2RenderState>> = new Ref(new RenderDeviceVector3AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw));
    private readonly uv_buffer_ref: Ref<RenderDeviceVector2AttributeBuffer<WebGL2RenderState>> = new Ref(new RenderDeviceVector2AttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw));
    private readonly index_buffer_ref: Ref<RenderDeviceIndexAttributeBuffer<WebGL2RenderState>> = new Ref(new RenderDeviceIndexAttributeBuffer(this.render_server, RenderStateBufferUsage.StaticDraw));

    protected _width: number = 1;
    protected _height: number = 1;
    protected _depth: number = 1;

    public get width() { return this._width; }
    public get height() { return this._height; }
    public get depth() { return this._depth; }

    public set width(width: number) {
        width = Math.max(width, 0);
        if (this._width !== width) {
            this._width = width;
        }
    }
    public set height(height: number) {
        height = Math.max(height, 0);
        if (this._height !== height) {
            this._height = height;
        }
    }
    public set depth(depth: number) {
        depth = Math.max(depth, 0);
        if (this._depth !== depth) {
            this._depth = depth;
        }
    }

    constructor(config: Config) {
        super(config);
        this.geometry.set_Geometry(
            RenderStatePrimitiveType.Triangles,
            {
                position: this.position_buffer_ref.expect,
                normal: this.normal_buffer_ref.expect,
                uv: this.uv_buffer_ref.expect,
            },
            this.index_buffer_ref.expect,
            36,
            undefined
        );
        const index_buffer_per_element_byte_count = this.index_buffer_ref.expect.per_element_byte_count;
        this.geometry.add_Surface(0 * index_buffer_per_element_byte_count, 6);
        this.geometry.add_Surface(6 * index_buffer_per_element_byte_count, 6);
        this.geometry.add_Surface(12 * index_buffer_per_element_byte_count, 6);
        this.geometry.add_Surface(18 * index_buffer_per_element_byte_count, 6);
        this.geometry.add_Surface(24 * index_buffer_per_element_byte_count, 6);
        this.geometry.add_Surface(30 * index_buffer_per_element_byte_count, 6);
        this.build();
    }

    public build() {
        const half_w = this.width / 2;
        const half_h = this.height / 2;
        const half_d = this.depth / 2;
        this.position_buffer_ref.expect.alloc_Data(
            new Float32Array([
                // top
                half_w, half_h, half_d,
                half_w, half_h, -half_d,
                -half_w, half_h, half_d,
                -half_w, half_h, -half_d,
                // bottom
                half_w, -half_h, half_d,
                half_w, -half_h, -half_d,
                -half_w, -half_h, half_d,
                -half_w, -half_h, -half_d,
                // front
                half_w, -half_h, half_d,
                half_w, half_h, half_d,
                -half_w, -half_h, half_d,
                -half_w, half_h, half_d,
                // back
                half_w, -half_h, -half_d,
                half_w, half_h, -half_d,
                -half_w, -half_h, -half_d,
                -half_w, half_h, -half_d,
                // right
                half_w, -half_h, -half_d,
                half_w, half_h, -half_d,
                half_w, -half_h, half_d,
                half_w, half_h, half_d,
                // left
                -half_w, -half_h, -half_d,
                -half_w, half_h, -half_d,
                -half_w, -half_h, half_d,
                -half_w, half_h, half_d,
            ])
        );
        this.normal_buffer_ref.expect.alloc_Data(
            new Float32Array([
                // top
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
                // bottom
                0, -1, 0,
                0, -1, 0,
                0, -1, 0,
                0, -1, 0,
                // front
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                // back
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                // right
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                // left
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
            ])
        );
        this.uv_buffer_ref.expect.alloc_Data(
            new Float32Array([
                // top
                1, 0,
                1, 1,
                0, 0,
                0, 1,
                // bottom
                1, 1,
                1, 0,
                0, 1,
                0, 0,
                // front
                1, 0,
                1, 1,
                0, 0,
                0, 1,
                // back
                1, 1,
                1, 0,
                0, 1,
                0, 0,
                // right
                1, 0,
                1, 1,
                0, 0,
                0, 1,
                // left
                0, 0,
                0, 1,
                1, 0,
                1, 1,
            ])
        );
        this.index_buffer_ref.expect.alloc_Data(
            new Uint32Array([
                // top
                0, 1, 2, 2, 1, 3,
                // bottom
                4, 6, 5, 5, 6, 7,
                // front
                8, 9, 10, 10, 9, 11,
                // back
                12, 14, 13, 13, 14, 15,
                // right
                16, 17, 18, 18, 17, 19,
                // left
                20, 22, 21, 21, 22, 23,
            ])
        );
        PrimitiveGeometryResource.$tmp_box3_for_bbox_0.min.set(-half_w, -half_h, -half_d);
        PrimitiveGeometryResource.$tmp_box3_for_bbox_0.max.set(half_w, half_h, half_d);
        this.geometry.set_BBox(PrimitiveGeometryResource.$tmp_box3_for_bbox_0);
    }

    protected dispose(): void {
        this.position_buffer_ref.clear();
        this.normal_buffer_ref.clear();
        this.uv_buffer_ref.clear();
        this.index_buffer_ref.clear();
    }

    // save / load
    public dump(writer: ClassWriter): void {
        writer.property('width', this.width);
        writer.property('height', this.height);
        writer.property('depth', this.depth);
    }

    public load(reader: ClassReader): void {
        this.width = reader.get<number>('width') ?? 1;
        this.height = reader.get<number>('height') ?? 1;
        this.depth = reader.get<number>('depth') ?? 1;
        this.build();
    }
}
