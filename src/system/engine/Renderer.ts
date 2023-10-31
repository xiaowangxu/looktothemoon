import { WebGLRenderer, type Camera, Scene, BoxGeometry, MeshBasicMaterial, Mesh, GridHelper, Color, PCFSoftShadowMap } from "three";
import { World3D } from "./World";
import type { Camera3D, Viewport } from "./SceneTree";

export interface RendererCreationOption {
    antialias?: boolean,
    logarithmicDepthBuffer?: boolean,
}

export class Renderer3D {

    public readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;

    constructor(canvas: HTMLCanvasElement, option: RendererCreationOption) {
        const { antialias = true, logarithmicDepthBuffer = false } = option;
        this.canvas = canvas;
        this.renderer = new WebGLRenderer({
            canvas: canvas,
            antialias, logarithmicDepthBuffer,
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;
    }

    public dispose() {
        this.renderer.dispose();
    }

    public set_ClearAlpha(alpha: number) {
        this.renderer.setClearAlpha(alpha);
    }

    public set_ClearColor(color: Color) {
        this.renderer.setClearColor(color);
    }

    public resize(width: number, height: number) {
        this.renderer.setSize(width, height, true);
    }

    public set_PixelRatio(pixel_ratio: number) {
        this.renderer.setPixelRatio(pixel_ratio);
    }

    public render(world: World3D, viewport: Viewport, camera: Camera3D): void {
        const world_3d = world.get_VisualWorld();
        world_3d.trigger_BeforeRender(viewport, camera);
        this.renderer.render(world_3d.get_VisualScene(), camera.get_Camera());
    }

    public get_Info() {
        return this.renderer.info;
    }

}