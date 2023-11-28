import { Ref, RefArray } from "@/system/utils/RefCounted";
import { RenderDeviceObject } from "../RenderDeviceObject";
import type { RenderState } from "../RenderState";
import type { RenderStateProgram } from "../render_state_objects/RenderStateProgram";
import type { RenderDevice } from "../RenderDevice";
import type { RenderStateShader } from "../render_state_objects/RenderStateShader";

type ProgramMap<T extends RenderState<T>, Program extends RenderStateProgram<T>> = Map<string, Ref<Program>>;

export abstract class RenderDeviceMaterialSet<
    T extends RenderState<T>,
    Program extends RenderStateProgram<T> = RenderStateProgram<T>,
    Shader extends RenderStateShader<T> = RenderStateShader<T>,
>
    extends RenderDeviceObject<T>
{
    protected programs_ref: ProgramMap<T, Program> = new Map();

    protected set_Shaders(vertex: Shader, fragments_set: { [name: string]: Shader }) {
        const map: ProgramMap<T, Program> = new Map();
        for (const [name, fragment] of Object.entries(fragments_set)) {
            map.set(name, new Ref(this.render_state.create_Program(vertex, fragment).expect() as Program));
        }
        this.clear_Programs();
        this.programs_ref = map;
    }

    constructor(render_device: RenderDevice<T>, vertex: Shader, fragments_set: { [name: string]: Shader }) {
        super(render_device);
        this.set_Shaders(vertex, fragments_set);
    }

    public has_Program(name: string) {
        return this.programs_ref.has(name);
    }

    public get_Program(name: string) {
        return this.programs_ref.get(name)?.value;
    }

    private clear_Programs() {
        for (const program_ref of this.programs_ref.values()) {
            program_ref.clear();
        }
        this.programs_ref.clear();
    }

    public dispose(): void {
        console.log(">>> dispose <RenderDeviceMaterialSet>");
        this.clear_Programs();
    }
}