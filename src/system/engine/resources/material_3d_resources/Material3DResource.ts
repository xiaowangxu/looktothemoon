import { ReadonlyRef } from "@/system/utils/RefCounted";
import { RenderServerMaterial } from "../../render_server/material/RenderServerMaterial";
import { Resource } from "../Resource";
import type { WebGPURenderStateCullMode } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";

export abstract class Material3DResource extends Resource {

    protected readonly render_server_material_ref: ReadonlyRef<RenderServerMaterial> = new ReadonlyRef(new RenderServerMaterial());
    public get render_server_material() { return this.render_server_material_ref.expect; }

    public get cull_mode() { return this.render_server_material.cull_mode; }
    public set cull_mode(cull_mode: WebGPURenderStateCullMode) { this.render_server_material.cull_mode = cull_mode; }

    public get depth_bias() { return this.render_server_material.depth_bias; }
    public set depth_bias(depth_bias: number) { this.render_server_material.depth_bias = depth_bias; }
    
    public get depth_bias_slope_scale() { return this.render_server_material.depth_bias_slope_scale; }
    public set depth_bias_slope_scale(depth_bias_slope_scale: number) { this.render_server_material.depth_bias_slope_scale = depth_bias_slope_scale; }

    protected dispose(): void {
        this.render_server_material_ref.clear();
    }
}