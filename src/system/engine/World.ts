import { Scene, Matrix4, Mesh, Object3D, DirectionalLightHelper, AmbientLight, DirectionalLight, ObjectLoader, Group } from "three";
import { Rid, type RID } from "./Rid";
import type { GeometryResource } from "./resources/GeometryResource";
import type { MaterialResource } from "./resources/MaterialResource";
import { SignalEmitter } from "../utils/SignalEmitter";
import type { MouseMotionInputEvent } from "./InputEvent";
import type { Camera3D } from "./SceneTree";

export class World3D {
    private readonly visual_world: VisualWorld3D = new VisualWorld3D();
    private readonly physics_world: PhysicsWorld3D = new PhysicsWorld3D();

    get_VisualWorld() {
        return this.visual_world;
    }

    get_PhysicsWorld() {
        return this.physics_world;
    }

    dispose() {
        this.visual_world.dispose();
        this.physics_world.dispose();
    }
}

// visual world

export class VisualWorld3D {
    private readonly scene: Scene = new Scene();
    private readonly instance_map: Map<string, Object3D> = new Map();

    // signal
    public signal_before_render: SignalEmitter<(camera: Camera3D) => void> = new SignalEmitter();

    constructor() {
        this.scene.matrixAutoUpdate = false;
        this.scene.matrixWorldAutoUpdate = false;
    }

    public get_VisualScene() {
        return this.scene;
    }

    public trigger_BeforeRender(camera: Camera3D) {
        this.signal_before_render.trigger(camera);
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
        mesh.matrixAutoUpdate = false;
        mesh.matrixWorldAutoUpdate = false;
        this.instance_map.set(rid, mesh);
        return rid;
    }

    private dispose_MeshGeometry(mesh: Mesh) {
        mesh.geometry?.dispose();
    }

    private dispose_MeshMaterial(mesh: Mesh) {
        if (mesh.material !== undefined) {
            if (mesh.material instanceof Array) {
                for (const mat of mesh.material) {
                    mat.dispose();
                }
            }
            else {
                mesh.material.dispose();
            }
        }
    }

    public free_Mesh(rid: RID) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance === undefined) return;
        instance.removeFromParent();
        this.dispose_MeshGeometry(instance);
        this.dispose_MeshMaterial(instance);
        this.instance_map.delete(rid);
    }

    public set_MeshGeometry(rid: RID, geometry_resource: GeometryResource) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance) {
            this.dispose_MeshGeometry(instance);
            instance.geometry = geometry_resource.get_BufferGeometry();
            if (instance.parent === null) {
                this.scene.add(instance);
            }
        }
    }

    public clear_MeshGeometry(rid: RID) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance && instance.geometry !== undefined) {
            this.dispose_MeshGeometry(instance);
            (instance.geometry as any) = undefined;
            instance.removeFromParent();
        }
    }

    public set_MeshMaterial(rid: RID, material: MaterialResource | MaterialResource[]) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance) {
            this.dispose_MeshMaterial(instance);
            if (material instanceof Array) {
                instance.material = material.map(m => m.get_Material());
            }
            else {
                instance.material = material.get_Material();
            }
        }
    }

    public clear_MeshMaterial(rid: RID) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance && instance.material !== undefined) {
            this.dispose_MeshMaterial(instance);
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

export class PhysicsWorld3D {

    public update_PhysicsPicking(event: MouseMotionInputEvent, camera: Camera3D) {
        // console.log(">>>>>> physics picking from viewport", event.viewport?.readable_name);
    }

    public dispose() {

    }
}