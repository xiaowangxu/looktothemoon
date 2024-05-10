import type { WebGPURenderStateCanvasTextureView } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateCanvasTextureView";
import { ReadonlyRef } from "@/system/utils/RefCounted";
import { RenderServer, RenderServerSingleton } from "../RenderServer";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import type { Disposable } from "@/system/utils/Type";
import { RenderServerObject } from "../RenderServerObject";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";

export class RenderServerViewport extends RenderServerObject implements Disposable {

    static readonly #tmp_matrix4_0: Matrix4 = Matrix4.new;
    static readonly #tmp_matrix3_0: Matrix3 = Matrix3.new;

    protected readonly canvas: HTMLCanvasElement;

    protected readonly canvas_texture_view_ref: ReadonlyRef<WebGPURenderStateCanvasTextureView>;
    public get canvas_texture_view() { return this.canvas_texture_view_ref.expect; }

    protected readonly _raw_size: Vector2 = Vector2.new;
    public get raw_size() { return this._raw_size.clone(); }
    public get_RawSize(target: Vector2) { return target.copy(this._raw_size); }

    protected readonly _size: Vector2 = Vector2.new;
    public get size() { return this._size.clone(); }
    public get_Size(target: Vector2) { return target.copy(this._size); }

    protected _raw_pixel_ratio: number = window.devicePixelRatio;
    public get raw_pixel_ratio() { return this._raw_pixel_ratio; }

    protected _scale: number = 1.0;
    public get scale() { return this._scale; }

    protected _pixel_ratio: number = 1.0;
    public get pixel_ratio() { return this._pixel_ratio; }

    constructor(canvas: HTMLCanvasElement) {
        super();
        this.canvas = canvas;
        const canvas_ctx = canvas.getContext('webgpu')!;
        canvas_ctx.configure({
            device: RenderServer.render_state.device,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
            format: 'rgba16float',
        });
        this.canvas_texture_view_ref = new ReadonlyRef(RenderServer.render_state.create_CanvasTextureView(canvas_ctx).expect());
    }

    public set_PixelRatio(ratio: number = window.devicePixelRatio) {
        this._raw_pixel_ratio = ratio;
        this._pixel_ratio = this._raw_pixel_ratio * this._scale;
        this.set_RawSize(this._raw_size.x, this._raw_size.y);
    }

    public set_Scale(scale: number) {
        this._scale = scale;
        this._pixel_ratio = this._raw_pixel_ratio * this._scale;
        this.set_RawSize(this._raw_size.x, this._raw_size.y);
    }

    public set_RawSize(width: number, height: number) {
        this._raw_size.set(
            Math.max(Math.floor(width)),
            Math.max(Math.floor(height)),
        );
        width = Math.max(Math.floor(width * this.pixel_ratio), 1);
        height = Math.max(Math.floor(height * this.pixel_ratio), 1);
        this._size.set(width, height);
    }

    public update_Size() {
        const canvas_width = this.canvas.width;
        const canvas_height = this.canvas.height;
        if (canvas_width !== this._size.x || canvas_height !== this._size.y) {
            this.canvas.width = this._size.x;
            this.canvas.height = this._size.y;
        }
    }

    public dispose() {
        this.canvas_texture_view_ref.clear();
    }
}