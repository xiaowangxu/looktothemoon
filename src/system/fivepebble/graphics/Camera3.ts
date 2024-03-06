import type { CameraLike } from "./CameraLike";
import { Deg2Rad } from "../Scalar";
import { Ray3 } from "../geometries/Ray3";
import { Matrix3 } from "../linear_algebra/Matrix3";
import { Matrix4 } from "../linear_algebra/Matrix4";
import { Vector2 } from "../linear_algebra/Vector2";
import { Vector3 } from "../linear_algebra/Vector3";
import { Frustum3 } from "./Frustum3";
import { Euler } from "../linear_algebra/Euler";
import type { LineLike } from "../geometries/LineLike";
import type { Line3 } from "../geometries/Line3";

export abstract class Camera3 implements CameraLike<Matrix4, Vector3, Matrix3> {

    static readonly #tmp_matrix3_0: Matrix3 = Matrix3.new;
    static readonly #tmp_matrix4_0: Matrix4 = Matrix4.new;
    static readonly #tmp_vector3_0: Vector3 = Vector3.new;
    static readonly #tmp_vector3_1: Vector3 = Vector3.new;
    static readonly #tmp_euler_0: Euler = Euler.new;

    protected _projection: Matrix4 = Matrix4.new;
    get projection() { return this._projection.clone(); }
    public get_Projection(target: Matrix4) { return target.copy(this._projection); }

    protected _global_transform: Matrix4 = Matrix4.new;
    protected _global_transform_inverse: Matrix4 = Matrix4.new;
    get global_transform() { return this._global_transform.clone(); }
    set global_transform(transform: Matrix4) {
        const euler = Camera3.#tmp_euler_0;
        const matrix3 = Camera3.#tmp_matrix3_0;
        const vector3 = Camera3.#tmp_vector3_0;
        transform.basis.decompose_RotationScale(euler, vector3);
        transform.get_Position(vector3);
        this._global_transform.set_BasisPosition(matrix3.set_Euler(euler), vector3);
        this._global_transform_inverse.inverse(this._global_transform);
    }
    public get_GlobalTransform(target: Matrix4) { return target.copy(this._global_transform); }

