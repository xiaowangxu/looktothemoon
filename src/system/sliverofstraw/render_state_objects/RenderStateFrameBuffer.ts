import { Ref } from "@/system/utils/RefCounted";
import type { RenderState } from "../RenderState";
import { RenderStateObject } from "../RenderStateObject";
import type { RenderStateTexture } from "./RenderStateTexture";

export type FrameBufferAttachment<RS extends RenderState<RS>> = RenderStateTexture<RS>;

export class RenderStateFrameBuffer<T extends RenderState<T>> extends RenderStateObject<T> {
    public attachments_ref: Map<any, Ref<FrameBufferAttachment<T>>> = new Map();

    public get attachement_points() { return [...this.attachments_ref.keys()]; }

    constructor(render_state: T) {
        super(render_state);
    }

    public has_Attachment(key: any) {
        return this.attachments_ref.has(key);
    }

    public set_Attachment(key: any, attachment: FrameBufferAttachment<T> | undefined) {
        if (this.attachments_ref.has(key)) {
            if (attachment === undefined) {
                this.attachments_ref.get(key)!.clear();
                this.attachments_ref.delete(key);
            }
            else {
                this.attachments_ref.get(key)!.value = attachment;
            }
        }
        else if (attachment !== undefined) {
            this.attachments_ref.set(key, new Ref(attachment));
        }
    }

    protected clear_Attachments() {
        for (const attachment of this.attachments_ref.values()) {
            attachment.clear();
        }
        this.attachments_ref.clear();
    }

    public dispose(): void {
        this.clear_Attachments();
        this.render_state.delete_FrameBuffer(this);
    }
}