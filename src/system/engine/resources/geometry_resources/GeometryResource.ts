import { Ref } from "@/system/utils/RefCounted";
import type { RenderServerGeometry } from "../../render_server/RenderServerGeometry";
import { Resource } from "../Resource";
import { RenderServer } from "../../render_server/RenderServer";

export abstract class GeometryResource extends Resource {
    private readonly geometry_ref: Ref<RenderServerGeometry> = new Ref();

    public get geometry() { return this.geometry_ref.expect; }

    constructor() {
        super();
        this.geometry_ref.value = RenderServer.create_Geometry();
    }

    protected dispose(): void {
        this.geometry_ref.clear();
    }
}