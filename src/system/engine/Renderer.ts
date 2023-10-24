import { WebGLRenderer, type Camera, Scene, BoxGeometry, MeshBasicMaterial, Mesh, GridHelper } from "three";
import { World3D } from "./World";
import type { Camera3D } from "./SceneTree";

export interface RendererCreationOption {
    antialias?: boolean,
    logarithmicDepthBuffer?: boolean,
}

export class Renderer3D {

    public readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;

    constructor(canvas: HTMLCanvasElement, option: RendererCreationOption) {
        const { antialias = true, logarithmicDepthBuffer = true } = option;
        this.canvas = canvas;
        this.renderer = new WebGLRenderer({
            canvas: canvas,
            antialias, logarithmicDepthBuffer,
        });
    }

    public dispose() {
        this.renderer.dispose();
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

    public render(world: World3D, camera: Camera3D): void {
        const world_3d = world.get_VisualWorld();
        world_3d.trigger_BeforeRender(camera);
        this.renderer.render(world_3d.get_VisualScene(), camera.get_Camera());
    }

    public get_Info() {
        return this.renderer.info;
    }

}

