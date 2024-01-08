import { Node } from "../../nodes/Node";
import { Node3D } from "../../nodes/node3ds/Node3D";
import { BoxGeometryResource, CylinderGeometryResource, SphereGeometryResource, TorusGeometryResource } from "../../resources/geometry_resources/PrimitiveGeometryResource";
import { type Config } from "../../ConfiguredObject";
import { ClassBase } from "./ClassBase";
import { MeshInstance3D } from "../../nodes/node3ds/visual_instance3ds/geometry3ds/MeshInstance3D";
import { Result } from "@/system/utils/Result";
import { NormalMaterialResource, UVMaterialResource } from "../../resources/material_resources/PrimitiveMaterialResource";
import { ArrayGeometryResource } from "../../resources/geometry_resources/ArrayGeometryResource";

export class ClassDatabase {
    private readonly db: Map<string, typeof ClassBase> = new Map();

    public has_Class(name: string) {
        return this.db.has(name);
    }

    public register_Class(cls: typeof ClassBase) {
        this.db.set(cls.class_name, cls);
    }

    public instantiate<T extends ClassBase>(config: Config, class_name: string): Result<T, Error> {
        if (!this.has_Class(class_name)) return Result.Error(new Error(`class ${class_name} does not exist`));
        const cons = this.db.get(class_name)!;
        return Result.Ok((new cons(config)) as T);
    }
}

export const ClassDB = new ClassDatabase();

ClassDB.register_Class(Node);
ClassDB.register_Class(Node3D);
ClassDB.register_Class(MeshInstance3D);

ClassDB.register_Class(ArrayGeometryResource);
ClassDB.register_Class(BoxGeometryResource);
ClassDB.register_Class(TorusGeometryResource);
ClassDB.register_Class(CylinderGeometryResource);
ClassDB.register_Class(SphereGeometryResource);

ClassDB.register_Class(NormalMaterialResource);
ClassDB.register_Class(UVMaterialResource);