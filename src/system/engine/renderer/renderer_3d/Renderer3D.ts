import type { Viewport } from "../../nodes/Node";
import { World3D } from "../../worlds/world3ds/World3D";
import { Vector2 } from "../../../fivepebble/linear_algebra/Vector2";
import { Ref } from "../../../utils/RefCounted";
import { type Config } from "../../ConfiguredObject";
import type { Renderer3DPipeline } from "./Renderer3DPipeline";
import { Resource } from "../../resources/Resource";

export abstract class Renderer3D extends Resource {
    protected get render_server() { return this.config.render_server; }

    protected _render_pipeline: Ref<Renderer3DPipeline> = new Ref();
    public get render_pipeline() { return this._render_pipeline.value; }
    public set render_pipeline(pipeline: Renderer3DPipeline | undefined) {
        if (this._render_pipeline.value !== pipeline) {
            this._render_pipeline.value = pipeline;
        }
    }

    protected readonly base_position: Vector2 = new Vector2(0, 0);
    protected readonly base_size: Vector2 = new Vector2(1, 1);

    constructor(config: Config) {
        super(config);
    }

    public set_Size(size: Vector2) {
        if (!this.base_size.equal(size)) {
            this.base_size.copy(size);
        }
    }

    public set_Position(position: Vector2) {
        if (!this.base_position.equal(position)) {
            this.base_position.copy(position);
        }
    }

    public abstract render(world: World3D, viewport: Viewport, once: boolean): void;

    protected dispose(): void {
        this._render_pipeline.clear();
    }
}

