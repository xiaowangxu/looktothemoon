import { Node3D, NodeNotification } from "../../SceneTree";

export class VisualInstance3D extends Node3D {
    private _local_visible: boolean = true;
    public get local_visible() { return this._local_visible; }
    public set local_visible(visible: boolean) {
        if (this._local_visible !== visible) {
            this._local_visible = visible;
            this.propagate_VisibilityChanged();
            this.is_global_visible_dirty = true;
        }
    }

    private _global_visible: boolean = true;
    private is_global_visible_dirty: boolean = false;
    protected is_global_visible_changed: boolean = false;
    public get global_visible(): boolean {
        if (this.is_global_visible_dirty) {
            const parent = this.get_Parent();
            if (parent !== undefined && parent instanceof VisualInstance3D) {
                const parent_global_visible = parent.global_visible;
                this._global_visible = parent_global_visible && this.local_visible;
                this.is_global_visible_dirty = false;
            }
            else {
                this._global_visible = this.local_visible;
                this.is_global_visible_dirty = false;
            }
        }
        return this._global_visible;
    }

    private _visual_layer: number = 0xffffffff;
    public get visual_layer() { return this._visual_layer; }
    public set visual_layer(layer: number) {
        layer = layer & 0xffffffff;
        if (this._visual_layer !== layer) {
            this._visual_layer = layer;
            this.on_VisualLayerChanged();
        }
    }

    protected on_VisualLayerChanged() {
        throw new Error('abstract method');
    }

    private propagate_VisibilityChanged() {
        if (this.is_global_visible_dirty) return;
        for (const child of this.children) {
            if (child instanceof VisualInstance3D) {
                child.propagate_VisibilityChanged();
            }
        }
        this.is_global_visible_dirty = true;
        this.is_global_visible_changed = true;
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.Parented: {
                const parent = this.get_Parent();
                if (parent !== undefined && parent instanceof VisualInstance3D) {
                    this.propagate_VisibilityChanged();
                }
                break;
            }
            case NodeNotification.Unparented: {
                this.propagate_VisibilityChanged();
                break;
            }
            case NodeNotification.InternalBeforeRender: {
                this.is_global_visible_changed = false;
                break;
            }
        }
        super._notification(what);
    }
}