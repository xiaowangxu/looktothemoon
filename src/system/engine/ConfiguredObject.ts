import type { Vector2 } from "../fivepebble/linear_algebra/Vector2";
import type { RenderServerDevice } from "./render_server/RenderServer";
import type { Renderer3DPipeline } from "./renderer/renderer_3d/Renderer3DPipeline";

export interface Config {
    render_server: RenderServerDevice,
    render_server_size: Vector2 | undefined,
    render_server_pixel_ratio: number | undefined,
    render_3d_pipeline: typeof Renderer3DPipeline,
    render_queue_max_solid_count?: number,
    render_queue_max_transparent_count?: number,
    disabled_render_queue1?: boolean,
    render_queue1_max_solid_count?: number,
    render_queue1_max_transparent_count?: number,
    physics_fps: number,
}

export abstract class ConfiguredObject {
    public readonly config: Config;

    constructor(config: Config) {
        this.config = config;
    }
}