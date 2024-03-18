import type { Rid } from "@/system/engine/Rid";
import { LightInstance3D } from "./LightInstance3D";
import { NodeNotification } from "../../../Node";
import { RenderServerLightType } from "@/system/engine/render_server/RenderServerLightData";

export class AmbientLight3D extends LightInstance3D {

    private light_rid: Rid | undefined = undefined;

    protected on_LayerChanged(): void {
        if (this.light_rid !== undefined) {
            const visual_world = this.get_Viewport()?.world_3d?.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_LightLayer(this.light_rid, this._layer);
            }
        }
    }

    protected on_ColorChanged(): void {
        if (this.light_rid !== undefined) {
            const visual_world = this.get_Viewport()?.world_3d?.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_LightColor(this.light_rid, this._color);
            }
        }
    }

    protected on_IntensityChanged(): void {
        if (this.light_rid !== undefined) {
            const visual_world = this.get_Viewport()?.world_3d?.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_LightIntensity(this.light_rid, this._intensity);
            }
        }
    }

    protected on_CastShadowChanged(): void { return; }

    protected on_AttenuationChanged(): void { return; }

    protected on_RenderQueueChanged(): void { return; }

    protected on_ShadowBiasChanged(): void { return; }

    protected on_ShadowNormalBiasChanged(): void { return; }

    protected on_ShadowOpacityChanged(): void { return; }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree: {
                if (this.light_rid === undefined) {
                    const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                    if (visual_world !== undefined) {
                        this.light_rid = visual_world.create_Light();
                        visual_world.set_LightType(this.light_rid, RenderServerLightType.AmbientLight);
                        visual_world.set_LightColor(this.light_rid, this._color);
                        visual_world.set_LightIntensity(this.light_rid, this._intensity);
                        visual_world.set_LightLayer(this.light_rid, this._layer);
                    }
                }
                break;
            }
            case NodeNotification.ExitingTree: {
                if (this.light_rid !== undefined) {
                    const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                    if (visual_world === undefined) throw new Error('<AmbientLight3D> _notification@ExitingTree: cannot find visual world, fail to free light instance');
                    visual_world.free_Light(this.light_rid);
                    this.light_rid = undefined;
                }
                break;
            }
            case NodeNotification.InternalBeforeRender: {
                if (this.light_rid !== undefined && (this.is_global_transform_changed || this.is_global_visible_changed)) {
                    const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                    if (visual_world === undefined) throw new Error('<AmbientLight3D> _notification@InternalBeforeRender: cannot find visual world, fail to update mesh instance');
                    if (this.is_global_visible_changed) {
                        visual_world.set_LightVisibility(this.light_rid, this.global_visible);
                    }
                }
                break;
            }
        }
        super._notification(what);
    }
}