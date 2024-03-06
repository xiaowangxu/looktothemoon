import { NodeNotification } from "../../Node";
import { Node3D } from "../Node3D";
import type { ClassReader, ClassWriter } from "../../../classes/saver_loader/ClassWriterReader";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Plane3 } from "@/system/fivepebble/geometries/Plane3";
import type { Config } from "@/system/engine/ConfiguredObject";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { Ray3 } from "@/system/fivepebble/geometries/Ray3";

export class FixSizeNode3D extends Node3D {
    public static readonly class_name: string = "FixSizeNode3D";

    static readonly #tmp_vector2_0 = Vector2.new;
    static readonly #tmp_vector3_0 = Vector3.new;
    static readonly #tmp_vector3_1 = Vector3.new;
    static readonly #tmp_vector3_2 = Vector3.new;
    static readonly #tmp_plane3_0 = Plane3.new;
    static readonly #tmp_ray3_0 = Ray3.new;

    public unit_pixel_count: number = 60;
    private _use_active_viewport: boolean = false;
    public get use_active_viewport() { return this._use_active_viewport; }
    public set use_active_viewport(use: boolean) {
        if (this._use_active_viewport !== use) {
            this._use_active_viewport = use;
            if (this._use_active_viewport) {
                this.block_redundant_before_render = true;
                this.propergate_redundant_before_render = false;
            }
            else {
                this.block_redundant_before_render = false;
                this.propergate_redundant_before_render = true;
            }
        }
    }
    public consider_pixel_ratio: boolean = false;

    constructor(config: Config) {
        super(config);
        this.block_redundant_before_render = false;
        this.propergate_redundant_before_render = true;
    }

    protected get_RelativeViewport() {
        return this._use_active_viewport ? this.get_SceneTree()?.get_ActiveViewports()[0] : this.get_SceneTree()?.get_RenderingViewport();
    }

    protected get_RelativeCamera3D() {
        return this.get_RelativeViewport()?.get_Camera3D();
    }

    protected get_Scale() {
        const viewport = this.get_RelativeViewport();
        const camera = this.get_RelativeCamera3D()?.get_Camera();
        if (viewport === undefined || camera === undefined) return undefined;
        const size = viewport.get_Size(FixSizeNode3D.#tmp_vector2_0);
        const half_height = this.unit_pixel_count / size.y;

        const plane_normal = camera.unproject_Normal(FixSizeNode3D.#tmp_vector2_0.set(0, 0), FixSizeNode3D.#tmp_vector3_0);
        this.update_GlobalTransform();
        const plane = FixSizeNode3D.#tmp_plane3_0.set_PointAndNormal(this._global_position, plane_normal);

        const center_origin = camera.unproject_Point(FixSizeNode3D.#tmp_vector2_0, undefined, FixSizeNode3D.#tmp_vector3_1);
        const center_ray = FixSizeNode3D.#tmp_ray3_0.set(center_origin, plane_normal);
        const center = plane.intersect_Ray(center_ray, FixSizeNode3D.#tmp_vector3_0);
        if (center === undefined) return undefined;

        const project_origin = camera.unproject_Point(FixSizeNode3D.#tmp_vector2_0.set(0, half_height), undefined, FixSizeNode3D.#tmp_vector3_1);
        const project_normal = camera.unproject_Normal(FixSizeNode3D.#tmp_vector2_0.set(0, half_height), FixSizeNode3D.#tmp_vector3_2);
        const ray = FixSizeNode3D.#tmp_ray3_0.set(project_origin, project_normal);
        const point = plane.intersect_Ray(ray, FixSizeNode3D.#tmp_vector3_2);
        if (point === undefined) return undefined;

        return center.distance_to(point) * 2;
    }

    protected update_Size() {
        const scale = this.get_Scale();
        if (scale === undefined) return;
        this.local_scale = FixSizeNode3D.#tmp_vector3_0.set(scale, scale, scale);
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.InternalBeforeRender: {
                this.update_Size();
                break;
            }
        }
        super._notification(what);
    }

    // save / load

    public dump(writer: ClassWriter): void {
        super.dump(writer);
        writer.property('unit_pixel_count', this.unit_pixel_count);
    }

    public load(reader: ClassReader): void {
        super.load(reader);
        this.unit_pixel_count = reader.get<number>('unit_pixel_count') ?? 50;
    }
}