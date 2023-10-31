import { Scene, Matrix4, Mesh, Object3D, Vector3 } from "three";
import { Rid, type RID } from "./Rid";
import { GeometryResource } from "./resources/GeometryResource";
import type { MaterialResource } from "./resources/MaterialResource";
import { SignalEmitter } from "../utils/SignalEmitter";
import type { Camera3D, Viewport } from "./SceneTree";
import type { PickingArea3D } from "./nodes/physics_3ds/PickingArea3D";

export class World3D {
    private readonly visual_world: VisualWorld3D = new VisualWorld3D();
    private readonly physics_world: PhysicsWorld3D = new PhysicsWorld3D();
    private readonly picking_world: PickingWorld3D = new PickingWorld3D();

    get_VisualWorld() {
        return this.visual_world;
    }

    get_PhysicsWorld() {
        return this.physics_world;
    }

    get_PickingWorld() {
        return this.picking_world;
    }

    dispose() {
        this.visual_world.dispose();
        this.physics_world.dispose();
        this.picking_world.dispose();
    }
}

// visual world

export class VisualWorld3D {
    private readonly scene: Scene = new Scene();
    private readonly instance_map: Map<string, Object3D> = new Map();

    // signal
    public signal_before_render: SignalEmitter<(viewport: Viewport, camera: Camera3D) => void> = new SignalEmitter();

    constructor() {
        this.scene.matrixAutoUpdate = false;
        this.scene.matrixWorldAutoUpdate = false;
    }

    public get_VisualScene() {
        return this.scene;
    }

    public trigger_BeforeRender(viewport: Viewport, camera: Camera3D) {
        this.signal_before_render.trigger(viewport, camera);
    }

    public get_Instance<T>(rid: RID) {
        const instance = this.instance_map.get(rid);
        if (instance === undefined) return undefined;
        return instance as T;
    }

    public dispose() {

    }

    // mesh

    public create_Mesh() {
        const rid = Rid();
        const mesh = new Mesh();
        (mesh.geometry as any) = undefined;
        (mesh.material as any) = undefined;
        mesh.matrixAutoUpdate = false;
        mesh.matrixWorldAutoUpdate = false;
        this.instance_map.set(rid, mesh);
        return rid;
    }

    private unref_MeshGeometry(mesh: Mesh) {
        if (mesh.geometry !== undefined && mesh.geometry.isRefCounted) {
            mesh.geometry.unref();
        }
    }

    private unref_MeshMaterial(mesh: Mesh) {
        if (mesh.material !== undefined) {
            if (mesh.material instanceof Array) {
                for (const mat of mesh.material) {
                    if (mat.isRefCounted) {
                        mat.unref();
                    }
                }
            }
            else if (mesh.material.isRefCounted) {
                mesh.material.unref();
            }
        }
    }

    public free_Mesh(rid: RID) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance === undefined) return;
        instance.removeFromParent();
        this.unref_MeshGeometry(instance);
        this.unref_MeshMaterial(instance);
        this.instance_map.delete(rid);
    }

    public set_MeshGeometry(rid: RID, geometry_resource: GeometryResource) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance) {
            this.unref_MeshGeometry(instance);
            const buffer_geometry = geometry_resource.get_BufferGeometry();
            instance.geometry = buffer_geometry;
            buffer_geometry.ref();
            if (instance.parent === null) {
                this.scene.add(instance);
            }
        }
    }

    public clear_MeshGeometry(rid: RID) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance && instance.geometry !== undefined) {
            this.unref_MeshGeometry(instance);
            (instance.geometry as any) = undefined;
            instance.removeFromParent();
        }
    }

    public set_MeshMaterial(rid: RID, material: MaterialResource | MaterialResource[]) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance) {
            this.unref_MeshMaterial(instance);
            if (material instanceof Array) {
                instance.material = material.map(m => {
                    const mat = m.get_Material();
                    mat.ref();
                    return mat;
                });
            }
            else {
                const mat = material.get_Material();
                instance.material = mat;
                mat.ref();
            }
        }
    }

    public clear_MeshMaterial(rid: RID) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance && instance.material !== undefined) {
            this.unref_MeshMaterial(instance);
            (instance.material as any) = undefined;
        }
    }

    public set_MeshGlobalTransform(rid: RID, transform: Matrix4) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance) {
            instance.matrixWorld.copy(transform);
        }
    }

    public set_MeshVisibility(rid: RID, visible: boolean) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance) {
            instance.visible = visible;
        }
    }

    public set_MeshLayer(rid: RID, layer: number) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance) {
            instance.layers.mask = layer;
        }
    }

    public set_MeshCastShadow(rid: RID, cast: boolean) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance) {
            instance.castShadow = cast;
        }
    }

    public set_MeshReceiveShadow(rid: RID, receive: boolean) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance) {
            instance.receiveShadow = receive;
        }
    }
}

// physics world

export interface RaycastResult {
    position: Vector3,
    normal: Vector3,
}

export class PhysicsWorld3D {
    public dispose() {

    }
}

// picking world

export interface PickingShape3D {
    perform_Raycast(from: Vector3, to: Vector3, side: PickingSide, camera: Camera3D | undefined): RaycastResult | undefined;
}

