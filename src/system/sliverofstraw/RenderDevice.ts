import type { RenderState } from "./RenderState";

export type RDCanvas = HTMLCanvasElement | OffscreenCanvas;

export class RenderDevice<T extends RenderState<T>> {
    public readonly canvas: RDCanvas;
    public readonly render_state: RenderState<T>;

    constructor(canvas: RDCanvas, render_state_class: new (render_device: RenderDevice<T>) => T){
        this.canvas = canvas;
        this.render_state = new render_state_class(this);
    }
}