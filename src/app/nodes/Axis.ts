import { Node3D } from "@/system/engine/nodes/node3ds/Node3D";
import { MeshInstance3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/geometry3ds/MeshInstance3D";
import { PolyLineGeometryResource } from "@/system/engine/resources/resources/GeometryResource";
import { LineMaterialResource } from "@/system/engine/resources/resources/MaterialResource";
import { euler } from "@/system/fivepebble/linear_algebra/Euler";
import { Euler, Vector3, Color } from "three";

export class Axis extends Node3D {
    private static readonly Red = 0xf82d4e;
    private static readonly Green = 0x04b973;
    private static readonly Blue = 0x466fd6;

    public readonly axis_x: MeshInstance3D = new MeshInstance3D();
    public readonly axis_y: MeshInstance3D = new MeshInstance3D();
    public readonly axis_z: MeshInstance3D = new MeshInstance3D();
    public readonly axis_x_mat: LineMaterialResource = new LineMaterialResource();
    public readonly axis_y_mat: LineMaterialResource = new LineMaterialResource();
    public readonly axis_z_mat: LineMaterialResource = new LineMaterialResource();

    private _axis_x_visible: boolean = true;
    public get axis_x_visible() { return this._axis_x_visible; }
    public set axis_x_visible(visible: boolean) {
        if (this._axis_x_visible !== visible) {
            this._axis_x_visible = visible;
            this.axis_x.local_visible = this._axis_x_visible;
        }
    }
    private _axis_y_visible: boolean = true;
    public get axis_y_visible() { return this._axis_y_visible; }
    public set axis_y_visible(visible: boolean) {
        if (this._axis_y_visible !== visible) {
            this._axis_x_visible = visible;
            this.axis_y.local_visible = this._axis_x_visible;
        }
    }
    private _axis_z_visible: boolean = true;
    public get axis_z_visible() { return this._axis_z_visible; }
    public set axis_z_visible(visible: boolean) {
        if (this._axis_z_visible !== visible) {
            this._axis_x_visible = visible;
            this.axis_z.local_visible = this._axis_x_visible;
        }
    }

    private _axis_x_width: number = 1.5;
    public get axis_x_width() { return this._axis_x_width; }
    public set axis_x_width(width: number) {
        if (this._axis_x_width !== width) {
            this._axis_x_width = width;
            this.axis_x_mat.width = this._axis_x_width;
        }
    }
    private _axis_y_width: number = 1.5;
    public get axis_y_width() { return this._axis_y_width; }
    public set axis_y_width(width: number) {
        if (this._axis_y_width !== width) {
            this._axis_x_width = width;
            this.axis_y_mat.width = this._axis_y_width;
        }
    }
    private _axis_z_width: number = 1.5;
    public get axis_z_width() { return this._axis_z_width; }
    public set axis_z_width(width: number) {
        if (this._axis_z_width !== width) {
            this._axis_x_width = width;
            this.axis_z_mat.width = this._axis_z_width;
        }
    }

    private axis_geometry: PolyLineGeometryResource = new PolyLineGeometryResource();

    constructor() {
        super();
        this.axis_geometry.points = [new Vector3(0, 0, 0), new Vector3(1, 0, 0)];
        this.axis_geometry.colors = [new Color(1, 1, 1), new Color(1, 1, 1)];
        this.axis_geometry.compute_LineDistances();
        this.add_Child(this.axis_x);
        this.add_Child(this.axis_y);
        this.add_Child(this.axis_z);
        this.axis_x.geometry = this.axis_y.geometry = this.axis_z.geometry = this.axis_geometry;
        this.axis_y.local_rotation = euler(0, 0, Math.PI / 2);
        this.axis_z.local_rotation = euler(0, -Math.PI / 2, 0);
        this.axis_x_mat.color = new Color(Axis.Red);
        this.axis_y_mat.color = new Color(Axis.Green);
        this.axis_z_mat.color = new Color(Axis.Blue);
        this.axis_x_mat.width = this.axis_x_width;
        this.axis_y_mat.width = this.axis_y_width;
        this.axis_z_mat.width = this.axis_z_width;
        // this.axis_x_mat.transparent = this.axis_y_mat.transparent = this.axis_z_mat.transparent = true;
        this.axis_x_mat.vertex_colors = this.axis_y_mat.vertex_colors = this.axis_z_mat.vertex_colors = true;
        // this.axis_x_mat.opacity = 0.35;
        // this.axis_y_mat.opacity = this.axis_z_mat.opacity = 0.5;
        this.axis_x.material = this.axis_x_mat;
        this.axis_y.material = this.axis_y_mat;
        this.axis_z.material = this.axis_z_mat;
    }
}