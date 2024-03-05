import type { Rid } from "@/system/engine/Rid";
import { LightInstance3D } from "./LightInstance3D";
import { NodeNotification } from "../../../Node";
import { RenderServerLightType } from "@/system/engine/render_server/RenderServerLightData";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Pi } from "@/system/fivepebble/Scalar";

export class SpotLight3D extends LightInstance3D {

    static readonly #tmp_vector3_0: Vector3 = Vector3.new;

    private light_rid: Rid | undefined = undefined;

    protected _angle: number = Pi / 4;
    public get angle() { return this._angle; }
    public set angle(angle: number) {
        angle = Math.max(0, angle);
        if (this._angle !== angle) {
            this._angle = angle;
            this.on_ParametersChanged();
        }
    }

    protected _falloff_angle: number = 0.05;
    public get falloff_angle() { return this._falloff_angle; }
    public set falloff_angle(falloff_angle: number) {
        falloff_angle = Math.max(0, falloff_angle);
        if (this._falloff_angle !== falloff_angle) {
            this._falloff_angle = falloff_angle;
            this.on_ParametersChanged();
        }
    }

    protected _distance: number = 5.0;
    public get distance() { return this._distance; }
    public set distance(distance: number) {
        distance = Math.max(0, distance);
        if (this._distance !== distance) {
            this._distance = distance;
            this.on_ParametersChanged();
        }
    }

    protected _falloff_distance: number = 0.05;
    public get falloff_distance() { return this._falloff_distance; }
    public set falloff_distance(falloff_distance: number) {
        falloff_distance = Math.max(0, falloff_distance);
        if (this._falloff_distance !== falloff_distance) {
            this._falloff_distance = falloff_distance;
            this.on_ParametersChanged();
        }
    }

    protected on_ParametersChanged(): void {
        if (this.light_rid !== undefined) {
            const visual_world = this.get_Viewport()?.world_3d?.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_LightParameters(this.light_rid, Math.max(0, this._angle - this._falloff_angle), this._angle, Math.max(0, this._distance - this._falloff_distance), this._distance);
            }
        }
    }

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

    protected on_AttenuationChanged(): void {
        if (this.light_rid !== undefined) {
            const visual_world = this.get_Viewport()?.world_3d?.visual_world;
            if (visual_world !== undefined) {
                visual_world.set_LightAttenuation(this.light_rid, this._attenuation);
            }
        }
    }

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

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree: {
                if (this.light_rid === undefined) {
                    const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                    if (visual_world !== undefined) {
                        this.light_rid = visual_world.create_Light();
                        visual_world.set_LightType(this.light_rid, RenderServerLightType.SpotLight);
                        visual_world.set_LightColor(this.light_rid, this._color);
                        visual_world.set_LightIntensity(this.light_rid, this._intensity);
                        visual_world.set_LightAttenuation(this.light_rid, this._attenuation);
                        visual_world.set_LightLayer(this.light_rid, this._layer);
                        visual_world.set_LightParameters(this.light_rid, Math.max(0, this._angle - this._falloff_angle), this._angle, Math.max(0, this._distance - this._falloff_distance), this._distance);
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
                    if (visual_world === undefined) throw new Error('<SpotLight3D> _notification@ExitingTree: cannot find visual world, fail to free light instance');
                    visual_world.free_Light(this.light_rid);
                    this.light_rid = undefined;
                }
                break;
            }
            case NodeNotification.InternalBeforeRender: {
                if (this.light_rid !== undefined && (this.is_global_transform_changed || this.is_global_visible_changed)) {
                    const visual_world = this.get_Viewport()?.world_3d?.visual_world;
                    if (visual_world === undefined) throw new Error('<SpotLight3D> _notification@InternalBeforeRender: cannot find visual world, fail to update mesh instance');
                    if (this.is_global_transform_changed) {
                        this.update_GlobalTransform();
                        const vec = SpotLight3D.#tmp_vector3_0.set(0, 0, -1);
                        vec.apply_Matrix4(vec, this._global_transform);
                        vec.direction_to(this._global_position, vec);
                        visual_world.set_LightGlobalPosition(this.light_rid, this._global_position);
                        visual_world.set_LightGlobalDirection(this.light_rid, vec);
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