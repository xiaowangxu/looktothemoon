import { Cacher } from "@/system/utils/Cacher";
import type { RID } from "../../../Rid";
import { NodeNotification } from "../../../SceneTree";
import type { ClassReader, ClassRef, ClassWriter } from "../../../classes/ClassWriterReader";
import { ValueObject } from "../../../classes/ValueObject";
import type { GeometryResource } from "../../../resources/GeometryResource";
import { MaterialResource, ThreeMaterialResource } from "../../../resources/MaterialResource";
import { GeometryInstance3D } from "./GeometryInstance3D";
import { MeshPhongMaterial, DoubleSide } from "three";
import { Ref, RefArray } from "@/system/utils/RefCounted";

const FallbackMaterial = new Cacher(() => new Ref(new ThreeMaterialResource(new MeshPhongMaterial({ color: 0xff00ff, side: DoubleSide }))));

export class MeshInstance3D extends GeometryInstance3D {
    public static readonly class_name: string = "MeshInstance3D";

    private mesh_rid: RID | undefined = undefined;
    private _geometry: Ref<GeometryResource> = new Ref();
    public get geometry() { return this._geometry.value; }
    public set geometry(geometry: GeometryResource | undefined) {
        if (this._geometry.value !== geometry) {
            this._geometry.value = geometry;
            if (this.mesh_rid !== undefined) {
                const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
                if (visual_world !== undefined) {
                    if (this._geometry.value === undefined) {
                        visual_world.clear_MeshGeometry(this.mesh_rid);
                    }
                    else {
                        visual_world.set_MeshGeometry(this.mesh_rid, this._geometry.value);
                    }
                }
            }
        }
    }
    private _material: Ref<MaterialResource> | RefArray<MaterialResource> = new Ref(FallbackMaterial.value.value);
    public get material(): MaterialResource | MaterialResource[] { return this._material.value as MaterialResource[]; }
    public set material(material: MaterialResource | undefined | (MaterialResource | undefined)[]) {
        if (this._material instanceof RefArray || this._material instanceof Ref) this._material.clear();
        if (material === undefined) {
            this._material = new Ref(FallbackMaterial.value.value);
        }
        else if (material instanceof MaterialResource) {
            this._material = new Ref(material);
        }
        else {
            this._material = new RefArray(material.map(m => m === undefined ? FallbackMaterial.value.value : m));
        }
        if (this.mesh_rid !== undefined) {
            const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
            if (visual_world !== undefined) {
                if (this._material.value === undefined) {
                    visual_world.clear_MeshMaterial(this.mesh_rid);
                }
                else {
                    visual_world.set_MeshMaterial(this.mesh_rid, this._material.value as MaterialResource | MaterialResource[]);
                }
            }
        }
    }

    protected on_VisualLayerChanged(): void {
        if (this.mesh_rid !== undefined) {
            const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
            if (visual_world !== undefined) {
                visual_world.set_MeshLayer(this.mesh_rid, this.visual_layer);
            }
        }
    }

    protected on_CastShadowChanged(): void {
        if (this.mesh_rid !== undefined) {
            const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
            if (visual_world !== undefined) {
                visual_world.set_MeshCastShadow(this.mesh_rid, this.cast_shadow);
            }
        }
    }

    protected on_ReceiveShadowChanged(): void {
        if (this.mesh_rid !== undefined) {
            const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
            if (visual_world !== undefined) {
                visual_world.set_MeshReceiveShadow(this.mesh_rid, this.receive_shadow);
            }
        }
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree: {
                if (this.mesh_rid === undefined) {
                    const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
                    if (visual_world !== undefined) {
                        this.mesh_rid = visual_world.create_Mesh();
                        if (this.geometry !== undefined) {
                            visual_world.set_MeshGeometry(this.mesh_rid, this.geometry);
                        }
                        if (this.material !== undefined) {
                            visual_world.set_MeshMaterial(this.mesh_rid, this.material as MaterialResource | MaterialResource[]);
                        }
                        visual_world.set_MeshLayer(this.mesh_rid, this.visual_layer);
                        visual_world.set_MeshCastShadow(this.mesh_rid, this.cast_shadow);
                        visual_world.set_MeshReceiveShadow(this.mesh_rid, this.receive_shadow);
                    }
                }
                break;
            }
            case NodeNotification.ExitingTree: {
                if (this.mesh_rid !== undefined) {
                    const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
                    if (visual_world === undefined) throw new Error('cannot find visual world, fail to free mesh instance');
                    visual_world.free_Mesh(this.mesh_rid);
                    this.mesh_rid = undefined;
                }
                break;
            }
            case NodeNotification.InternalBeforeRender: {
                if (this.mesh_rid !== undefined) {
                    const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
                    if (visual_world === undefined) throw new Error('cannot find visual world, fail to update mesh instance');
                    if (this.is_global_transform_changed) {
                        visual_world.set_MeshGlobalTransform(this.mesh_rid, this.global_transform);
                    }
                    if (this.is_global_visible_changed) {
                        visual_world.set_MeshVisibility(this.mesh_rid, this.global_visible);
                    }
                }
                break;
            }
            case NodeNotification.Dispose: {
                this._geometry.clear();
                this._material.clear();
                break;
            }
        }
        super._notification(what);
    }

    // save / load

    public dump(writer: ClassWriter): void {
        super.dump(writer);
        writer.property('geometry', this.geometry);
        const material = this.material;
        writer.property('material',
            material === undefined ? undefined :
                (material instanceof MaterialResource ? material :
                    new ValueObject(material.map(m => m === FallbackMaterial.value.value ? undefined : writer.ref(m, false)))
                )
        );
    }

    public load(reader: ClassReader): void {
        super.load(reader);
        const geometry = reader.get<GeometryResource>('geometry');
        this.geometry = geometry;
        const material = reader.get('material');
        if (material === undefined) { }
        else if (material instanceof MaterialResource) this.material = material;
        else if (material instanceof ValueObject) {
            this.material = (material.value as ClassRef[]).map(ref => reader.get<MaterialResource>(ref)!);
        }
    }
}