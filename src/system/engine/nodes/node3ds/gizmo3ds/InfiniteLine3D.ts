import type { Config } from "@/system/engine/ConfiguredObject";
import { ray3, type Ray3 } from "@/system/fivepebble/geometries/Ray3";
import { vec3, Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Cacher } from "@/system/utils/Cacher";
import { MultiLineGeometryResource } from "@/system/engine/resources/geometry_resources/MultiLineGeometryResource";
import { Ref } from "@/system/utils/RefCounted";
import { MeshInstance3D } from "../visual_instance3ds/geometry3ds/MeshInstance3D";
import { NodeNotification } from "../../Node";
import { Quaternion } from "@/system/fivepebble/linear_algebra/Quaternion";
import { Euler } from "@/system/fivepebble/linear_algebra/Euler";
import { Plane3, plane3 } from "@/system/fivepebble/geometries/Plane3";
import { frustum3, Frustum3 } from "@/system/fivepebble/graphics/Frustum3";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";

const LineGeometry = new Cacher((config: Config) => {
    const line = new MultiLineGeometryResource(config);
    return new Ref(line);
});

export class InfiniteLine3D extends MeshInstance3D {

    static #tmp_vector3_0 = Vector3.new;
    static #frustum: Frustum3 = frustum3();
    static #planes: [Plane3, Plane3, Plane3, Plane3, Plane3, Plane3] = [InfiniteLine3D.#frustum.near, InfiniteLine3D.#frustum.far, InfiniteLine3D.#frustum.left, InfiniteLine3D.#frustum.top, InfiniteLine3D.#frustum.right, InfiniteLine3D.#frustum.bottom]

    private readonly _ray: Ray3 = ray3(vec3(), vec3(1, 0, 0));
    public get ray() { return this._ray.clone(); }
    public set ray(ray: Ray3) {
        this._ray.copy(ray);
    }

    constructor(config: Config) {
        super(config);
        this.top_level = true;
        this.geometry = LineGeometry.get(this.config).expect;
        this.block_redundant_before_render = false;
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.InternalBeforeRender: {
                this.update_Visual();
                break;
            }
        }
        super._notification(what);
    }


    private update_Visual() {
        const camera = this.get_SceneTree()?.get_RenderCamera3D();
        if (camera === undefined) {
            this.local_visible = false;
            return;
        }
        camera.get_Camera().get_Frustum(InfiniteLine3D.#frustum);
        const planes = InfiniteLine3D.#planes;
        const points = planes.map((p, i) => {
            const point = p.intersect_UncappedRay(this._ray);
            if (point === undefined) return undefined;
            for (let j = 0; j < 6; j++) {
                if (j === i) continue;
                if (!planes[j].is_PointOver(point, true)) return undefined;
            }
            return point;
        }).filter(p => p !== undefined);
        if (points.length < 2) {
            this.local_visible = false;
        }
        else {
            this.local_visible = true;
            this.local_position = points[0]!;
            const s = points[0]!.distance_to(points[1]!);
            this.local_scale = vec3(s, s, s);
            this.local_rotation = Euler.new.set_Quaternion(Quaternion.new.set_Rotate(vec3(1, 0, 0), InfiniteLine3D.#tmp_vector3_0.direction_to(points[0]!, points[1]!)));
        }
    }
}