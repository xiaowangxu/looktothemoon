import { Ref } from "@/system/utils/RefCounted";
import type { RenderState } from "../../RenderState";
import { RenderStateObject } from "../RenderStateObject";
import type { RenderStateProgram } from "./RenderStateProgram";
import type { RenderStateProgramState } from "./RenderStateProgramState";

export class RenderStatePipeline<T extends RenderState<T>> extends RenderStateObject<T> {

    public readonly program_ref: Ref<RenderStateProgram<T>> = new Ref();
    public readonly program_state_ref: Ref<RenderStateProgramState<T>> = new Ref();

    constructor(render_state: T, program: RenderStateProgram<T>, program_state: RenderStateProgramState<T>) {
        super(render_state);
        this.program_ref.value = program;
        this.program_state_ref.value = program_state;
    }

    public dispose(): void {
        this.program_ref.clear();
        this.program_state_ref.clear();
        this.render_state.delete_Pipeline(this);
    }
}