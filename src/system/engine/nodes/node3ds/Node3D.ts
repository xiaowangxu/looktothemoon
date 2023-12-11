import type { ClassReader, ClassWriter } from "../../classes/ClassWriterReader";
import { Vector3, vec3 } from "../../../fivepebble/linear_algebra/Vector3";
import { Euler, euler } from "../../../fivepebble/linear_algebra/Euler";
import { Matrix4 } from "../../../fivepebble/linear_algebra/Matrix4";
import { Matrix3 } from "../../../fivepebble/linear_algebra/Matrix3";
import { Node, NodeNotification } from "../Node";


export class Node3D extends Node {
    public static readonly class_name: string = "Node3D";

    // local
    private _local_position: Vector3 = vec3();
    private _local_rotation: Euler = euler();
    private _local_scale: Vector3 = vec3(1, 1, 1);

    public get local_position() {
        return this._local_position;
    }
    public set local_position(position: Vector3) {
        this._local_position = position;
        this.is_local_transform_dirty = true;
        this.propagate_TransformChanged();
    }
    public get local_rotation() {
        return this._local_rotation;
    }
    public set local_rotation(rotation: Euler) {
        this._local_rotation = rotation;
        this.is_local_transform_dirty = true;
        this.propagate_TransformChanged();
    }
    public get local_scale() {
        return this._local_scale;
    }
    public set local_scale(scale: Vector3) {
        this._local_scale = scale;
        this.is_local_transform_dirty = true;
        this.propagate_TransformChanged();
    }

    private _top_level: boolean = false;
    public get top_level() { return this._top_level; }
    public set top_level(top_level: boolean) {
        if (this._top_level !== top_level) {
            this._top_level = top_level;
            this.propagate_TransformChanged();
        }
    }

    private _local_transform: Matrix4 = Matrix4.make_Identity();
    private is_local_transform_dirty: boolean = false;
    public get local_transform(): Matrix4 {
        if (this.is_local_transform_dirty) {
            const basis = Matrix3.make_Scale(this._local_scale.x, this._local_scale.y, this._local_scale.z).compose(Matrix3.from_Euler(this._local_rotation));
            this._local_transform = Matrix4.from_BasisPosition(basis, this._local_position);
            this.is_local_transform_dirty = false;
        }
        return this._local_transform;
    }
    public set local_transform(transform: Matrix4) {
        this._local_transform = transform;
        const [rotation, scale] = this._local_transform.basis.get_RotationScale();
        this._local_position = this._local_transform.position;
        this._local_rotation = rotation;
        this._local_scale = scale;
        this.is_local_transform_dirty = false;
        this.propagate_TransformChanged();
    }

    // global
    private _global_position: Vector3 = vec3();
    private _global_rotation: Euler = euler();

    private _global_transform: Matrix4 = Matrix4.make_Identity();
    private is_global_transform_dirty: boolean = false;
    protected is_global_transform_changed: boolean = false;

    public get global_position(): Vector3 {
        if (this.is_global_transform_dirty) {
            const _ = this.global_transform;
        }
        return this._global_position;
    }
    public set global_position(position: Vector3) {
        this.global_transform = Matrix4.from_BasisPosition(this.global_transform.basis, position);
    }
    public get global_rotation(): Euler {
        if (this.is_global_transform_dirty) {
            const _ = this.global_transform;
        }
        return this._global_rotation;
    }
    public set global_rotation(rotation: Euler) {
        this.global_transform = Matrix4.from_BasisPosition(Matrix3.from_Euler(rotation), this.global_transform.position);
    }

    public get global_transform(): Matrix4 {
        if (this.is_global_transform_dirty) {
            const parent = this.get_Parent();
            if (!this.top_level && parent !== undefined && parent instanceof Node3D) {
                this._global_transform = this.local_transform.compose(parent.global_transform!);
                // setup global position / rotation
                const [rotation, _] = this._global_transform.basis.get_RotationScale();
                this._global_position = this._global_transform.position;
                this._global_rotation = rotation;
                this.is_global_transform_dirty = false;
            }
            else {
                this._global_transform = this.local_transform;
                this._global_position = this.local_position;
                this._global_rotation = this.local_rotation;
                this.is_global_transform_dirty = false;
            }
        }
        return this._global_transform;
    }
    public set global_transform(transform: Matrix4) {
        const parent = this.get_Parent();
        if (!this.top_level && parent !== undefined && parent instanceof Node3D) {
            this.local_transform = transform.compose(parent.global_transform.inverse());
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
        return local_position.apply_Matrix4(this.global_transform);
    }

    public to_Local(global_position: Vector3) {
        return global_position.apply_Matrix4(this.global_transform.inverse());
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
