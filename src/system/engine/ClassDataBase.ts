import { Camera3D, Node, Node3D, Viewport } from "./SceneTree";
import { ViewportDomContainer } from "./nodes/ViewportDomContainer";
import { InterpolateCamera3D } from "./nodes/camera_3ds/InterpolateCamera3D";
import { OrbitCamera3D } from "./nodes/camera_3ds/OrbitCamera3D";
import { OrthographicCamera3D } from "./nodes/camera_3ds/OrthographicCamera3D";
import { PerspectiveCamera3D } from "./nodes/camera_3ds/PerspectiveCamera3D";
import { GeometryInstance3D } from "./nodes/visual_instances/GeometryInstance";
import { MeshInstance3D } from "./nodes/visual_instances/MeshInstance3D";
import { VisualInstance3D } from "./nodes/visual_instances/VisualInstance3D";
import { ClassBase } from "./ClassBase";
import { Resource } from "./Resource";
import { ActionInputEvent, ComposeInputEvent, InputActionMap, InputEvent, InputEventFromViewport, KeyInputEvent, MouseButton, MouseButtonInputEvent, MouseEnterLeaveInputEvent, MouseInputEvent, MouseMotionInputEvent, ShortCut, } from "./InputEvent";
import { BufferGeometryResource, GeometryResource } from "./resources/GeometryResource";


class ClassDataBase {
    private readonly db: Map<string, new (...args: any[]) => ClassBase> = new Map();

    public has_Class(name: string) {
        return this.db.has(name);
    }

    public register_Class(cls: new (...args: any[]) => ClassBase) {
        this.db.set((cls as typeof ClassBase).class_name, cls);
    }

    public instantiate<T extends typeof ClassBase>(cls: T, ...args: any[]) {
        if (!this.has_Class(cls.class_name)) throw new Error(`class ${cls.class_name} does not exist`);
        const cons = this.db.get(cls.class_name)! as new (...args: any[]) => T;
        return new cons(...args);
    }
}

export const ClassDB = new ClassDataBase();

(window as any).classdb = ClassDB;

ClassDB.register_Class(ClassBase);
ClassDB.register_Class(Node);
ClassDB.register_Class(Node3D);
ClassDB.register_Class(Camera3D);
ClassDB.register_Class(Viewport);
ClassDB.register_Class(VisualInstance3D);
ClassDB.register_Class(GeometryInstance3D);
ClassDB.register_Class(MeshInstance3D);
ClassDB.register_Class(OrbitCamera3D);
ClassDB.register_Class(InterpolateCamera3D);
ClassDB.register_Class(OrthographicCamera3D);
ClassDB.register_Class(PerspectiveCamera3D);
ClassDB.register_Class(ViewportDomContainer);

ClassDB.register_Class(Resource);
ClassDB.register_Class(InputEvent);
ClassDB.register_Class(InputEventFromViewport);
ClassDB.register_Class(ComposeInputEvent);
ClassDB.register_Class(MouseButtonInputEvent);
ClassDB.register_Class(MouseInputEvent);
ClassDB.register_Class(MouseEnterLeaveInputEvent);
ClassDB.register_Class(MouseMotionInputEvent);
ClassDB.register_Class(KeyInputEvent);
ClassDB.register_Class(ActionInputEvent);
ClassDB.register_Class(ShortCut);
ClassDB.register_Class(InputActionMap);

ClassDB.register_Class(GeometryResource);
ClassDB.register_Class(BufferGeometryResource);
