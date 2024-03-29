import { Ref, type Refed } from "@/system/utils/RefCounted";
import { Resource } from "../Resource";
import type { RenderServerMaterial, RenderServerMaterialCullFace, RenderServerMaterialUniforms } from "../../render_server/RenderServerMaterial";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import type { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import type { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import type { Config } from "../../ConfiguredObject";
import { TextureResource } from "../texture_resources/TextureResource";

export type MaterialReadOnlyUniforms = Readonly<RenderServerMaterialUniforms>;

export abstract class MaterialResource extends Resource {
	static readonly $const_empty_uniforms: MaterialReadOnlyUniforms = {};

	protected readonly material_ref: Ref<RenderServerMaterial> = new Ref();

	public get material() { return this.material_ref.expect; }

	public get render_server() { return this.config.render_server; }

	public get uniforms(): MaterialReadOnlyUniforms { return MaterialResource.$const_empty_uniforms; }

	public set cull_face(face: RenderServerMaterialCullFace) { this.material.cull_face = face; }

	constructor(config: Config) {
		super(config);
	}

	protected set_Uniform(uniform: string, value: WebGL2RenderStateTexture | number | Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4 | undefined): void {
		this.material.set_Uniform(uniform, value);
	}
	
	protected dispose(): void {
		console.log(">>> dispose <MaterialResource>", this.rid);
		this.material_ref.clear();
	}
}

type OverrideUniformType = number | Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4 | TextureResource;

export class MaterialOverrideResource extends MaterialResource {

	public get uniforms(): MaterialReadOnlyUniforms { return this.override_material_ref.value?.uniforms ?? MaterialResource.$const_empty_uniforms; }

	private readonly override_material_ref: Ref<MaterialResource> = new Ref();

	private readonly override_uniforms_map: Map<string, Refed<OverrideUniformType>> = new Map();

    public get transparent() { return this.material.transparent; }
	public set transparent(transparent: boolean) { this.material.transparent = transparent; }

	constructor(config: Config) {
		super(config);
		this.material_ref.value = this.render_server.create_Material();
	}

	protected clear_OverrideUniformsMap() {
		for (const val of this.override_uniforms_map.values()) {
			if (val instanceof Ref) val.clear();
		}
		this.override_uniforms_map.clear();
	}

	public set_OverrideMaterial<T extends MaterialResource>(material: T extends MaterialOverrideResource ? never : T) {
		if (material instanceof MaterialOverrideResource) throw new Error('<MaterialOverrideResource> set_OverrideMaterial: base material should not be another MaterialOverrideResource');
		if (!material.material.has_shader) throw new Error('<MaterialOverrideResource> set_OverrideMaterial: base material does not have a shader, maybe it is not properly initialized');
		this.clear_OverrideUniformsMap();
		this.override_material_ref.value = material;
		this.material.set_Material(material.material.shader, material.uniforms);
	}

	public set_UniformOverride(uniform: string, value: OverrideUniformType | undefined): void {
		if (this.material.has_Uniform(uniform)) {
			const is_texture = value instanceof TextureResource;
			const has_uniform = this.override_uniforms_map.has(uniform);
			if (is_texture) {
				if (has_uniform) {
					const texture_ref = this.override_uniforms_map.get(uniform)! as Ref<TextureResource>;
					texture_ref.value = value;
				}
				else if (value !== undefined) {
					this.override_uniforms_map.set(uniform, new Ref(value));
				}
			}
			else if (value !== undefined) {
				this.override_uniforms_map.set(uniform, value);
			}
			if (has_uniform && value === undefined) {
				this.override_uniforms_map.delete(uniform);
			}
			this.material.set_Uniform(uniform, is_texture ? value.texture : value);
		}
	}

	protected dispose(): void {
		console.log(">>> dispose <MaterialOverrideResource>", this.rid);
		this.override_material_ref.clear();
		this.clear_OverrideUniformsMap();
		super.dispose();
	}
}