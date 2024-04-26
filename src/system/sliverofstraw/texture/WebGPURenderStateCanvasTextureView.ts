import type { WebGPURenderState } from "../WebGPURenderState";
import { WebGPURenderStateTextureDimension } from "./WebGPURenderStateTexture";
import { WebGPURenderStateTextureView } from "./WebGPURenderStateTextureView";

export class WebGPURenderStateCanvasTextureView extends WebGPURenderStateTextureView {

    public readonly canvas: GPUCanvasContext;

    public get texture_view() { return this.canvas.getCurrentTexture().createView(); }

    constructor(render_state: WebGPURenderState, canvas: GPUCanvasContext) {
        super(render_state, undefined!, WebGPURenderStateTextureDimension.D2, undefined!);
        this.canvas = canvas;
    }

    public dispose(): void {
        this.render_state.delete_CanvasTextureView(this);
        super.dispose();
    }
}