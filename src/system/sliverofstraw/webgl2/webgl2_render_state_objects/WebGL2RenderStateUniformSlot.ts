import { RenderStateUniformType } from "../../RenderState";
import type { WebGL2RenderState } from "../WebGL2RenderState";
import type { WebGL2RenderStateProgram } from "./WebGL2RenderStateProgram";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { RenderStateTextureUniformSlot, RenderStateUniformSlot, RenderStateValueUniformSlot, type RenderStateTextureUniformType, type RenderStateUniformTypeMap } from "../../render_state_objects/RenderStateUniformSlot";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { WebGL2RenderStateSampledTexture, type WebGL2RenderStateTexture, type WebGL2RenderStateTextureSampler } from "./WebGL2RenderStateTexture";
import { Ref } from "@/system/utils/RefCounted";
import { Matrix2 } from "@/system/fivepebble/linear_algebra/Matrix2";

interface WebGL2RenderStateUniformSlotCommitable {
    commit(): void;
}

export type WebGL2RenderStateUniform<VT extends RenderStateUniformType = RenderStateUniformType> =
    VT extends RenderStateTextureUniformType ?
    RenderStateTextureUniformSlot<WebGL2RenderState, WebGL2RenderStateProgram, VT, WebGL2RenderStateTexture, WebGL2RenderStateTextureSampler> & WebGL2RenderStateUniformSlotCommitable :
    RenderStateValueUniformSlot<WebGL2RenderState, WebGL2RenderStateProgram, VT, RenderStateUniformTypeMap<WebGL2RenderState, VT>> & WebGL2RenderStateUniformSlotCommitable;

// Bool, Uint, Int, Float, Vec2, Vec3, Vec4, Mat3, Mat4

export class WebGL2RenderStateBoolUniformSlot extends RenderStateValueUniformSlot<WebGL2RenderState, WebGL2RenderStateProgram, RenderStateUniformType.Bool, boolean> implements WebGL2RenderStateUniformSlotCommitable {

    protected readonly location: WebGLUniformLocation;

    protected default_value: boolean;

    protected _value: boolean = false;
    public get value() { return this._value; }

    protected changed: boolean = true;

    public set_Value(value: boolean | undefined, commit: boolean = false): void {
        if (value === undefined) {
            if (this._value !== this.default_value) {
                this._value = this.default_value;
                this.changed = true;
            }
        }
        else if (this._value !== value) {
            this._value = value;
            this.changed = true;
        }
        if (commit) this.commit();
    }

    commit(): void {
        if (this.changed) {
            this.render_state.use_ProgramProxy(this.program.program);
            this.render_state.gl.uniform1ui(this.location, this._value ? 1 : 0);
            this.changed = false;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, name: string, default_value: boolean) {
        super(render_state, program, RenderStateUniformType.Bool, name);
        this.location = location;
        this.default_value = default_value;
        this._value = default_value;
    }
}

export class WebGL2RenderStateUintUniformSlot extends RenderStateValueUniformSlot<WebGL2RenderState, WebGL2RenderStateProgram, RenderStateUniformType.Uint, number> implements WebGL2RenderStateUniformSlotCommitable {

    protected readonly location: WebGLUniformLocation;

    protected default_value: number;

    protected _value: number = 0;
    public get value() { return this._value; }

    protected changed: boolean = true;

    public set_Value(value: number | undefined, commit: boolean = false): void {
        if (value === undefined) {
            if (this._value !== this.default_value) {
                this._value = this.default_value;
                this.changed = true;
            }
        }
        else if (this._value !== value) {
            this._value = value;
            this.changed = true;
        }
        if (commit) this.commit();
    }

    commit(): void {
        if (this.changed) {
            this.render_state.use_ProgramProxy(this.program.program);
            this.render_state.gl.uniform1ui(this.location, this._value);
            this.changed = false;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, name: string, default_value: number) {
        super(render_state, program, RenderStateUniformType.Uint, name);
        this.location = location;
        this.default_value = default_value;
        this._value = default_value;
    }
}

export class WebGL2RenderStateIntUniformSlot extends RenderStateValueUniformSlot<WebGL2RenderState, WebGL2RenderStateProgram, RenderStateUniformType.Int, number> implements WebGL2RenderStateUniformSlotCommitable {

    protected readonly location: WebGLUniformLocation;

    protected default_value: number;

    protected _value: number = 0;
    public get value() { return this._value; }

    protected changed: boolean = true;

    public set_Value(value: number | undefined, commit: boolean = false): void {
        if (value === undefined) {
            if (this._value !== this.default_value) {
                this._value = this.default_value;
                this.changed = true;
            }
        }
        else if (this._value !== value) {
            this._value = value;
            this.changed = true;
        }
        if (commit) this.commit();
    }

