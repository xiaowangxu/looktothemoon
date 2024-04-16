import type { Viewport } from "../../nodes/Node";
import { RaycastSide } from "@/system/fivepebble/geometries/GeometryLike";
import type { ClassReader, ClassWriter } from "../../classes/saver_loader/ClassWriterReader";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import { PickingShape3DResource, type RaycastResult3 } from "./PickingShapeResource";


export class PickingBoxResource extends PickingShape3DResource {
    public static readonly class_name: string = "PickingBoxResource";

    static readonly #tmp_vector3_0 = Vector3.new;
    static readonly #tmp_vector3_1 = Vector3.new;

    public readonly preserve_global_transform: boolean = false;

    private _width: number = 1;
    public get width() { return this._width; }
    public set width(width: number) {
        if (this._width !== width) {
            this._width = width;
            this.trigger_Changed();
        }
    }

    private _height: number = 1;
    public get height() { return this._height; }
    public set height(height: number) {
        if (this._height !== height) {
            this._height = height;
            this.trigger_Changed();
        }
    }

    private _depth: number = 1;
    public get depth() { return this._depth; }
    public set depth(depth: number) {
        if (this._depth !== depth) {
            this._depth = depth;
            this.trigger_Changed();
        }
    }

    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3 | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
        let min = 0, max = 1;
        let axis = 0;
        let sign = 0;

        const position_start = PickingBoxResource.#tmp_vector3_0.set(-this.width / 2, -this.height / 2, -this.depth / 2);
        const position_end = PickingBoxResource.#tmp_vector3_1.set(this.width / 2, this.height / 2, this.depth / 2);

        for (let i = 0; i < 3; i++) {
            const seg_from = i === 0 ? from.x : (i === 1 ? from.y : from.z);
            const seg_to = i === 0 ? to.x : (i === 1 ? to.y : to.z);
            const box_begin = i === 0 ? position_start.x : (i === 1 ? position_start.y : position_start.z);
            const box_end = i === 0 ? position_end.x : (i === 1 ? position_end.y : position_end.z);
            let cmin, cmax;
            let csign;

            if (seg_from < seg_to) {
                if (seg_from > box_end || seg_to < box_begin) {
                    return undefined;
                }
                const length = seg_to - seg_from;
                cmin = (seg_from < box_begin) ? ((box_begin - seg_from) / length) : 0;
                cmax = (seg_to > box_end) ? ((box_end - seg_from) / length) : 1;
                csign = -1;

            }
            else {
                if (seg_to > box_end || seg_from < box_begin) {
                    return undefined;
                }
                const length = seg_to - seg_from;
                cmin = (seg_from > box_end) ? (box_end - seg_from) / length : 0;
                cmax = (seg_to < box_begin) ? (box_begin - seg_from) / length : 1;
                csign = 1;
            }

            if (cmin > min) {
                min = cmin;
                axis = i;
                sign = csign;
            }
            if (cmax < max) {
                max = cmax;
            }
            if (max < min) {
                return undefined;
            }
        }

        const rel = PickingBoxResource.#tmp_vector3_0.sub(to, from);

        const result = Vector3.new.add_Scaled(from, min, rel);
        const normal = Vector3.new;
        switch (axis) {
            case 0: normal.x = sign; break;
            case 1: normal.y = sign; break;
            case 2: normal.z = sign; break;
        }

        return { position: result, normal: normal };
    }

    protected dispose(): void { }

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
    }
}