class PickingArea {
    public readonly area: PickingArea3D;
    public layer: number = 0xffffffff;
    public enabled: boolean = true;

    constructor(area: PickingArea3D) {
        this.area = area;
    }
}

class PickingShapeInstance {
    public shape: PickingShape3D | undefined;
    public area: PickingArea | undefined;
    public layer: number = 0xffffffff;
    public global_transform: Matrix4 = new Matrix4();
    public global_transform_inverse: Matrix4 = new Matrix4();
}

export enum PickingOrder {
    Ordered, Unordered,
}

export enum PickingSide {
    Front, Back, Double,
}

export class RayPickingOption {
    public readonly from: Vector3;
    public readonly to: Vector3;
    public readonly mask: number;
    public readonly camera: Camera3D | undefined;
    public readonly order: PickingOrder;
    public readonly side: PickingSide;

    constructor(from: Vector3, to: Vector3, mask: number, camera: Camera3D | undefined, order: PickingOrder = PickingOrder.Ordered, side: PickingSide = PickingSide.Front) {
        this.from = from.clone();
        this.to = to.clone();
        this.mask = mask & 0xffffffff;
        this.camera = camera;
        this.order = order;
        this.side = side;
    }
}

export class RayPickingResult {
    public readonly area: PickingArea3D;
    public readonly position: Vector3;
    public readonly normal: Vector3;
    public readonly distance: number;

    constructor(area: PickingArea3D, position: Vector3, normal: Vector3, distance: number) {
        this.area = area;
        this.position = position.clone();
        this.normal = normal.clone();
        this.distance = distance;
    }
}

export class PickingWorld3D {
    private readonly shape_map: Map<string, PickingShapeInstance> = new Map();
    private readonly area_map: Map<string, PickingArea> = new Map();

    private get_Area(rid: RID) {
        return this.area_map.get(rid);
    }

    private get_Shape(rid: RID) {
        return this.shape_map.get(rid);
    }

    public perform_RayPicking(option: RayPickingOption) {
        const { mask, from, to, camera, order, side } = option;
        const result: RayPickingResult[] = [];
        for (const shape_instance of this.shape_map.values()) {
            const { shape, area, global_transform, global_transform_inverse } = shape_instance;
            if (shape !== undefined && area !== undefined && area.enabled && (area.layer & mask) !== 0) {
                const local_from = from.clone().applyMatrix4(global_transform_inverse);
                const local_to = to.clone().applyMatrix4(global_transform_inverse);
                const res = shape.perform_Raycast(local_from, local_to, side, camera);
                if (res !== undefined) {
                    const position = res.position.clone().applyMatrix4(global_transform);
                    const normal = res.normal.clone().applyMatrix4(global_transform).normalize();
                    result.push(new RayPickingResult(area.area, position, normal, position.distanceTo(from)));
                }
            }
        }
        if (order === PickingOrder.Ordered) {
            result.sort((a, b) => a.distance - b.distance);
        }
        return result;
    }

    public create_PickingArea(area: PickingArea3D): RID {
        const rid = Rid();
        const _area = new PickingArea(area);
        this.area_map.set(rid, _area);
        return rid;
    }

    public set_PickingAreaLayer(rid: RID, layer: number) {
        const area = this.get_Area(rid);
        if (area === undefined) return;
        area.layer = layer;
    }

    public set_PickingAreaEnabled(rid: RID, enabled: boolean) {
        const area = this.get_Area(rid);
        if (area === undefined) return;
        area.enabled = enabled;
    }

    public free_PickingArea(rid: RID) {
        const area = this.get_Area(rid);
        if (area === undefined) return;
        this.area_map.delete(rid);
    }

    public create_PickingShapeInstance(): RID {
        const rid = Rid();
        const shape = new PickingShapeInstance();
        this.shape_map.set(rid, shape);
        return rid;
    }

    public free_PickingShapeInstance(rid: RID) {
        const shape = this.get_Shape(rid);
        if (shape === undefined) return;
        this.shape_map.delete(rid);
    }

    public set_PickingShapeInstanceGlobalTransform(rid: RID, global_transform: Matrix4) {
        const shape = this.get_Shape(rid);
        if (shape === undefined) return;
        shape.global_transform.copy(global_transform);
        shape.global_transform_inverse.copy(global_transform).invert();
    }

    public set_PickingShapeInstanceArea(rid: RID, area_rid: RID) {
        const shape = this.get_Shape(rid);
        const area = this.get_Area(area_rid);
        if (shape === undefined || area === undefined) return;
        shape.area = area;
    }

    public clear_PickingShapeInstanceArea(rid: RID) {
        const shape = this.get_Shape(rid);
        if (shape === undefined) return;
        shape.area = undefined;
    }

    public set_PickingShapeInstanceShape(rid: RID, shape: PickingShape3D) {
        const _shape = this.get_Shape(rid);
        if (_shape === undefined) return;
        _shape.shape = shape;
    }

    public clear_PickingShapeInstanceShape(rid: RID) {
        const _shape = this.get_Shape(rid);
        if (_shape === undefined) return;
        _shape.shape = undefined;
    }

    public dispose() {
        this.area_map.clear();
        this.shape_map.clear();
    }
}