import { NodeNotification } from "@/system/engine/nodes/Node";
import { Light3D } from './Light3D';
import type { RID } from '@/system/engine/Rid';
import type { ClassReader, ClassWriter } from '@/system/engine/classes/ClassWriterReader';

export class SpotLight3D extends Light3D {
    public static readonly class_name: string = "SpotLight3D";

    private light_rid: RID | undefined = undefined;

    private _decay: number = 2;
    public get decay() { return this._decay; }
    public set decay(decay: number) {
        if (this._decay !== decay) {
            this._decay = decay;
            if (this.light_rid !== undefined) {
                const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
                if (visual_world !== undefined) {
                    visual_world.set_SpotLightDecay(this.light_rid, this._decay);
                }
            }
        }
    }

    private _distance: number = 0;
    public get distance() { return this._distance; }
    public set distance(distance: number) {
        if (this._distance !== distance) {
            this._distance = distance;
            if (this.light_rid !== undefined) {
                const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
                if (visual_world !== undefined) {
                    visual_world.set_SpotLightDistance(this.light_rid, this._distance);
                }
            }
        }
    }

    private _angle: number = Math.PI / 3;
    public get angle() { return this._angle; }
    public set angle(angle: number) {
        if (this._angle !== angle) {
            this._angle = angle;
            if (this.light_rid !== undefined) {
                const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
                if (visual_world !== undefined) {
                    visual_world.set_SpotLightAngle(this.light_rid, this._angle);
                }
            }
        }
    }

    private _penumbra: number = 0;
    public get penumbra() { return this._penumbra; }
    public set penumbra(penumbra: number) {
        if (this._penumbra !== penumbra) {
            this._penumbra = penumbra;
            if (this.light_rid !== undefined) {
                const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
                if (visual_world !== undefined) {
                    visual_world.set_SpotLightPenumbra(this.light_rid, this._penumbra);
                }
            }
        }
    }

    public get power() { return this.intensity * Math.PI; }
    public set power(power: number) { this.intensity = power / (Math.PI * 4); }

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
                        this.light_rid = visual_world.create_SpotLight();
                        visual_world.set_LightLayer(this.light_rid, this.visual_layer);
                        visual_world.set_LightColor(this.light_rid, this.color);
                        visual_world.set_LightIntensity(this.light_rid, this.intensity);
                        visual_world.set_SpotLightDecay(this.light_rid, this.decay);
                        visual_world.set_SpotLightDistance(this.light_rid, this.distance);
                        visual_world.set_SpotLightAngle(this.light_rid, this.angle);
                        visual_world.set_SpotLightPenumbra(this.light_rid, this.penumbra);
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
                        visual_world.set_LightGlobalTransform(this.light_rid, this.global_transform);
                        visual_world.set_SpotLightRotation(this.light_rid, this.global_rotation);
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

    // save / load

    public dump(writer: ClassWriter): void {
        super.dump(writer);
        writer.property('decay', this.decay);
        writer.property('distance', this.distance);
        writer.property('angle', this.angle);
        writer.property('penumbra', this.penumbra);
    }

    public load(reader: ClassReader): void {
        super.load(reader);
        this.decay = reader.get<number>('decay') ?? 2;
        this.distance = reader.get<number>('distance') ?? 0;
        this.angle = reader.get<number>('angle') ?? Math.PI / 3;
        this.penumbra = reader.get<number>('penumbra') ?? 0;
    }
}