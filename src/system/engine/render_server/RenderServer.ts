import { RenderDevice, type RenderDeviceCanvas, type RenderDeviceInitOption } from "@/system/sliverofstraw/render_device/RenderDevice";
import { RenderStateBufferType, RenderStateBufferUsage, RenderStateDataType, RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType } from "@/system/sliverofstraw/render_state_objects/RenderState";
import type { WebGL2RenderStateBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateBuffer";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { Ref } from "@/system/utils/RefCounted";
import { RenderServerLightsData } from "./RenderServerLightData";
import { RenderServerGeometry } from "./RenderServerGeometry";
import { RenderServerShader } from "./RenderServerShader";
import { RenderServerMaterial } from "./RenderServerMaterial";
import { RenderDeviceMatrix4AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { WebGL2RenderState, type WebGL2RenderStateInitOption } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import type { Color } from "@/system/fivepebble/graphics/Color";
import type { WebGL2RenderStateProgram } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateProgram";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";

export enum RenderServerPlainColorTexture { Empty, White, Black, Transparent, Grey }

export class RenderServerDevice extends RenderDevice<WebGL2RenderState, WebGL2RenderStateInitOption> {

    static readonly #tmp_matrix4_0: Matrix4 = Matrix4.new;
    static readonly #tmp_matrix3_0: Matrix3 = Matrix3.new;

    // Codes
    public static readonly WorldUniformsCode = `layout(std140) uniform WorldUniforms {
    mat4 CAMERA_WORLD;
    mat4 CAMERA_VIEW;
    mat4 CAMERA_PROJECTION;
    mat4 CAMERA_INV_PROJECTION;
    mat3 CAMERA_NORMAL_VIEW;

    // screen size in renderer, the render_server_scale is transparent, so changing render_server_scale will not affect screen_size
    // for logic screen_size use (screen_size / pixel_ratio)
    vec2 SCREEN_SIZE;

    float TIME;
    bool CAMERA_IS_ORTH;

    // pixel_ratio is raw pixel_ratio * render_scale
    float PIXEL_RATIO;
    
    // paddings
    float _world_preserved_0;
    float _world_preserved_1;
    float _world_preserved_2;
};

layout(std140) uniform EnvironmentUniforms {
    vec4 BACKGROUND_COLOR;
    bool USE_SKY;

    // paddings
    float _env_preserved_0;
    float _env_preserved_1;
    float _env_preserved_2;
};`;

    // texture layout
    //   |-------|-------|-------|-------|-------|-------|-------|-------|
    //   |   0   |   1   |   2   |   3   |   4   |   5   |   6   |   7   |
    //   |-------|-------|-------|-------|-------|-------|-------|-------|
    //   |       |       | light | l_cls |shadow |  sky  | envgi |       |
    //   |-------|-------|-------|-------|-------|-------|-------|-------|
    //   |   8   |   9   |   10  |   11  |   12  |   13  |   14  |   15  |
    //   |-------|-------|-------|-------|-------|-------|-------|-------|
    //   |  pres |  pres |  pres |  pres |  pres |  pres |  pres |  pres |
    //   |-------|-------|-------|-------|-------|-------|-------|-------|

    public static readonly LightsTextureUnit: number = 2;
    public static readonly LightsClusterTextureUnit: number = 3;
    public static readonly ShadowsTextureUnit: number = 4;
    public static readonly SkyTextureUnit: number = 5;
    public static readonly EnvironmentGITextureUnit: number = 6;

    public static readonly WorldUniformsName: string = 'WorldUniforms';
    public static readonly WorldUniformsUnit: number = 0;

    public static readonly EnvironmentUniformsName: string = 'EnvironmentUniforms';
    public static readonly EnvironmentUniformsUnit: number = 1;

    // Uniforms Uniforms layout std140
    // 
    //   |-------------|-------------|-------------|-------------|
    //   |    Byte4    |    Byte8    |    Byte12   |    Byte16   |
    //   |-------------|-------------|-------------|-------------| ---- 0 Bytes ------+
    //   |  cam_world  |             |             |             |                    |
    //   |      0      |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------|                    |
    //   |             |             |             |             |                    |  64 Bytes
    //   |-------------|-------------|-------------|-------------|                    |
    //   |             |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------|                    |
    //   |             |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------| ---- 64 Bytes  ----+
    //   |   cam_view  |             |             |             |                    |
    //   |      64     |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------|                    |
    //   |             |             |             |             |                    |  64 Bytes
    //   |-------------|-------------|-------------|-------------|                    |
    //   |             |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------|                    |
    //   |             |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------| ---- 128 Bytes ----+
    //   |   cam_proj  |             |             |             |                    |
    //   |     128     |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------|                    |
    //   |             |             |             |             |                    |  64 Bytes
    //   |-------------|-------------|-------------|-------------|                    |
    //   |             |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------|                    |
    //   |             |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------| ---- 192 Bytes ----+
    //   |   inv_proj  |             |             |             |                    |
    //   |     192     |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------|                    |
    //   |             |             |             |             |                    |  64 Bytes
    //   |-------------|-------------|-------------|-------------|                    |
    //   |             |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------|                    |
    //   |             |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------| ---- 256 Bytes ----+
    //   | cam_norview |             |             |      /      |                    |
    //   |     256     |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------|                    |  48 Bytes
    //   |             |             |             |      /      |                    |
    //   |-------------|-------------|-------------|-------------|                    |
    //   |             |             |             |      /      |                    |  
    //   |-------------|-------------|-------------|-------------| ---- 304 Bytes ----+
    //   | screen_size |             |     time    |  orthogonal |                    |  16 Bytes
    //   |     304     |             |     312     |     316     |                    |
    //   |-------------|-------------|-------------|-------------| ---- 320 Bytes ----+
    //   | pixel_ratio |      /      |      /      |      /      |                    |  16 Bytes
    //   |     320     |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------| ---- 336 Bytes ----+
    //                                                           ^
    //                                                           | 336 Bytes
    //   total 336 Bytes => 84 * 4 float32s

    private world_uniforms_buffer_ref: Ref<WebGL2RenderStateBuffer> = new Ref();

    private readonly world_uniforms_buffer_data: Float32Array = new Float32Array(84);

    private readonly world_uniforms_camera_world: Float32Array = new Float32Array(this.world_uniforms_buffer_data.buffer, 0, 16);
    private readonly world_uniforms_camera_view: Float32Array = new Float32Array(this.world_uniforms_buffer_data.buffer, 64, 16);
    private readonly world_uniforms_camera_projection: Float32Array = new Float32Array(this.world_uniforms_buffer_data.buffer, 128, 16);
    private readonly world_uniforms_camera_inv_projection: Float32Array = new Float32Array(this.world_uniforms_buffer_data.buffer, 192, 16);
    private readonly world_uniforms_camera_normal_view: Float32Array = new Float32Array(this.world_uniforms_buffer_data.buffer, 256, 16);
    private readonly world_uniforms_screen_size: Float32Array = new Float32Array(this.world_uniforms_buffer_data.buffer, 304, 2);
    private readonly world_uniforms_time: Float32Array = new Float32Array(this.world_uniforms_buffer_data.buffer, 312, 1);
    private readonly world_uniforms_camera_is_orthogonal: Uint32Array = new Uint32Array(this.world_uniforms_buffer_data.buffer, 316, 1);
    private readonly world_uniforms_pixel_ratio: Float32Array = new Float32Array(this.world_uniforms_buffer_data.buffer, 320, 1);

    // Environment Uniforms layout std140
    // 
    //   |-------------|-------------|-------------|-------------|
    //   |    Byte4    |    Byte8    |    Byte12   |    Byte16   |
    //   |-------------|-------------|-------------|-------------| ---- 0 Bytes ------+
    //   |   bg_color  |             |             |             |                    |  16 Bytes
    //   |     288     |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------| ---- 16 Bytes ----+
    //   |   use_sky   |      /      |      /      |      /      |                    |  16 Bytes
    //   |     304     |      /      |      /      |      /      |                    |
    //   |-------------|-------------|-------------|-------------| ---- 32 Bytes ----+
    //                                                           ^
    //                                                           | 32 Bytes
    //   
    //   total 32 Bytes => 8 * 4 float32s

    private env_uniforms_buffer_ref: Ref<WebGL2RenderStateBuffer> = new Ref();

    private readonly env_uniforms_buffer_data: Float32Array = new Float32Array(8);

    private readonly env_uniforms_background_color: Float32Array = new Float32Array(this.env_uniforms_buffer_data.buffer, 0, 4);
    private readonly env_uniforms_use_sky: Uint32Array = new Uint32Array(this.env_uniforms_buffer_data.buffer, 16, 1);

    // default values

    public readonly identity_transform_attribute_buffer_ref: Ref<RenderDeviceMatrix4AttributeBuffer<WebGL2RenderState>> = new Ref();
    public get identity_transform_attribute_buffer() { return this.identity_transform_attribute_buffer_ref.expect; }

    public readonly plain_color_textures = {
        empty: new Ref<WebGL2RenderStateTexture>(),
        white: new Ref<WebGL2RenderStateTexture>(),
        black: new Ref<WebGL2RenderStateTexture>(),
        transparent: new Ref<WebGL2RenderStateTexture>(),
        grey: new Ref<WebGL2RenderStateTexture>(),
    }

    // Render Data

    public readonly lights_data_ref: Ref<RenderServerLightsData> = new Ref();
    public readonly shadows_texture_ref: Ref<WebGL2RenderStateTexture> = new Ref();

    public readonly sky_texture_ref: Ref<WebGL2RenderStateTexture> = new Ref();

    constructor(canvas: RenderDeviceCanvas) {
        super(canvas, WebGL2RenderState, { preserve_texture_count: 8, texture_slot_base: 3, default_texture_slot: 3, canvas_antialias: false, canvas_preserve_drawing_buffer: true });
        if (this.render_state.user_texture_slot_count < 8) throw new Error('<RenderServerDevice> constructor: not enough user texture slot');
        this.setup_IdentityTransformAttributeBuffer();
        this.setup_WorldUniformsBuffer();
        this.setup_EnvironmentUniformsBuffer();
        this.setup_PlainColorTextures();
    }

    // Setup

    private setup_IdentityTransformAttributeBuffer() {
        this.identity_transform_attribute_buffer_ref.value = new RenderDeviceMatrix4AttributeBuffer(this, RenderStateBufferUsage.StaticDraw, [Matrix4.new], 1);
    }

    private setup_WorldUniformsBuffer() {
        this.world_uniforms_buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Uniform, RenderStateBufferUsage.DynamicDraw, 1, RenderStateDataType.Float, false, 0).expect();
        this.render_state.alloc_Buffer(this.world_uniforms_buffer_ref.expect, this.world_uniforms_buffer_data.byteLength);
        this.render_state.bind_UniformBuffer(this.world_uniforms_buffer_ref.expect, RenderServerDevice.WorldUniformsUnit);
    }

    private setup_EnvironmentUniformsBuffer() {
        this.env_uniforms_buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Uniform, RenderStateBufferUsage.DynamicDraw, 1, RenderStateDataType.Float, false, 0).expect();
        this.render_state.alloc_Buffer(this.env_uniforms_buffer_ref.expect, this.env_uniforms_buffer_data.byteLength);
        this.render_state.bind_UniformBuffer(this.env_uniforms_buffer_ref.expect, RenderServerDevice.EnvironmentUniformsUnit);
    }

    public setup_ProgramUniformBlocks(program: WebGL2RenderStateProgram) {
        // World Uniforms
        const world_location = this.render_state.get_ProgramUniformBlockLocation(program, RenderServerDevice.WorldUniformsName);
        if (world_location >= 0) {
            this.render_state.set_ProgramUniformBuffer(program, world_location, RenderServerDevice.WorldUniformsUnit);
        }
        // Environment Uniforms
        const env_location = this.render_state.get_ProgramUniformBlockLocation(program, RenderServerDevice.EnvironmentUniformsName);
        if (env_location >= 0) {
            this.render_state.set_ProgramUniformBuffer(program, env_location, RenderServerDevice.EnvironmentUniformsUnit);
        }
    }

    private setup_PlainColorTextures() {
        const plain_color_empty = this.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.render_state.alloc_Texture2D(plain_color_empty, 2, 2, 0, RenderStateTextureDataFormat.RGBA, new Uint8ClampedArray([
            255, 0, 255, 255,
            0, 255, 255, 255,
            0, 255, 255, 255,
            255, 0, 255, 255,
        ]));
        this.plain_color_textures.empty.value = plain_color_empty;
        const plain_color_white = this.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1).expect();
        this.render_state.alloc_Texture2D(plain_color_white, 1, 1, 0, RenderStateTextureDataFormat.RGBA, new Uint8ClampedArray([255, 255, 255, 255]));
        this.plain_color_textures.white.value = plain_color_white;
        const plain_color_black = this.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1).expect();
        this.render_state.alloc_Texture2D(plain_color_black, 1, 1, 0, RenderStateTextureDataFormat.RGBA, new Uint8ClampedArray([0, 0, 0, 255]));
        this.plain_color_textures.black.value = plain_color_black;
        const plain_color_transparent = this.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1).expect();
        this.render_state.alloc_Texture2D(plain_color_transparent, 1, 1, 0, RenderStateTextureDataFormat.RGBA, new Uint8ClampedArray([255, 255, 255, 255]));
        this.plain_color_textures.transparent.value = plain_color_transparent;
        const plain_color_grey = this.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1).expect();
        this.render_state.alloc_Texture2D(plain_color_grey, 1, 1, 0, RenderStateTextureDataFormat.RGBA, new Uint8ClampedArray([227, 227, 227, 255]));
        this.plain_color_textures.grey.value = plain_color_grey;
    }

    // Setting / Getting

    public get_PlainColorTexture(color: RenderServerPlainColorTexture): WebGL2RenderStateTexture {
        switch (color) {
            case RenderServerPlainColorTexture.Empty: return this.plain_color_textures.empty.expect;
            case RenderServerPlainColorTexture.White: return this.plain_color_textures.white.expect;
            case RenderServerPlainColorTexture.Black: return this.plain_color_textures.black.expect;
            case RenderServerPlainColorTexture.Transparent: return this.plain_color_textures.transparent.expect;
            case RenderServerPlainColorTexture.Grey: return this.plain_color_textures.grey.expect;
            default: {
                const n: never = color;
                throw new Error();
            }
        }
    }

    public set_WorldUniforms(camera_world: Matrix4, camera_projection: Matrix4, camera_is_orthogonal: boolean, screen_width: number, screen_height: number, time: number, pixel_ratio_override?: number) {
        // camera world
        {
            this.world_uniforms_camera_world[0] = camera_world.n11;
            this.world_uniforms_camera_world[1] = camera_world.n21;
            this.world_uniforms_camera_world[2] = camera_world.n31;
            this.world_uniforms_camera_world[3] = camera_world.n41;
            this.world_uniforms_camera_world[4] = camera_world.n12;
            this.world_uniforms_camera_world[5] = camera_world.n22;
            this.world_uniforms_camera_world[6] = camera_world.n32;
            this.world_uniforms_camera_world[7] = camera_world.n42;
            this.world_uniforms_camera_world[8] = camera_world.n13;
            this.world_uniforms_camera_world[9] = camera_world.n23;
            this.world_uniforms_camera_world[10] = camera_world.n33;
            this.world_uniforms_camera_world[11] = camera_world.n43;
            this.world_uniforms_camera_world[12] = camera_world.n14;
            this.world_uniforms_camera_world[13] = camera_world.n24;
            this.world_uniforms_camera_world[14] = camera_world.n34;
            this.world_uniforms_camera_world[15] = camera_world.n44;
        }
        // camera view
        {
            const matrix = RenderServerDevice.#tmp_matrix4_0.inverse(camera_world);
            this.world_uniforms_camera_view[0] = matrix.n11;
            this.world_uniforms_camera_view[1] = matrix.n21;
            this.world_uniforms_camera_view[2] = matrix.n31;
            this.world_uniforms_camera_view[3] = matrix.n41;
            this.world_uniforms_camera_view[4] = matrix.n12;
            this.world_uniforms_camera_view[5] = matrix.n22;
            this.world_uniforms_camera_view[6] = matrix.n32;
            this.world_uniforms_camera_view[7] = matrix.n42;
            this.world_uniforms_camera_view[8] = matrix.n13;
            this.world_uniforms_camera_view[9] = matrix.n23;
            this.world_uniforms_camera_view[10] = matrix.n33;
            this.world_uniforms_camera_view[11] = matrix.n43;
            this.world_uniforms_camera_view[12] = matrix.n14;
            this.world_uniforms_camera_view[13] = matrix.n24;
            this.world_uniforms_camera_view[14] = matrix.n34;
            this.world_uniforms_camera_view[15] = matrix.n44;
        }
        // camera normal view
        {
            // transpose( inverse( mat3( inverse( camera_world ) ) ) )
            const matrix = RenderServerDevice.#tmp_matrix4_0.get_Basis(RenderServerDevice.#tmp_matrix3_0);
            matrix.inverse(matrix);
            this.world_uniforms_camera_normal_view[0] = matrix.n11;
            this.world_uniforms_camera_normal_view[1] = matrix.n12;
            this.world_uniforms_camera_normal_view[2] = matrix.n13;
            this.world_uniforms_camera_normal_view[3] = 0;
            this.world_uniforms_camera_normal_view[4] = matrix.n21;
            this.world_uniforms_camera_normal_view[5] = matrix.n22;
            this.world_uniforms_camera_normal_view[6] = matrix.n23;
            this.world_uniforms_camera_normal_view[7] = 0;
            this.world_uniforms_camera_normal_view[8] = matrix.n31;
            this.world_uniforms_camera_normal_view[9] = matrix.n32;
            this.world_uniforms_camera_normal_view[10] = matrix.n33;
            this.world_uniforms_camera_normal_view[11] = 0;
        }
        // camera projection
        {
            this.world_uniforms_camera_projection[0] = camera_projection.n11;
            this.world_uniforms_camera_projection[1] = camera_projection.n21;
            this.world_uniforms_camera_projection[2] = camera_projection.n31;
            this.world_uniforms_camera_projection[3] = camera_projection.n41;
            this.world_uniforms_camera_projection[4] = camera_projection.n12;
            this.world_uniforms_camera_projection[5] = camera_projection.n22;
            this.world_uniforms_camera_projection[6] = camera_projection.n32;
            this.world_uniforms_camera_projection[7] = camera_projection.n42;
            this.world_uniforms_camera_projection[8] = camera_projection.n13;
            this.world_uniforms_camera_projection[9] = camera_projection.n23;
            this.world_uniforms_camera_projection[10] = camera_projection.n33;
            this.world_uniforms_camera_projection[11] = camera_projection.n43;
            this.world_uniforms_camera_projection[12] = camera_projection.n14;
            this.world_uniforms_camera_projection[13] = camera_projection.n24;
            this.world_uniforms_camera_projection[14] = camera_projection.n34;
            this.world_uniforms_camera_projection[15] = camera_projection.n44;
        }
        // camera inv projection
        {
            const matrix = RenderServerDevice.#tmp_matrix4_0.inverse(camera_projection);
            this.world_uniforms_camera_inv_projection[0] = matrix.n11;
            this.world_uniforms_camera_inv_projection[1] = matrix.n21;
            this.world_uniforms_camera_inv_projection[2] = matrix.n31;
            this.world_uniforms_camera_inv_projection[3] = matrix.n41;
            this.world_uniforms_camera_inv_projection[4] = matrix.n12;
            this.world_uniforms_camera_inv_projection[5] = matrix.n22;
            this.world_uniforms_camera_inv_projection[6] = matrix.n32;
            this.world_uniforms_camera_inv_projection[7] = matrix.n42;
            this.world_uniforms_camera_inv_projection[8] = matrix.n13;
            this.world_uniforms_camera_inv_projection[9] = matrix.n23;
            this.world_uniforms_camera_inv_projection[10] = matrix.n33;
            this.world_uniforms_camera_inv_projection[11] = matrix.n43;
            this.world_uniforms_camera_inv_projection[12] = matrix.n14;
            this.world_uniforms_camera_inv_projection[13] = matrix.n24;
            this.world_uniforms_camera_inv_projection[14] = matrix.n34;
            this.world_uniforms_camera_inv_projection[15] = matrix.n44;
        }
        // camera is orth
        {
            this.world_uniforms_camera_is_orthogonal[0] = camera_is_orthogonal ? 1 : 0;
        }
        // screen size
        {
            this.world_uniforms_screen_size[0] = screen_width;
            this.world_uniforms_screen_size[1] = screen_height;
        }
        // time
        {
            this.world_uniforms_time[0] = time;
        }
        // pixel ratio
        {
            this.world_uniforms_pixel_ratio[0] = pixel_ratio_override ?? this._pixel_ratio;
        }
        this.render_state.update_Buffer(this.world_uniforms_buffer_ref.expect, this.world_uniforms_buffer_data);
    }

    public set_EnvironmentUniforms(background_color: Color, use_sky: boolean) {
        // background color
        {
            this.env_uniforms_background_color[0] = background_color.r;
            this.env_uniforms_background_color[1] = background_color.g;
            this.env_uniforms_background_color[2] = background_color.b;
            this.env_uniforms_background_color[3] = background_color.a;
        }
        // use sky
        {
            this.env_uniforms_use_sky[0] = use_sky ? 1 : 0;
        }
        this.render_state.update_Buffer(this.env_uniforms_buffer_ref.expect, this.env_uniforms_buffer_data);
    }

    private _raw_pixel_ratio: number = window.devicePixelRatio;
    public get raw_pixel_ratio() { return this._raw_pixel_ratio; }
    private _pixel_ratio: number = window.devicePixelRatio;
    public get pixel_ratio() { return this._pixel_ratio; }

    public set_PixelRatio(ratio: number = window.devicePixelRatio, scale: number = 1) {
        this._raw_pixel_ratio = ratio;
        this._pixel_ratio = ratio * scale;
    }

    private _flushed: boolean = false;
    public get flushed() { return this._flushed; }

    public set_Size(width: number, height: number) {
        this._flushed = false;
        width = Math.max(Math.floor(width * this.pixel_ratio), 1);
        height = Math.max(Math.floor(height * this.pixel_ratio), 1);
        const canvas_width = this.canvas.width;
        const canvas_height = this.canvas.height;
        if (canvas_width !== width || canvas_height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this._flushed = true;
        }
    }

    public set_RenderCapabilities(depth_test?: boolean, depth_write?: boolean, depth_func?: number, blend?: boolean, polygon_offset?: boolean) {
        if (depth_test !== undefined) {
            this.render_state.set_CapabilityProxy(this.render_state.gl.DEPTH_TEST, depth_test);
        }
        if (depth_write !== undefined) {
            this.render_state.set_DepthMaskProxy(depth_write);
        }
        if (depth_func !== undefined) {
            this.render_state.set_DepthFuncProxy(depth_func);
        }
        if (blend !== undefined) {
            this.render_state.set_CapabilityProxy(this.render_state.gl.BLEND, blend);
        }
        if (polygon_offset !== undefined) {
            this.render_state.set_CapabilityProxy(this.render_state.gl.POLYGON_OFFSET_FILL, polygon_offset);
        }
    }

    // Create

    public use_LightsData(lights_data: RenderServerLightsData | undefined) {
        if (this.lights_data_ref.value !== lights_data) {
            if (lights_data === undefined) {
                this.lights_data_ref.value = undefined;
                this.render_state.deactive_Texture(RenderStateTextureType.Tex2DArray, RenderServerDevice.LightsTextureUnit);
            }
            else {
                this.lights_data_ref.value = lights_data;
                this.render_state.active_Texture(lights_data.lights_texture, RenderServerDevice.LightsTextureUnit);
            }
        }
    }

    public use_ShadowsTexture(shadow: WebGL2RenderStateTexture | undefined) {
        if (this.shadows_texture_ref.value !== shadow) {
            if (shadow === undefined) {
                this.shadows_texture_ref.value = undefined;
                this.render_state.deactive_Texture(RenderStateTextureType.Tex2DArray, RenderServerDevice.ShadowsTextureUnit);
            }
            else {
                this.shadows_texture_ref.value = shadow;
                this.render_state.active_Texture(shadow, RenderServerDevice.ShadowsTextureUnit);
            }
        }
    }

    public use_SkyTexture(sky: WebGL2RenderStateTexture | undefined) {
        if (this.sky_texture_ref.value !== sky) {
            if (sky === undefined) {
                this.sky_texture_ref.value = undefined;
                this.render_state.deactive_Texture(RenderStateTextureType.Tex2D, RenderServerDevice.SkyTextureUnit);
            }
            else {
                this.sky_texture_ref.value = sky;
                this.render_state.active_Texture(sky, RenderServerDevice.SkyTextureUnit);
            }
        }
    }

    public create_Geometry() {
        return new RenderServerGeometry(this);
    }

    public create_Shader() {
        return new RenderServerShader(this);
    }

    public create_Material() {
        return new RenderServerMaterial(this);
    }

    public dispose(): void {
        this.world_uniforms_buffer_ref.clear();
        this.lights_data_ref.clear();
        this.shadows_texture_ref.clear();
        this.sky_texture_ref.clear();
        this.plain_color_textures.empty.clear();
        this.plain_color_textures.white.clear();
        this.plain_color_textures.black.clear();
        this.plain_color_textures.transparent.clear();
    }
}