    get frustum() {
        return this.get_Frustum(Frustum3.new);
    }
    get_Frustum(target: Frustum3): Frustum3 {
        return target.set_Projection(Camera3.#tmp_matrix4_0.compose(this._global_transform_inverse, this._projection));
    }

    protected _mask: number = 0xffffffff;
    set mask(mask: number) {
        mask = mask & 0xffffffff;
        if (this._mask !== mask) {
            this._mask = mask;
        }
    }
    get mask() { return this._mask; }

    public abstract get is_orthogonal(): boolean;

    project_Point(point: Vector3, target: Vector2): Vector2 {
        const p = Camera3.#tmp_vector3_0;
        p.apply_Matrix4(point, this._global_transform_inverse);
        p.apply_Matrix4(p, this._projection);
        return target.set(p.x, p.y);
    }

    abstract unproject_Point(ndc: Vector2, depth: number | undefined, target: Vector3): Vector3;

    abstract unproject_Normal(ndc: Vector2, target: Vector3): Vector3;

    project_Ray(ndc: Vector2, depth: number | undefined, target: Ray3): Ray3 {
        return target.set(this.unproject_Point(ndc, depth, Camera3.#tmp_vector3_0), this.unproject_Normal(ndc, Camera3.#tmp_vector3_1))
    }
    abstract project_Line(ndc: Vector2, target: Line3): Line3;

    abstract clone(): Camera3;
}

export class OrthographicCamera3 extends Camera3 {
    protected _width: number = 1;
    public get width() { return this._width; }
    public set width(width: number) {
        if (this._width !== width) {
            this._width = width;
            this.update();
        }
    }

    protected _height: number = 1;
    public get height() { return this._height; }
    public set height(height: number) {
        if (this._height !== height) {
            this._height = height;
            this.update();
        }
    }

    protected _near: number = 0.01;
    public get near() { return this._near; }
    public set near(near: number) {
        if (this._near !== near) {
            this._near = near;
            this.update();
        }
    }

    protected _far: number = 2000;
    public get far() { return this._far; }
    public set far(far: number) {
        if (this._far !== far) {
            this._far = far;
            this.update();
        }
    }

    public get aspect() { return this.width / this.height; }
    public set aspect(aspect: number) {
        this.width = aspect * this.height;
    }

    protected _zoom: number = 1;
    public get zoom() { return this._zoom; }
    public set zoom(zoom: number) {
        if (this._zoom !== zoom) {
            this._zoom = zoom;
            this.update();
        }
    }

    public get is_orthogonal(): boolean { return true; }

    constructor() {
        super();
        this.update();
    }

    protected update() {
        const half_width = this.width / (2 * this.zoom);
        const half_height = this.height / (2 * this.zoom);
        this._projection.set_OrthogonalProjection(-half_width, half_width, half_height, -half_height, this.near, this.far);
    }

    unproject_Point(point: Vector2, depth: number = this.near, target: Vector3): Vector3 {
        const half_width = this.width / (2 * this.zoom);
        const half_height = this.height / (2 * this.zoom);
        const p = target.set(point.x * half_width, point.y * half_height, -depth);
        return p.apply_Matrix4(p, this._global_transform);
    }

    unproject_Normal(point: Vector2, target: Vector3): Vector3 {
        const n = target.set(0, 0, -1);
        n.transform(n, this._global_transform.basis);
        n.normalize(n);
        return n;
    }

    project_Line(ndc: Vector2, target: Line3): Line3 {
        this.unproject_Point(ndc, undefined, target.start);
        this.unproject_Normal(ndc, target.end);
        target.end.add_Scaled(target.start, this.far, target.end);
        return target;
    }

    clone(): OrthographicCamera3 {
        const orth = new OrthographicCamera3();
        orth.mask = this.mask;
        orth._global_transform.copy(this._global_transform);
        orth._global_transform_inverse.copy(this._global_transform_inverse);
        orth._width = this.width;
        orth._height = this.height;
        orth._near = this.near;
        orth._far = this.far;
        orth._zoom = this.zoom;
        orth._projection.copy(this._projection);
        return orth;
    }
}

export class PerspectiveCamera3 extends Camera3 {
    protected _fov: number = 70 * Deg2Rad;
    public get fov() { return this._fov; }
    public set fov(fov: number) {
        if (this._fov !== fov) {
            this._fov = fov;
            this.update();
        }
    }

    protected _aspect: number = 1;
    public get aspect() { return this._aspect; }
    public set aspect(aspect: number) {
        if (this._aspect !== aspect) {
            this._aspect = aspect;
            this.update();
        }
    }

    protected _near: number = 0.01;
    public get near() { return this._near; }
    public set near(near: number) {
        if (this._near !== near) {
            this._near = near;
            this.update();
        }
    }

    protected _far: number = 2000;
    public get far() { return this._far; }
    public set far(far: number) {
        if (this._far !== far) {
            this._far = far;
            this.update();
        }
    }

    public get width() {
        return this.aspect * this.height;
    }

    public get height() {
        return this.near * Math.tan(this.fov / 2) * 2;
    }

    public get is_orthogonal(): boolean { return false; }

    constructor() {
        super();
        this.update();
    }

    protected update() {
        this._projection.set_PerspectiveFovProjection(this.fov, this.aspect, this.near, this.far);
    }

    unproject_Point(ndc: Vector2, depth: number = this.near, target: Vector3): Vector3 {
        if (depth === 0) return this._global_transform.get_Position(target);
        const half_height = this.near * Math.tan(this.fov / 2);
        const half_width = this.aspect * half_height;
        const p = target.set(ndc.x * half_width, ndc.y * half_height, -depth);
        p.apply_Matrix4(p, this.global_transform);
        return p;
    }

    unproject_Normal(ndc: Vector2, target: Vector3): Vector3 {
        const p = this.unproject_Point(ndc, this.near, target);
        return p.direction_to(this._global_transform.position, p);
    }

    project_Line(ndc: Vector2, target: Line3): Line3 {
        this.unproject_Point(ndc, undefined, target.start);
        this.unproject_Normal(ndc, target.end);
        target.end.add_Scaled(target.start, this.far, target.end);
        return target;
    }

    clone(): PerspectiveCamera3 {
        const persp = new PerspectiveCamera3();
        persp.mask = this.mask;
        persp._global_transform.copy(this._global_transform);
        persp._global_transform_inverse.copy(this._global_transform_inverse);
        persp._fov = this.fov;
        persp._aspect = this.aspect;
        persp._near = this.near;
        persp._far = this.far;
        persp._projection.copy(this._projection)
        return persp;
    }
}