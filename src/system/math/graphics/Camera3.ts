import { Deg2Rad } from "../Scalar";
import { Matrix4 } from "../linear_algebra/Matrix4";
import type { CameraLike } from "./CameraLike";

export abstract class Camera3 implements CameraLike<Matrix4> {
    protected _projection: Matrix4 = Matrix4.make_Identity();
    get projection() { return this._projection; }

    protected _global_transform: Matrix4 = Matrix4.make_Identity();
    get global_transform() { return this._global_transform; }
    set global_transformrld(transform: Matrix4) {
        this._global_transform = transform;
    }

    protected _mask: number = 0xffffffff;
    set mask(mask: number) {
        mask = mask & 0xffffffff;
        if (this._mask !== mask) {
            this._mask = mask;
        }
    }
    get mask() { return this._mask; }

    public abstract get_Frustum(): any;
}

export class OrthographicCamera3 extends Camera3 {
    protected _width: number = 2;
    public get width() { return this._width; }
    public set width(width: number) {
        if (this._width !== width) {
            this._width = width;
            this.update();
        }
    }

    protected _height: number = 2;
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

    constructor() {
        super();
        this.update();
    }

    protected update() {
        const half_w = this.width / (2 * this.zoom);
        const half_h = this.height / (2 * this.zoom);
        this._projection = Matrix4.make_OrthogonalProjection(-half_w, half_w, half_h, -half_h, this.near, this.far);
    }

    public get_Frustum() {
        throw new Error("Method not implemented.");
    }
}

export class PerspectiveCamera3 extends Camera3 {
    protected _fov: number = 70;
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

    constructor() {
        super();
        this.update();
    }

    protected update() {
        this._projection = Matrix4.make_PerspectiveFovProjection(this.fov * Deg2Rad, this.aspect, this.near, this.far);
    }

    public get_Frustum() {
        throw new Error("Method not implemented.");
    }
}