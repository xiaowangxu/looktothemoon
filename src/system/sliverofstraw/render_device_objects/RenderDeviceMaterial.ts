import { Ref } from "@/system/utils/RefCounted";
import { RenderDeviceObject } from "../RenderDeviceObject";
import type { RenderState } from "../RenderState";
import type { RenderStateProgram } from "../render_state_objects/RenderStateProgram";
import type { RenderDevice } from "../RenderDevice";

export abstract class RenderDeviceMaterial<T extends RenderState<T>, Program extends RenderStateProgram<T> = RenderStateProgram<T>>
    extends RenderDeviceObject<T>
{
    public readonly program_ref: Ref<Program> = new Ref();

    public get program(): Program { return this.program_ref.expect; }

    constructor(render_device: RenderDevice<T>, program: Program) {
        super(render_device);
        this.program_ref.value = program;
    }

    public dispose(): void {
        console.log(">>> dispose <RenderDeviceMaterial>");
        this.program_ref.clear();
    }
}