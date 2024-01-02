import { RenderDeviceObject } from "@/system/sliverofstraw/RenderDeviceObject";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { Ref } from "@/system/utils/RefCounted";
import type { RenderServerShader, RenderServerShaderPass } from "./RenderServerShader";
import { type RenderServerDevice } from "./RenderServer";
import { RenderStateUniformType } from "@/system/sliverofstraw/RenderState";
import { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";

type UniformOverrideValueType = number | Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4 | undefined;
type UniformOverrideType = Ref<WebGL2RenderStateTexture> | UniformOverrideValueType;
export type RenderServerMaterialUniforms = { [name: string]: RenderStateUniformType };

export enum RenderServerMaterialCullFace {
    Back, Front, None
}

export class RenderServerMaterial extends RenderDeviceObject<WebGL2RenderState> {
    private readonly shader_ref: Ref<RenderServerShader> = new Ref();
    private uniforms_override: Map<string, { type: RenderStateUniformType, value: UniformOverrideType }> = new Map();

    public transparent: boolean = false;
    public cull_face: RenderServerMaterialCullFace = RenderServerMaterialCullFace.Back;

    public get shader() { return this.shader_ref.expect; }
    public get has_shader() { return !this.shader_ref.is_empty; }

    constructor(render_device: RenderServerDevice) {
        super(render_device);
    }

    private clear_UniformOverride() {
        for (const { type, value } of this.uniforms_override.values()) {
            if (type === RenderStateUniformType.Tex2D ||
                type === RenderStateUniformType.Tex3D ||
                type === RenderStateUniformType.Tex2DArray) {
                (value as Ref<WebGL2RenderStateTexture>).clear();
            }
        }
        this.uniforms_override.clear();
    }

    private clear_Material() {
        this.shader_ref.clear();
        this.clear_UniformOverride();
    }

    public set_Material(shader: RenderServerShader, uniforms: RenderServerMaterialUniforms) {
        this.shader_ref.value = shader;
        const uniform_override: Map<string, { type: RenderStateUniformType, value: UniformOverrideType | undefined }> = new Map();
        for (const [name, type] of Object.entries(uniforms)) {
            switch (type) {
                case RenderStateUniformType.Uint:
                case RenderStateUniformType.Int:
                case RenderStateUniformType.Float:
                case RenderStateUniformType.Vec2:
                case RenderStateUniformType.Vec3:
                case RenderStateUniformType.Vec4:
                case RenderStateUniformType.Mat3:
                case RenderStateUniformType.Mat4: {
                    uniform_override.set(name, { type, value: undefined });
                    break;
                }
                case RenderStateUniformType.Tex2D:
                case RenderStateUniformType.Tex3D:
                case RenderStateUniformType.Tex2DArray: {
                    uniform_override.set(name, { type, value: new Ref() });
                    break;
                }
                default: {
                    const n: never = type;
                    break;
                }
            }
        }
        this.clear_UniformOverride();
        this.uniforms_override = uniform_override;
    }

    public set_UniformOverride(uniform: string, value: WebGL2RenderStateTexture | number | Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4 | undefined): void {
        if (!this.uniforms_override.has(uniform)) return;
        const uniform_override = this.uniforms_override.get(uniform)!
        const type = uniform_override.type;
        switch (type) {
            case RenderStateUniformType.Uint:
            case RenderStateUniformType.Int:
            case RenderStateUniformType.Float: {
                if (value !== undefined && typeof value !== "number") return;
                uniform_override.value = value;
                return;
            }
            case RenderStateUniformType.Vec2: {
                if (value !== undefined && !(value instanceof Vector2)) return;
                uniform_override.value = value;
                return;
            }
            case RenderStateUniformType.Vec3: {
                if (value !== undefined && !(value instanceof Vector3)) return;
                uniform_override.value = value;
                return;
            }
            case RenderStateUniformType.Vec4: {
                if (value !== undefined && !(value instanceof Vector4)) return;
                uniform_override.value = value;
                return;
            }
            case RenderStateUniformType.Mat3: {
                if (value !== undefined && !(value instanceof Matrix3)) return;
                uniform_override.value = value;
                return;
            }
            case RenderStateUniformType.Mat4: {
                if (value !== undefined && !(value instanceof Matrix4)) return;
                uniform_override.value = value;
                return;
            }
            case RenderStateUniformType.Tex2D:
            case RenderStateUniformType.Tex3D:
            case RenderStateUniformType.Tex2DArray: {
                if (value !== undefined && !(value instanceof WebGL2RenderStateTexture)) return;
                (uniform_override.value as Ref<WebGL2RenderStateTexture>).value = value;
                return;
            }
            default: {
                const n: never = type;
                break;
            }
        }
    }

    public commit_AllUniformOverride(stage: RenderServerShaderPass) {
        if (!this.has_shader) return;
        const shader = this.shader_ref.expect;
        for (const [name, { type, value }] of this.uniforms_override.entries()) {
            switch (type) {
                case RenderStateUniformType.Uint:
                case RenderStateUniformType.Int:
                case RenderStateUniformType.Float:
                case RenderStateUniformType.Vec2:
                case RenderStateUniformType.Vec3:
                case RenderStateUniformType.Vec4:
                case RenderStateUniformType.Mat3:
                case RenderStateUniformType.Mat4: {
                    shader.set_ValueUniform(stage, name, value as UniformOverrideValueType);
                    break;
                }
                case RenderStateUniformType.Tex2D:
                case RenderStateUniformType.Tex3D:
                case RenderStateUniformType.Tex2DArray: {
                    shader.set_TextureUniform(stage, name, (value as Ref<WebGL2RenderStateTexture>).value);
                    break;
                }
                default: {
                    const n: never = type;
                    break;
                }
            }
        }
        shader.commit_AllUniform(stage);
    }

    public get_Program(stage: RenderServerShaderPass) {
        return this.shader_ref.value?.get_Program(stage);
    }

    public dispose(): void {
        console.log(">>> dispose <RenderServerMaterial>");
        this.clear_Material();
    }
}