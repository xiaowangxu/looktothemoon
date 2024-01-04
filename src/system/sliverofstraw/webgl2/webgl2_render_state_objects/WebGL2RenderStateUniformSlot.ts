import { type RenderStateUniformVectorType, RenderStateUniformType, type RenderStateTextureUniformType } from "../../RenderState";
import type { WebGL2RenderState } from "../WebGL2RenderState";
import type { WebGL2RenderStateProgram } from "./WebGL2RenderStateProgram";
import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import type { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { RenderStateTextureUniformSlot, RenderStateValueUniformSlot } from "../../render_state_objects/RenderStateUniformSlot";
import type { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { WebGL2RenderStateSampledTexture, type WebGL2RenderStateTexture, type WebGL2RenderStateTextureSampler } from "./WebGL2RenderStateTexture";
import { Ref } from "@/system/utils/RefCounted";

export abstract class WebGL2RenderStateValueUniformSlot<
    VT extends RenderStateUniformType,
    V,
    AT extends RenderStateUniformVectorType
> extends RenderStateValueUniformSlot<WebGL2RenderState, VT, V, AT>
{
    protected readonly location: WebGLUniformLocation;

    public abstract get value(): V | undefined;
    public abstract set value(value: V | undefined);

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, type: VT, location: WebGLUniformLocation, default_value: V) {
        super(render_state, program, type, default_value);
        this.location = location;
    }

    public commit(): void {
        if (this.changed) {
            this.render_state.set_ProgramUniform((this.program as WebGL2RenderStateProgram), this.location, this.type, this);
            this.changed = false;
        }
    }
}

// Uint, Int, Float, Vec2, Vec3, Vec4, Mat3, Mat4

export class WebGL2RenderStateUintUniformSlot extends WebGL2RenderStateValueUniformSlot<RenderStateUniformType.Uint, number, Uint32Array> {
    public get value() { return this._value; }
    public set value(value: number | undefined) {
        if (this._value !== value) {
            this._value = value;
            this.changed = true;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, default_value: number) {
        super(render_state, program, RenderStateUniformType.Uint, location, default_value);
    }
}

export class WebGL2RenderStateIntUniformSlot extends WebGL2RenderStateValueUniformSlot<RenderStateUniformType.Int, number, Int32Array> {
    public get value() { return this._value; }
    public set value(value: number | undefined) {
        if (this._value !== value) {
            this._value = value;
            this.changed = true;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, default_value: number) {
        super(render_state, program, RenderStateUniformType.Int, location, default_value);
    }
}

export class WebGL2RenderStateFloatUniformSlot extends WebGL2RenderStateValueUniformSlot<RenderStateUniformType.Float, number, Float32Array> {
    public get value() { return this._value; }
    public set value(value: number | undefined) {
        if (this._value !== value) {
            this._value = value;
            this.changed = true;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, default_value: number) {
        super(render_state, program, RenderStateUniformType.Float, location, default_value);
    }

    public get typed_array(): Float32Array { return new Float32Array([this._value ?? this.default_value]); }
}

export class WebGL2RenderStateVec2UniformSlot extends WebGL2RenderStateValueUniformSlot<RenderStateUniformType.Vec2, Vector2, Float32Array> {
    public get value() { return this._value; }
    public set value(value: Vector2 | undefined) {
        if (this._value === undefined) {
            if (value !== undefined) {
                this._value = value.clone();
                this.changed = true;
            }
        }
        else if (value === undefined) {
            this._value = undefined;
            this.changed = true;
        }
        else if (!this._value.equal(value)) {
            this._value.copy(value);
            this.changed = true;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, default_value: Vector2) {
        super(render_state, program, RenderStateUniformType.Vec2, location, default_value);
    }
}

export class WebGL2RenderStateVec3UniformSlot extends WebGL2RenderStateValueUniformSlot<RenderStateUniformType.Vec3, Vector3, Float32Array> {
    public get value() { return this._value; }
    public set value(value: Vector3 | undefined) {
        if (this._value === undefined) {
            if (value !== undefined) {
                this._value = value.clone();
                this.changed = true;
            }
        }
        else if (value === undefined) {
            this._value = undefined;
            this.changed = true;
        }
        else if (!this._value.equal(value)) {
            this._value.copy(value);
            this.changed = true;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, default_value: Vector3) {
        super(render_state, program, RenderStateUniformType.Vec3, location, default_value);
    }
}

export class WebGL2RenderStateVec4UniformSlot extends WebGL2RenderStateValueUniformSlot<RenderStateUniformType.Vec4, Vector4, Float32Array> {
    public get value() { return this._value; }
    public set value(value: Vector4 | undefined) {
        if (this._value === undefined) {
            if (value !== undefined) {
                this._value = value.clone();
                this.changed = true;
            }
        }
        else if (value === undefined) {
            this._value = undefined;
            this.changed = true;
        }
        else if (!this._value.equal(value)) {
            this._value.copy(value);
            this.changed = true;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, default_value: Vector4) {
        super(render_state, program, RenderStateUniformType.Vec4, location, default_value);
    }
}

export class WebGL2RenderStateMat3UniformSlot extends WebGL2RenderStateValueUniformSlot<RenderStateUniformType.Mat3, Matrix3, Float32Array> {
    public get value() { return this._value; }
    public set value(value: Matrix3 | undefined) {
        if (this._value === undefined) {
            if (value !== undefined) {
                this._value = value.clone();
                this.changed = true;
            }
        }
        else if (value === undefined) {
            this._value = undefined;
            this.changed = true;
        }
        else if (!this._value.equal(value)) {
            this._value.copy(value);
            this.changed = true;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, default_value: Matrix3) {
        super(render_state, program, RenderStateUniformType.Mat3, location, default_value);
    }
}

export class WebGL2RenderStateMat4UniformSlot extends WebGL2RenderStateValueUniformSlot<RenderStateUniformType.Mat4, Matrix4, Float32Array> {
    public get value() { return this._value; }
    public set value(value: Matrix4 | undefined) {
        if (this._value === undefined) {
            if (value !== undefined) {
                this._value = value.clone();
                this.changed = true;
            }
        }
        else if (value === undefined) {
            this._value = undefined;
            this.changed = true;
        }
        else if (!this._value.equal(value)) {
            this._value.copy(value);
            this.changed = true;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, default_value: Matrix4) {
        super(render_state, program, RenderStateUniformType.Mat4, location, default_value);
    }
}

// Tex2D, Tex2DArray, Tex3D

export class WebGL2RenderStateTextureUniformSlot extends RenderStateTextureUniformSlot<WebGL2RenderState, RenderStateTextureUniformType, WebGL2RenderStateTexture, WebGL2RenderStateTextureSampler>
{
    protected readonly location: WebGLUniformLocation;

    protected sampled_texture_ref: Ref<WebGL2RenderStateSampledTexture> = new Ref();
    protected sampled_texture_slot: number = 0;

    public get sampled_texture() { return this.sampled_texture_ref.expect; }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, type: RenderStateTextureUniformType, location: WebGLUniformLocation, default_texture: WebGL2RenderStateTexture | undefined, default_sampler: WebGL2RenderStateTextureSampler | undefined) {
        super(render_state, program, type, default_texture, default_sampler);
        this.location = location;
    }

    public commit(): void {
        if (this.changed || this.sampled_texture_ref.is_empty) {
            this.sampled_texture_ref.value = this.render_state.create_SampledTexture(this.texture, this.sampler);
        }
        const sampled_texture = this.sampled_texture_ref.expect;
        // check slot
        if (sampled_texture.slot === undefined || sampled_texture.slot !== this.sampled_texture_slot) {
            this.render_state.set_ProgramUniform((this.program as WebGL2RenderStateProgram), this.location, this.type, this);
            this.sampled_texture_slot = sampled_texture.slot!;
        }
        this.changed = false;
    }

    public dispose(): void {
        this.sampled_texture_ref.clear();
        super.dispose();
    }
}