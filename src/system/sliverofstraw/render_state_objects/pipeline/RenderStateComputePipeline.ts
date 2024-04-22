import { Ref } from "@/system/utils/RefCounted";
import type { RenderState } from "../../RenderState";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderStateProgram } from "./RenderStateProgram";
import type { RenderStateProgramState } from "./RenderStateProgramState";

export abstract class RenderStateComputePipeline<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public readonly program_ref: Ref<RenderStateProgram<T>> = new Ref();

    constructor(render_state: T, program: RenderStateProgram<T>, program_state: RenderStateProgramState<T>) {
        super(render_state);
        this.program_ref.value = program;
    }

    public dispose(): void {
        this.program_ref.clear();
        this.render_state.delete_ComputePipeline(this);
    }
}