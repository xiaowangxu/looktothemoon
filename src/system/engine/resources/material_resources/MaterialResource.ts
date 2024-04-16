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
	static readonly $const_empty_uniforms: MaterialReadOnlyUniforms = {};

	protected readonly material_ref: Ref<RenderServerMaterial> = new Ref();

	public get material() { return this.material_ref.expect; }

	public get render_server() { return this.config.render_server; }

	public get uniforms(): MaterialReadOnlyUniforms { return MaterialResource.$const_empty_uniforms; }

	public set cull_face(face: RenderServerMaterialCullFace) { this.material.cull_face = face; }
	public set polygon_offset(polygon_offset: boolean) { this.material.polygon_offset = polygon_offset; }
	public set polygon_offset_factor(polygon_offset_factor: number) { this.material.polygon_offset_factor = polygon_offset_factor; }
	public set polygon_offset_units(polygon_offset_units: number) { this.material.polygon_offset_units = polygon_offset_units; }

	constructor(config: Config) {
		super(config);
	}

	public set_Uniform(uniform: string, value: WebGL2RenderStateTexture | boolean | number | Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4 | undefined): void {
		if (typeof value === 'boolean') value = value ? 1 : 0;
		this.material.set_Uniform(uniform, value);
	}

	protected dispose(): void {
		console.log(">>> dispose <MaterialResource>", this.rid);
		this.material_ref.clear();
	}
}