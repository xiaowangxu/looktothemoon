import { Box3 } from "@/system/fivepebble/geometries/Box3";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import type { CameraFrustumLikeCullable } from "@/system/fivepebble/graphics/CameraLike";
import type { Frustum3 } from "@/system/fivepebble/graphics/Frustum3";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import type { Transformable } from "@/system/fivepebble/linear_algebra/VectorLike";
import { Ref, RefMap } from "@/system/utils/RefCounted";
import type { Cloneable, Disposable } from "@/system/utils/Type";
import { RID, type Rid } from "../../Rid";
import type { RenderServerRenderMaterial } from "../../render_server/material/RenderServerRenderMaterial";
import { WorldObject } from "../WorldObject";
import type { SceneTree } from "../../SceneTree";
import type { MaterialResource } from "../../resources/material_resources/MaterialResource";
import type { RenderServerRenderer3DQueue } from "../../render_server/renderer3d/RenderServerRenderer3DQueue";
import { RenderServerLightData, RenderServerLightType } from "../../render_server/light/RenderServerLightData";
import type { RenderServerGeometry3D } from "../../render_server/geometry/RenderServerGeometry3D";
import type { Geometry3DResource } from "../../resources/geometry_resources/geometry3d_resources/Geometry3DResource";
import { Quaternion } from "@/system/fivepebble/linear_algebra/Quaternion";
import { type Indexed } from "@/system/utils/Type";
import { IndexedVec } from "@/system/structures/IndexedVec";
import type { RenderServerTexture } from "../../render_server/texture/RenderServerTexture";
import type { Texture2DResource } from "../../resources/texture_resources/texture2d_resources/Texture2DResource";

export type Cullable = CameraFrustumLikeCullable<Matrix4, Vector3, Matrix3> & Cloneable<Cullable> & Transformable<Cullable, Vector4, Matrix4>;

export class VisualWorld3DMesh extends WorldObject {

    public readonly geometry_ref: Ref<RenderServerGeometry3D> = new Ref();
    public readonly lod_geometrys_ref: { geometry: Ref<RenderServerGeometry3D>, distance: number }[] = [];
    public get has_geometry() { return !this.geometry_ref.is_empty }

    protected readonly surface_materials_ref: RefMap<number, RenderServerRenderMaterial> = new RefMap();
    public readonly material_override_ref: Ref<RenderServerRenderMaterial> = new Ref();
    private get has_surface_materials(): boolean { return !this.surface_materials_ref.is_empty; };

    public readonly global_transform: Matrix4 = Matrix4.new;
    public readonly global_normal: Matrix3 = Matrix3.new;
    public visible: boolean = true;
    public layer: number = 0xffffffff;
    public cast_shadow: boolean = true;
    public render_queue: number = 0;

    //editor
    public editor_highlighted: boolean = false;

    // cullable
    // global transformed
    private cullable: Cullable = Box3.new;
    private is_cullable_empty: boolean = true;
    private cullable_override: Cullable | undefined = undefined;
    public cullable_enlargment: number = 0;

    constructor(rid: Rid) {
        super(rid);
    }

    private on_geometry_bbox_changed = (bbox: Box3) => { this.update_Cullable(); }
    private update_Cullable() {
        if (this.cullable_override === undefined) {
            if (!this.has_geometry) {
                this.is_cullable_empty = true;
            }
            else {
                this.cullable.affine_transform(this.geometry_ref.expect.bbox, this.global_transform);
                this.is_cullable_empty = this.cullable.is_empty;
            }
        }
        else {
            this.cullable.affine_transform(this.cullable_override, this.global_transform);
            this.is_cullable_empty = this.cullable.is_empty;
        }
    }

    public set_Geometry(geometry: RenderServerGeometry3D | undefined) {
        if (!this.geometry_ref.is_empty) {
            this.geometry_ref.expect.singal_bbox_changed.disconnect(this.on_geometry_bbox_changed);
        }
        this.geometry_ref.value = geometry;
        if (!this.geometry_ref.is_empty) {
            this.geometry_ref.expect.singal_bbox_changed.connect(this.on_geometry_bbox_changed);
        }
        this.update_Cullable();
    }

