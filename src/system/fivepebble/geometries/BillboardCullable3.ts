import type { Cullable } from "@/system/engine/worlds/world3ds/VisualWorld3D";
import type { Matrix3 } from "../linear_algebra/Matrix3";
import { Matrix4 } from "../linear_algebra/Matrix4";
import { Vector3 } from "../linear_algebra/Vector3";
import { Vector4 } from "../linear_algebra/Vector4";
import type { Transformable } from "../linear_algebra/VectorLike";
import type { Cloneable } from "@/system/utils/Type";
import type { CameraFrustumLikeCullable, CameraLike } from "../graphics/CameraLike";
import type { FrustumLike } from "../graphics/FrustumLike";
import { Vector2 } from "../linear_algebra/Vector2";
import type { Frustum3 } from "../graphics/Frustum3";

export class BillboardCullable3 implements CameraFrustumLikeCullable<Matrix4, Vector3, Matrix3>, Cloneable<Cullable>, Transformable<Cullable, Vector4, Matrix4> {

    //#region init

    static get new() { return new BillboardCullable3(BillboardCullable3.#const_vector3_zero, 1, 1); }
    static create(center: Vector3, width: number, height: number) { return new BillboardCullable3(center, width, height); }

    //#endregion

    static readonly #const_vector3_zero = new Vector3(0, 0, 0);
    static readonly #tmp_vector3_0 = new Vector3();
    static readonly #tmp_vector3_1 = new Vector3();
    static readonly #tmp_vector3_2 = new Vector3();
    static readonly #tmp_vector3_3 = new Vector3();
    static readonly #tmp_vector3_4 = new Vector3();
    static readonly #tmp_vector3_5 = new Vector3();
    static readonly #tmp_vector3_6 = new Vector3();
    static readonly #tmp_vector2_0 = new Vector2();

    public width: number = 1;
    public height: number = 1;

    public readonly center: Vector3;

    constructor(center: Vector3, width: number, height: number) {
        this.width = width;
        this.height = height;
        this.center = center.clone();
    }

    get is_empty(): boolean { return this.width <= 0 || this.height <= 0; }

    sort_distance_to(camera: CameraLike<Matrix4, Vector3, Matrix3>, enlargement: number): number {
        return this.center.distance_to(camera.get_GlobalPosition(BillboardCullable3.#tmp_vector3_0));
    }

    cull(camera: CameraLike<Matrix4, Vector3, Matrix3>, frustum: Frustum3, screen_size: Vector2, enlargement: number): boolean {
        // check near && far plane
        if (frustum.near.is_PointBelow(this.center, false) || frustum.near.is_PointBelow(this.center, false)) return true;
        const ndc = camera.project_Point(this.center, BillboardCullable3.#tmp_vector2_0);
        ndc.mult(ndc, screen_size);
        const screen_left = - screen_size.x / 2 - enlargement - this.width / 2; 
        const screen_right = - screen_left; 
        const screen_bottom = - screen_size.y / 2 - enlargement - this.height / 2; 
        const screen_top = - screen_bottom; 
        if (ndc.x <= screen_left || ndc.x >= screen_right) return true;
        if (ndc.y <= screen_bottom || ndc.y >= screen_top) return true;
        return false;
    }

    clone(): BillboardCullable3 {
        return new BillboardCullable3(this.center, this.width, this.height);
    }

    affine_transform(a: BillboardCullable3, mat: Matrix4): BillboardCullable3 {
        this.width = a.width;
        this.height = a.height;
        this.center.affine_transform(a.center, mat);
        return this;
    }
}