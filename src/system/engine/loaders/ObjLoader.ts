import { Result } from '@/system/utils/Result';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { type Mesh, Material } from 'three';
import { MeshInstance3D } from '../nodes/node3ds/visual_instance3ds/geometry_3ds/MeshInstance3D';
import { ThreeGeometryResource } from '../resources/resources/GeometryResource';
import { ThreeMaterialResource } from '../resources/resources/MaterialResource';

export class ObjLoader {
    constructor() {

    }

    public parse(data: string): Result<MeshInstance3D, Error> {
        const loader = new OBJLoader();
        const group = loader.parse(data);
        const mesh = group.children[0] as Mesh;
        if (mesh === undefined) return Result.Error(new Error('can not find mesh to be loaded'));
        const geometry = mesh.geometry;
        const material = mesh.material;
        const mesh_instance = new MeshInstance3D();
        mesh_instance.geometry = new ThreeGeometryResource(geometry);
        mesh_instance.material = material instanceof Material ? new ThreeMaterialResource(material) : material.map(m => new ThreeMaterialResource(m));
        return Result.Ok(mesh_instance);
    }
}