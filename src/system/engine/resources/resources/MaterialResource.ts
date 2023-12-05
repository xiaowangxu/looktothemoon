import { Resource } from "../Resource";
import { Camera, Color, Material, MeshNormalMaterial, Scene, ShaderMaterial, WebGLRenderer } from 'three';
import { MaterialLoader } from 'three';
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { PlainObject } from "@/system/engine/classes/PlainObject";
import { ClassReader, type ClassWriter } from "../../classes/ClassWriterReader";
import type { RefCounted } from "@/system/utils/RefCounted";

declare module 'three' {
    interface Material extends RefCounted {
        isRefCounted: boolean;
        ref_count(): number;
        ref(): void;
        unref(): void;
    }
}

Material.prototype.isRefCounted = true;
Material.prototype.ref = function () {
    this.userData.ref_count++;
}
Material.prototype.ref_count = function () {
    return this.userData.ref_count;
}
Material.prototype.unref = function () {
    if (this.ref_count() === 0) return;
    const ref_count = --this.userData.ref_count;
    if (ref_count <= 0) {
        this.dispose();
    }
}

export abstract class MaterialResource extends Resource {
    public static readonly class_name: string = "MaterialResource";

    constructor() {
        super();
    }

    protected init_RefCount() {
        Object.defineProperty(
            this.get_Material().userData,
            'ref_count',
            {
                value: 0,
                enumerable: false,
                writable: true,
            }
        );
    }

    public get_Material(): Material {
        throw new Error('abstract method');
    }
}

export class ThreeMaterialResource extends MaterialResource {
    public static readonly class_name: string = "ThreeMaterialResource";
    public static readonly use_custom_instantiater: boolean = true;

    private readonly material: Material;

    constructor(material: Material) {
        super();
        this.material = material;
        this.init_RefCount();
    }

    public cast_Material<T extends Material>() {
        return this.material as T;
    }

    public get_Material(): Material {
        return this.material;
    }

    protected dispose(): void {
        console.log(">>>>> dispose three material", this);
    }

    // save / load

    public dump(writer: ClassWriter): void {
        writer.initialization('three_material', new PlainObject(this.material.toJSON()));
    }

    public load(reader: ClassReader): void { }

    public static instantiate(data: any | ClassReader): ThreeMaterialResource {
        if (data instanceof ClassReader) {
            const three_material: PlainObject | undefined = data.get('three_material');
            if (three_material === undefined || !(three_material instanceof PlainObject)) throw new Error('can not instantiate ThreeMaterialResource');
            const loader = new MaterialLoader();
            const material = loader.parse(three_material.value);
            return new ThreeMaterialResource(material);
        }
        else {
            const three_material: Material | undefined = data.three_material;
            if (three_material === undefined || !(three_material instanceof Material)) throw new Error('can not instantiate ThreeMaterialResource');
            return new ThreeMaterialResource(three_material);
        }
    }
}

export class PhysicalMaterialResource extends MaterialResource {
    public static readonly class_name: string = "PhysicalMaterialResource";
    
    private readonly physical_material: MeshNormalMaterial = new MeshNormalMaterial();

    constructor() {
        super();
        this.init_RefCount();
    }

    public get_Material(): Material {
        return this.physical_material;
    }

    protected dispose(): void {}
}

export class NormalMaterialResource extends MaterialResource {
    public static readonly class_name: string = "NormalMaterialResource";

    private readonly normal_material: MeshNormalMaterial = new MeshNormalMaterial();

    constructor() {
        super();
        this.init_RefCount();
    }

    public get_Material(): Material {
        return this.normal_material;
    }

    protected dispose(): void { }

    // save / load

    public dump(writer: ClassWriter): void {
    }

    public load(reader: ClassReader): void {
    }
}

export class LineMaterialResource extends MaterialResource {
    public static readonly class_name: string = "LineMaterialResource";

    private line_material: LineMaterial = new LineMaterial({
        color: 0xffffff,
        vertexColors: false,
        linewidth: 1,
        worldUnits: false,
        alphaToCoverage: false,
        dashed: false,
        dashScale: 1,
        gapSize: 1,
        dashSize: 2,
        dashOffset: 0,
    });

    private _transparent: boolean = false;
    public get transparent() { return this._transparent; }
    public set transparent(transparent: boolean) {
        if (this._transparent !== transparent) {
            this._transparent = transparent;
            this.line_material.transparent = this._transparent;
        }
    }

    private _opacity: number = 1;
    public get opacity() { return this._opacity; }
    public set opacity(opacity: number) {
        if (this._opacity !== opacity) {
            this._opacity = opacity;
            this.line_material.opacity = this._opacity;
        }
    }

