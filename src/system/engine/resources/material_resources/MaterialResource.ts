import { Ref } from "@/system/utils/RefCounted";
import { Resource } from "../Resource";
import type { RenderServerMaterial, RenderServerMaterialCullFace, RenderServerMaterialUniforms } from "../../render_server/RenderServerMaterial";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import type { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import type { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import type { Config } from "../../ConfiguredObject";

export type MaterialReadOnlyUniforms = Readonly<RenderServerMaterialUniforms>;

export abstract class MaterialResource extends Resource {
	protected readonly material_ref: Ref<RenderServerMaterial> = new Ref();

	public get material() { return this.material_ref.expect; }

	public get render_server() { return this.config.render_server; }

	static readonly empty_uniforms: MaterialReadOnlyUniforms = {};

	public get uniforms(): MaterialReadOnlyUniforms { return MaterialResource.empty_uniforms; }

	public set cull_face(face: RenderServerMaterialCullFace) { this.material.cull_face = face; }

	constructor(config: Config) {
		super(config);
	}

	public set_UniformOverride(uniform: string, value: WebGL2RenderStateTexture | number | Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4 | undefined): void {
		this.material.set_UniformOverride(uniform, value);
	}

	protected dispose(): void {
		console.log(">>> dispose <MaterialResource>", this.rid);
		this.material_ref.clear();
	}
}

export class MaterialOverrideResource extends MaterialResource {
	private _uniforms: RenderServerMaterialUniforms | undefined;

	public get uniforms(): MaterialReadOnlyUniforms { return this._uniforms ?? MaterialResource.empty_uniforms; }

	private readonly override_material_ref: Ref<MaterialResource> = new Ref();

	public set transparent(transparent: boolean) { this.material.transparent = transparent; }

	constructor(config: Config) {
		super(config);
		this.material_ref.value = this.render_server.create_Material();
	}

	public set_OverrideMaterial(material: MaterialResource) {
		if (!material.material.has_shader) throw new Error('<MaterialOverrideResource> set_OverrideMaterial: base material does not have a shader, maybe it is not properly initialized');
		this.override_material_ref.value = material;
		this._uniforms = material.uniforms;
		this.material.set_Material(material.material.shader, material.uniforms);
	}

	public set_UniformOverride(uniform: string, value: WebGL2RenderStateTexture | number | Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4 | undefined): void {
		this.material.set_UniformOverride(uniform, value);
	}

	protected dispose(): void {
		console.log(">>> dispose <MaterialOverrideResource>", this.rid);
		this.override_material_ref.clear();
		super.dispose();
	}
}