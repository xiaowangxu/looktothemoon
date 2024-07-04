import { Node } from "../../nodes/Node";
import { Node3D } from "../../nodes/node3ds/Node3D";
import { ClassBase } from "./ClassBase";
import { MeshInstance3D } from "../../nodes/node3ds/visual_instance3ds/geometry3ds/MeshInstance3D";
import { Result } from "@/system/utils/Result";
import { ArrayGeometry3DResource } from "../../resources/geometry_resources/geometry3d_resources/ArrayGeometry3DResource";
import { ImageTexture2DResource } from "../../resources/texture_resources/texture2d_resources/ImageTexture2DResource";
import { SpotLight3D } from "../../nodes/node3ds/visual_instance3ds/light3ds/SpotLight3D";
import { PackedSceneResource } from "../../resources/packed_scene/PackedScene";
import { PbrMaterial3DResource } from "../../resources/material_resources/material3d_resources/PbrMaterial3DResource";

export class ClassDatabase {
    private readonly db: Map<string, typeof ClassBase> = new Map();

    public has_Class(name: string) {
        return this.db.has(name);
    }

    public register_Class(cls: typeof ClassBase) {
        this.db.set(cls.class_name, cls);
    }

    public instantiate<T extends ClassBase>(class_name: string): Result<T, Error> {
        if (!this.has_Class(class_name)) return Result.Error(new Error(`class <${class_name}> is not registered in ClassDB`));
        const cons = this.db.get(class_name)!;
        return Result.Ok((new cons()) as T);
    }
}

export const ClassDB = new ClassDatabase();

ClassDB.register_Class(ArrayGeometry3DResource);
ClassDB.register_Class(ImageTexture2DResource);
ClassDB.register_Class(MeshInstance3D);
ClassDB.register_Class(SpotLight3D);
ClassDB.register_Class(Node3D);
ClassDB.register_Class(PackedSceneResource);
ClassDB.register_Class(PbrMaterial3DResource);