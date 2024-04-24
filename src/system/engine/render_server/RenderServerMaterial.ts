import { RenderDeviceObject } from "@/system/sliverofstraw/render_device/RenderDeviceObject";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { Ref } from "@/system/utils/RefCounted";
import type { RenderServerShader, RenderServerShaderPass } from "./RenderServerShader";
import { type RenderServerDevice } from "./RenderServer";
import { RenderStateUniformType } from "@/system/sliverofstraw/render_state/RenderState";
import { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";

type UniformValueType = number | Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4 | undefined;
type UniformType = Ref<WebGL2RenderStateTexture> | UniformValueType;
export type RenderServerMaterialUniforms = { [name: string]: RenderStateUniformType };

export enum RenderServerMaterialCullFace {
    Back, Front, None
}

export class RenderServerMaterial extends RenderDeviceObject<WebGL2RenderState> {
    private readonly shader_ref: Ref<RenderServerShader> = new Ref();
    private uniforms_map: Map<string, { type: RenderStateUniformType, value: UniformType }> = new Map();

    public transparent: boolean = false;
    public cull_face: RenderServerMaterialCullFace = RenderServerMaterialCullFace.Back;
    public polygon_offset: boolean = false;
    public polygon_offset_factor: number = 1.5;
    public polygon_offset_units: number = 1.5;

    public get shader() { return this.shader_ref.expect; }
    public get has_shader() { return !this.shader_ref.is_empty; }

    constructor(render_device: RenderServerDevice) {
        super(render_device);
    }

    private clear_UniformsMap() {
        for (const { type, value } of this.uniforms_map.values()) {
            if (type === RenderStateUniformType.Tex2D ||
                type === RenderStateUniformType.Tex3D ||
                type === RenderStateUniformType.Tex2DArray) {
                (value as Ref<WebGL2RenderStateTexture>).clear();
            }
        }
        this.uniforms_map.clear();
    }

    private clear_Material() {
        this.shader_ref.clear();
        this.clear_UniformsMap();
    }

    public set_Material(shader: RenderServerShader, uniforms: RenderServerMaterialUniforms) {
        this.shader_ref.value = shader;
        const uniform_override: Map<string, { type: RenderStateUniformType, value: UniformType | undefined }> = new Map();
        for (const [name, type] of Object.entries(uniforms)) {
            switch (type) {
                case RenderStateUniformType.Bool:
                case RenderStateUniformType.Uint:
                case RenderStateUniformType.Int:
                case RenderStateUniformType.Float:
                case RenderStateUniformType.Vector2:
                case RenderStateUniformType.Vector3:
                case RenderStateUniformType.Vector4:
                case RenderStateUniformType.Matrix3:
                case RenderStateUniformType.Matrix4: {
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
        this.clear_UniformsMap();
        this.uniforms_map = uniform_override;
    }

    public has_Uniform(uniform: string) {
        return this.uniforms_map.has(uniform);
    }

    public set_Uniform(uniform: string, value: boolean | number | Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4 | WebGL2RenderStateTexture | undefined): void {
        if (!this.has_Uniform(uniform)) return;
        const uniform_override = this.uniforms_map.get(uniform)!
        const type = uniform_override.type;
        switch (type) {
            case RenderStateUniformType.Bool:
            case RenderStateUniformType.Uint:
            case RenderStateUniformType.Int:
            case RenderStateUniformType.Float: {
                if (value !== undefined && typeof value !== "number") return;
                uniform_override.value = value;
                return;
            }
            case RenderStateUniformType.Vector2: {
                if (value !== undefined && !(value instanceof Vector2)) return;
                uniform_override.value = value;
                return;
            }
            case RenderStateUniformType.Vector3: {
                if (value !== undefined && !(value instanceof Vector3)) return;
                uniform_override.value = value;
                return;
            }
            case RenderStateUniformType.Vector4: {
                if (value !== undefined && !(value instanceof Vector4)) return;
                uniform_override.value = value;
                return;
            }
            case RenderStateUniformType.Matrix3: {
                if (value !== undefined && !(value instanceof Matrix3)) return;
                uniform_override.value = value;
                return;
            }
            case RenderStateUniformType.Matrix4: {
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

    public commit_AllUniforms(stage: RenderServerShaderPass) {
        if (!this.has_shader) return;
        const shader = this.shader_ref.expect;
        for (const [name, { type, value }] of this.uniforms_map.entries()) {
            switch (type) {
                case RenderStateUniformType.Bool:
                case RenderStateUniformType.Uint:
                case RenderStateUniformType.Int:
                case RenderStateUniformType.Float:
                case RenderStateUniformType.Vector2:
                case RenderStateUniformType.Vector3:
                case RenderStateUniformType.Vector4:
                case RenderStateUniformType.Matrix3:
                case RenderStateUniformType.Matrix4: {
                    shader.set_ValueUniform(stage, name, value as UniformValueType);
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