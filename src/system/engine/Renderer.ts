import { WebGLRenderer, type Camera, Scene, BoxGeometry, MeshBasicMaterial, Mesh, GridHelper } from "three";
import { World3D } from "./World";

export interface RendererCreationOption {
    antialias?: boolean,
}

export class Renderer3D {

    public readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;

    constructor(canvas: HTMLCanvasElement, option: RendererCreationOption) {
        const { antialias = true } = option;
        this.canvas = canvas;
        this.renderer = new WebGLRenderer({
            canvas: canvas,
            antialias
        });
    }

    public set_ClearAlpha(alpha: number) {
        this.renderer.setClearAlpha(alpha);
    }

    public resize(width: number, height: number) {
        this.renderer.setSize(width, height, true);
    }

    public set_PixelRatio(pixel_ratio: number) {
        this.renderer.setPixelRatio(pixel_ratio);
    }

    public render(world: World3D, camera: Camera): void {
        this.renderer.render(world.get_VisualWorld().get_VisualScene(), camera);
    }

    public get_Info() {
        return this.renderer.info;
    }
}

