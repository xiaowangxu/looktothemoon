import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { RID, type Rid } from "../../Rid";
import type { Viewport } from "../../nodes/Node";
import type { Camera3D } from "../../nodes/node3ds/camera3ds/Camera3D";
import type { PickingArea3D } from "../../nodes/node3ds/physics3ds/PickingArea3D";
import { RaycastSide, type RaycastResult } from "@/system/fivepebble/geometries/GeometryLike";
import { ConfiguredObject, type Config } from "../../ConfiguredObject";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";

type RaycastResult3 = RaycastResult<Vector3, Matrix3>;

export interface PickingShape3D {
    preserve_global_transform: boolean;
    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3D | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined;
}

class PickingArea extends ConfiguredObject {
    public readonly area: PickingArea3D;
    public layer: number = 0xffffffff;
    public priority: number = 0;
    public enabled: boolean = true;

    constructor(config: Config, area: PickingArea3D) {
        super(config);
        this.area = area;
    }
}

class PickingShapeInstance extends ConfiguredObject {
    public shape: PickingShape3D | undefined;
    public area: PickingArea | undefined;
    public distance_offset: number = 0;
    public readonly global_transform: Matrix4 = Matrix4.new;
    public readonly global_transform_inverse: Matrix4 = Matrix4.new;
}

export enum PickingOrder {
    Ordered, OffsetOrdered, Unordered
}

export class RayPickingOption {
    public readonly from: Vector3;
    public readonly to: Vector3;
    public readonly mask: number;
    public readonly camera: Camera3D | undefined;
    public readonly viewport: Viewport | undefined;
    public readonly order: PickingOrder;
    public readonly side: RaycastSide;

    constructor(from: Vector3, to: Vector3, mask: number, camera: Camera3D | undefined, viewport: Viewport | undefined, order: PickingOrder = PickingOrder.Ordered, side: RaycastSide = RaycastSide.Front) {
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
        this.position = position.clone();
        this.normal = normal.clone();
        this.distance = distance;
        this.offset_distance = offset_distance;
        this.priority = priority;
    }
}

export class PickingWorld3D extends ConfiguredObject {

    static readonly #tmp_vector3_0 = Vector3.new;
    static readonly #tmp_vector3_1 = Vector3.new;

    private readonly shape_map: Map<Rid, PickingShapeInstance> = new Map();
    private readonly area_map: Map<Rid, PickingArea> = new Map();

    private get_Area(rid: Rid) {
        return this.area_map.get(rid);
    }

    private get_Shape(rid: Rid) {
        return this.shape_map.get(rid);
    }

    public perform_RayPicking(option: RayPickingOption) {
        const { mask, from, to, camera, viewport, order, side } = option;
        const result: RayPickingResult[] = [];
        for (const shape_instance of this.shape_map.values()) {
            const _from = PickingWorld3D.#tmp_vector3_0.copy(from);
            const _to = PickingWorld3D.#tmp_vector3_1.copy(to);
            const { shape, distance_offset, area, global_transform, global_transform_inverse } = shape_instance;
            if (shape !== undefined && area !== undefined && area.enabled && (area.layer & mask) !== 0) {
                const preserve_global_transform = shape.preserve_global_transform;
                const local_from = preserve_global_transform ? _from : _from.apply_Matrix4(_from, global_transform_inverse);
                const local_to = preserve_global_transform ? _to : _to.apply_Matrix4(_to, global_transform_inverse);
                const res = shape.perform_Raycast(local_from, local_to, global_transform, side, camera, viewport);
                if (res !== undefined) {
                    const _res_position = res.position.clone();
                    const _res_normal = res.normal.clone();
                    const position = preserve_global_transform ? _res_position : _res_position.apply_Matrix4(_res_position, global_transform);
                    const normal = preserve_global_transform ? _res_normal : _res_normal.apply_Matrix4(_res_normal, global_transform).normalize(_res_normal);
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

    public create_PickingArea(area: PickingArea3D): Rid {
        const rid = RID();
        const _area = new PickingArea(this.config, area);
        this.area_map.set(rid, _area);
        return rid;
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

    public free_PickingArea(rid: Rid) {
        const area = this.get_Area(rid);
        if (area === undefined) return;
        this.area_map.delete(rid);
    }

    public create_PickingShapeInstance(): Rid {
        const rid = RID();
        const shape = new PickingShapeInstance(this.config);
        this.shape_map.set(rid, shape);
        return rid;
    }

    public free_PickingShapeInstance(rid: Rid) {
        const shape = this.get_Shape(rid);
        if (shape === undefined) return;
        this.shape_map.delete(rid);
    }

    public set_PickingShapeInstanceGlobalTransform(rid: Rid, global_transform: Matrix4) {
        const shape = this.get_Shape(rid);
        if (shape === undefined) return;
        shape.global_transform.copy(global_transform);
        shape.global_transform_inverse.inverse(global_transform);
    }

    public set_PickingShapeInstanceArea(rid: Rid, area_rid: Rid) {
        const shape = this.get_Shape(rid);
        const area = this.get_Area(area_rid);
        if (shape === undefined || area === undefined) return;
        shape.area = area;
    }

    public clear_PickingShapeInstanceArea(rid: Rid) {
        const shape = this.get_Shape(rid);
        if (shape === undefined) return;
        shape.area = undefined;
    }

    public set_PickingShapeInstanceShape(rid: Rid, shape: PickingShape3D) {
        const _shape = this.get_Shape(rid);
        if (_shape === undefined) return;
        _shape.shape = shape;
    }

    public set_PickingShapeInstanceDistanceOffset(rid: Rid, distance_offset: number) {
        const _shape = this.get_Shape(rid);
        if (_shape === undefined) return;
        _shape.distance_offset = distance_offset;
    }

    public clear_PickingShapeInstanceShape(rid: Rid) {
        const _shape = this.get_Shape(rid);
        if (_shape === undefined) return;
        _shape.shape = undefined;
    }

    public dispose() {
        this.area_map.clear();
        this.shape_map.clear();
    }
}