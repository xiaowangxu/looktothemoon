import { ReadonlyRef } from "@/system/utils/RefCounted";
import { RenderServerMaterial } from "../../render_server/material/RenderServerMaterial";
import { Resource } from "../Resource";

export abstract class Material3DResource extends Resource {

    protected readonly render_server_material_ref: ReadonlyRef<RenderServerMaterial> = new ReadonlyRef(new RenderServerMaterial());
    public get render_server_material() { return this.render_server_material_ref.expect; }

    protected dispose(): void {
        this.render_server_material_ref.clear();
    }
}