    public set_LodGeometry(distance: number, geometry: RenderServerGeometry3D | undefined) {
        const index = this.lod_geometrys_ref.findIndex(i => i.distance === distance);
        if (index < 0) {
            // new lod level
            if (geometry !== undefined) {
                this.lod_geometrys_ref.push({
                    geometry: new Ref(geometry),
                    distance,
                });
            }
        }
        else {
            // already has lod
            if (geometry === undefined) {
                this.lod_geometrys_ref.splice(index, 1)[0].geometry.clear();
            }
            else {
                this.lod_geometrys_ref[index].geometry.value = geometry;
            }
        }
    }

    public set_CullableOverride(cullable: Cullable | undefined) {
        if (cullable === undefined) {
            if (this.cullable_override === undefined) return;
            this.cullable_override = undefined;
            this.cullable = Box3.new;
        }
        else {
            this.cullable_override = cullable.clone();
            this.cullable = cullable.clone();
        }
        this.update_Cullable();
    }

    public set_CullableEnlargement(amount: number) {
        this.cullable_enlargment = Math.max(0, Math.min(65536, amount));
    }

    public set_EditorHighlighted(highlighted: boolean) {
        this.editor_highlighted = highlighted;
    }

    public set_SurfaceMaterial(surface_idx: number, material: RenderServerRenderMaterial | undefined) {
        if (this.geometry_ref.is_empty) return;
        if (surface_idx < 0) return;
        this.surface_materials_ref.set(surface_idx, material);
    }

    public set_MaterialOverride(material: RenderServerRenderMaterial | undefined) {
        this.material_override_ref.value = material;
    }

    public set_GlobalTransform(mat: Matrix4) {
        this.global_transform.copy(mat);
        this.global_normal.set_NormalTransform(this.global_transform);
        this.update_Cullable();
    }

    public set_Visible(visible: boolean) {
        this.visible = visible;
    }

    public set_Layer(layer: number) {
        this.layer = layer & 0xffffffff;
    }

    public set_RenderQueue(render_queue: number) {
        this.render_queue = render_queue;
    }

    public set_CastShadow(cast: boolean) {
        this.cast_shadow = cast;
    }

    protected clear_Geometry() {
        if (!this.geometry_ref.is_empty) {
            this.geometry_ref.expect.singal_bbox_changed.disconnect(this.on_geometry_bbox_changed);
        }
        this.geometry_ref.clear();
        for (const { geometry } of this.lod_geometrys_ref) {
            geometry.clear();
        }
    }

    public clear_Materials() {
        this.material_override_ref.clear();
        this.surface_materials_ref.clear();
    }

    // fill render queue

    public fill_RenderQueue(queue: RenderServerRenderer3DQueue, camera: Camera3, frustum: Frustum3, screen_size: Vector2): boolean {
        // cullable test
        if (!this.visible || (this.layer & camera.mask) === 0 || !this.has_geometry) return false;
        const cullable = this.cullable;
        if (this.is_cullable_empty || cullable.cull(camera, frustum, screen_size, this.cullable_enlargment)) return false;
        const sort_distance = cullable.sort_distance_to(camera, this.cullable_enlargment);
        const geometry = this.geometry_ref.expect;
        if ((geometry.surface_length <= 0) || !this.has_surface_materials) {
            if (this.material_override_ref.is_empty) return false;
            const vertex_array = geometry.vertex_array_ref.expect;
            if (vertex_array !== undefined) queue.add(vertex_array, this.material_override_ref.expect, geometry.instance_count, this.global_transform, this.global_normal, this.layer, sort_distance);
        }
        else {
            const surface_count = this.geometry_ref.expect.surface_length;
            for (let i = 0; i < surface_count; i++) {
                let material = this.surface_materials_ref.get(i);
                if (material === undefined) {
                    if (this.material_override_ref.is_empty) continue;
                    else material = this.material_override_ref.expect;
                }
                const vertex_array_view = geometry.get_Surface(i);
                if (vertex_array_view !== undefined) queue.add(vertex_array_view, material, geometry.instance_count, this.global_transform, this.global_normal, this.layer, sort_distance);
            }
        }
        return true;
    }

    public dispose(): void {
        this.clear_Geometry();
        this.clear_Materials();
    }
}

