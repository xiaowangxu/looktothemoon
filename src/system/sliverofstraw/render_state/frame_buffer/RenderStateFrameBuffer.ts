import type { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import type { RenderState } from "../RenderState";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderStateTextureView } from "../texture/RenderStateTextureView";

export abstract class RenderStateFrameBuffer<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public abstract set blend_constant(constant: Vector4);

    /**
     * add a ***color_attachment*** to this frame_buffer, the index will always grow linearly without holes, you may not alter the attachments' order or total
     * 
     * if you have to change / remove one / many attachment(s) of the frame_buffer, use clear_Attachments then add_Attachment
     */
    public abstract add_Attachment(attchment: RenderStateTextureView<T>, clear: boolean, clear_color: Vector4, write: boolean, resolve: RenderStateTextureView<T> | undefined): void;

    /**
     * set the depth_stencil_attachment of this frame_buffer
     */
    public abstract set_DepthStencilAttachment(
        attchment: RenderStateTextureView<T>,
        depth_clear: boolean, depth_clear_value: number, depth_write: boolean,
        stencil_clear: boolean | undefined, stencil_clear_value: number | undefined, stencil_write: boolean | undefined,
    ): void;

    /**
     * this will clear ***all*** the attachments, but ***not*** ***depth_stencil_attachment***
     */
    public abstract clear_Attachments(): void;

    /**
     * clear the depth_stencil_attachment of this frame_buffer
     */
    public abstract clear_DepthStencilAttachment(): void;

    public dispose(): void {
        this.render_state.delete_FrameBuffer(this);
    }
}