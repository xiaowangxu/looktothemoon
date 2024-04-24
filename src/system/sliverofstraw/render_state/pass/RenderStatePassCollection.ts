import type { RenderState } from "../RenderState";
import { RenderStateObject } from "../RenderStateObject";
import type { RenderStateBuffer } from "../buffer/RenderStateBuffer";
import type { RenderStateFrameBuffer } from "../frame_buffer/RenderStateFrameBuffer";
import type { RenderStateTexture, RendetStateTextureDestination } from "../texture/RenderStateTexture";
import type { RenderStateComputePass } from "./RenderStateComputePass";
import type { RenderStateRenderPass } from "./RenderStateRenderPass";

export abstract class RenderStatePassCollection<T extends RenderState<T>> extends RenderStateObject<T> {

    constructor(render_state: T) {
        super(render_state);
    }

    public abstract copy_Buffers(
        dst: RenderStateBuffer<T>, dst_offset: number,
        data: RenderStateBuffer<T>, data_offset: number, data_length: number,
    ): void;

    public abstract copy_BufferTexture(
        dst: RenderStateTexture<T>,
        dst_destination: RendetStateTextureDestination | undefined,
        dst_mipmap_level: number | undefined,
        dst_x: number | undefined, dst_y: number | undefined, dst_z: number | undefined,
        dst_w: number | undefined, dst_h: number | undefined, dst_d: number | undefined,
        data: RenderStateBuffer<T>,
        data_w: number | undefined, data_h: number | undefined, data_offset: number | undefined
    ): void;

    public abstract copy_Textures(
        dst_destination: RendetStateTextureDestination | undefined,
        dst_mipmap_level: number | undefined,
        dst_x: number | undefined, dst_y: number | undefined, dst_z: number | undefined,
        dst_w: number | undefined, dst_h: number | undefined, dst_d: number | undefined,
        data_destination: RendetStateTextureDestination | undefined,
        data_mipmap_level: number | undefined,
        data_x: number | undefined, data_y: number | undefined, data_z: number | undefined,
    ): void;

    public abstract copy_TextureBuffer(
        dst: RenderStateBuffer<T>,
        dst_w: number | undefined, dst_h: number | undefined, dst_offset: number | undefined,
        data: RenderStateTexture<T>,
        data_destination: RendetStateTextureDestination | undefined,
        data_mipmap_level: number | undefined,
        data_x: number | undefined, data_y: number | undefined, data_z: number | undefined,
        data_w: number | undefined, data_h: number | undefined, data_d: number | undefined,
    ): void;

    public abstract create_RenderPass(frame_buffer: RenderStateFrameBuffer<T>): RenderStateRenderPass<T>;

    public abstract create_ComputePass(): RenderStateComputePass<T>;

    public abstract finish(): void;
}