export class VisualWorld3DLight extends WorldObject implements Indexed {

    static readonly #const_forward_vector3 = Vector3.create(0, 0, -1);
    static readonly #tmp_color_vector4: Vector4 = Vector4.new;
    static readonly #tmp_cullable_affine_transform_matrix4 = Matrix4.new;
    static readonly #tmp_cullable_rotate_matrix3 = Matrix3.new;
    static readonly #tmp_cullable_rotate_quaternion = Quaternion.new;

    protected changed: boolean = true;

    //#region Indexed interface

    public index: number = -1;

    //#endregion

    public type: RenderServerLightType = RenderServerLightType.Spot;
    public readonly position: Vector3 = Vector3.new;
    public readonly direction: Vector3 = Vector3.create(0, 0, -1);
    public readonly color: Vector3 = Vector3.create(1, 1, 1);
    public intensity: number = 1.0;
    public attenuation: number = 2.0;
    public layer: number = 0xffffffff;
    public mask: number = 0xffffffff;
    public visible: boolean = true;
    public render_queue: number = 0;
    public param_0: number = 0;
    public param_1: number = 0;
    public param_2: number = 0;
    public param_3: number = 0;

    // public cast_shadow: boolean = false;
    // public shadow_bias: number = 0;
    // public shadow_normal_bias: number = 0;
    // public shadow_opacity: number = 0;
    // public shadows: Set<VisualWorld3DLightShadow> = new Set();

    private cullable: Cullable | undefined = undefined;
    private cullable_override: Cullable | undefined = undefined;
    private is_cullable_empty: boolean = true;
    public cullable_enlargment: number = 0;

    constructor(rid: Rid) {
        super(rid);
    }

    public set_Type(type: RenderServerLightType) {
        this.type = type;
        this.changed = true;
    }

    public set_GlobalPositionDirection(position?: Vector3, direction?: Vector3) {
        if (position === undefined && direction === undefined) return;
        if (position) this.position.copy(position);
        if (direction) this.direction.copy(direction);
        this.update_Cullable();
        this.changed = true;
    }

    private update_Cullable() {
        if (this.cullable !== undefined) {
            this.cullable.affine_transform(this.cullable_override!,
                VisualWorld3DLight.#tmp_cullable_affine_transform_matrix4.set_BasisPosition(
                    VisualWorld3DLight.#tmp_cullable_rotate_matrix3.set_Quaternion(
                        VisualWorld3DLight.#tmp_cullable_rotate_quaternion.set_Rotate(
                            VisualWorld3DLight.#const_forward_vector3,
                            this.direction
                        )
                    ),
                    this.position
                )
            );
            this.is_cullable_empty = this.cullable.is_empty;
        }
    }

    public set_Cullable(cullable: Cullable | undefined) {
        if (cullable === undefined) {
            if (this.cullable_override === undefined) return;
            this.cullable_override = undefined;
            this.cullable = undefined;
            this.is_cullable_empty = true;
        }
        else {
            this.cullable_override = cullable.clone();
            this.cullable = cullable.clone();
            this.is_cullable_empty = this.cullable.is_empty;
        }
        this.update_Cullable();
    }

    public set_CullableEnlargement(amount: number) {
        this.cullable_enlargment = Math.max(0, Math.min(65536, amount));
    }

    public set_Color(color: Vector3) {
        this.color.copy(color);
        this.changed = true;
    }

    public set_Intensity(intensity: number) {
        this.intensity = intensity;
        this.changed = true;
    }

    public set_Attenuation(attenuation: number) {
        this.attenuation = attenuation;
        this.changed = true;
    }

    public set_Mask(mask: number) {
        this.mask = mask & 0xffffffff;
        // for (const shadow of this.shadows) {
        //     shadow.set_Mask(this.mask);
        // }
        this.changed = true;
    }

    public set_Layer(layer: number) {
        this.layer = layer & 0xffffffff;
        this.changed = true;
    }

    public set_RenderQueue(render_queue: number) {
        this.render_queue = render_queue;
        this.changed = true;
    }

    public set_Visible(visible: boolean) {
        this.visible = visible;
        this.changed = true;
    }

    public set_Parameter0(val: number) {
        this.param_0 = val;
        this.changed = true;
    }

    public set_Parameter1(val: number) {
        this.param_1 = val;
        this.changed = true;
    }

    public set_Parameter2(val: number) {
        this.param_2 = val;
        this.changed = true;
    }

    public set_Parameter3(val: number) {
        this.param_3 = val;
        this.changed = true;
    }

    // public set_CastShadow(cast: boolean) {
    //     this.cast_shadow = cast;
    //     this.changed = true;
    // }

    // public add_Shadow(shadow: VisualWorld3DLightShadow) {
    //     shadow.light = this;
    //     shadow.set_Mask(this.layer);
    //     this.shadows.add(shadow);
    // }

    // public remove_Shadow(shadow: VisualWorld3DLightShadow) {
    //     shadow.light = undefined;
    //     shadow.set_Mask(0);
    //     this.shadows.delete(shadow);
    // }

    // public set_ShadowBias(bias: number) {
    //     this.shadow_bias = bias;
    //     this.changed = true;
    // }

    // public set_ShadowNormalBias(bias: number) {
    //     this.shadow_normal_bias = bias;
    //     this.changed = true;
    // }

    // public set_ShadowOpacity(opacity: number) {
    //     this.shadow_opacity = opacity;
    //     this.changed = true;
    // }

    // fill light data

    public trigger_Changed() {
        this.changed = true;
    }

    public update_LightData(lights_data: RenderServerLightData) {
        if (!this.changed) return;
        // console.log("this.changed");
        const index = this.index;
        const color = VisualWorld3DLight.#tmp_color_vector4;
        color.set(this.color.x * this.intensity, this.color.y * this.intensity, this.color.z * this.intensity, 0);
        lights_data.set_Data(
            index, this.type,
            this.position, this.direction, this.attenuation, color,
            this.layer, this.mask, this.visible, this.render_queue,
            undefined, undefined, undefined, undefined, undefined, undefined,
            this.param_0, this.param_1, this.param_2, this.param_3
        );
        this.changed = false;
    }

    public dispose(): void {
        // this.shadows.clear();
    }
}

