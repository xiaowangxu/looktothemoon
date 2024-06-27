import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { RID, type Rid } from "../../Rid";
import type { Viewport } from "../../nodes/Node";
import type { PickingArea3D } from "../../nodes/node3ds/physics3ds/PickingArea3D";
import { RaycastSide, type RaycastResult } from "@/system/fivepebble/geometries/GeometryLike";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";

type RaycastResult3 = RaycastResult<Vector3, Matrix3>;

export interface PickingShape3D {
    preserve_global_transform: boolean;
    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3 | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined;
}

class PickingArea {
    public readonly area: PickingArea3D;
    public layer: number = 0xffffffff;
    public priority: number = 0;
    public enabled: boolean = true;

    constructor(area: PickingArea3D) {
        this.area = area;
    }
}

class PickingShapeInstance {
    public shape: PickingShape3D | undefined;
    public area: PickingArea | undefined;
    public distance_offset: number = 0;
    public readonly global_transform: Matrix4 = Matrix4.new;
    public readonly global_transform_inverse: Matrix4 = Matrix4.new;
    public readonly global_normal_transform: Matrix3 = Matrix3.new;
}

export enum PickingOrder {
    Ordered, OffsetOrdered, Unordered
}

export class RayPickingOption {
    public readonly from: Vector3;
    public readonly to: Vector3;
    public readonly mask: number;
    public readonly camera: Camera3 | undefined;
    public readonly viewport: Viewport | undefined;
    public readonly order: PickingOrder;
    public readonly side: RaycastSide;

    constructor(from: Vector3, to: Vector3, mask: number, camera: Camera3 | undefined, viewport: Viewport | undefined, order: PickingOrder = PickingOrder.Ordered, side: RaycastSide = RaycastSide.Front) {
        this.from = from;
        this.to = to;
        this.mask = mask & 0xffffffff;
        this.camera = camera;
        this.viewport = viewport;
        this.order = order;
        this.side = side;
    }
}

export class RayPickingResult {
    public readonly area: PickingArea3D;
    public readonly position: Vector3;
    public readonly normal: Vector3;
    public readonly distance: number;
    public readonly offset_distance: number;
    public readonly priority: number;

    constructor(area: PickingArea3D, position: Vector3, normal: Vector3, distance: number, offset_distance: number, priority: number) {
        this.area = area;
        this.position = position;
        this.normal = normal;
        this.distance = distance;
        this.offset_distance = offset_distance;
        this.priority = priority;
    }
}

export class PickingWorld3D {

    static readonly #tmp_vector3_0 = Vector3.new;
    static readonly #tmp_vector3_1 = Vector3.new;
    static readonly #tmp_matrix4_0 = Matrix4.new;

    private readonly shapes_map: Map<Rid, PickingShapeInstance> = new Map();
    private readonly areas_map: Map<Rid, PickingArea> = new Map();

    public get is_empty(): boolean {
        return this.shapes_map.size <= 0 && this.areas_map.size <= 0;
    }

    public perform_RayPicking(option: RayPickingOption) {
        const { mask, from, to, camera, viewport, order, side } = option;
        const result: RayPickingResult[] = [];
        for (const shape_instance of this.shapes_map.values()) {
            const _from = PickingWorld3D.#tmp_vector3_0.copy(from);
            const _to = PickingWorld3D.#tmp_vector3_1.copy(to);
            const { shape, distance_offset, area, global_transform, global_transform_inverse, global_normal_transform } = shape_instance;
            if (shape !== undefined && area !== undefined && area.enabled && (area.layer & mask) !== 0) {
                const preserve_global_transform = shape.preserve_global_transform;
                const local_from = preserve_global_transform ? _from : _from.affine_transform(_from, global_transform_inverse);
                const local_to = preserve_global_transform ? _to : _to.affine_transform(_to, global_transform_inverse);
                const res = shape.perform_Raycast(local_from, local_to, global_transform, side, camera, viewport);
                if (res !== undefined) {
                    const _res_position = res.position;
                    const _res_normal = res.normal;
                    const position = preserve_global_transform ? _res_position : _res_position.affine_transform(_res_position, global_transform);
                    const normal = preserve_global_transform ? _res_normal : _res_normal.transform(_res_normal, global_normal_transform).normalize(_res_normal);
                    const distance = position.distance_to(from);
                    result.push(
                        new RayPickingResult(area.area, position, normal, distance, distance + distance_offset, area.priority)
                    );
                }
            }
        }
        if (order === PickingOrder.Ordered) {
            result.sort((a, b) => {
                const priority_a = a.priority;
                const priority_b = b.priority;
                if (priority_a < priority_b) return -1;
                if (priority_a > priority_b) return 1;
                return a.distance - b.distance;
            });
        }
        else if (order === PickingOrder.OffsetOrdered) {
            result.sort((a, b) => {
                const priority_a = a.priority;
                const priority_b = b.priority;
                if (priority_a < priority_b) return -1;
                if (priority_a > priority_b) return 1;
                return a.offset_distance - b.offset_distance;
            });
        }
        return result;
    }

