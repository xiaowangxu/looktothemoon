import { Camera3D, Node, Node3D, Viewport } from "../SceneTree";
import { ViewportDomContainer } from "../nodes/ViewportDomContainer";
import { InterpolateCamera3D } from "../nodes/camera_3ds/InterpolateCamera3D";
import { OrbitCamera3D } from "../nodes/camera_3ds/OrbitCamera3D";
import { OrthographicCamera3D } from "../nodes/camera_3ds/OrthographicCamera3D";
import { PerspectiveCamera3D } from "../nodes/camera_3ds/PerspectiveCamera3D";
import { GeometryInstance3D } from "../nodes/visual_instances/geometry_3ds/GeometryInstance3D";
import { MeshInstance3D } from "../nodes/visual_instances/geometry_3ds/MeshInstance3D";
import { VisualInstance3D } from "../nodes/visual_instances/VisualInstance3D";
import { ClassBase } from "./ClassBase";
import { Resource } from "../Resource";
import { ActionInputEvent, ComposeInputEvent, InputActionMap, InputEvent, InputEventFromViewport, KeyInputEvent, MouseButton, MouseButtonInputEvent, MouseEnterLeaveInputEvent, MouseInputEvent, MouseMotionInputEvent, ShortCut, } from "../InputEvent";
import { GeometryResource, PolyLineGeometryResource, ThreeGeometryResource } from "../resources/GeometryResource";
import { MaterialResource, ThreeMaterialResource } from "../resources/MaterialResource";
import { Color, Vector2, Vector3, Vector4, Euler, Quaternion, Matrix3, Matrix4 } from "three";
import { PlainObject } from "./PlainObject";
import { ValueObject } from "./ValueObject";
import type { ClassReader, ClassWriter } from "./ClassWriterReader";
import { PackedSceneResource } from "../resources/PackedSceneResource";
import { PickingArea3D } from "../nodes/physics_3ds/PickingArea3D";
import { PickingShape3D } from "../nodes/physics_3ds/PickingShape3D";
import { PickingBoxResource } from "../resources/PickingShapeResource";
import { AmbientLight3D } from "../nodes/visual_instances/light_3ds/AmbientLight3D";
import { HemisphereLight3D } from "../nodes/visual_instances/light_3ds/HemisphereLight3D";
import { ImageResource } from "../resources/ImageResource";

export class ClassDataBase {
    private readonly db: Map<string, typeof ClassBase> = new Map();

    public has_Class(name: string) {
        return this.db.has(name);
    }

    public register_Class(cls: new (...args: any[]) => ClassBase) {
        this.db.set((cls as typeof ClassBase).class_name, cls as typeof ClassBase);
    }

    public instantiate<T extends ClassBase>(class_name: string, data: Object | undefined = undefined): T {
        if (!this.has_Class(class_name)) throw new Error(`class ${class_name} does not exist`);
        const cons = this.db.get(class_name)!;
        if (cons.use_custom_instantiater) {
            return cons.instantiate(data ?? {}) as T;
        }
        return (new cons()) as T;
    }
}

export const ClassDB = new ClassDataBase();

ClassDB.register_Class(ClassBase);

ClassDB.register_Class(Node);
ClassDB.register_Class(Node3D);
ClassDB.register_Class(Camera3D);
ClassDB.register_Class(Viewport);
ClassDB.register_Class(MeshInstance3D);
ClassDB.register_Class(OrbitCamera3D);
ClassDB.register_Class(InterpolateCamera3D);
ClassDB.register_Class(OrthographicCamera3D);
ClassDB.register_Class(PerspectiveCamera3D);
ClassDB.register_Class(ViewportDomContainer);
ClassDB.register_Class(PickingArea3D);
ClassDB.register_Class(PickingShape3D);
ClassDB.register_Class(AmbientLight3D);
ClassDB.register_Class(HemisphereLight3D);

ClassDB.register_Class(ImageResource);

ClassDB.register_Class(PackedSceneResource);

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

ClassDB.register_Class(ThreeGeometryResource);
ClassDB.register_Class(PolyLineGeometryResource);

ClassDB.register_Class(ThreeMaterialResource);

ClassDB.register_Class(PickingBoxResource);

export class ValueDataBase {
    private readonly saver: Map<Function, (v: any, value_db: ValueDataBase) => string> = new Map();
    private readonly loader: Map<string, (v: string, value_db: ValueDataBase) => any> = new Map();

    public register_Value(name: string, type: Function, saver: (v: any, value_db: ValueDataBase) => string, loader: (v: string, value_db: ValueDataBase) => any) {
        this.saver.set(type, (v, vdb) => `${name}(${saver(v, vdb)})`);
        this.loader.set(name, loader);
    }

    public has_ValueSaver(value: any) {
        if (value === undefined || value === null) return false;
        const cons = value.constructor;
        if (cons === undefined) return false;
        return this.saver.has(cons);
    }

    public has_ValueLoader(type: string) {
        return this.loader.has(type);
    }

