import { clamp } from "@/system/engine/MathF";
import { MeshInstance3D } from "@/system/engine/nodes/visual_instances/geometry_3ds/MeshInstance3D";
import { GeometryResource, SegmentLineGeometryResource, ThreeGeometryResource } from "@/system/engine/resources/GeometryResource";
import { LineMaterialResource, MaterialResource, ThreeMaterialResource } from "@/system/engine/resources/MaterialResource";
import { Cacher } from "@/system/utils/Cacher";
import { Box3, BoxGeometry, Color, Matrix4, MeshBasicMaterial, Vector3 } from "three";

const WireframeBoxWireFrameGeometry = new Cacher<SegmentLineGeometryResource>(() => {
    const geometry = new SegmentLineGeometryResource();
    geometry.points = [
        new Vector3(0, 0, 0), new Vector3(1, 0, 0),
        new Vector3(1, 0, 0), new Vector3(1, 0, 1),
        new Vector3(1, 0, 1), new Vector3(0, 0, 1),
        new Vector3(0, 0, 1), new Vector3(0, 0, 0),

        new Vector3(0, 1, 0), new Vector3(1, 1, 0),
        new Vector3(1, 1, 0), new Vector3(1, 1, 1),
        new Vector3(1, 1, 1), new Vector3(0, 1, 1),
        new Vector3(0, 1, 1), new Vector3(0, 1, 0),

        new Vector3(0, 0, 0), new Vector3(0, 1, 0),
        new Vector3(1, 0, 0), new Vector3(1, 1, 0),
        new Vector3(1, 0, 1), new Vector3(1, 1, 1),
        new Vector3(0, 0, 1), new Vector3(0, 1, 1),
    ];
    return geometry;
});
const WireframeBoxSolidGeometry = new Cacher<GeometryResource>(() => {
    const geometry = new BoxGeometry(1, 1, 1);
    geometry.translate(0.5, 0.5, 0.5);
    return new ThreeGeometryResource(geometry);
});

export class WireframeBox extends MeshInstance3D {
    private readonly wireframe_box_geometry: SegmentLineGeometryResource;
    private readonly wireframe_box_material: LineMaterialResource = new LineMaterialResource();
    private readonly solid_box_geometry: GeometryResource;
    private readonly solid_box_material: MaterialResource = new ThreeMaterialResource(new MeshBasicMaterial({ color: new Color(0.2, 0.3, 1.0), transparent: true, opacity: 0.1 }));
    private readonly solid_box_mesh: MeshInstance3D = new MeshInstance3D();

    private _box: Box3 = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
    public get box() { return this._box; }
    public set box(box: Box3) {
        this._box.copy(box);
        const global_transform = new Matrix4();
        const scale = this._box.getSize(new Vector3());
        global_transform.makeScale(scale.x, scale.y, scale.z);
        global_transform.setPosition(this._box.min);
        this.global_transform = global_transform;
    }

    private _width: number = 1.5;
    public get width() { return this._width; }
    public set width(width: number) {
        if (this._width !== width) {
            this._width = width;
            this.wireframe_box_material.width = this._width;
        }
    }

    private _color: Color = new Color(0.2, 0.3, 1.0);
    public get color() { return this._color; }
    public set color(color: Color) {
        this._color = color;
        this.wireframe_box_material.color = this._color;
    }

    private _wireframe_opacity: number = 1;
    public get wireframe_opacity() { return this._wireframe_opacity; }
    public set wireframe_opacity(opacity: number) {
        opacity = clamp(opacity, 0, 1);
        if (this._wireframe_opacity !== opacity) {
            this._wireframe_opacity = opacity;
            this.wireframe_box_material.transparent = this._wireframe_opacity !== 1;
            this.wireframe_box_material.opacity = this._wireframe_opacity;
        }
    }

    private _solid_opacity: number = 1;
    public get solid_opacity() { return this._solid_opacity; }
    public set solid_opacity(opacity: number) {
        opacity = clamp(opacity, 0, 1);
        if (this._solid_opacity !== opacity) {
            this._solid_opacity = opacity;
            // this.solid_box_material.transparent = this._solid_opacity !== 1;
            // this.solid_box_material.opacity = this._solid_opacity;
        }
    }

    constructor() {
        super();
        this.wireframe_box_geometry = WireframeBoxWireFrameGeometry.value;
        this.solid_box_geometry = WireframeBoxSolidGeometry.value;
        this.geometry = this.wireframe_box_geometry;
        this.material = this.wireframe_box_material;
        this.solid_box_mesh.geometry = this.solid_box_geometry;
        this.solid_box_mesh.material = this.solid_box_material;
        this.add_Child(this.solid_box_mesh);
        this.wireframe_box_material.width = this.width;
        this.wireframe_box_material.color = this.color;
        this.wireframe_box_material.transparent = this.wireframe_opacity !== 1;
        this.wireframe_box_material.opacity = this.wireframe_opacity;
    }
}