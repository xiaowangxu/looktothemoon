import { Camera3D, Node, Node3D, Viewport } from "./SceneTree";
import { ViewportDomContainer } from "./nodes/ViewportDomContainer";
import { InterpolateCamera3D } from "./nodes/camera_3ds/InterpolateCamera3D";
import { OrbitCamera3D } from "./nodes/camera_3ds/OrbitCamera3D";
import { OrthographicCamera3D } from "./nodes/camera_3ds/OrthographicCamera3D";
import { PerspectiveCamera3D } from "./nodes/camera_3ds/PerspectiveCamera3D";
import { GeometryInstance3D } from "./nodes/visual_instances/GeometryInstance";
import { MeshInstance3D } from "./nodes/visual_instances/MeshInstance3D";
import { VisualInstance3D } from "./nodes/visual_instances/VisualInstance3D";

class ClassDataBase {
    private readonly db: Map<string, new (...args: any[]) => Object> = new Map();

    public has_Class(name: string) {
        return this.db.has(name);
    }

    public register_Class<T extends Object>(name: string, cls: new (...args: any[]) => T) {
        return this.db.set(name, cls);
    }

    public instantiate<T extends Object>(name: string, ...args: any[]) {
        if (!this.has_Class(name)) throw new Error(`class ${name} does not exist`);
        const cons = this.db.get(name)! as new (...args: any[]) => T;
        return new cons(...args);
    }
}

export const ClassDB = new ClassDataBase();

ClassDB.register_Class('Node', Node);
ClassDB.register_Class('Node3D', Node3D);
ClassDB.register_Class('Camera3D', Camera3D);
ClassDB.register_Class('Viewport', Viewport);
ClassDB.register_Class('VisualInstance3D', VisualInstance3D);
ClassDB.register_Class('GeometryInstance3D', GeometryInstance3D);
ClassDB.register_Class('MeshInstance3D', MeshInstance3D);
ClassDB.register_Class('OrbitCamera3D', OrbitCamera3D);
ClassDB.register_Class('InterpolateCamera3D', InterpolateCamera3D);
ClassDB.register_Class('OrthographicCamera3D', OrthographicCamera3D);
ClassDB.register_Class('PerspectiveCamera3D', PerspectiveCamera3D);
ClassDB.register_Class('ViewportDomContainer', ViewportDomContainer);
