import { Ref } from "@/system/utils/RefCounted";
import { RenderDeviceObject } from "../RenderDeviceObject";
import type { RenderState } from "../RenderState";
import type { RenderDeviceSurface } from "./RenderDeviceSurface";
import type { RenderDeviceMaterialSet } from "./RenderDeviceMaterialSet";
import type { RenderDevice, RenderDeviceRenderable } from "../RenderDevice";

export abstract class RenderDeviceRenderableSurface<
    T extends RenderState<T>,
    Mat extends RenderDeviceMaterialSet<T> = RenderDeviceMaterialSet<T>,
    Surf extends RenderDeviceSurface<T> = RenderDeviceSurface<T>,
>
    extends RenderDeviceObject<T> implements RenderDeviceRenderable<T>
{
    public readonly material_ref: Ref<Mat> = new Ref();
    public readonly surface_ref: Ref<Surf> = new Ref();

    public material_changed: boolean = false;
    public surface_changed: boolean = false;

    constructor(render_device: RenderDevice<T>) {
        super(render_device);
    }

    public set_Material(material: Mat) {
        this.material_changed = true;
        this.material_ref.value = material;
    }

    public set_Surface(surface: Surf) {
        this.surface_changed = true;
        this.surface_ref.value = surface;
    }

    public abstract render(stage: string): void;

    public dispose(): void {
        console.log(">>> dispose <RenderDeviceRenderableSurface>");
        this.material_ref.clear();
        this.surface_ref.clear();
    }
}