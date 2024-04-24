import { Ref, type Refed } from "@/system/utils/RefCounted";
import type { Config } from "../../ConfiguredObject";
import { Resource } from "../Resource";
import { MaterialResource, type MaterialReadOnlyUniforms } from "./MaterialResource";
import type { RenderServerMaterialUniforms } from "../../render_server/RenderServerMaterial";
import type { FragmentShaderSetInitSet, RenderServerShader, RenderServerShaderPass, UniformInitSet } from "../../render_server/RenderServerShader";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import type { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import type { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { TextureResource } from "../texture_resources/TextureResource";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import type { WebGL2RenderStateShader } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateShader";
import { RenderStateShaderType } from "@/system/sliverofstraw/render_state_objects/RenderState";

export class ShaderResource extends Resource {
    protected shader_ref: Ref<RenderServerShader> = new Ref();

    public get has_shader() { return !this.shader_ref.is_empty; }
    public get shader() { return this.shader_ref.expect; }

    public uniforms: MaterialReadOnlyUniforms = MaterialResource.$const_empty_uniforms;

    constructor(config: Config) {
        super(config);
    }

    public set_Shaders(vertex_code: string, vertex_uniforms: UniformInitSet<WebGL2RenderState>, fragments_set: FragmentShaderSetInitSet<{ code: string, uniforms: UniformInitSet<WebGL2RenderState> }>) {
        const rs = this.config.render_server;
        const vertex_shader = rs.render_state.create_Shader(RenderStateShaderType.Vertex, vertex_code).expect();
        const _fragments_set: { [K in RenderServerShaderPass]?: { shader: WebGL2RenderStateShader, uniforms: UniformInitSet<WebGL2RenderState> } } = {};
        const _uniforms: RenderServerMaterialUniforms = {};
        for (const [key, { type }] of Object.entries(vertex_uniforms)) {
            _uniforms[key] = type;
        }
        for (const [key, { code, uniforms }] of Object.entries(fragments_set)) {
            const frag_shader = rs.render_state.create_Shader(RenderStateShaderType.Fragment, code).expect();
            _fragments_set[key as RenderServerShaderPass] = { shader: frag_shader, uniforms };
            for (const [key, { type }] of Object.entries(uniforms)) {
                if (_uniforms[key] === type) throw new Error(`<ShaderResource> set_Shaders: found more than one uniforms with same name '${key}' but have different types`);
                _uniforms[key] = type;
            }
        }
        this.shader_ref.value = rs.create_Shader();
        this.uniforms = _uniforms;
        this.shader_ref.expect.set_Shaders(vertex_shader, vertex_uniforms, _fragments_set);
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
        if (!this.shader_resource_ref.expect.has_shader) throw new Error('<ShaderMaterialResource> ShaderMaterialResource: base shader resource does not have a shader set, maybe it is not properly initialized');
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