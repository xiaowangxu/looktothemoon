import { type RefCounted, Ref } from "../utils/RefCounted";
import type { RenderingDevice } from "./RenderingDevice";

export class FrameBuffer implements RefCounted {
    private readonly rd: RenderingDevice;

    private _framebuffer: WebGLFramebuffer | undefined = undefined;
    public get framebuffer() { return this._framebuffer; }
    public set framebuffer(framebuffer: WebGLFramebuffer | undefined) { this._framebuffer = framebuffer; }

    public get compiled() { return this.framebuffer !== undefined; }

    private _ref_count: number = 0;
    public ref_count(): number { return this._ref_count; }
    public ref(): void { this._ref_count++; }
    public unref(): void {
        this._ref_count--;
        if (this._ref_count <= 0) {
            this._ref_count = 0;
            this.free();
        }
    }

    constructor(rd: RenderingDevice) {
        this.rd = rd;
    }

    public free() {
        console.log(">>>>> free frame buffer");
        this.rd.state.free_FrameBuffer(this);
    }
}