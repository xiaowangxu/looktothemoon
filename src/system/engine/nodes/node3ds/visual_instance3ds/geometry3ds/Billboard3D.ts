import type { Rid } from "../../../../Rid";
import { NodeNotification } from "@/system/engine/nodes/Node";
import { MaterialResource } from "../../../../resources/material_resources/MaterialResource";
import { GeometryInstance3D } from "./GeometryInstance3D";
import { Ref } from "@/system/utils/RefCounted";
import type { Config } from "@/system/engine/ConfiguredObject";
import type { PlaneGeometryResource } from "@/system/engine/resources/geometry_resources/PrimitiveGeometryResource";

export class Billboard3D extends GeometryInstance3D {
    public static readonly class_name: string = "Billboard3D";

    protected mesh_rid: Rid | undefined = undefined;
    protected geometry!: Ref<PlaneGeometryResource>;

    protected _material_override: Ref<MaterialResource> = new Ref();
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
    
    protected on_CullableOverrideChanged(): void {
        throw new Error("<Billboard3D> on_CullableOverrideChanged: you can not change Billboard3D's cullable property");
    }

    protected on_EditorHighlightedChanged(): void {
        if (this.mesh_rid !== undefined) {
            const visual_world = this.get_Viewport()?.world_3d?.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_MeshEditorHighlighted(this.mesh_rid, this._editor_highlighted);
            }
        }
    }

    constructor(config: Config) {
        super(config);
        this.block_redundant_before_render = false;
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree: {
                if (this.mesh_rid === undefined) {
                    const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                    if (visual_world !== undefined) {
                        this.mesh_rid = visual_world.create_Mesh();
                        if (this.geometry !== undefined) {
                            visual_world.set_MeshGeometry(this.mesh_rid, this.geometry.expect);
                        }
                        if (this.material !== undefined) {
                            visual_world.set_MeshMaterialOverride(this.mesh_rid, this.material);
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
            case NodeNotification.ExitingTree: {
                if (this.mesh_rid !== undefined) {
                    const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                    if (visual_world === undefined) throw new Error('<Billboard3D> _notification@ExitingTree: cannot find visual world, fail to free mesh instance');
                    visual_world.free_Mesh(this.mesh_rid);
                    this.mesh_rid = undefined;
                }
                break;
            }
            case NodeNotification.InternalBeforeRender: {
                if (this.mesh_rid !== undefined && (this.is_global_transform_changed || this.is_global_visible_changed)) {
                    const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                    if (visual_world === undefined) throw new Error('<Billboard3D> _notification@InternalBeforeRender: cannot find visual world, fail to update mesh instance');
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
                this.geometry.clear();
                this._material_override.clear();
                break;
            }
        }
        super._notification(what);
    }
}