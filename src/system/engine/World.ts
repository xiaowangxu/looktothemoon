import { Scene, Matrix4, Mesh, Object3D, Vector3, Euler, AmbientLight, HemisphereLight, DirectionalLight, PointLight, Light, Color, SpotLight, Quaternion } from "three";
import { Rid, type RID } from "./Rid";
import { GeometryResource } from "./resources/GeometryResource";
import type { MaterialResource } from "./resources/MaterialResource";
import { SignalEmitter } from "../utils/SignalEmitter";
import type { Camera3D, Viewport } from "./SceneTree";
import type { PickingArea3D } from "./nodes/physics_3ds/PickingArea3D";

import { DirectionalLightHelper } from 'three';

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
        for (const instance of this.instance_map.values()) {
            if (instance instanceof Mesh) {
                instance.removeFromParent();
                this.unref_MeshGeometry(instance);
                this.unref_MeshMaterial(instance);
            }
            else if (instance instanceof Light) {
                instance.removeFromParent();
                instance.dispose();
            }
        }
        this.instance_map.clear();
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

    // light

    public create_AmbientLight() {
        const rid = Rid();
        const light = new AmbientLight();
        light.matrixAutoUpdate = false;
        light.matrixWorldAutoUpdate = false;
        this.instance_map.set(rid, light);
        this.scene.add(light);
        return rid;
    }

    public create_HemisphereLight() {
        const rid = Rid();
        const light = new HemisphereLight();
        light.matrixAutoUpdate = false;
        light.matrixWorldAutoUpdate = false;
        light.updateMatrix();
        light.updateMatrixWorld(true);
        this.instance_map.set(rid, light);
        this.scene.add(light);
        return rid;
    }

    public create_DirectionalLight() {
        const rid = Rid();
        const light = new DirectionalLight();
        light.matrixAutoUpdate = false;
        light.matrixWorldAutoUpdate = false;
        light.position.set(0, 0, 0);
        light.updateMatrix();
        light.updateMatrixWorld(true);
        light.target.matrixAutoUpdate = false;
        light.target.matrixWorldAutoUpdate = false;
        light.target.updateMatrix();
        light.target.updateMatrixWorld(true);
        this.instance_map.set(rid, light);
        this.scene.add(light);
        return rid;
    }

    public create_SpotLight() {
        const rid = Rid();
        const light = new SpotLight();
        light.matrixAutoUpdate = false;
        light.matrixWorldAutoUpdate = false;
        light.position.set(0, 0, 0);
        light.updateMatrix();
        light.updateMatrixWorld(true);
        light.target.matrixAutoUpdate = false;
        light.target.matrixWorldAutoUpdate = false;
        light.target.updateMatrix();
        light.target.updateMatrixWorld(true);
        this.instance_map.set(rid, light);
        this.scene.add(light);
        return rid;
    }

    public create_PointLight() {
        const rid = Rid();
        const light = new PointLight();
        light.matrixAutoUpdate = false;
        light.matrixWorldAutoUpdate = false;
        light.updateMatrix();
        light.updateMatrixWorld(true);
        this.instance_map.set(rid, light);
        this.scene.add(light);
        return rid;
    }

    public set_HemisphereLightGroundColor(rid: RID, ground_color: Color) {
        const instance = this.get_Instance<HemisphereLight>(rid);
        if (instance) {
            instance.groundColor.copy(ground_color);
        }
    }

    public set_HemisphereLightUp(rid: RID, up: Vector3) {
        const instance = this.get_Instance<HemisphereLight>(rid);
        if (instance) {
            instance.position.copy(up);
            instance.updateMatrix();
            instance.updateMatrixWorld(true);
        }
    }

    public set_DirectionalLightRotation(rid: RID, rotation: Euler) {
        const instance = this.get_Instance<DirectionalLight>(rid);
        if (instance) {
            instance.target.position.copy(new Vector3(0, -1, 0).applyEuler(rotation));
            instance.target.updateMatrix();
            instance.target.updateMatrixWorld(true);
        }
    }

    public set_PointLightDecay(rid: RID, decay: number) {
        const instance = this.get_Instance<PointLight>(rid);
        if (instance) {
            instance.decay = decay;
        }
    }

    public set_PointLightRadius(rid: RID, radius: number) {
        const instance = this.get_Instance<PointLight>(rid);
        if (instance) {
            instance.distance = radius;
        }
    }

    public set_SpotLightDecay(rid: RID, decay: number) {
        const instance = this.get_Instance<SpotLight>(rid);
        if (instance) {
            instance.decay = decay;
        }
    }

    public set_SpotLightDistance(rid: RID, distance: number) {
        const instance = this.get_Instance<SpotLight>(rid);
        if (instance) {
            instance.distance = distance;
        }
    }

    public set_SpotLightAngle(rid: RID, angle: number) {
        const instance = this.get_Instance<SpotLight>(rid);
        if (instance) {
            instance.angle = angle;
        }
    }

    public set_SpotLightPenumbra(rid: RID, penumbra: number) {
        const instance = this.get_Instance<SpotLight>(rid);
        if (instance) {
            instance.penumbra = penumbra;
        }
    }

    public set_SpotLightRotation(rid: RID, rotation: Euler) {
        const instance = this.get_Instance<SpotLight>(rid);
        if (instance) {
            const position = new Vector3();
            instance.matrixWorld.decompose(position, new Quaternion(), new Vector3());
            instance.target.position.copy(new Vector3(0, -1, 0).applyEuler(rotation).add(position));
            instance.target.updateMatrix();
            instance.target.updateMatrixWorld(true);
        }
    }

    public set_LightColor(rid: RID, color: Color) {
        const instance = this.get_Instance<Light>(rid);
        if (instance) {
            instance.color.copy(color);
        }
    }

    public set_LightIntensity(rid: RID, intensity: number) {
        const instance = this.get_Instance<Light>(rid);
        if (instance) {
            instance.intensity = intensity;
        }
    }

    public set_LightGlobalTransform(rid: RID, transform: Matrix4) {
        const instance = this.get_Instance<Light>(rid);
        if (instance) {
            instance.matrixWorld.copy(transform);
        }
    }

    public set_LightVisibility(rid: RID, visible: boolean) {
        const instance = this.get_Instance<Light>(rid);
        if (instance) {
            instance.visible = visible;
        }
    }

    public set_LightLayer(rid: RID, layer: number) {
        const instance = this.get_Instance<Light>(rid);
        if (instance) {
            instance.layers.mask = layer;
        }
    }

    public free_Light(rid: RID) {
        const instance = this.get_Instance<Light>(rid);
        if (instance === undefined) return;
        instance.removeFromParent();
        instance.dispose();
        this.instance_map.delete(rid);
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
    preserve_global_transform: boolean;
    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: PickingSide, camera: Camera3D | undefined, viewport: Viewport | undefined): RaycastResult | undefined;
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
    public global_transform: Matrix4 = new Matrix4();
    public global_transform_inverse: Matrix4 = new Matrix4();
}

