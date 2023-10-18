import { WebGLRenderer, type Camera, Scene, BoxGeometry, MeshBasicMaterial, Mesh, GridHelper } from "three";
import { SignalEmitter } from "../utils/SignalEmitter";

export interface RendererCreationOption {
    antialias?: boolean,
}

export class Renderer {

    public readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;

    public readonly signal_before_render: SignalEmitter<(renderer: Renderer, camera: Camera, world: World) => void> = new SignalEmitter();
    public readonly signal_after_render: SignalEmitter<(renderer: Renderer, camera: Camera, world: World) => void> = new SignalEmitter();

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

    public render(scene: Scene, camera: Camera): void {
        this.renderer.render(scene, camera);
    }
}

export class World {
    public readonly scene: Scene = new Scene();

    constructor() {
        const geometry = new BoxGeometry(1, 1, 1);
        const material = new MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new Mesh(geometry, material);
        const grid = new GridHelper(100, 100);
        this.scene.add(cube);
        this.scene.add(grid);
    }
}