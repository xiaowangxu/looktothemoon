import type { ClassReader, ClassWriter } from "../../classes/saver_loader/ClassWriterReader";
import { Vector3, vec3 } from "../../../fivepebble/linear_algebra/Vector3";
import { Euler, euler } from "../../../fivepebble/linear_algebra/Euler";
import { Matrix4 } from "../../../fivepebble/linear_algebra/Matrix4";
import { Matrix3 } from "../../../fivepebble/linear_algebra/Matrix3";
import { Node, NodeNotification } from "../Node";

export class Node3D extends Node {
    public static readonly class_name: string = "Node3D";

    // local
    protected readonly _local_position: Vector3 = vec3();
    protected readonly _local_rotation: Euler = euler();
    protected readonly _local_scale: Vector3 = vec3(1, 1, 1);

    public get local_position() {
        return this._local_position.clone();
    }
    public set local_position(position: Vector3) {
        if (!this._local_position.equal(position)) {
            this._local_position.copy(position);
            this.is_local_transform_dirty = true;
            this.propagate_TransformChanged();
        }
    }
    public get local_rotation() {
        return this._local_rotation.clone();
    }
    public set local_rotation(rotation: Euler) {
        if (!this._local_rotation.equal(rotation)) {
            this._local_rotation.copy(rotation);
            this.is_local_transform_dirty = true;
            this.propagate_TransformChanged();
        }
    }
    public get local_scale() {
        return this._local_scale.clone();
    }
    public set local_scale(scale: Vector3) {
        if (!this._local_scale.equal(scale)) {
            this._local_scale.copy(scale);
            this.is_local_transform_dirty = true;
            this.propagate_TransformChanged();
        }
    }

    protected _top_level: boolean = false;
    public get top_level() { return this._top_level; }
    public set top_level(top_level: boolean) {
        if (this._top_level !== top_level) {
            this._top_level = top_level;
            this.propagate_TransformChanged();
        }
    }

    protected readonly _local_transform: Matrix4 = Matrix4.make_Identity();
    protected is_local_transform_dirty: boolean = false;

    static #basis: Matrix3 = Matrix3.make_Identity();
    static #vector3: Vector3 = Vector3.make_Zero();
    static #matrix4_0: Matrix4 = Matrix4.make_Identity();
    static #matrix4_1: Matrix4 = Matrix4.make_Identity();
    static #basis_rotation: Matrix3 = Matrix3.make_Identity();
    static #euler: Euler = new Euler();

    public get local_transform(): Matrix4 {
        if (this.is_local_transform_dirty) {
            const basis = Node3D.#basis;
            const basis_rotation = Node3D.#basis_rotation;
            basis.set_Scale(this._local_scale.x, this._local_scale.y, this._local_scale.z);
            basis_rotation.set_Euler(this._local_rotation);
            basis.composes(basis_rotation, basis);
            this._local_transform.set_BasisPosition(basis, this._local_position);
            this.is_local_transform_dirty = false;
        }
        return this._local_transform.clone();
    }
    public set local_transform(transform: Matrix4) {
        this._local_transform.copy(transform);
        this._local_transform.get_Basis(Node3D.#basis).decomposes_RotationScale(Node3D.#euler, Node3D.#vector3);
        this._local_position.copy(this._local_transform.position);
        this._local_rotation.copy(Node3D.#euler);
        this._local_scale.copy(Node3D.#vector3);
        this.is_local_transform_dirty = false;
        this.propagate_TransformChanged();
    }

    // global
    protected readonly _global_position: Vector3 = vec3();
    protected readonly _global_rotation: Euler = euler();

    protected readonly _global_transform: Matrix4 = Matrix4.make_Identity();
    private is_global_transform_dirty: boolean = false;
    protected is_global_transform_changed: boolean = false;

    public get global_position(): Vector3 {
        if (this.is_global_transform_dirty) {
            const _ = this.global_transform;
        }
        return this._global_position.clone();
    }
    public set global_position(position: Vector3) {
        this.global_transform = Node3D.#matrix4_0.set_BasisPosition(this.global_transform.get_Basis(Node3D.#basis), position);
    }
    public get global_rotation(): Euler {
        if (this.is_global_transform_dirty) {
            const _ = this.global_transform;
        }
        return this._global_rotation.clone();
    }
    public set global_rotation(rotation: Euler) {
        this.global_transform = Node3D.#matrix4_0.set_BasisPosition(Node3D.#basis.set_Euler(rotation), this.global_transform.get_Position(Node3D.#vector3));
    }

    public get global_transform(): Matrix4 {
        if (this.is_global_transform_dirty) {
            const parent = this.get_Parent();
            if (!this.top_level && parent !== undefined && parent instanceof Node3D) {
                this._global_transform.composes(this.local_transform, parent.global_transform!);
                // setup global position / rotation
                this._global_transform.get_Basis(Node3D.#basis).decomposes_RotationScale(Node3D.#euler, Node3D.#vector3);
                this._global_position.copy(this._global_transform.get_Position(Node3D.#vector3));
                this._global_rotation.copy(Node3D.#euler);
            }
            else {
                this._global_transform.copy(this.local_transform);
                this._global_position.copy(this.local_position);
                this._global_rotation.copy(this.local_rotation);
            }
            this.is_global_transform_dirty = false;
        }
        return this._global_transform.clone();
    }
    public set global_transform(transform: Matrix4) {
        const parent = this.get_Parent();
        if (!this.top_level && parent !== undefined && parent instanceof Node3D) {
            this.local_transform = Node3D.#matrix4_0.composes(transform, Node3D.#matrix4_1.inverses(parent.global_transform));
        }
        else {
            this.local_transform = transform;
        }
    }

    protected propagate_TransformChanged() {
        if (this.is_global_transform_dirty) return;
        for (const child of this.children) {
            if (child instanceof Node3D && !child.top_level) {
                child.propagate_TransformChanged();
            }
        }
        this.is_global_transform_dirty = true;
        this.is_global_transform_changed = true;
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.Parented: {
                const parent = this.get_Parent();
                if (parent !== undefined && parent instanceof Node3D) {
                    this.propagate_TransformChanged();
                }
                return;
            }
            case NodeNotification.Unparented: {
                this.propagate_TransformChanged();
                return;
            }
            case NodeNotification.InternalBeforeRender: {
                this.is_global_transform_changed = false;
            }
        }
        super._notification(what);
    }

    protected _notification_IgnoreTransformChange(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.Parented: {
                const parent = this.get_Parent();
                if (parent !== undefined && parent instanceof Node3D) {
                    this.propagate_TransformChanged();
                }
                return;
            }
            case NodeNotification.Unparented: {
                this.propagate_TransformChanged();
                return;
            }
        }
    }

    // apis
    public to_Global(local_position: Vector3) {
        return Vector3.new._apply_Matrix4(local_position, this.global_transform);
    }

    public to_Local(global_position: Vector3) {
        const invert = this.global_transform;
        return Vector3.new._apply_Matrix4(global_position, invert.inverses(invert));
    }

    // save / load
    public dump(writer: ClassWriter): void {
        super.dump(writer);
        writer.property('top_level', this.top_level);
        writer.property('local_transform', this.local_transform);
    }

    public load(reader: ClassReader): void {
        super.load(reader);
        this.top_level = reader.get<boolean>('top_level') ?? false;
        this.local_transform = reader.get<Matrix4>('local_transform') ?? Matrix4.make_Identity();
    }
}