import { Ray3 } from "@/system/fivepebble/geometries/Ray3";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { RefCacher } from "@/system/utils/RefCounted";
import { MeshInstance3D } from "../visual_instance3ds/geometry3ds/MeshInstance3D";
import { NodeNotification } from "../../Node";
import { Quaternion } from "@/system/fivepebble/linear_algebra/Quaternion";
import { Euler } from "@/system/fivepebble/linear_algebra/Euler";
import { Plane3 } from "@/system/fivepebble/geometries/Plane3";
import { Frustum3 } from "@/system/fivepebble/graphics/Frustum3";
import { PolyLineGeometry3DResource } from "@/system/engine/resources/geometry_resources/geometry3d_resources/polyline_geometry3d_resources/PolyLineGeometry3DResource";

const LineGeometry = new RefCacher(() => {
    const line = new PolyLineGeometry3DResource();
    return line;
});

export class InfiniteLine3D extends MeshInstance3D {

    static readonly #tmp_vector3_0 = Vector3.new;
    static readonly #frustum: Frustum3 = Frustum3.new;
    static readonly #planes: [Plane3, Plane3, Plane3, Plane3, Plane3, Plane3] = [InfiniteLine3D.#frustum.near, InfiniteLine3D.#frustum.far, InfiniteLine3D.#frustum.left, InfiniteLine3D.#frustum.top, InfiniteLine3D.#frustum.right, InfiniteLine3D.#frustum.bottom];
    static readonly #intersect_points: [Vector3, Vector3, Vector3, Vector3, Vector3, Vector3] = [Vector3.new, Vector3.new, Vector3.new, Vector3.new, Vector3.new, Vector3.new];

    private readonly _ray: Ray3 =  Ray3.create(Vector3.new, Vector3.create(1, 0, 0));
    public get ray() { return this._ray.clone(); }
    public set ray(ray: Ray3) {
        this._ray.copy(ray);
    }

    constructor() {
        super();
        this.top_level = true;
        this.geometry = LineGeometry.get();
        this.block_redundant_before_render_notification = false;
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
        const camera = this.get_SceneTree()?.get_RenderingViewport()?.get_Camera3D();
        if (camera === undefined) {
            this.local_visible = false;
            return;
        }
        camera.get_Camera().get_Frustum(InfiniteLine3D.#frustum);
        const planes = InfiniteLine3D.#planes;
        const points = planes.map((p, i) => {
            const point = p.intersect_UncappedRay(this._ray, InfiniteLine3D.#intersect_points[i]);
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
            this.local_scale = Vector3.create(s, s, s);
            this.local_rotation = Euler.new.set_Quaternion(Quaternion.new.set_Rotate(Vector3.create(1, 0, 0), InfiniteLine3D.#tmp_vector3_0.direction_to(points[0]!, points[1]!)));
        }
    }
}