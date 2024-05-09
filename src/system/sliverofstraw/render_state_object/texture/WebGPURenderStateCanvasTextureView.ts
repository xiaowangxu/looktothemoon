import type { WebGPURenderState } from "../../WebGPURenderState";
import { WebGPURenderStateTextureDimension } from "./WebGPURenderStateTexture";
import { WebGPURenderStateTextureView } from "./WebGPURenderStateTextureView";

export class WebGPURenderStateCanvasTextureView extends WebGPURenderStateTextureView {

    public readonly canvas: GPUCanvasContext;

    public get texture() { return this.canvas.getCurrentTexture(); }
    public get texture_view() { return this.texture.createView(); }

    constructor(render_state: WebGPURenderState, canvas: GPUCanvasContext) {
        super(render_state, undefined!, WebGPURenderStateTextureDimension.D2, 1, undefined!);
        this.canvas = canvas;
    }

    public dispose(): void {
        this.render_state.delete_CanvasTextureView(this);
        super.dispose();
    }
}