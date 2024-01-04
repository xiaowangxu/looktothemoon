import type { Rid } from "../../../../Rid";
import { NodeNotification } from "@/system/engine/nodes/Node";
import type { ClassReader, ClassWriter } from "../../../../classes/saver_loader/ClassWriterReader";
import type { GeometryResource } from "../../../../resources/geometry_resources/GeometryResource";
import { MaterialResource } from "../../../../resources/material_resources/MaterialResource";
import { GeometryInstance3D } from "./GeometryInstance3D";
import { Ref } from "@/system/utils/RefCounted";

export class MeshInstance3D extends GeometryInstance3D {
    public static readonly class_name: string = "MeshInstance3D";

    private mesh_rid: Rid | undefined = undefined;
    
    private _geometry: Ref<GeometryResource> = new Ref();
    public get geometry() { return this._geometry.value; }
    public set geometry(geometry: GeometryResource | undefined) {
        if (this._geometry.value !== geometry) {
            this._geometry.value = geometry;
            if (this.mesh_rid !== undefined) {
                const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                if (visual_world !== undefined) {
                    visual_world.set_MeshGeometry(this.mesh_rid, this._geometry.value);
                }
            }
        }
    }

    private _material_override: Ref<MaterialResource> = new Ref();
    public get material(): MaterialResource | undefined { return this._material_override.value; }
    public set material(material: MaterialResource | undefined) {
        if (this._material_override.value !== material) {
            this._material_override.value = material;
            if (this.mesh_rid !== undefined) {
                const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                if (visual_world !== undefined) {
                    visual_world.set_MeshMaterialOverride(this.mesh_rid, this._material_override.value);
                }
            }
        }
    }

    private _surface_materials_map: Map<number, Ref<MaterialResource>> = new Map();
    public set_SurfaceMaterial(surface_idx: number, material: MaterialResource | undefined) {
        if (surface_idx < 0) return;
        if (this._surface_materials_map.has(surface_idx)) {
            const old_material_ref = this._surface_materials_map.get(surface_idx)!;
            if (material === undefined) {
                old_material_ref.clear();
                this._surface_materials_map.delete(surface_idx);
            }
            else {
                old_material_ref.value = material;
            }
            if (this.mesh_rid !== undefined) {
                const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                if (visual_world !== undefined) {
                    visual_world.set_MeshSurfaceMaterial(this.mesh_rid, surface_idx, material);
                }
            }
        }
        else if (material !== undefined) {
            this._surface_materials_map.set(surface_idx, new Ref(material));
            if (this.mesh_rid !== undefined) {
                const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                if (visual_world !== undefined) {
                    visual_world.set_MeshSurfaceMaterial(this.mesh_rid, surface_idx, material);
                }
            }
        }
    }

    protected on_LayerChanged(): void {
        if (this.mesh_rid !== undefined) {
            const visual_world = this.get_Viewport()?.world_3d?.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_MeshLayer(this.mesh_rid, this._layer);
            }
        }
    }

    protected on_RenderQueueChanged(): void {
        if (this.mesh_rid !== undefined) {
            const visual_world = this.get_Viewport()?.world_3d?.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_MeshRenderQueue(this.mesh_rid, this._render_queue);
            }
        }
    }

    protected on_CastShadowChanged(): void {
        if (this.mesh_rid !== undefined) {
            const visual_world = this.get_Viewport()?.world_3d?.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_MeshCastShadow(this.mesh_rid, this._cast_shadow);
            }
        }
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree: {
                if (this.mesh_rid === undefined) {
                    const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                    if (visual_world !== undefined) {
                        this.mesh_rid = visual_world.create_Mesh();
                        if (this.geometry !== undefined) {
                            visual_world.set_MeshGeometry(this.mesh_rid, this.geometry);
                        }
                        if (this.material !== undefined) {
                            visual_world.set_MeshMaterialOverride(this.mesh_rid, this.material);
                        }
                        for (const [surface_idx, material] of this._surface_materials_map.entries()) {
                            visual_world.set_MeshSurfaceMaterial(this.mesh_rid, surface_idx, material.expect);
                        }
                        visual_world.set_MeshLayer(this.mesh_rid, this._layer);
                        visual_world.set_MeshRenderQueue(this.mesh_rid, this._render_queue);
                        visual_world.set_MeshCastShadow(this.mesh_rid, this._cast_shadow);
                    }
                }
                break;
            }
            case NodeNotification.ExitingTree: {
                if (this.mesh_rid !== undefined) {
                    const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                    if (visual_world === undefined) throw new Error('<MeshInstance3D> _notification@ExitingTree: cannot find visual world, fail to free mesh instance');
                    visual_world.free_Mesh(this.mesh_rid);
                    this.mesh_rid = undefined;
                }
                break;
            }
            case NodeNotification.InternalBeforeRender: {
                if (this.mesh_rid !== undefined && (this.is_global_transform_changed || this.is_global_visible_changed)) {
                    const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                    if (visual_world === undefined) throw new Error('<MeshInstance3D> _notification@InternalBeforeRender: cannot find visual world, fail to update mesh instance');
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
                this._material_override.clear();
                for (const value of this._surface_materials_map.values()) {
                    value.clear();
                }
                this._surface_materials_map.clear();
                break;
            }
        }
        super._notification(what);
    }

    // save / load

    public dump(writer: ClassWriter): void {
        super.dump(writer);
        writer.property('geometry', this.geometry);
        writer.property('material', this.material);
    }

    public load(reader: ClassReader): void {
        super.load(reader);
        this.geometry = reader.get<GeometryResource>('geometry');
        this.material = reader.get<MaterialResource>('material');
    }
}