    //#region Area

    protected area_getter_cache: [undefined | Rid, PickingArea | undefined] = [undefined, undefined];
    protected set_AreaGetterCache(rid: Rid, area: PickingArea) {
        this.area_getter_cache[0] = rid;
        this.area_getter_cache[1] = area;
    }
    protected reset_AreaGetterCache(rid: Rid) {
        if (this.area_getter_cache[0] === rid) {
            this.area_getter_cache[0] = undefined;
            this.area_getter_cache[1] = undefined;
        }
    }
    protected clear_AreaGetterCache() {
        this.area_getter_cache[0] = undefined;
        this.area_getter_cache[1] = undefined;
    }

    private get_Area(rid: Rid) {
        if (this.area_getter_cache[0] === rid) {
            return this.area_getter_cache[1];
        }
        const area = this.areas_map.get(rid);
        if (area !== undefined) {
            this.set_AreaGetterCache(rid, area);
        }
        return area;
    }

    public create_PickingArea(area: PickingArea3D): Rid {
        const rid = RID();
        const _area = new PickingArea(area);
        this.areas_map.set(rid, _area);
        return rid;
    }

    public free_PickingArea(rid: Rid) {
        const area = this.get_Area(rid);
        if (area === undefined) return;
        this.reset_AreaGetterCache(rid);
        this.areas_map.delete(rid);
    }

    public set_PickingAreaLayer(rid: Rid, layer: number) {
        const area = this.get_Area(rid);
        if (area === undefined) return;
        area.layer = layer;
    }

    public set_PickingAreaPriority(rid: Rid, priority: number) {
        const area = this.get_Area(rid);
        if (area === undefined) return;
        area.priority = priority;
    }

    public set_PickingAreaEnabled(rid: Rid, enabled: boolean) {
        const area = this.get_Area(rid);
        if (area === undefined) return;
        area.enabled = enabled;
    }

    //#endregion

    //#region Shape

    protected shape_getter_cache: [undefined | Rid, PickingShapeInstance | undefined] = [undefined, undefined];
    protected set_ShapeGetterCache(rid: Rid, shape: PickingShapeInstance) {
        this.shape_getter_cache[0] = rid;
        this.shape_getter_cache[1] = shape;
    }
    protected reset_ShapeGetterCache(rid: Rid) {
        if (this.shape_getter_cache[0] === rid) {
            this.shape_getter_cache[0] = undefined;
            this.shape_getter_cache[1] = undefined;
        }
    }
    protected clear_ShapeGetterCache() {
        this.shape_getter_cache[0] = undefined;
        this.shape_getter_cache[1] = undefined;
    }

    private get_Shape(rid: Rid) {
        if (this.shape_getter_cache[0] === rid) {
            return this.shape_getter_cache[1];
        }
        const shape = this.shapes_map.get(rid);
        if (shape !== undefined) {
            this.set_ShapeGetterCache(rid, shape);
        }
        return shape;
    }

    public create_PickingShapeInstance(): Rid {
        const rid = RID();
        const shape = new PickingShapeInstance();
        this.shapes_map.set(rid, shape);
        return rid;
    }

    public free_PickingShapeInstance(rid: Rid) {
        const shape = this.get_Shape(rid);
        if (shape === undefined) return;
        this.reset_ShapeGetterCache(rid);
        this.shapes_map.delete(rid);
    }

    public set_PickingShapeInstanceGlobalTransform(rid: Rid, global_transform: Matrix4) {
        const shape = this.get_Shape(rid);
        if (shape === undefined) return;
        shape.global_transform.copy(global_transform);
        shape.global_transform_inverse.inverse(global_transform);
        PickingWorld3D.#tmp_matrix4_0.transpose(shape.global_transform_inverse).get_Basis(shape.global_normal_transform);
    }

    public set_PickingShapeInstanceArea(rid: Rid, area_rid: Rid | undefined) {
        const shape = this.get_Shape(rid);
        if (shape === undefined) return;
        if (area_rid === undefined) {
            shape.area = undefined;
            return;
        }
        const area = this.get_Area(area_rid);
        if (area === undefined) return;
        shape.area = area;
    }

    public set_PickingShapeInstanceShape(rid: Rid, shape: PickingShape3D | undefined) {
        const _shape = this.get_Shape(rid);
        if (_shape === undefined) return;
        _shape.shape = shape;
    }

    public set_PickingShapeInstanceDistanceOffset(rid: Rid, distance_offset: number) {
        const _shape = this.get_Shape(rid);
        if (_shape === undefined) return;
        _shape.distance_offset = distance_offset;
    }

    //#endregion

    public dispose() {
        this.areas_map.clear();
        this.shapes_map.clear();
    }
}