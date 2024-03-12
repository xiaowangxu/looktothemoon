import { World3D } from "../../worlds/world3ds/World3D";
import { Ref } from "../../../utils/RefCounted";
import { type Config } from "../../ConfiguredObject";
import type { Renderer3DPipeline } from "./Renderer3DPipeline";
import { Resource } from "../../resources/Resource";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";

export abstract class OffscreenRenderer3D extends Resource {
    protected get render_server() { return this.config.render_server; }

    protected _render_pipeline: Ref<Renderer3DPipeline> = new Ref();
    public get render_pipeline() { return this._render_pipeline.value; }
    public set render_pipeline(pipeline: Renderer3DPipeline | undefined) {
        if (this._render_pipeline.value !== pipeline) {
            this._render_pipeline.value = pipeline;
        }
    }

    constructor(config: Config) {
        super(config);
    }

    public abstract render(world: World3D, camera: Camera3, once: boolean): void;
}

