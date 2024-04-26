import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Ref, RefArray, RefMap } from "@/system/utils/RefCounted";
import type { WebGPURenderStateTextureView } from "../texture/WebGPURenderStateTextureView";
import { WebGPURenderStateCanvasTextureView } from "../texture/WebGPURenderStateCanvasTextureView";
import { bitmask_check, bitmask_enable, bitmask_keep, bitmask_set, bitmask_test } from "@/system/utils/BitMask";
import { WebGPURenderStateObjectRefCounted } from "../WebGPURenderStateObject";

export class WebGPURenderStateFrameBuffer extends WebGPURenderStateObjectRefCounted {

    public _blend_constant: Vector4 = new Vector4();
    public set blend_constant(constant: Vector4) {
        this._blend_constant.copy(constant);
    }

    protected readonly canvas_texture_refs: RefMap<number, WebGPURenderStateCanvasTextureView> = new RefMap();

    protected readonly color_attachment_refs: RefArray<WebGPURenderStateTextureView> = new RefArray();
    protected color_attachment_entries: GPURenderPassColorAttachment[] = [];

    protected readonly depth_stencil_attachment_ref: Ref<WebGPURenderStateTextureView> = new Ref();

    public readonly frame_buffer_desc: GPURenderPassDescriptor = {
        colorAttachments: this.color_attachment_entries,
        depthStencilAttachment: undefined,
    }

    public add_Attachment(attchment: WebGPURenderStateTextureView | WebGPURenderStateCanvasTextureView, clear: boolean, clear_color: Vector4, write: boolean, resolve: WebGPURenderStateTextureView | WebGPURenderStateCanvasTextureView | undefined): void {
        const index = this.color_attachment_entries.length;
        const is_view_canvas = attchment instanceof WebGPURenderStateCanvasTextureView;
        const is_resolve_canvas = resolve instanceof WebGPURenderStateCanvasTextureView;
        if (!is_view_canvas) {
            this.color_attachment_refs.push(attchment);
        }
        else {
            const mask = bitmask_set(0, index, 0, 31);
            this.canvas_texture_refs.set(mask, attchment);
        }
        if (is_resolve_canvas) {
            const mask = bitmask_enable(bitmask_set(0, index, 0, 31), 31);
            this.canvas_texture_refs.set(mask, resolve);
        }
        this.color_attachment_entries.push({
            view: is_view_canvas ? undefined! : attchment.texture_view,
            clearValue: [clear_color.r, clear_color.g, clear_color.b, clear_color.a],
            loadOp: clear ? 'clear' : 'load',
            storeOp: write ? 'store' : 'discard',
            resolveTarget: is_resolve_canvas ? undefined : (resolve !== undefined ? resolve.texture_view : undefined),
        });
    }

    public set_DepthStencilAttachment(attchment: WebGPURenderStateTextureView, depth_clear: boolean, depth_clear_value: number, depth_write: boolean, stencil_clear: boolean | undefined = undefined, stencil_clear_value: number | undefined = undefined, stencil_write: boolean | undefined = undefined): void {
        this.depth_stencil_attachment_ref.value = attchment;
        this.frame_buffer_desc.depthStencilAttachment = {
            view: attchment.texture_view,
            depthClearValue: depth_clear_value,
            depthLoadOp: depth_clear ? 'clear' : 'load',
            depthStoreOp: depth_write ? 'store' : 'discard',
            depthReadOnly: !depth_write,
            stencilClearValue: stencil_clear_value,
            stencilLoadOp: stencil_clear === undefined ? undefined : (stencil_clear ? 'clear' : 'load'),
            stencilStoreOp: stencil_write === undefined ? undefined : (stencil_write ? 'store' : 'discard'),
            stencilReadOnly: stencil_write === undefined ? undefined : (!stencil_write),
        };
    }

    public clear_Attachments(): void {
        this.canvas_texture_refs.clear();
        this.color_attachment_refs.clear();
        this.color_attachment_entries = [];
        this.frame_buffer_desc.colorAttachments = this.color_attachment_entries;
    }

    public clear_DepthStencilAttachment(): void {
        this.depth_stencil_attachment_ref.clear();
        this.frame_buffer_desc.depthStencilAttachment = undefined;
    }

    public refresh_CanvasTextureView() {
        for (const [mask, texture_view] of this.canvas_texture_refs) {
            const resolve = bitmask_check(mask, 31);
            const index = bitmask_keep(mask, 31, 0);
            if (resolve) {
                this.color_attachment_entries[index].resolveTarget = texture_view.texture_view;
            }
            else {
                this.color_attachment_entries[index].view = texture_view.texture_view;
            }
        }
    }

    public dispose(): void {
        this.canvas_texture_refs.clear();
        this.color_attachment_refs.clear();
        this.depth_stencil_attachment_ref.clear();
        this.render_state.delete_FrameBuffer(this);
    }
}