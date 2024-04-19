import type { Ref } from "@/system/utils/RefCounted";
import { RenderStateFrameBuffer } from "../../render_state_objects/frame_buffer/RenderStateFrameBuffer";
import type { RenderStateTexture } from "../../render_state_objects/texture/RenderStateTexture";
import type { WebGL2RenderState } from "../WebGL2RenderState";

export class WebGL2RenderStateFrameBuffer extends RenderStateFrameBuffer<WebGL2RenderState> {
    public readonly attachments_ref: Map<number, Ref<RenderStateTexture<WebGL2RenderState>>> = new Map();

    public readonly frame_buffer: WebGLFramebuffer;

    constructor(render_state: WebGL2RenderState, frame_buffer: WebGLFramebuffer) {
        super(render_state);
        this.frame_buffer = frame_buffer;
    }
}