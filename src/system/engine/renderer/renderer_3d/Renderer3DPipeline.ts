import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { ConfiguredObject, type Config } from "../../ConfiguredObject";
import type { Renderer3D } from "./Renderer3D";

export class Renderer3DPipeline extends ConfiguredObject {
    protected readonly renderer: Renderer3D;
    protected readonly size: Vector2 = new Vector2(1, 1);
    private is_size_dirty: boolean = false;

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

    public render() {
        if (this.is_size_dirty) {
            this.is_size_dirty = false;
            this.resize_Internal();
        }
        this.render_Internal();
    }

    protected resize_Internal() {
        // console.log(`<Renderer3DPipeline> resize_Internal: resized to ${this.size.x}, ${this.size.y}`);
    }

    protected render_Internal() {
        // console.log(`<Renderer3DPipeline> render_Internal: render to ${this.size.x}, ${this.size.y}`);
    }

    public dispose(): void {
        throw new Error('<Renderer3DPipeline> dispose: abstract method');
    }
}