// export enum LightShadowMapSize {
//     S128, S256, S512, S1024, S2048
// }

// export class VisualWorld3DLightShadow extends WorldObject {

//     public light: VisualWorld3DLight | undefined = undefined;
//     public readonly camera: Camera3 = new Camera3();
//     public readonly global_projection: Matrix4 = Matrix4.new;
//     public size: LightShadowMapSize = LightShadowMapSize.S512;

//     public rect_min: Vector2 = Vector2.create(0, 0);
//     public rect_max: Vector2 = Vector2.create(1, 1);
//     public rect_layer: number = 0;

//     public set_Projection(mat: Matrix4) {
//         this.camera.projection = mat;
//         this.update_GlobalProjection();
//     }

//     public set_GlobalTransform(mat: Matrix4) {
//         this.camera.global_transform = mat;
//         this.update_GlobalProjection();
//         console.log(this);
//     }

//     public set_Mask(mask: number) {
//         this.camera.mask = mask;
//     }

//     protected update_GlobalProjection() {
//         this.camera.get_GlobalProjection(this.global_projection);
//     }

//     public fill_LightShadowData(lights_data: RenderServerLightsData, idx: number) {
//         if (idx >= lights_data.max_light_count) return;
//         lights_data.set_LightProjectionMatrixRegion(idx, this.global_projection, this.rect_min, this.rect_max, this.rect_layer);
//     }

//     public dispose(): void { }
// }

export class VisualWorld3D implements Disposable {

    protected readonly meshes_map: Map<Rid, VisualWorld3DMesh> = new Map();
    protected readonly lights_map: Map<Rid, VisualWorld3DLight> = new Map();
    protected readonly lights_indexed_vec: IndexedVec<VisualWorld3DLight> = new IndexedVec(1024);

    // protected readonly light_shadows_map: Map<Rid, VisualWorld3DLightShadow> = new Map();

    public get meshes() { return this.meshes_map.values(); }
    public get lights() { return this.lights_map.values(); }
    // public get light_shadows() { return this.light_shadows_map.values(); }

    public get is_empty(): boolean {
        return true;
        // return this.meshes_map.size <= 0 && this.lights_map.size <= 0 && this.light_shadows_map.size <= 0;
    }