    commit(): void {
        if (this.changed) {
            this.render_state.use_ProgramProxy(this.program.program);
            this.render_state.gl.uniform1i(this.location, this._value);
            this.changed = false;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, name: string, default_value: number) {
        super(render_state, program, RenderStateUniformType.Int, name);
        this.location = location;
        this.default_value = default_value;
        this._value = default_value;
    }
}

export class WebGL2RenderStateFloatUniformSlot extends RenderStateValueUniformSlot<WebGL2RenderState, WebGL2RenderStateProgram, RenderStateUniformType.Float, number> implements WebGL2RenderStateUniformSlotCommitable {

    protected readonly location: WebGLUniformLocation;

    protected default_value: number;

    protected _value: number = 0;
    public get value() { return this._value; }

    protected changed: boolean = true;

    public set_Value(value: number | undefined, commit: boolean = false): void {
        if (value === undefined) {
            if (this._value !== this.default_value) {
                this._value = this.default_value;
                this.changed = true;
            }
        }
        else if (this._value !== value) {
            this._value = value;
            this.changed = true;
        }
        if (commit) this.commit();
    }

    commit(): void {
        if (this.changed) {
            this.render_state.use_ProgramProxy(this.program.program);
            this.render_state.gl.uniform1f(this.location, this._value);
            this.changed = false;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, name: string, default_value: number) {
        super(render_state, program, RenderStateUniformType.Float, name);
        this.location = location;
        this.default_value = default_value;
        this._value = default_value;
    }
}

export class WebGL2RenderStateVector2UniformSlot extends RenderStateValueUniformSlot<WebGL2RenderState, WebGL2RenderStateProgram, RenderStateUniformType.Vector2, Vector2> implements WebGL2RenderStateUniformSlotCommitable {

    protected readonly location: WebGLUniformLocation;

    protected default_value: Vector2 = new Vector2();

    protected _value: Vector2 = new Vector2();
    public get value() { return this._value.clone(); }

    protected changed: boolean = true;

    public set_Value(value: Vector2 | undefined, commit: boolean = false): void {
        if (value === undefined) {
            if (!this._value.equal(this.default_value)) {
                this._value.copy(this.default_value);
                this.changed = true;
            }
        }
        else if (!this._value.equal(value)) {
            this._value.copy(value);
            this.changed = true;
        }
        if (commit) this.commit();
    }

    commit(): void {
        if (this.changed) {
            this.render_state.use_ProgramProxy(this.program.program);
            this.render_state.gl.uniform2f(this.location, this._value.x, this._value.y);
            this.changed = false;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, name: string, default_value: Vector2) {
        super(render_state, program, RenderStateUniformType.Vector2, name);
        this.location = location;
        this.default_value.copy(default_value);
        this._value.copy(default_value);
    }
}

export class WebGL2RenderStateVector3UniformSlot extends RenderStateValueUniformSlot<WebGL2RenderState, WebGL2RenderStateProgram, RenderStateUniformType.Vector3, Vector3> implements WebGL2RenderStateUniformSlotCommitable {

    protected readonly location: WebGLUniformLocation;

    protected default_value: Vector3 = new Vector3();

    protected _value: Vector3 = new Vector3();
    public get value() { return this._value.clone(); }

    protected changed: boolean = true;

    public set_Value(value: Vector3 | undefined, commit: boolean = false): void {
        if (value === undefined) {
            if (!this._value.equal(this.default_value)) {
                this._value.copy(this.default_value);
                this.changed = true;
            }
        }
        else if (!this._value.equal(value)) {
            this._value.copy(value);
            this.changed = true;
        }
        if (commit) this.commit();
    }

    commit(): void {
        if (this.changed) {
            this.render_state.use_ProgramProxy(this.program.program);
            this.render_state.gl.uniform3f(this.location, this._value.x, this._value.y, this._value.z);
            this.changed = false;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, name: string, default_value: Vector3) {
        super(render_state, program, RenderStateUniformType.Vector3, name);
        this.location = location;
        this.default_value.copy(default_value);
        this._value.copy(default_value);
    }
}

export class WebGL2RenderStateVector4UniformSlot extends RenderStateValueUniformSlot<WebGL2RenderState, WebGL2RenderStateProgram, RenderStateUniformType.Vector4, Vector4> implements WebGL2RenderStateUniformSlotCommitable {

    protected readonly location: WebGLUniformLocation;

    protected default_value: Vector4 = new Vector4();

    protected _value: Vector4 = new Vector4();
    public get value() { return this._value.clone(); }

    protected changed: boolean = true;

