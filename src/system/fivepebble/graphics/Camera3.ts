import type { CameraLike } from "./CameraLike";
import { Deg2Rad } from "../Scalar";
import { Ray3 } from "../geometries/Ray3";
import { Matrix3 } from "../linear_algebra/Matrix3";
import { Matrix4 } from "../linear_algebra/Matrix4";
import { Vector2 } from "../linear_algebra/Vector2";
import { Vector3 } from "../linear_algebra/Vector3";
import { Frustum3 } from "./Frustum3";

export abstract class Camera3 implements CameraLike<Matrix4, Vector3, Matrix3> {
    protected _projection: Matrix4 = Matrix4.make_Identity();
    get projection() { return this._projection.clone(); }

    protected _global_transform: Matrix4 = Matrix4.make_Identity();
    protected _global_transform_inverse: Matrix4 = Matrix4.make_Identity();
    get global_transform() { return this._global_transform.clone(); }
    set global_transform(transform: Matrix4) {
        const position = transform.position;
        const [rotation, _] = transform.basis.decompose_RotationScale();
        this._global_transform.set_BasisPosition(Matrix3.from_Euler(rotation), position);
        this._global_transform_inverse.inverses(this._global_transform)
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

    project_Point(point: Vector3): Vector2 {
        const p = point.apply_Matrix4(this._global_transform_inverse);
        p.applys_Matrix4(p, this._projection);
        return new Vector2(p.x, p.y);
    }

    abstract unproject_Point(ndc: Vector2, depth?: number): Vector3;

    abstract unproject_Normal(ndc: Vector2): Vector3;

    project_Ray(ndc: Vector2, depth?: number): Ray3 {
        return new Ray3(this.unproject_Point(ndc, depth), this.unproject_Normal(ndc));
    }

    get_Frustum(): Frustum3 {
        return Frustum3.from_Projection(this._global_transform_inverse.compose(this._projection));
    }

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

    unproject_Point(point: Vector2, depth: number = this.near): Vector3 {
        const half_width = this.width / (2 * this.zoom);
        const half_height = this.height / (2 * this.zoom);
        const p = new Vector3(point.x * half_width, point.y * half_height, -depth);
        return p.applys_Matrix4(p, this._global_transform);
    }

    unproject_Normal(point: Vector2): Vector3 {
        const n = new Vector3(0, 0, -1);
        n.transforms(n, this._global_transform.basis);
        n.normalizes(n);
        return n;
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

    unproject_Point(ndc: Vector2, depth: number = this.near): Vector3 {
        if (depth === 0) return this._global_transform.position;
        const half_height = this.near * Math.tan(this.fov / 2);
        const half_width = this.aspect * half_height;
        const p = new Vector3(ndc.x * half_width, ndc.y * half_height, -depth);
        p.applys_Matrix4(p, this.global_transform);
        return p;
    }

    unproject_Normal(ndc: Vector2): Vector3 {
        const p = this.unproject_Point(ndc, this.near);
        return p.get_DirectionTo(this._global_transform.position, p);
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