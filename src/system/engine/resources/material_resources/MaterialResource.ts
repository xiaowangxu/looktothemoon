import { Ref } from "@/system/utils/RefCounted";
import { Resource } from "../Resource";
import { RenderServer } from "../../render_server/RenderServer";
import type { RenderServerMaterial } from "../../render_server/RenderServerMaterial";

export class MaterialResource extends Resource {
    private readonly material_ref: Ref<RenderServerMaterial> = new Ref();

    public get material() { return this.material_ref.expect; }

    constructor() {
        super();
        this.material_ref.value = RenderServer.create_Material();
    }

    protected dispose(): void {
        this.material_ref.clear();
    }
}