    public set_Value(value: Vector4 | undefined, commit: boolean = false): void {
        if (value === undefined) {
            if (!this._value.equal(this.default_value)) {
                this._value.copy(this.default_value);
                this.changed = true;
            }
        }
        else if (!this._value.equal(value)) {
            this._value.copy(value);
            this.changed = true;
        }
        if (commit) this.commit();
    }

    commit(): void {
        if (this.changed) {
            this.render_state.use_ProgramProxy(this.program.program);
            this.render_state.gl.uniform4f(this.location, this._value.x, this._value.y, this._value.z, this._value.w);
            this.changed = false;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, name: string, default_value: Vector4) {
        super(render_state, program, RenderStateUniformType.Vector4, name);
        this.location = location;
        this.default_value.copy(default_value);
        this._value.copy(default_value);
    }
}

export class WebGL2RenderStateMatrix2UniformSlot extends RenderStateValueUniformSlot<WebGL2RenderState, WebGL2RenderStateProgram, RenderStateUniformType.Matrix2, Matrix2> implements WebGL2RenderStateUniformSlotCommitable {

    static #tmp_float32array_0 = new Float32Array(4);

    protected default_value: Matrix2 = new Matrix2();

    protected readonly location: WebGLUniformLocation;

    protected _value: Matrix2 = new Matrix2();
    public get value() { return this._value.clone(); }

    protected changed: boolean = true;

    public set_Value(value: Matrix2 | undefined, commit: boolean = false): void {
        if (value === undefined) {
            if (!this._value.equal(this.default_value)) {
                this._value.copy(this.default_value);
                this.changed = true;
            }
        }
        else if (!this._value.equal(value)) {
            this._value.copy(value);
            this.changed = true;
        }
        if (commit) this.commit();
    }

    commit(): void {
        if (this.changed) {
            const float32array = WebGL2RenderStateMatrix2UniformSlot.#tmp_float32array_0;
            float32array[0] = this._value.n11;
            float32array[1] = this._value.n21;
            float32array[2] = this._value.n12;
            float32array[3] = this._value.n22;
            this.render_state.use_ProgramProxy(this.program.program);
            this.render_state.gl.uniformMatrix2fv(this.location, false, float32array);
            this.changed = false;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, name: string, default_value: Matrix2) {
        super(render_state, program, RenderStateUniformType.Matrix2, name);
        this.location = location;
        this.default_value.copy(default_value);
        this._value.copy(default_value);
    }
}

export class WebGL2RenderStateMatrix3UniformSlot extends RenderStateValueUniformSlot<WebGL2RenderState, WebGL2RenderStateProgram, RenderStateUniformType.Matrix3, Matrix3> implements WebGL2RenderStateUniformSlotCommitable {

    static #tmp_float32array_0 = new Float32Array(9);

    protected default_value: Matrix3 = new Matrix3();

    protected readonly location: WebGLUniformLocation;

    protected _value: Matrix3 = new Matrix3();
    public get value() { return this._value.clone(); }

    protected changed: boolean = true;

    public set_Value(value: Matrix3 | undefined, commit: boolean = false): void {
        if (value === undefined) {
            if (!this._value.equal(this.default_value)) {
                this._value.copy(this.default_value);
                this.changed = true;
            }
        }
        else if (!this._value.equal(value)) {
            this._value.copy(value);
            this.changed = true;
        }
        if (commit) this.commit();
    }

    commit(): void {
        if (this.changed) {
            const float32array = WebGL2RenderStateMatrix3UniformSlot.#tmp_float32array_0;
            float32array[0] = this._value.n11;
            float32array[1] = this._value.n21;
            float32array[2] = this._value.n31;
            float32array[3] = this._value.n12;
            float32array[4] = this._value.n22;
            float32array[5] = this._value.n32;
            float32array[6] = this._value.n13;
            float32array[7] = this._value.n23;
            float32array[8] = this._value.n33;
            this.render_state.use_ProgramProxy(this.program.program);
            this.render_state.gl.uniformMatrix3fv(this.location, false, float32array);
            this.changed = false;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, name: string, default_value: Matrix3) {
        super(render_state, program, RenderStateUniformType.Matrix3, name);
        this.location = location;
        this.default_value.copy(default_value);
        this._value.copy(default_value);
    }
}

export class WebGL2RenderStateMatrix4UniformSlot extends RenderStateValueUniformSlot<WebGL2RenderState, WebGL2RenderStateProgram, RenderStateUniformType.Matrix4, Matrix4> implements WebGL2RenderStateUniformSlotCommitable {

    static #tmp_float32array_0 = new Float32Array(16);

    protected default_value: Matrix4 = new Matrix4();

    protected readonly location: WebGLUniformLocation;

    protected _value: Matrix4 = new Matrix4();
    public get value() { return this._value.clone(); }

    protected changed: boolean = true;

