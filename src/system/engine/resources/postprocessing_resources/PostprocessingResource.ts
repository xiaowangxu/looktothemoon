import type { WebGPURenderStateTextureView } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureView";
import { Resource } from "../Resource";

export abstract class PostprocessingResource extends Resource {

    public abstract get pass_count(): number;
    public abstract render_Pass(pass: number, encoder: GPURenderPassEncoder, color_texture_view: WebGPURenderStateTextureView, normal_texture_view: WebGPURenderStateTextureView, depth_texture_view: WebGPURenderStateTextureView): void;

}