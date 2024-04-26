import { RenderStateObjectRefCounted } from "../../render_state/RenderStateObject";
import { RenderStateTextureDimension } from "../../render_state/texture/RenderStateTexture";
import type { WebGPURenderState } from "../WebGPURenderState";
import { WebGPURenderStateTexture } from "./WebGPURenderStateTexture";
import { WebGPURenderStateTextureView } from "./WebGPURenderStateTextureView";

export class WebGPURenderStateCanvasTextureView extends WebGPURenderStateTextureView {

    public readonly canvas: GPUCanvasContext;

    public get texture_view() { return this.canvas.getCurrentTexture().createView(); }

    constructor(render_state: WebGPURenderState, canvas: GPUCanvasContext) {
        super(render_state, undefined!, RenderStateTextureDimension.D2, undefined!);
        this.canvas = canvas;
    }

    public dispose(): void {
        this.render_state.delete_CanvasTextureView(this);
        super.dispose();
    }
}