import { NodeNotification } from "@/system/engine/nodes/Node";
import { Light3D } from './Light3D';
import type { RID } from '@/system/engine/Rid';

export class DirectionalLight3D extends Light3D {
    public static readonly class_name: string = "DirectionalLight3D";

    private light_rid: RID | undefined = undefined;

    constructor() {
        super();
    }

    protected on_VisualLayerChanged(): void {
        if (this.light_rid !== undefined) {
            const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
            if (visual_world !== undefined) {
                visual_world.set_LightLayer(this.light_rid, this.visual_layer);
            }
        }
    }

    protected on_ColorChanged() {
        if (this.light_rid !== undefined) {
            const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
            if (visual_world !== undefined) {
                visual_world.set_LightColor(this.light_rid, this.color);
            }
        }
    }

    protected on_IntensityChanged() {
        if (this.light_rid !== undefined) {
            const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
            if (visual_world !== undefined) {
                visual_world.set_LightIntensity(this.light_rid, this.intensity);
            }
        }
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree: {
                if (this.light_rid === undefined) {
                    const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
                    if (visual_world !== undefined) {
                        this.light_rid = visual_world.create_DirectionalLight();
                        visual_world.set_LightLayer(this.light_rid, this.visual_layer);
                        visual_world.set_LightColor(this.light_rid, this.color);
                        visual_world.set_LightIntensity(this.light_rid, this.intensity);
                    }
                }
                break;
            }
            case NodeNotification.ExitingTree: {
                if (this.light_rid !== undefined) {
                    const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
                    if (visual_world === undefined) throw new Error('cannot find visual world, fail to free light instance');
                    visual_world.free_Light(this.light_rid);
                    this.light_rid = undefined;
                }
                break;
            }
            case NodeNotification.InternalBeforeRender: {
                if (this.light_rid !== undefined) {
                    const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
                    if (visual_world === undefined) throw new Error('cannot find visual world, fail to update light instance');
                    if (this.is_global_transform_changed) {
                        visual_world.set_DirectionalLightRotation(this.light_rid, this.global_rotation);
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