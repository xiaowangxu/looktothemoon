import type { Rid } from "../../../../Rid";
import { NodeNotification } from "@/system/engine/nodes/Node";
import { GeometryInstance3D } from "./GeometryInstance3D";
import { Ref, RefMap } from "@/system/utils/RefCounted";
import type { Geometry3DResource } from "@/system/engine/resources/geometry3d_resources/Geometry3DResource";
import type { Material3DResource } from "@/system/engine/resources/material_3d_resources/Material3DResource";

export class MeshInstance3D extends GeometryInstance3D {

    public static readonly class_name: string = "MeshInstance3D";

    private mesh_rid: Rid | undefined = undefined;

    private _geometry: Ref<Geometry3DResource> = new Ref();
    public get geometry() { return this._geometry.value; }
    public set geometry(geometry: Geometry3DResource | undefined) {
        if (this._geometry.value !== geometry) {
            this._geometry.value = geometry;
            if (this.mesh_rid !== undefined) {
                const visual_world = this.visual_world;
                if (visual_world !== undefined) {
                    visual_world.set_MeshGeometry(this.mesh_rid, this._geometry.value);
                }
            }
        }
    }

    private _material_override: Ref<Material3DResource> = new Ref();
    public get material(): Material3DResource | undefined { return this._material_override.value; }
    public set material(material: Material3DResource | undefined) {
        if (this._material_override.value !== material) {
            this._material_override.value = material;
            if (this.mesh_rid !== undefined) {
                const visual_world = this.visual_world;
                if (visual_world !== undefined) {
                    visual_world.set_MeshMaterialOverride(this.mesh_rid, this._material_override.value);
                }
            }
        }
    }

    private _surface_materials_map: RefMap<number, Material3DResource> = new RefMap();
    public set_SurfaceMaterial(surface_idx: number, material: Material3DResource | undefined) {
        if (surface_idx < 0) return;
        if (this._surface_materials_map.set(surface_idx, material)) {
            if (this.mesh_rid !== undefined) {
                const visual_world = this.visual_world;
                if (visual_world !== undefined) {
                    visual_world.set_MeshSurfaceMaterial(this.mesh_rid, surface_idx, material);
                }
            }
        }
    }

    protected clear_SurfaceMaterials() {
        const visual_world = this.visual_world;
        for (const surface_idx of this._surface_materials_map.keys()) {
            if (this.mesh_rid !== undefined && visual_world !== undefined) {
                visual_world.set_MeshSurfaceMaterial(this.mesh_rid, surface_idx, undefined);
            }
        }
        this._surface_materials_map.clear();
    }

    protected on_LayerChanged(): void {
        if (this.mesh_rid !== undefined) {
            const visual_world = this.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_MeshLayer(this.mesh_rid, this._layer);
            }
        }
    }

    protected on_RenderQueueChanged(): void {
        if (this.mesh_rid !== undefined) {
            const visual_world = this.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_MeshRenderQueue(this.mesh_rid, this._render_queue);
            }
        }
    }

    protected on_CastShadowChanged(): void {
        if (this.mesh_rid !== undefined) {
            const visual_world = this.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_MeshCastShadow(this.mesh_rid, this._cast_shadow);
            }
        }
    }

    protected on_CullableOverrideChanged(): void {
        if (this.mesh_rid !== undefined) {
            const visual_world = this.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_MeshCullableOverride(this.mesh_rid, this._cullable_override);
            }
        }
    }

    protected on_EditorHighlightedChanged(): void {
        if (this.mesh_rid !== undefined) {
            const visual_world = this.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_MeshEditorHighlighted(this.mesh_rid, this._editor_highlighted);
            }
        }
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree:
            case NodeNotification.World3DAdded: {
                if (this.mesh_rid === undefined) {
                    const visual_world = this.visual_world;
                    if (visual_world !== undefined) {
                        this.mesh_rid = visual_world.create_Mesh();
                        if (this.geometry !== undefined) {
                            visual_world.set_MeshGeometry(this.mesh_rid, this.geometry);
                        }
                        if (this.material !== undefined) {
                            visual_world.set_MeshMaterialOverride(this.mesh_rid, this.material);
                        }
                        for (const [surface_idx, material] of this._surface_materials_map.entries()) {
                            visual_world.set_MeshSurfaceMaterial(this.mesh_rid, surface_idx, material);
                        }
                        visual_world.set_MeshLayer(this.mesh_rid, this._layer);
                        visual_world.set_MeshRenderQueue(this.mesh_rid, this._render_queue);
                        visual_world.set_MeshCastShadow(this.mesh_rid, this._cast_shadow);
                        visual_world.set_MeshCullableOverride(this.mesh_rid, this._cullable_override);
                        visual_world.set_MeshEditorHighlighted(this.mesh_rid, this._editor_highlighted);
                    }
                }
                break;
            }
            case NodeNotification.ExitingTree:
            case NodeNotification.World3DRemoved: {
                if (this.mesh_rid !== undefined) {
                    const visual_world = this.visual_world;
                    if (visual_world === undefined) throw new Error('<MeshInstance3D> _notification@ExitingTree: cannot find visual world, fail to free mesh instance');
                    visual_world.free_Mesh(this.mesh_rid);
                    this.mesh_rid = undefined;
                }
                break;
            }
            case NodeNotification.InternalBeforeRender: {
                if (this.mesh_rid !== undefined && (this.is_global_transform_changed || this.is_global_visible_changed)) {
                    const visual_world = this.visual_world;
                    if (visual_world === undefined) throw new Error('<MeshInstance3D> _notification@InternalBeforeRender: cannot find visual world, fail to update mesh instance');
                    if (this.is_global_transform_changed) {
                        this.update_GlobalTransform();
                        visual_world.set_MeshGlobalTransform(this.mesh_rid, this._global_transform);
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
                this._surface_materials_map.clear();
                break;
            }
        }
        super._notification(what);
    }
}