    public trigger_BeforeRender(scene_tree: SceneTree) {
        this.render_server_light_data.set_Length(this.get_LightCount());
        for (const light of this.lights_indexed_vec) {
            light.update_LightData(this.render_server_light_data);
        }
        this.render_server_light_data.commit();
    }

    //#region Mesh

    public create_Mesh(): Rid {
        const rid = RID();
        const mesh = new VisualWorld3DMesh(rid);
        this.meshes_map.set(rid, mesh);
        return rid;
    }

    protected mesh_getter_cache: [undefined | Rid, VisualWorld3DMesh | undefined] = [undefined, undefined];
    protected set_MeshGetterCache(rid: Rid, mesh: VisualWorld3DMesh) {
        this.mesh_getter_cache[0] = rid;
        this.mesh_getter_cache[1] = mesh;
    }
    protected reset_MeshGetterCache(rid: Rid) {
        if (this.mesh_getter_cache[0] === rid) {
            this.mesh_getter_cache[0] = undefined;
            this.mesh_getter_cache[1] = undefined;
        }
    }
    protected clear_MeshGetterCache() {
        this.mesh_getter_cache[0] = undefined;
        this.mesh_getter_cache[1] = undefined;
    }

    protected get_Mesh(rid: Rid): VisualWorld3DMesh | undefined {
        if (this.mesh_getter_cache[0] === rid) {
            return this.mesh_getter_cache[1];
        }
        const mesh = this.meshes_map.get(rid);
        if (mesh !== undefined) {
            this.set_MeshGetterCache(rid, mesh);
        }
        return mesh;
    }

    public free_Mesh(rid: Rid) {
        const instance = this.get_Mesh(rid);
        if (instance === undefined) return;
        instance.dispose();
        this.reset_MeshGetterCache(rid);
        this.meshes_map.delete(rid);
    }

