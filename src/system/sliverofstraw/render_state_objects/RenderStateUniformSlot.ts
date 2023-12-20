import { Ref } from "@/system/utils/RefCounted";
import type { RenderState, RenderStateTextureUniformType, RenderStateUniformVectorType, RenderStateUniformType } from "../RenderState";
import { RenderStateObject } from "../RenderStateObject";
import type { RenderStateProgram } from "./RenderStateProgram";
import type { RenderStateTexture, RenderStateTextureSampler } from "./RenderStateTexture";

export abstract class RenderStateUniformSlot<RS extends RenderState<RS>, VT extends RenderStateUniformType> extends RenderStateObject<RS> {
    protected readonly type: VT;

    protected readonly program_ref: Ref<RenderStateProgram<RS>> = new Ref();
    protected get program() { return this.program_ref.expect; }

    constructor(render_state: RS, program: RenderStateProgram<RS>, type: VT) {
        super(render_state);
        this.type = type;
        this.program_ref.value = program;
    }

    public abstract commit(): void;

    public dispose(): void {
        this.program_ref.clear();
    }
}

export abstract class RenderStateValueUniformSlot<
    RS extends RenderState<RS>,
    VT extends RenderStateUniformType,
    V,
    AT extends RenderStateUniformVectorType
> extends RenderStateUniformSlot<RS, VT>
{
    protected _value: V | undefined;
    protected default_value: V;

    protected changed: boolean = true;

    public get result(): V { return this.value ?? this.default_value; }

    public abstract get value(): V | undefined;
    public abstract set value(value: V | undefined);

    constructor(render_state: RS, program: RenderStateProgram<RS>, type: VT, default_value: V) {
        super(render_state, program, type);
        this.default_value = default_value;
    }
}

export abstract class RenderStateTextureUniformSlot<
    RS extends RenderState<RS>,
    VT extends RenderStateTextureUniformType,
    TT extends RenderStateTexture<RS>,
    ST extends RenderStateTextureSampler<RS>,
> extends RenderStateUniformSlot<RS, VT>
{
    protected _texture: Ref<TT> = new Ref();
    protected default_texture: Ref<TT> = new Ref();

    protected _sampler: Ref<ST> = new Ref();
    protected default_sampler: Ref<ST> = new Ref();

    protected changed: boolean = true;

    public get texture() { return this._texture.value ?? this.default_texture.value }
    public set texture(value: TT | undefined) {
        if (this._texture.value !== value) {
            this._texture.value = value;
            this.changed = true;
        }
    }

    public get sampler() { return this._sampler.value ?? this.default_sampler.value; }
    public set sampler(sampler: ST | undefined) {
        if (this._sampler.value !== sampler) {
            this._sampler.value = sampler;
            this.changed = true;
        }
    }

    constructor(render_state: RS, program: RenderStateProgram<RS>, type: VT, default_texture: TT | undefined, default_sampler: ST | undefined) {
        super(render_state, program, type);
        this.default_texture.value = default_texture;
        this.default_sampler.value = default_sampler;
    }

    public dispose(): void {
        this._texture.clear();
        this.default_texture.clear();
        this._sampler.clear();
        this.default_sampler.clear();
        super.dispose();
    }
}