import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { type Config } from "../../ConfiguredObject";
import type { Viewport } from "../../nodes/Node";
import type { World3D } from "../../worlds/world3ds/World3D";
import { Resource } from "../../resources/Resource";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import type { Renderer3D } from "./Renderer3D";

export abstract class Renderer3DPipeline extends Resource {
    protected readonly size: Vector2 = new Vector2(1, 1);
    private is_size_dirty: boolean = true;

    public abstract get texture(): WebGL2RenderStateTexture;

    constructor(config: Config) {
        super(config);
    }

    public set_Size(size: Vector2) {
        if (!this.size.equal(size)) {
            this.size.copy(size);
            this.is_size_dirty = true;
        }
    }

    public render(renderer: Renderer3D, world: World3D, viewport: Viewport, once: boolean) {
        if (this.is_size_dirty) {
            this.is_size_dirty = false;
            this.resize_Internal();
        }
        this.render_Internal(renderer, world, viewport, once);
    }

    protected abstract resize_Internal(): void;

    protected abstract render_Internal(renderer: Renderer3D, world: World3D, viewport: Viewport, once: boolean): void;

    public abstract dispose(): void;
}