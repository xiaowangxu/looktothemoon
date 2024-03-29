import { Ref } from "@/system/utils/RefCounted";
import type { Config } from "../../ConfiguredObject";
import { Resource } from "../Resource";
import { MaterialResource, type MaterialReadOnlyUniforms } from "./MaterialResource";
import type { RenderServerMaterialUniforms } from "../../render_server/RenderServerMaterial";

export class ShaderResource extends Resource {

    public uniforms: MaterialReadOnlyUniforms = MaterialResource.$const_empty_uniforms;

    protected dispose(): void { }

}

export class ShaderMaterialResource extends MaterialResource {

    private shader_ref : Ref<ShaderResource> = new Ref();

    public get uniforms(): Readonly<RenderServerMaterialUniforms> {
        return this.shader_ref.is_empty ? MaterialResource.$const_empty_uniforms : this.shader_ref.expect.uniforms;
    }


    constructor(config: Config) {
		super(config);
		this.material_ref.value = this.render_server.create_Material();
	}
    
    public set_Shader(shader: ShaderResource) {
        this.shader_ref.value = shader;
    }
}