import { Color, Vector3 } from 'three';
import { NodeNotification } from '@/system/engine/SceneTree';
import { Light3D } from './Light3D';
import type { RID } from '@/system/engine/Rid';
import type { ClassReader, ClassWriter } from '@/system/engine/classes/ClassWriterReader';

export class HemisphereLight3D extends Light3D {
    public static readonly class_name: string = "HemisphereLight3D";

    private light_rid: RID | undefined = undefined;

    private _ground_color: Color = new Color(1, 1, 1);
    public get ground_color() { return this._ground_color.clone(); }
    public set ground_color(ground_color: Color) {
        this._ground_color.copy(ground_color);
        if (this.light_rid !== undefined) {
            const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
            if (visual_world !== undefined) {
                visual_world.set_HemisphereLightGroundColor(this.light_rid, this.ground_color);
            }
        }
    }

    private _up: Vector3 = new Vector3(0, 1, 0);
    public get up() { return this._up.clone(); }
    public set up(up: Vector3) {
        this._up.copy(up);
        if (this.light_rid !== undefined) {
            const visual_world = this.get_Viewport()?.get_World3D()?.get_VisualWorld();
            if (visual_world !== undefined) {
                visual_world.set_HemisphereLightUp(this.light_rid, this.up);
            }
        }
    }

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
                        this.light_rid = visual_world.create_HemisphereLight();
                        visual_world.set_LightLayer(this.light_rid, this.visual_layer);
                        visual_world.set_LightColor(this.light_rid, this.color);
                        visual_world.set_LightIntensity(this.light_rid, this.intensity);
                        visual_world.set_HemisphereLightGroundColor(this.light_rid, this.ground_color);
                        visual_world.set_HemisphereLightUp(this.light_rid, this.up);
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
        writer.property('ground_color', this.ground_color);
        writer.property('up', this.up);
    }

    public load(reader: ClassReader): void {
        super.load(reader);
        this.ground_color = reader.get<Color>('ground_color') ?? new Color(1, 1, 1);
        this.up = reader.get<Vector3>('up') ?? new Vector3(0, 1, 0);
    }
}