export enum PickingOrder {
    Ordered, OffsetOrdered, Unordered,
}

export enum PickingSide {
    Front, Back, Double,
}

export class RayPickingOption {
    public readonly from: Vector3;
    public readonly to: Vector3;
    public readonly mask: number;
    public readonly camera: Camera3D | undefined;
    public readonly viewport: Viewport | undefined;
    public readonly order: PickingOrder;
    public readonly side: PickingSide;

    constructor(from: Vector3, to: Vector3, mask: number, camera: Camera3D | undefined, viewport: Viewport | undefined, order: PickingOrder = PickingOrder.Ordered, side: PickingSide = PickingSide.Front) {
        this.from = from.clone();
        this.to = to.clone();
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
        const { mask, from, to, camera, viewport, order, side } = option;
        const result: RayPickingResult[] = [];
        for (const shape_instance of this.shape_map.values()) {
            const { shape, distance_offset, area, global_transform, global_transform_inverse } = shape_instance;
            if (shape !== undefined && area !== undefined && area.enabled && (area.layer & mask) !== 0) {
                const preserve_global_transform = shape.preserve_global_transform;
                const local_from = preserve_global_transform ? from.clone() : from.clone().applyMatrix4(global_transform_inverse);
                const local_to = preserve_global_transform ? to.clone() : to.clone().applyMatrix4(global_transform_inverse);
                const res = shape.perform_Raycast(local_from, local_to, global_transform, side, camera, viewport);
                if (res !== undefined) {
                    const position = preserve_global_transform ? res.position.clone() : res.position.clone().applyMatrix4(global_transform);
                    const normal = preserve_global_transform ? res.normal.clone() : res.normal.clone().applyMatrix4(global_transform).normalize();
                    const distance = position.distanceTo(from)
                    result.push(new RayPickingResult(area.area, position, normal, distance, distance + distance_offset, area.priority));
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

    public set_PickingAreaPriority(rid: RID, priority: number) {
        const area = this.get_Area(rid);
        if (area === undefined) return;
        area.priority = priority;
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

    public set_PickingShapeInstanceDistanceOffset(rid: RID, distance_offset: number) {
        const _shape = this.get_Shape(rid);
        if (_shape === undefined) return;
        _shape.distance_offset = distance_offset;
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