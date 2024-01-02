import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { ConfiguredObject, type Config } from "../../ConfiguredObject";
import type { Renderer3D } from "./Renderer3D";
import { RenderServerPlainColorTexture } from "../../render_server/RenderServer";
import type { Viewport } from "../../nodes/Node";
import type { World3D } from "../../worlds/world3ds/World3D";

export class Renderer3DPipeline extends ConfiguredObject {
    protected readonly renderer: Renderer3D;
    protected readonly size: Vector2 = new Vector2(1, 1);
    private is_size_dirty: boolean = true;

    public get texture() { return this.config.render_server.get_PlainColorTexture(RenderServerPlainColorTexture.Empty); }

    constructor(config: Config, renderer: Renderer3D) {
        super(config);
        this.renderer = renderer;
    }

    public set_Size(size: Vector2) {
        if (!this.size.equal(size)) {
            this.size.copy(size);
            this.is_size_dirty = true;
        }
    }

    public render(world: World3D, viewport: Viewport, once: boolean) {
        if (this.is_size_dirty) {
            this.is_size_dirty = false;
            this.resize_Internal();
        }
        this.render_Internal(world, viewport, once);
    }

    protected resize_Internal() {
        // console.log(`<Renderer3DPipeline> resize_Internal: resized to ${this.size.x}, ${this.size.y}`);
    }

    protected render_Internal(world: World3D, viewport: Viewport, once: boolean) {
        // console.log(`<Renderer3DPipeline> render_Internal: render to ${this.size.x}, ${this.size.y}`);
    }

    public dispose(): void {
        throw new Error('<Renderer3DPipeline> dispose: abstract method');
    }
}