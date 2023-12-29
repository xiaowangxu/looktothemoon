import type { Vector2 } from "../fivepebble/linear_algebra/Vector2";
import type { RenderServerDevice } from "./render_server/RenderServer";

export interface Config {
    render_server_3d: RenderServerDevice,
    render_server_size: Vector2 | undefined,
    render_server_pixel_ratio: number | undefined,
    render_queue_max_solid_count?: number,
    render_queue_max_transparent_count?: number,
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