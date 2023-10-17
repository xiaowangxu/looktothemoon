import { WebGLRenderer, type Camera } from "three";
import { SignalEmitter } from "../utils/EventEmitter";
import type { World } from "./World";

export interface RendererCreationOption {
    alpha?: boolean,
    antialias?: boolean,
}

export class Renderer {

    private readonly canvas: HTMLCanvasElement;
    private readonly render: WebGLRenderer;

    private readonly signal_before_render: SignalEmitter<(renderer: Renderer, camera: Camera, world: World) => void> = new SignalEmitter();
    private readonly signal_after_render: SignalEmitter<(renderer: Renderer, camera: Camera, world: World) => void> = new SignalEmitter();
    private readonly signal_resize: SignalEmitter<(width: number, height: number) => void> = new SignalEmitter();

    private camera_dirty: boolean = true;
    private camera: Camera | undefined = undefined;
    private world: World | undefined = undefined;

    constructor(canvas: HTMLCanvasElement, option: RendererCreationOption) {
        const { alpha = false, antialias = true } = option;
        this.canvas = canvas;
        this.render = new WebGLRenderer({
            canvas: canvas,
            alpha, antialias
        });
    }

    public set_ActiveCamera(camera: Camera | undefined) {
        this.camera = camera;
        this.camera_dirty = true;
    }

    public set_ActiveWorld(world: World | undefined) {
        this.world = world;
    }

    private start_Render(): void {
        if (this.camera === undefined) return;
        this.before_Render();
        this.on_Render();
        this.after_Render();
    }

    private before_Render(): void {
        if (this.camera_dirty) {

        }
        this.camera_dirty = false;
        this.signal_before_render.trigger(this, this.camera!, this.world!);
    }

    private on_Render(): void {
        this.render.render(this.world!.scene, this.camera!);
    }

    private after_Render(): void {
        this.signal_after_render.trigger(this, this.camera!, this.world!);
    }
}