    public set_MeshGeometry(rid: Rid, geometry: Geometry3DResource | undefined) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            if (geometry === undefined) {
                instance.set_Geometry(undefined);
            }
            else {
                instance.set_Geometry(geometry.render_server_geometry);
            }
        }
    }

    public set_MeshLodGeometry(rid: Rid, distance: number, geometry: Geometry3DResource | undefined) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            if (geometry === undefined) {
                instance.set_LodGeometry(distance, undefined);
            }
            else {
                instance.set_LodGeometry(distance, geometry.render_server_geometry);
            }
        }
    }

    public set_MeshCullableOverride(rid: Rid, cullable: Cullable | undefined) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_CullableOverride(cullable);
        }
    }

    public set_MeshCullableEnlargment(rid: Rid, amount: number) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_CullableEnlargement(amount);
        }
    }

    public set_MeshEditorHighlighted(rid: Rid, highlighted: boolean) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_EditorHighlighted(highlighted);
        }
    }

    public set_MeshSurfaceMaterial(rid: Rid, surface_idx: number, material: MaterialResource | undefined) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            if (material === undefined) {
                instance.set_SurfaceMaterial(surface_idx, undefined);
            }
            else {
                instance.set_SurfaceMaterial(surface_idx, material.render_server_material);
            }
        }
    }

    public set_MeshMaterialOverride(rid: Rid, material: MaterialResource | undefined) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            if (material === undefined) {
                instance.set_MaterialOverride(undefined);
            }
            else {
                instance.set_MaterialOverride(material.render_server_material);
            }
        }
    }

    public set_MeshGlobalTransform(rid: Rid, transform: Matrix4) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_GlobalTransform(transform);
        }
    }

    public set_MeshVisibility(rid: Rid, visible: boolean) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_Visible(visible);
        }
    }

    public set_MeshLayer(rid: Rid, layer: number) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_Layer(layer);
        }
    }

    public set_MeshRenderQueue(rid: Rid, render_queue: number) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_RenderQueue(render_queue);
        }
    }

    public set_MeshCastShadow(rid: Rid, cast: boolean) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_CastShadow(cast);
        }
    }

    //#endregion

    //#region Light

    protected readonly background_texture_ref: Ref<RenderServerTexture> = new Ref();
    public get background_texture() { return this.background_texture_ref.value; }

    public set_BackgroundTexture(texture: Texture2DResource | undefined) {
        this.background_texture_ref.value = texture?.render_server_texture;
    }

    public readonly render_server_light_data = new RenderServerLightData(2048);

    public create_Light(): Rid {
        const rid = RID();
        const light = new VisualWorld3DLight(rid);
        this.lights_map.set(rid, light);
        this.lights_indexed_vec.push(light);
        return rid;
    }

    protected light_getter_cache: [undefined | Rid, VisualWorld3DLight | undefined] = [undefined, undefined];
    protected set_LightGetterCache(rid: Rid, light: VisualWorld3DLight) {
        this.light_getter_cache[0] = rid;
        this.light_getter_cache[1] = light;
    }
    protected reset_LightGetterCache(rid: Rid) {
        if (this.light_getter_cache[0] === rid) {
            this.light_getter_cache[0] = undefined;
            this.light_getter_cache[1] = undefined;
        }
    }
    protected clear_LightGetterCache() {
        this.light_getter_cache[0] = undefined;
        this.light_getter_cache[1] = undefined;
    }

    protected get_Light(rid: Rid): VisualWorld3DLight | undefined {
        if (this.light_getter_cache[0] === rid) {
            return this.light_getter_cache[1];
        }
        const light = this.lights_map.get(rid);
        if (light !== undefined) {
            this.set_LightGetterCache(rid, light);
        }
        return light;
    }

    protected get_LightCount() {
        return this.lights_indexed_vec.length;
    }

    public free_Light(rid: Rid) {
        const instance = this.get_Light(rid);
        if (instance === undefined) return;
        const index = instance.index;
        instance.dispose();
        this.reset_LightGetterCache(rid);
        this.lights_map.delete(rid);
        const replace_instance = this.lights_indexed_vec.swap_remove(index);
        replace_instance?.trigger_Changed();
    }

    public set_LightType(rid: Rid, type: RenderServerLightType) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Type(type);
        }
    }

    public set_LightGlobalPositionDirection(rid: Rid, position?: Vector3, direction?: Vector3) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_GlobalPositionDirection(position, direction);
        }
    }

    public set_LightColor(rid: Rid, color: Vector3) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Color(color);
        }
    }

    public set_LightIntensity(rid: Rid, intensity: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Intensity(intensity);
        }
    }

    public set_LightAttenuation(rid: Rid, attenuation: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Attenuation(attenuation);
        }
    }

    public set_LightLayer(rid: Rid, layer: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Layer(layer);
        }
    }

    public set_LightMask(rid: Rid, mask: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Mask(mask);
        }
    }

    public set_LightRenderQueue(rid: Rid, queue: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_RenderQueue(queue);
        }
    }

    public set_LightVisibility(rid: Rid, visible: boolean) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Visible(visible);
        }
    }

    public set_LightParameters(rid: Rid, val0?: number, val1?: number, val2?: number, val3?: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            if (val0 !== undefined) instance.set_Parameter0(val0);
            if (val1 !== undefined) instance.set_Parameter1(val1);
            if (val2 !== undefined) instance.set_Parameter2(val2);
            if (val3 !== undefined) instance.set_Parameter3(val3);
        }
    }

    public set_LightParameter0(rid: Rid, val: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Parameter0(val);
        }
    }

    public set_LightParameter1(rid: Rid, val: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Parameter1(val);
        }
    }

    public set_LightParameter2(rid: Rid, val: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Parameter2(val);
        }
    }

    public set_LightParameter3(rid: Rid, val: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Parameter3(val);
        }
    }

    // public set_LightShadowBias(rid: Rid, bias: number) {
    //     const instance = this.get_Light(rid);
    //     if (instance) {
    //         instance.set_ShadowBias(bias);
    //     }
    // }

    // public set_LightCastShadow(rid: Rid, cast: boolean) {
    //     const instance = this.get_Light(rid);
    //     if (instance) {
    //         instance.set_CastShadow(cast);
    //     }
    // }

    // public add_LightShadow(rid: Rid, shadow: Rid) {
    //     const instance = this.get_Light(rid);
    //     const shadow_instance = this.get_LightShadow(shadow);
    //     if (instance && shadow_instance && shadow_instance.light === undefined) {
    //         instance.add_Shadow(shadow_instance);
    //     }
    // }

    // public remove_LightShadow(rid: Rid, shadow: Rid) {
    //     const instance = this.get_Light(rid);
    //     const shadow_instance = this.get_LightShadow(shadow);
    //     if (instance && shadow_instance && shadow_instance.light === instance) {
    //         instance.remove_Shadow(shadow_instance);
    //     }
    // }

    // public set_LightShadowNormalBias(rid: Rid, bias: number) {
    //     const instance = this.get_Light(rid);
    //     if (instance) {
    //         instance.set_ShadowNormalBias(bias);
    //     }
    // }

    // public set_LightShadowOpacity(rid: Rid, opacity: number) {
    //     const instance = this.get_Light(rid);
    //     if (instance) {
    //         instance.set_ShadowOpacity(opacity);
    //     }
    // }

    public set_LightCullable(rid: Rid, cullable: Cullable | undefined) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Cullable(cullable);
        }
    }

    public set_LightCullableEnlargment(rid: Rid, amount: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_CullableEnlargement(amount);
        }
    }

    //#endregion

    // //#region LightShadow

    // public create_LightShadow(): Rid {
    //     const rid = RID();
    //     const light = new VisualWorld3DLightShadow(this.config, rid);
    //     this.light_shadows_map.set(rid, light);
    //     return rid;
    // }

    // protected light_shadow_getter_cache: [undefined | Rid, VisualWorld3DLightShadow | undefined] = [undefined, undefined];
    // protected set_LightShadowGetterCache(rid: Rid, light: VisualWorld3DLightShadow) {
    //     this.light_shadow_getter_cache[0] = rid;
    //     this.light_shadow_getter_cache[1] = light;
    // }
    // protected reset_LightShadowGetterCache(rid: Rid) {
    //     if (this.light_shadow_getter_cache[0] === rid) {
    //         this.light_shadow_getter_cache[0] = undefined;
    //         this.light_shadow_getter_cache[1] = undefined;
    //     }
    // }
    // protected clear_LightShadowGetterCache() {
    //     this.light_shadow_getter_cache[0] = undefined;
    //     this.light_shadow_getter_cache[1] = undefined;
    // }

    // protected get_LightShadow(rid: Rid): VisualWorld3DLightShadow | undefined {
    //     if (this.light_shadow_getter_cache[0] === rid) {
    //         return this.light_shadow_getter_cache[1];
    //     }
    //     const shadow = this.light_shadows_map.get(rid);
    //     if (shadow !== undefined) {
    //         this.set_LightShadowGetterCache(rid, shadow);
    //     }
    //     return shadow;
    // }

    // public free_LightShadow(rid: Rid) {
    //     const instance = this.get_LightShadow(rid);
    //     if (instance === undefined) return;
    //     if (instance.light !== undefined) instance.light.remove_Shadow(instance);
    //     instance.dispose();
    //     this.reset_LightShadowGetterCache(rid);
    //     this.light_shadows_map.delete(rid);
    // }

    // public set_LightShadowProjection(rid: Rid, projection: Matrix4) {
    //     const instance = this.get_LightShadow(rid);
    //     if (instance) {
    //         instance.set_Projection(projection);
    //     }
    // }

    // public set_LightShadowGlobalTransform(rid: Rid, transform: Matrix4) {
    //     const instance = this.get_LightShadow(rid);
    //     if (instance) {
    //         instance.set_GlobalTransform(transform);
    //     }
    // }

    // //#endregion

    public dispose() {
        for (const mesh of this.meshes) {
            mesh.dispose();
        }
        for (const light of this.lights) {
            light.dispose();
        }
        this.render_server_light_data.dispose();
        // for (const light_shadow of this.light_shadows) {
        //     light_shadow.dispose();
        // }
        this.meshes_map.clear();
        this.lights_map.clear();
        this.lights_indexed_vec.clear();
        this.background_texture_ref.clear();
        // this.sky_frame_buffer.clear();
        // this.sky_texture.clear();
        // this.shadows_texture.clear();
        // this.lights_data.clear();
        this.clear_MeshGetterCache();
        this.clear_LightGetterCache();
        // this.clear_LightShadowGetterCache();
    }
}