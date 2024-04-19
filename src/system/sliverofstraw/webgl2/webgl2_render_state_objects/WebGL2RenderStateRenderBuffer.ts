import type { WebGL2RenderState } from "../WebGL2RenderState";
import { RenderStateMultiSampleTexture } from "../../render_state_objects/texture/RenderStateMultiSampleTexture";
import type { RenderStateTextureFormat } from "../../RenderState";

export class WebGL2RenderStateRenderBuffer extends RenderStateMultiSampleTexture<WebGL2RenderState> {
    public readonly render_buffer: WebGLRenderbuffer;

    constructor(render_state: WebGL2RenderState, render_buffer: WebGLRenderbuffer, format: RenderStateTextureFormat, samples: number) {
        super(render_state, format, samples);
        this.render_buffer = render_buffer;
    }

    public dispose(): void {
        this.render_state.delete_RenderBuffer(this);
    }
}