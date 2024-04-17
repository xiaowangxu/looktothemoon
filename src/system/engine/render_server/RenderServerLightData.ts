import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { Ref } from "@/system/utils/RefCounted";
import { RenderServerDevice } from "./RenderServer";
import { RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType } from "@/system/sliverofstraw/RenderState";
import type { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { RenderDeviceObject } from "@/system/sliverofstraw/render_device_objects/RenderDeviceObject";

export enum RenderServerLightType {
    None = 0,
    AmbientLight = 1,
    DirectionalLight = 2,
    PointLight = 3,
    SpotLight = 4,
}

export class RenderServerLightsData extends RenderDeviceObject<WebGL2RenderState> {
    private readonly lights_texture_ref: Ref<WebGL2RenderStateTexture> = new Ref();

    public get lights_texture() { return this.lights_texture_ref.expect; }

    public readonly texture_width;
    public readonly texture_height;
    public readonly max_light_count;

    // lights data
    private static LightParamCount = 21;
    private readonly /*             */ lights_data: Uint32Array;
    private readonly /*              */ light_type: Uint32Array;
    private readonly /*             */ light_pos_x: Float32Array;
    private readonly /*             */ light_pos_y: Float32Array;
    private readonly /*             */ light_pos_z: Float32Array;
    private readonly /*             */ light_dir_x: Float32Array;
    private readonly /*             */ light_dir_y: Float32Array;
    private readonly /*             */ light_dir_z: Float32Array;
    private readonly /*           */ light_color_r: Float32Array;
    private readonly /*           */ light_color_g: Float32Array;
    private readonly /*           */ light_color_b: Float32Array;
    private readonly /*       */ light_attenuation: Float32Array;
    private readonly /*              */ light_mask: Uint32Array;
    private readonly /*           */ light_param_0: Float32Array;
    private readonly /*           */ light_param_1: Float32Array;
    private readonly /*           */ light_param_2: Float32Array;
    private readonly /*           */ light_param_3: Float32Array;
    private readonly /*       */ light_shadow_bias: Float32Array;
    private readonly /**/ light_shadow_normal_bias: Float32Array;
    private readonly /*    */ light_shadow_opacity: Float32Array;
    private readonly /*       */ light_data_stride: Uint32Array;
    private readonly /*         */ light_perserved: Uint32Array;

    private readonly light_proj_n11: Float32Array;
    private readonly light_proj_n34: Float32Array;
    private readonly light_rect_max_y: Float32Array;

    constructor(render_server: RenderServerDevice, width: number, height: number) {
        super(render_server);
        this.texture_width = width;
        this.texture_height = height;
        const max_light_count = this.max_light_count = this.texture_width * this.texture_height;
        // texture
        const texture = this.render_state.create_Texture(RenderStateTextureType.Tex2DArray, false, RenderStateTextureFormat.R32UI, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.lights_texture_ref.value = texture;
        this.render_state.alloc_Texture3D(texture, this.texture_width, this.texture_height, RenderServerLightsData.LightParamCount, 0, RenderStateTextureDataFormat.RInt);
        // data
        this.lights_data = new Uint32Array(max_light_count * RenderServerLightsData.LightParamCount);
        const light_layer_bytes = max_light_count * Uint32Array.BYTES_PER_ELEMENT;
        /*              */this.light_type = new Uint32Array(this.lights_data.buffer, light_layer_bytes * 0, max_light_count);
        /*             */this.light_pos_x = new Float32Array(this.lights_data.buffer, light_layer_bytes * 1, max_light_count);
        /*             */this.light_pos_y = new Float32Array(this.lights_data.buffer, light_layer_bytes * 2, max_light_count);
        /*             */this.light_pos_z = new Float32Array(this.lights_data.buffer, light_layer_bytes * 3, max_light_count);
        /*             */this.light_dir_x = new Float32Array(this.lights_data.buffer, light_layer_bytes * 4, max_light_count);
        /*             */this.light_dir_y = new Float32Array(this.lights_data.buffer, light_layer_bytes * 5, max_light_count);
        /*             */this.light_dir_z = new Float32Array(this.lights_data.buffer, light_layer_bytes * 6, max_light_count);
        /*           */this.light_color_r = new Float32Array(this.lights_data.buffer, light_layer_bytes * 7, max_light_count);
        /*           */this.light_color_g = new Float32Array(this.lights_data.buffer, light_layer_bytes * 8, max_light_count);
        /*           */this.light_color_b = new Float32Array(this.lights_data.buffer, light_layer_bytes * 9, max_light_count);
        /*       */this.light_attenuation = new Float32Array(this.lights_data.buffer, light_layer_bytes * 10, max_light_count);
        /*              */this.light_mask = new Uint32Array(this.lights_data.buffer, light_layer_bytes * 11, max_light_count);
        /*           */this.light_param_0 = new Float32Array(this.lights_data.buffer, light_layer_bytes * 12, max_light_count);
        /*           */this.light_param_1 = new Float32Array(this.lights_data.buffer, light_layer_bytes * 13, max_light_count);
        /*           */this.light_param_2 = new Float32Array(this.lights_data.buffer, light_layer_bytes * 14, max_light_count);
        /*           */this.light_param_3 = new Float32Array(this.lights_data.buffer, light_layer_bytes * 15, max_light_count);
        /*       */this.light_shadow_bias = new Float32Array(this.lights_data.buffer, light_layer_bytes * 16, max_light_count);
        /**/this.light_shadow_normal_bias = new Float32Array(this.lights_data.buffer, light_layer_bytes * 17, max_light_count);
        /*    */this.light_shadow_opacity = new Float32Array(this.lights_data.buffer, light_layer_bytes * 18, max_light_count);
        /*       */this.light_data_stride = new Uint32Array(this.lights_data.buffer, light_layer_bytes * 19, max_light_count);
        /*         */this.light_perserved = new Uint32Array(this.lights_data.buffer, light_layer_bytes * 20, max_light_count);
        this.light_proj_n11 = new Float32Array(this.lights_data.buffer, light_layer_bytes * 0, max_light_count);
        this.light_proj_n34 = new Float32Array(this.lights_data.buffer, light_layer_bytes * 11, max_light_count);
        this.light_rect_max_y = new Float32Array(this.lights_data.buffer, light_layer_bytes * 19, max_light_count);
        this.light_attenuation.fill(2);
        this.light_mask.fill(0xffffffff);
    }

    static readonly #index_array: [number, number] = [0, 0];

    private get_Index(id: number): [number, number] {
        RenderServerLightsData.#index_array[0] = id % this.texture_width;
        RenderServerLightsData.#index_array[1] = Math.floor(id / this.texture_width);
        return RenderServerLightsData.#index_array;
    }

    public clear_Lights() {
        this.light_type.fill(0);
    }

    public set_Light(id: number,
        type?: RenderServerLightType,
        position?: Vector3, direction?: Vector3, color?: Vector3, attenuation?: number,
        mask?: number,
        param_0?: number, param_1?: number, param_2?: number, param_3?: number,
        shadow_bias?: number, shadow_normal_bias?: number, shadow_opacity?: number,
        data_stride?: number,
    ) {
        if (id < 0 || id >= this.max_light_count) return;
        if (type !== undefined) {
            this.light_type[id] = type;
        }
        if (position !== undefined) {
            this.light_pos_x[id] = position.x;
            this.light_pos_y[id] = position.y;
            this.light_pos_z[id] = position.z;
        }
        if (direction !== undefined) {
            this.light_dir_x[id] = direction.x;
            this.light_dir_y[id] = direction.y;
            this.light_dir_z[id] = direction.z;
        }
        if (color !== undefined) {
            this.light_color_r[id] = color.x;
            this.light_color_g[id] = color.y;
            this.light_color_b[id] = color.z;
        }
        if (attenuation !== undefined)/*          */ this.light_attenuation[id] = attenuation;
        if (mask !== undefined)/*                 */ this.light_mask[id] = mask & 0xffffffff;
        if (param_0 !== undefined)/*              */ this.light_param_0[id] = param_0;
        if (param_1 !== undefined)/*              */ this.light_param_1[id] = param_1;
        if (param_2 !== undefined)/*              */ this.light_param_2[id] = param_2;
        if (param_3 !== undefined)/*              */ this.light_param_3[id] = param_3;
        if (shadow_bias !== undefined)/*          */ this.light_shadow_bias[id] = shadow_bias;
        if (shadow_normal_bias !== undefined)/*   */ this.light_shadow_normal_bias[id] = shadow_normal_bias;
        if (shadow_opacity !== undefined)/*       */ this.light_shadow_opacity[id] = shadow_opacity;
        if (data_stride !== undefined)/*       */ this.light_data_stride[id] = Math.max(0, Math.floor(data_stride));
    }

    public set_LightProjectionMatrixRegion(id: number, proj: Matrix4, min: Vector2, max: Vector2, layer: number) {
        if (id < 0 || id >= this.max_light_count) return;
        this.light_proj_n11[id] = proj.n11;
        this.light_pos_x[id] = proj.n12;
        this.light_pos_y[id] = proj.n13;
        this.light_pos_z[id] = proj.n14;
        this.light_dir_x[id] = proj.n21;
        this.light_dir_y[id] = proj.n22;
        this.light_dir_z[id] = proj.n23;
        this.light_color_r[id] = proj.n24;
        this.light_color_g[id] = proj.n31;
        this.light_color_b[id] = proj.n32;
        this.light_attenuation[id] = proj.n33;
        this.light_proj_n34[id] = proj.n34;
        this.light_param_0[id] = proj.n41;
        this.light_param_1[id] = proj.n42;
        this.light_param_2[id] = proj.n43;
        this.light_param_3[id] = proj.n44;
        this.light_shadow_bias[id] = min.x;
        this.light_shadow_normal_bias[id] = min.y;
        this.light_shadow_opacity[id] = max.x;
        this.light_rect_max_y[id] = max.y;
        this.light_perserved[id] = layer;
    }

    public commit_AllLightsData() {
        this.render_state.update_Texture3D(this.lights_texture, 0, RenderStateTextureDataFormat.RInt, this.lights_data, this.texture_width, this.texture_height, RenderServerLightsData.LightParamCount, 0, 0, 0);
    }

    public dispose() {
        this.lights_texture_ref.clear();
    }
}