import type { WebGPURenderState } from "../../WebGPURenderState";
import { WebGPURenderStateTextureDimension, WebGPURendetStateTextureDestination } from "./WebGPURenderStateTexture";
import { WebGPURenderStateTextureView } from "./WebGPURenderStateTextureView";

export class WebGPURenderStateCanvasTextureView extends WebGPURenderStateTextureView {

    public readonly canvas: GPUCanvasContext;

    public get texture() { return this.canvas.getCurrentTexture(); }
    public get texture_view() { return this.texture.createView({ aspect: this.part }); }

    constructor(render_state: WebGPURenderState, canvas: GPUCanvasContext, part: WebGPURendetStateTextureDestination) {
        super(render_state, undefined!, WebGPURenderStateTextureDimension.D2, part, 1, undefined!);
        this.canvas = canvas;
    }

    public dispose(): void {
        this.render_state.delete_CanvasTextureView(this);
        super.dispose();
    }
}