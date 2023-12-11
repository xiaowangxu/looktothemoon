import { Scene, Matrix4, Mesh, Object3D, Vector3, Euler, AmbientLight, HemisphereLight, DirectionalLight, PointLight, Light, Color, SpotLight, Quaternion } from "three";
import { Rid, type RID } from "../../Rid";
import { GeometryResource } from "../../resources/resources/GeometryResource";
import type { MaterialResource } from "../../resources/resources/MaterialResource";
import { SignalEmitter } from "../../../utils/SignalEmitter";
import type { Viewport } from "../../Viewport";
import type { Camera3D } from "../../nodes/camera3ds/Camera3D";
import { Matrix4 as MyMat4 } from "../../../fivepebble/linear_algebra/Matrix4";

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

    public set_MeshMaterial(rid: RID, material: MaterialResource | (MaterialResource)[]) {
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

    public set_MeshGlobalTransform(rid: RID, transform: MyMat4) {
        const instance = this.get_Instance<Mesh>(rid);
        if (instance) {
            instance.matrixWorld.fromArray(transform.transposed_array);
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