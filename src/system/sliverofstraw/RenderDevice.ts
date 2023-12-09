import type { RenderStateInitOption, RenderState } from "./RenderState";

export interface RenderDeviceInitOption { }

export type RDCanvas = HTMLCanvasElement | OffscreenCanvas;

export abstract class RenderDevice<T extends RenderState<T>, Init extends RenderDeviceInitOption = RenderDeviceInitOption> {
    public readonly canvas: RDCanvas;
    public readonly render_state: T;

    constructor(canvas: RDCanvas, render_state_class: new (render_device: RenderDevice<T, Init>, option: Init) => T, option: Init) {
        this.canvas = canvas;
        this.render_state = new render_state_class(this, option);
    }

    public render_Renderable(stage: string, renderable: RenderDeviceRenderable<T>) {
        renderable.render(stage);
    }

    public abstract dispose(): void;
}

export interface RenderDeviceRenderable<T extends RenderState<T>> {
    render(stage: string): void;
}