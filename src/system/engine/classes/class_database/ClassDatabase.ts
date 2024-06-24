import { Node } from "../../nodes/Node";
import { Node3D } from "../../nodes/node3ds/Node3D";
import { ClassBase } from "./ClassBase";
import { MeshInstance3D } from "../../nodes/node3ds/visual_instance3ds/geometry3ds/MeshInstance3D";
import { Result } from "@/system/utils/Result";
import { ArrayGeometry3DResource } from "../../resources/geometry_resources/geometry3d_resources/ArrayGeometry3DResource";

export class ClassDatabase {
    private readonly db: Map<string, typeof ClassBase> = new Map();

    public has_Class(name: string) {
        return this.db.has(name);
    }

    public register_Class(cls: typeof ClassBase) {
        this.db.set(cls.class_name, cls);
    }

    public instantiate<T extends ClassBase>(class_name: string): Result<T, Error> {
        if (!this.has_Class(class_name)) return Result.Error(new Error(`class ${class_name} does not exist`));
        const cons = this.db.get(class_name)!;
        return Result.Ok((new cons()) as T);
    }
}

export const ClassDB = new ClassDatabase();

ClassDB.register_Class(ArrayGeometry3DResource);