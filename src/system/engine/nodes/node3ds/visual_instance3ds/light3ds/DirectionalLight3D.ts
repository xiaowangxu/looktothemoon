import type { Rid } from "@/system/engine/Rid";
import { LightInstance3D } from "./LightInstance3D";
import { NodeNotification } from "../../../Node";
import { RenderServerLightType } from "@/system/engine/render_server/RenderServerLightData";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";

export class DirectionalLight3D extends LightInstance3D {

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

    protected on_AttenuationChanged(): void { return; }

    protected on_RenderQueueChanged(): void { return; }

    protected on_ShadowBiasChanged(): void {
        if (this.light_rid !== undefined) {
            const visual_world = this.get_Viewport()?.world_3d?.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_LightShadowBias(this.light_rid, this._shadow_bias);
            }
        }
    }

    protected on_ShadowNormalBiasChanged(): void {
        if (this.light_rid !== undefined) {
            const visual_world = this.get_Viewport()?.world_3d?.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_LightShadowNormalBias(this.light_rid, this._shadow_normal_bias);
            }
        }
    }

    protected on_ShadowOpacityChanged(): void {
        if (this.light_rid !== undefined) {
            const visual_world = this.get_Viewport()?.world_3d?.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_LightShadowOpacity(this.light_rid, this._shadow_opacity);
            }
        }
    }

    static #vector3: Vector3 = new Vector3();

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree: {
                if (this.light_rid === undefined) {
                    const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                    if (visual_world !== undefined) {
                        this.light_rid = visual_world.create_Light();
                        visual_world.set_LightType(this.light_rid, RenderServerLightType.DirectionalLight);
                        visual_world.set_LightColor(this.light_rid, this._color);
                        visual_world.set_LightIntensity(this.light_rid, this._intensity);
                        visual_world.set_LightLayer(this.light_rid, this._layer);
                        visual_world.set_LightShadowBias(this.light_rid, this._shadow_bias);
                        visual_world.set_LightShadowNormalBias(this.light_rid, this._shadow_normal_bias);
                        visual_world.set_LightShadowOpacity(this.light_rid, this._shadow_opacity);
                    }
                }
                break;
            }
            case NodeNotification.ExitingTree: {
                if (this.light_rid !== undefined) {
                    const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                    if (visual_world === undefined) throw new Error('<DirectionalLight3D> _notification@ExitingTree: cannot find visual world, fail to free light instance');
                    visual_world.free_Light(this.light_rid);
                    this.light_rid = undefined;
                }
                break;
            }
            case NodeNotification.InternalBeforeRender: {
                if (this.light_rid !== undefined && (this.is_global_transform_changed || this.is_global_visible_changed)) {
                    const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                    if (visual_world === undefined) throw new Error('<DirectionalLight3D> _notification@InternalBeforeRender: cannot find visual world, fail to update mesh instance');
                    if (this.is_global_transform_changed) {
                        const vec = DirectionalLight3D.#vector3;
                        vec.set(0, 0, -1);
                        vec._apply_Matrix4(vec, this.global_transform);
                        vec.direction_to(this._global_position, vec);
                        vec.negate(vec);
                        visual_world.set_LightGlobalPosition(this.light_rid, vec);
                    }
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