    public save_Value(value: any) {
        if (value === undefined) throw new Error('can not save undefined');
        if (value === null) return 'null';
        const cons = value.constructor;
        if (cons === undefined) throw new Error('can not save value');
        const saver = this.saver.get(cons);
        if (saver === undefined) throw new Error(`can not save value of ${cons.name}`);
        return saver(value, this);
    }

    public load_Value(value: string): any {
        if (value === 'null') return null;
        const first_idx_of_lcir = value.indexOf('(', 0);
        if (first_idx_of_lcir < 0) throw new Error(`error format of value '${value}'`);
        const type = value.substring(0, first_idx_of_lcir);
        if (!this.has_ValueLoader(type)) throw new Error(`can not load value of type ${type}`);
        const v = value.substring(first_idx_of_lcir + 1, value.length - 1);
        return this.loader.get(type)!(v, this);
    }
}

export const ValueDB = new ValueDataBase();

ValueDB.register_Value('number', Number, v => v.toString(), v => parseFloat(v));
ValueDB.register_Value('string', String, v => JSON.stringify(v), v => JSON.parse(v));
ValueDB.register_Value('boolean', Boolean, v => v ? 'true' : 'false', v => v === 'true');

ValueDB.register_Value('vector2', Vector2, v => `${v.x},${v.y}`, v => {
    const nums = v.split(',');
    const x = parseFloat(nums[0]), y = parseFloat(nums[1]);
    return new Vector2(x, y);
});

ValueDB.register_Value('vector3', Vector3, v => `${v.x},${v.y},${v.z}`, v => {
    const nums = v.split(',');
    const x = parseFloat(nums[0]), y = parseFloat(nums[1]), z = parseFloat(nums[2]);
    return new Vector3(x, y, z);
});

ValueDB.register_Value('vector4', Vector4, v => `${v.x},${v.y},${v.z},${v.w}`, v => {
    const nums = v.split(',');
    const x = parseFloat(nums[0]), y = parseFloat(nums[1]), z = parseFloat(nums[2]), w = parseFloat(nums[3]);
    return new Vector4(x, y, z, w);
});

ValueDB.register_Value('euler', Euler, v => `${v.x},${v.y},${v.z}`, v => {
    const nums = v.split(',');
    const x = parseFloat(nums[0]), y = parseFloat(nums[1]), z = parseFloat(nums[2]);
    return new Euler(x, y, z);
});

ValueDB.register_Value('quaternion', Quaternion, v => `${v.x},${v.y},${v.z},${v.w}`, v => {
    const nums = v.split(',');
    const x = parseFloat(nums[0]), y = parseFloat(nums[1]), z = parseFloat(nums[2]), w = parseFloat(nums[3]);
    return new Quaternion(x, y, z, w);
});

ValueDB.register_Value('matrix3', Matrix3, v => v.elements.join(','), v => {
    const nums = v.split(',');
    const v0 = parseFloat(nums[0]),
        v1 = parseFloat(nums[1]),
        v2 = parseFloat(nums[2]),
        v3 = parseFloat(nums[3]),
        v4 = parseFloat(nums[4]),
        v5 = parseFloat(nums[5]),
        v6 = parseFloat(nums[6]),
        v7 = parseFloat(nums[7]),
        v8 = parseFloat(nums[8]);
    return new Matrix3(v0, v3, v6, v1, v4, v7, v2, v5, v8);
});

ValueDB.register_Value('matrix4', Matrix4, v => v.elements.join(','), v => {
    const nums = v.split(',');
    const v0 = parseFloat(nums[0]),
        v1 = parseFloat(nums[1]),
        v2 = parseFloat(nums[2]),
        v3 = parseFloat(nums[3]),
        v4 = parseFloat(nums[4]),
        v5 = parseFloat(nums[5]),
        v6 = parseFloat(nums[6]),
        v7 = parseFloat(nums[7]),
        v8 = parseFloat(nums[8]),
        v9 = parseFloat(nums[9]),
        v10 = parseFloat(nums[10]),
        v11 = parseFloat(nums[11]),
        v12 = parseFloat(nums[12]),
        v13 = parseFloat(nums[13]),
        v14 = parseFloat(nums[14]),
        v15 = parseFloat(nums[15]);
    return new Matrix4(v0, v4, v8, v12,
                       v1, v5, v9, v13,
                       v2, v6, v10, v14,
                       v3, v7, v11, v15);
});

ValueDB.register_Value('color', Color, v => `${v.r},${v.g},${v.b}`, v => {
    const nums = v.split(',');
    const r = parseFloat(nums[0]), g = parseFloat(nums[1]), b = parseFloat(nums[2]);
    return new Color(r, g, b);
});

ValueDB.register_Value('plainobject', PlainObject, v => PlainObject.save(v), v => PlainObject.load(v));
ValueDB.register_Value('valueobject', ValueObject, (v, vdb) => ValueObject.save(v, vdb), (v, vdb) => ValueObject.load(v, vdb));