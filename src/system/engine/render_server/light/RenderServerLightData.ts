import { WebGPURenderState } from "@/system/sliverofstraw/WebGPURenderState";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage, type WebGPURenderStateBuffer } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderStateBufferUniformType } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { ReadonlyRef } from "@/system/utils/RefCounted";
import type { Disposable } from "@/system/utils/Type";
import { RenderServer } from "../RenderServer";
import type { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import type { Color } from "@/system/fivepebble/graphics/Color";
import { bitmask_bitset, bitmask_enable, bitmask_get, bitmask_set, bitmask_test } from "@/system/utils/BitMask";
import { clamp } from "@/system/fivepebble/Scalar";

export enum RenderServerLightType {
    Ambient,
    Directional,
    Spot,
    Point,
}

/**
 * LightData different in each VisualWorld3D
 */
export class RenderServerLightData implements Disposable {

    static LightDataUniformMemoryLayout = WebGPURenderState.RenderStateMemoryLayout({
        type: 'struct',
        members: [
            // position vec3
            WebGPURenderStateBufferUniformType.Vector4,
            // direction vec3, attenuation f32
            WebGPURenderStateBufferUniformType.Vector4,
            // color vec3
            WebGPURenderStateBufferUniformType.Vector3,
            // layer u32
            WebGPURenderStateBufferUniformType.Uint,
            // mask u32
            WebGPURenderStateBufferUniformType.Uint,
            // visible bool, render queue
            // u32 00000000 00000000 00000000 00000000
            //     ^ visible         |queue-| |-type-|
            WebGPURenderStateBufferUniformType.Uint,
            // shadows
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            // params vec4f
            WebGPURenderStateBufferUniformType.Vector4,
        ]
    } as const);

    static readonly #const_light_data_32_element_count = RenderServerLightData.LightDataUniformMemoryLayout.size / 4;

    public readonly capcity: number;
    public length: number = 0;
    public readonly light_data_buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;
    public readonly light_data_array_buffer: ArrayBuffer;
    public readonly light_count_buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;
    public readonly light_count_array_buffer: ArrayBuffer;

    protected data_changed: boolean = true;
    protected length_changed: boolean = true;

    constructor(capcity: number = 1024) {
        this.capcity = capcity;
        this.light_data_buffer_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform | WebGPURenderStateBufferType.Storage, WebGPURenderStateBufferUsage.CopyDst, RenderServerLightData.LightDataUniformMemoryLayout.size * this.capcity).expect());
        this.light_data_array_buffer = new ArrayBuffer(this.light_data_buffer_ref.expect.length);
        this.light_count_buffer_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, 4).expect());
        this.light_count_array_buffer = new ArrayBuffer(this.light_count_buffer_ref.expect.length);
    }

    public set_Length(length: number) {
        length = clamp(length, 0, this.capcity);
        if (this.length !== length) {
            this.length = length;
            const uint_array = new Uint32Array(this.light_count_array_buffer);
            uint_array[0] = this.length;
            this.length_changed = true;
        }
    }

    public set_Data(
        index: number, type: RenderServerLightType,
        position: Vector3, direction: Vector3, attenuation: number, color: Color,
        layer: number, mask: number, visible: boolean, render_queue: number,
        shadow_0: number = 0, shadow_1: number = 0, shadow_2: number = 0, shadow_3: number = 0, shadow_4: number = 0, shadow_5: number = 0,
        param_0: number = 0, param_1: number = 0, param_2: number = 0, param_3: number = 0,
    ) {
        if (index >= this.length) return;

        const float_array = new Float32Array(this.light_data_array_buffer, index * RenderServerLightData.LightDataUniformMemoryLayout.size, RenderServerLightData.#const_light_data_32_element_count);
        const uint_array = new Uint32Array(this.light_data_array_buffer, index * RenderServerLightData.LightDataUniformMemoryLayout.size, RenderServerLightData.#const_light_data_32_element_count);

        // position vec3
        float_array[0] = position.x;
        float_array[1] = position.y;
        float_array[2] = position.z;
        // direction vec3, attenuation f32
        float_array[3] = direction.x;
        float_array[4] = direction.y;
        float_array[5] = direction.z;
        float_array[6] = attenuation;
        // color vec3, preserved f32
        float_array[7] = color.r;
        float_array[8] = color.g;
        float_array[9] = color.b;
        float_array[10] = color.a;
        // layer u32
        uint_array[11] = layer;
        // mask u32
        uint_array[12] = mask;
        // visible bool, render queue 8bit number 
        const bitmask = bitmask_bitset(bitmask_set(bitmask_set(0, type, 0, 8), render_queue, 8, 8), 31, visible);
        uint_array[13] = bitmask;
        // console.log("type", bitmask_get(bitmask, 0, 8));
        // console.log("queue", bitmask_get(bitmask, 8, 8));
        // console.log("visible", bitmask_test(bitmask, 31));

        // shadows
        uint_array[14] = shadow_0;
        uint_array[15] = shadow_1;
        uint_array[16] = shadow_2;
        uint_array[17] = shadow_3;
        uint_array[18] = shadow_4;
        uint_array[19] = shadow_5;
        // params
        float_array[20] = param_0;
        float_array[21] = param_1;
        float_array[22] = param_2;
        float_array[23] = param_3;

        this.data_changed = true;
    }

    public commit(force: boolean = false) {
        if (force || this.data_changed) {
            if (this.length > 0) {
                this.light_data_buffer_ref.expect.update_Data(0, this.light_data_array_buffer, 0, this.length * RenderServerLightData.LightDataUniformMemoryLayout.size);
            }
            this.data_changed = false;
        }
        if (force || this.length_changed) {
            this.light_count_buffer_ref.expect.update_Data(0, this.light_count_array_buffer);
            this.length_changed = false;
        }
    }

    public dispose(): void {
        this.light_data_buffer_ref.clear();
        this.light_count_buffer_ref.clear();
    }
}