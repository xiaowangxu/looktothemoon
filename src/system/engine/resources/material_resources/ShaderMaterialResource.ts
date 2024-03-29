import { Ref, type Refed } from "@/system/utils/RefCounted";
import type { Config } from "../../ConfiguredObject";
import { Resource } from "../Resource";
import { MaterialResource, type MaterialReadOnlyUniforms } from "./MaterialResource";
import type { RenderServerMaterialUniforms } from "../../render_server/RenderServerMaterial";
import type { RenderServerShader } from "../../render_server/RenderServerShader";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import type { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import type { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { TextureResource } from "../texture_resources/TextureResource";

export class ShaderResource extends Resource {
    protected shader_ref: Ref<RenderServerShader> = new Ref(this.config.render_server.create_Shader());

    public get shader() { return this.shader_ref.expect; }

    public uniforms: MaterialReadOnlyUniforms = MaterialResource.$const_empty_uniforms;

    constructor(config: Config) {
        super(config);
    }

    protected dispose(): void {
        this.shader_ref.clear();
    }
}

type OverrideUniformType = number | Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4 | TextureResource;

export class ShaderMaterialResource extends MaterialResource {

    private shader_resource_ref: Ref<ShaderResource> = new Ref();

    public get transparent() { return this.material.transparent; }
    public set transparent(transparent: boolean) { this.material.transparent = transparent; }

    public get uniforms(): Readonly<RenderServerMaterialUniforms> {
        return this.shader_resource_ref.is_empty ? MaterialResource.$const_empty_uniforms : this.shader_resource_ref.expect.uniforms;
    }

    private readonly override_uniforms_map: Map<string, Refed<OverrideUniformType>> = new Map();

    constructor(config: Config) {
        super(config);
        this.material_ref.value = this.render_server.create_Material();
    }

    public set_Shader(shader: ShaderResource) {
        this.clear_OverrideUniformsMap();
        this.shader_resource_ref.value = shader;
        this.material.set_Material(this.shader_resource_ref.expect.shader, this.uniforms);
    }

    protected clear_OverrideUniformsMap() {
        for (const val of this.override_uniforms_map.values()) {
            if (val instanceof Ref) val.clear();
        }
        this.override_uniforms_map.clear();
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
        console.log(">>> dispose <ShaderMaterialResource>", this.rid);
        this.shader_resource_ref.clear();
        this.clear_OverrideUniformsMap();
    }
}