    private _color: Color = new Color(1, 1, 1);
    public get color() { return this._color; }
    public set color(color: Color) {
        this._color.copy(color);
        this.line_material.color = this._color;
    }

    private _vertex_colors: boolean = false;
    public get vertex_colors() { return this._vertex_colors; }
    public set vertex_colors(vertex_color: boolean) {
        if (this._vertex_colors !== vertex_color) {
            this._vertex_colors = vertex_color;
            this.line_material.vertexColors = this._vertex_colors;
            this.line_material.needsUpdate = true;
        }
    }

    private _width: number = 1;
    public get width() { return this._width; }
    public set width(width: number) {
        if (this._width !== width) {
            this._width = width;
            this.line_material.linewidth = this._width;
        }
    }

    private _world_unit: boolean = false;
    public get world_unit() { return this._world_unit; }
    public set world_unit(world_unit: boolean) {
        if (this._world_unit !== world_unit) {
            this._world_unit = world_unit;
            this.line_material.worldUnits = this._world_unit;
            this.line_material.needsUpdate = true;
        }
    }

    private _alpha_to_coverage: boolean = true;
    public get alpha_to_coverage() { return this._alpha_to_coverage; }
    public set alpha_to_coverage(alpha_to_coverage: boolean) {
        if (this._alpha_to_coverage !== alpha_to_coverage) {
            this._alpha_to_coverage = alpha_to_coverage;
            this.line_material.alphaToCoverage = this._alpha_to_coverage;
        }
    }

    private _dashed: boolean = false;
    public get dashed() { return this._dashed; }
    public set dashed(dashed: boolean) {
        if (this._dashed !== dashed) {
            this._dashed = dashed;
            this.line_material.dashed = this._dashed;
        }
    }

    private _dash_scale: number = 1;
    public get dash_scale() { return this._dash_scale; }
    public set dash_scale(dash_scale: number) {
        if (this._dash_scale !== dash_scale) {
            this._dash_scale = dash_scale;
            this.line_material.dashScale = this._dash_scale;
        }
    }

    private _gap_size: number = 1;
    public get gap_size() { return this._gap_size; }
    public set gap_size(gap_size: number) {
        if (this._gap_size !== gap_size) {
            this._gap_size = gap_size;
            this.line_material.gapSize = this._gap_size;
        }
    }

    private _dash_size: number = 2;
    public get dash_size() { return this._dash_size; }
    public set dash_size(dash_size: number) {
        if (this._dash_size !== dash_size) {
            this._dash_size = dash_size;
            this.line_material.dashSize = this._dash_size;
        }
    }

    private _dash_offset: number = 0;
    public get dash_offset() { return this._dash_offset; }
    public set dash_offset(dash_offset: number) {
        if (this._dash_offset !== dash_offset) {
            this._dash_offset = dash_offset;
            this.line_material.dashOffset = this._dash_offset;
        }
    }

    constructor() {
        super();
        (this.line_material as any).onBeforeRender = (renderer: WebGLRenderer, scene: Scene, camera: Camera) => {
            renderer.getSize(this.line_material.resolution);
        };
        this.init_RefCount();
    }

    public get_Material(): Material {
        return this.line_material;
    }

    protected dispose(): void { }

    // save / load

    public dump(writer: ClassWriter): void {
        writer.property('transparent', this.transparent);
        writer.property('opacity', this.opacity);
        writer.property('color', this.color);
        writer.property('vertex_colors', this.vertex_colors);
        writer.property('width', this.width);
        writer.property('world_unit', this.world_unit);
        writer.property('alpha_to_coverage', this.alpha_to_coverage);
        writer.property('dashed', this.dashed);
        writer.property('dash_scale', this.dash_scale);
        writer.property('gap_size', this.gap_size);
        writer.property('dash_size', this.dash_size);
        writer.property('dash_offset', this.dash_offset);
    }

    public load(reader: ClassReader): void {
        this.transparent = reader.get<boolean>('transparent') ?? false;
        this.opacity = reader.get<number>('opacity') ?? 1;
        this.color = reader.get<Color>('color') ?? new Color(1, 1, 1);
        this.vertex_colors = reader.get<boolean>('vertex_colors') ?? false;
        this.width = reader.get<number>('width') ?? 1;
        this.world_unit = reader.get<boolean>('world_unit') ?? false;
        this.alpha_to_coverage = reader.get<boolean>('alpha_to_coverage') ?? true;
        this.dashed = reader.get<boolean>('dashed') ?? false;
        this.dash_scale = reader.get<number>('dash_scale') ?? 1;
        this.gap_size = reader.get<number>('gap_size') ?? 1;
        this.dash_size = reader.get<number>('dash_size') ?? 2;
        this.dash_offset = reader.get<number>('dash_offset') ?? 0;
    }
}