    public set_Value(value: Matrix4 | undefined, commit: boolean = false): void {
        if (value === undefined) {
            if (!this._value.equal(this.default_value)) {
                this._value.copy(this.default_value);
                this.changed = true;
            }
        }
        else if (!this._value.equal(value)) {
            this._value.copy(value);
            this.changed = true;
        }
        if (commit) this.commit();
    }

    commit(): void {
        if (this.changed) {
            const float32array = WebGL2RenderStateMatrix4UniformSlot.#tmp_float32array_0;
            float32array[0] = this._value.n11;
            float32array[1] = this._value.n21;
            float32array[2] = this._value.n31;
            float32array[3] = this._value.n41;
            float32array[4] = this._value.n12;
            float32array[5] = this._value.n22;
            float32array[6] = this._value.n32;
            float32array[7] = this._value.n42;
            float32array[8] = this._value.n13;
            float32array[9] = this._value.n23;
            float32array[10] = this._value.n33;
            float32array[11] = this._value.n43;
            float32array[12] = this._value.n14;
            float32array[13] = this._value.n24;
            float32array[14] = this._value.n34;
            float32array[15] = this._value.n44;
            this.render_state.use_ProgramProxy(this.program.program);
            this.render_state.gl.uniformMatrix4fv(this.location, false, float32array);
            this.changed = false;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, location: WebGLUniformLocation, name: string, default_value: Matrix4) {
        super(render_state, program, RenderStateUniformType.Matrix4, name);
        this.location = location;
        this.default_value.copy(default_value);
        this._value.copy(default_value);
    }
}

// Tex2D, Tex2DArray, Tex3D

export class WebGL2RenderStateTextureUniformSlot extends RenderStateTextureUniformSlot<WebGL2RenderState, WebGL2RenderStateProgram, RenderStateTextureUniformType, WebGL2RenderStateTexture, WebGL2RenderStateTextureSampler> implements WebGL2RenderStateUniformSlotCommitable {

    protected readonly location: WebGLUniformLocation;

    protected _default_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    protected get default_texture() { return this._default_texture.value; }
    protected _texture: Ref<WebGL2RenderStateTexture> = new Ref();
    public get texture() { return this._texture.value; }

    protected _default_sampler: Ref<WebGL2RenderStateTextureSampler> = new Ref();
    protected get default_sampler() { return this._default_sampler.value; }
    protected _sampler: Ref<WebGL2RenderStateTextureSampler> = new Ref();
    public get sampler() { return this._sampler.value; }

    protected sampled_texture: Ref<WebGL2RenderStateSampledTexture> = new Ref();
    protected sampled_texture_slot: number = 0;

    protected changed: boolean = true;

    public set_Texture(value: WebGL2RenderStateTexture | undefined, commit: boolean = false): void {
        if (value === undefined) {
            if (this.texture !== this.default_texture) {
                this._texture.value = this.default_texture;
                this.changed = true;
            }
        }
        else if (this.texture !== value) {
            this._texture.value = value;
            this.changed = true;
        }
        if (commit) this.commit();
    }

    public set_Sampler(value: WebGL2RenderStateTextureSampler | undefined, commit: boolean = false): void {
        if (value === undefined) {
            if (this.sampler !== this.default_sampler) {
                this._sampler.value = this.default_sampler;
                this.changed = true;
            }
        }
        else if (this.sampler !== value) {
            this._sampler.value = value;
            this.changed = true;
        }
        if (commit) this.commit();
    }

    commit(): void {
        if (this.changed || this.sampled_texture.is_empty) {
            this.sampled_texture.value = this.render_state.create_SampledTexture(this.texture, this.sampler);
        }
        this.changed = false;
        const sampled_texture = this.sampled_texture.expect;
        // check slot
        if (sampled_texture.slot === undefined || sampled_texture.slot !== this.sampled_texture_slot) {
            const slot = this.render_state.get_SampledTextureSlot(sampled_texture);
            this.render_state.use_ProgramProxy(this.program.program);
            this.render_state.gl.uniform1i(this.location, slot);
            this.sampled_texture_slot = sampled_texture.slot!;
        }
    }

    constructor(render_state: WebGL2RenderState, program: WebGL2RenderStateProgram, type: RenderStateTextureUniformType, location: WebGLUniformLocation, name: string, default_value: { texture: WebGL2RenderStateTexture | undefined, sampler: WebGL2RenderStateTextureSampler | undefined }) {
        super(render_state, program, type, name);
        this.location = location;
        this._default_texture.value = default_value.texture;
        this._default_sampler.value = default_value.sampler;
    }

    public dispose(): void {
        this._default_texture.clear();
        this._default_sampler.clear();
        this._texture.clear();
        this._sampler.clear();
        this.sampled_texture.clear();
        super.dispose();
    }
}