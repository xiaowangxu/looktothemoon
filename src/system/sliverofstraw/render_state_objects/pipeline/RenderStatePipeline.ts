import { Ref } from "@/system/utils/RefCounted";
import type { RenderState } from "../../RenderState";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderStateProgram } from "./RenderStateProgram";
import type { RenderStateProgramState } from "./RenderStateProgramState";

export abstract class RenderStatePipeline<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public readonly program_ref: Ref<RenderStateProgram<T>> = new Ref();
    public readonly program_state: RenderStateProgramState<T>;

    constructor(render_state: T, program: RenderStateProgram<T>, program_state: RenderStateProgramState<T>) {
        super(render_state);
        this.program_ref.value = program;
        this.program_state = program_state;
    }

    public dispose(): void {
        this.program_ref.clear();
        this.render_state.delete_Pipeline(this);
    }
}