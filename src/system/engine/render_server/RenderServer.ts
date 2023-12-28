import type { RenderDeviceCanvas } from "@/system/sliverofstraw/RenderDevice";
import { RenderStateBufferType, RenderStateBufferUsage, RenderStateDataType, RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType } from "@/system/sliverofstraw/RenderState";
import { WebGL2RenderDevice } from "@/system/sliverofstraw/webgl2/WebGL2RenderDevice";
import type { WebGL2RenderStateBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateBuffer";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { Ref } from "@/system/utils/RefCounted";
import { RenderServerLightsData } from "./RenderServerLightData";
import { RenderServerGeometry } from "./RenderServerGeometry";
import { RenderServerShader } from "./RenderServerShader";
import { RenderServerMaterial } from "./RenderServerMaterial";
import { RenderDeviceMatrix4AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";

export enum RenderServerPlainColorTexture { White, Black, Transparent, Grey }

export class RenderServerDevice extends WebGL2RenderDevice {

    // Codes
    public static readonly ConstantsCode = `const float PI = 3.1415926535;\nconst float TAU = 6.283185307;\nconst float EPSILON = 0.00001;`
    public static readonly WorldUniformsCode = `layout(std140) uniform WorldUniforms {
    mat4 camera_world;
    mat4 camera_view;
    mat4 camera_projection;
    mat4 camera_inv_projection;
    vec2 screen_size;
    float time;
    bool camera_is_orthogonal;
    float pixel_ratio;
};`
    public static readonly EnvironmentUniformsCode = `layout(std140) uniform EnvironmentUniforms {
    mat4 camera_world;
    mat4 camera_view;
    mat4 camera_projection;
    mat4 camera_inv_projection;
    vec2 screen_size;
    float time;
    bool camera_is_orthogonal;
};`
    public static readonly FrameOutputBufferCode = `layout(location = 0) out vec4 o_color;\nlayout(location = 1) out vec3 o_normal;`
    public static readonly FrameOiTOutputBufferCode = `layout(location = 0) out vec4 o_color;\nlayout(location = 1) out float o_accum;`
    public static readonly OitOutputCode = `    // oit
    color.rgb *= color.a;
    float _z = gl_FragCoord.z;
    float _a = color.a;
    float _w = _a * max(0.01, min(3000.0, 0.03 / (1e-5 + pow(abs(_z) / 200.0, 4.0))));
    o_color = vec4(color.rgb * _w, color.a);
    o_accum = color.a * _w;`;

    // texture layout
    //   |-------|-------|-------|-------|-------|-------|-------|-------|
    //   |   0   |   1   |   2   |   3   |   4   |   5   |   6   |   7   |
    //   |-------|-------|-------|-------|-------|-------|-------|-------|
    //   |       |       |       | empty |  lit  | l_cls | l_shd |  sky  |
    //   |-------|-------|-------|-------|-------|-------|-------|-------|
    //   |   8   |   9   |   10  |   11  |   12  |   13  |   14  |   15  |
    //   |-------|-------|-------|-------|-------|-------|-------|-------|
    //   |  pres |  pres |  pres |  pres |  pres |  pres |  pres |  pres |
    //   |-------|-------|-------|-------|-------|-------|-------|-------|

    public static readonly EmptyTextureUnit: number = 2;
    public static readonly LightsTextureUnit: number = 3;
    public static readonly LightsClusterTextureUnit: number = 4;
    public static readonly SkyTextureUnit: number = 5;

    public static readonly WorldUniformsName: string = 'WorldUniforms';
    public static readonly WorldUniformsUnit: number = 0;
    public static readonly EnvironmentUniformsName: string = 'EnvironmentUniforms';
    public static readonly EnvironmentUniformsUnit: number = 1;

    // World Uniforms layout std140
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
    //   | screen_size |             |     time    | orthogonal  |                    |  16 Bytes
    //   |     256     |             |     264     |     268     |                    |
    //   |-------------|-------------|-------------|-------------| ---- 272 Bytes ----+
    //   | pixel_ratio |             |             |             |                    |  16 Bytes
    //   |     272     |             |             |             |                    |
    //   |-------------|-------------|-------------|-------------| ---- 276 Bytes ----+
    //   
    //   total 276 Bytes => 69 * 4 float32s

    private world_uniforms_buffer_ref: Ref<WebGL2RenderStateBuffer> = new Ref();

    private readonly world_uniforms_buffer_data: Float32Array = new Float32Array(69);
    private readonly world_uniforms_camera_world: Float32Array = new Float32Array(this.world_uniforms_buffer_data.buffer, 0, 16);
    private readonly world_uniforms_camera_view: Float32Array = new Float32Array(this.world_uniforms_buffer_data.buffer, 64, 16);
    private readonly world_uniforms_camera_projection: Float32Array = new Float32Array(this.world_uniforms_buffer_data.buffer, 128, 16);
    private readonly world_uniforms_camera_inv_projection: Float32Array = new Float32Array(this.world_uniforms_buffer_data.buffer, 192, 16);
    private readonly world_uniforms_screen_size: Float32Array = new Float32Array(this.world_uniforms_buffer_data.buffer, 256, 2);
    private readonly world_uniforms_time: Float32Array = new Float32Array(this.world_uniforms_buffer_data.buffer, 264, 1);
    private readonly world_uniforms_camera_is_orthogonal: Uint32Array = new Uint32Array(this.world_uniforms_buffer_data.buffer, 268, 1);
    private readonly world_uniforms_pixel_ratio: Float32Array = new Float32Array(this.world_uniforms_buffer_data.buffer, 272, 1);

    // Environment Uniforms layout std140
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
    //   | screen_size |             |     time    | orthogonal  |                    |  16 Bytes
    //   |     256     |             |     264     |     268     |                    |
    //   |-------------|-------------|-------------|-------------| ---- 272 Bytes ----+
    //   
    //   total 272 Bytes => 68 * 4 float32s


    // default values

    private environment_uniforms_buffer_ref: Ref<WebGL2RenderStateBuffer> = new Ref();
    private readonly environment_uniforms_buffer_data: Float32Array = new Float32Array(68);

    public readonly identity_transform_attribute_buffer_ref: Ref<RenderDeviceMatrix4AttributeBuffer<WebGL2RenderState>> = new Ref();
    public get identity_transform_attribute_buffer() { return this.identity_transform_attribute_buffer_ref.expect; }

    public readonly empty_texture_ref: Ref<WebGL2RenderStateTexture> = new Ref();
    public get empty_texture() { return this.empty_texture_ref.expect; }

    public readonly plain_color_textures = {
        white: new Ref<WebGL2RenderStateTexture>(),
        black: new Ref<WebGL2RenderStateTexture>(),
        transparent: new Ref<WebGL2RenderStateTexture>(),
        grey: new Ref<WebGL2RenderStateTexture>(),
    }

    // Render Data

    public readonly lights_data_ref: Ref<RenderServerLightsData> = new Ref();

    public readonly sky_texture_ref: Ref<WebGL2RenderStateTexture> = new Ref();

    constructor(canvas: RenderDeviceCanvas) {
        super(canvas, { preserve_texture_count: 8, texture_slot_base: 3, default_texture_slot: 3, canvas_antialias: true, canvas_preserve_drawing_buffer: true });
        if (this.render_state.user_texture_slot_count < 8) throw new Error('<RenderServerDevice> constructor: not enough user texture slot');
        this.setup_IdentityTransformAttributeBuffer();
        this.setup_WorldUniformsBuffer();
        this.setup_EnvironmentUniformsBuffer();
        this.setup_EmptyTexture();
        this.setup_PlainColorTextures();
    }

    // Setup

    private setup_IdentityTransformAttributeBuffer() {
        this.identity_transform_attribute_buffer_ref.value = new RenderDeviceMatrix4AttributeBuffer(this, RenderStateBufferUsage.StaticDraw, [Matrix4.make_Identity()], 1);
    }

    private setup_WorldUniformsBuffer() {
        this.world_uniforms_buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Uniform, RenderStateBufferUsage.DynamicDraw, 1, RenderStateDataType.Float, false, 0).expect();
        this.render_state.alloc_Buffer(this.world_uniforms_buffer_ref.expect, this.world_uniforms_buffer_data.byteLength);
        this.render_state.bind_UniformBuffer(this.world_uniforms_buffer_ref.expect, RenderServerDevice.WorldUniformsUnit);
    }

    private setup_EnvironmentUniformsBuffer() {
        this.environment_uniforms_buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Uniform, RenderStateBufferUsage.DynamicDraw, 1, RenderStateDataType.Float, false, 0).expect();
        this.render_state.alloc_Buffer(this.environment_uniforms_buffer_ref.expect, this.environment_uniforms_buffer_data.byteLength);
        this.render_state.bind_UniformBuffer(this.environment_uniforms_buffer_ref.expect, RenderServerDevice.EnvironmentUniformsUnit);
    }

    private setup_EmptyTexture() {
        const texture = this.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.empty_texture_ref.value = texture;
        this.render_state.alloc_Texture2D(texture, 2, 2, 0, RenderStateTextureDataFormat.RGBA, new Uint8ClampedArray([
            255, 0, 255, 255,
            0, 255, 255, 255,
            0, 255, 255, 255,
            255, 0, 255, 255,
        ]));
        this.render_state.active_Texture(texture, RenderServerDevice.EmptyTextureUnit);
    }

    private setup_PlainColorTextures() {
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

    static #matrix: Matrix4 = Matrix4.make_Identity();

    public set_WorldUniforms(camera_world: Matrix4, camera_projection: Matrix4, camera_is_orthogonal: boolean, screen_width: number, screen_height: number, time: number) {
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
            const matrix = RenderServerDevice.#matrix.inverses(camera_world);
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
        // camera view
        {
            const matrix = RenderServerDevice.#matrix.inverses(camera_projection);
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
            this.world_uniforms_pixel_ratio[0] = window.devicePixelRatio / this._pixel_ratio;
        }
        this.render_state.update_Buffer(this.world_uniforms_buffer_ref.expect, this.world_uniforms_buffer_data);
    }

    public set_EnvironmentUniforms() {
        this.render_state.update_Buffer(this.environment_uniforms_buffer_ref.expect, this.environment_uniforms_buffer_data);
    }

    private _pixel_ratio: number = window.devicePixelRatio;
    public get pixel_ratio() { return this._pixel_ratio; }

    public set_PixelRatio(ratio: number) {
        this._pixel_ratio = ratio;
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

    public set_RenderCapabilities(depth_test?: boolean, depth_write?: boolean, depth_func?: number, blend?: boolean) {
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
    }

    // Create

    public create_LightsData(width: number, height: number) {
        return new RenderServerLightsData(this, width, height);
    }

    public use_LightsData(lights_data: RenderServerLightsData) {
        if (this.lights_data_ref.value !== lights_data) {
            const texture = lights_data.lights_texture;
            this.lights_data_ref.value = lights_data;
            this.render_state.active_Texture(texture, RenderServerDevice.LightsTextureUnit);
        }
    }

    public use_SkyTexture(sky: WebGL2RenderStateTexture) {
        if (this.sky_texture_ref.value !== sky) {
            this.sky_texture_ref.value = sky;
            this.render_state.active_Texture(sky, RenderServerDevice.SkyTextureUnit);
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
        this.empty_texture_ref.clear();
        this.lights_data_ref.clear();
        this.plain_color_textures.white.clear();
        this.plain_color_textures.black.clear();
        this.plain_color_textures.transparent.clear();
    }
}

export const RenderServer3D = new RenderServerDevice(document.getElementById('render-server-canvas') as HTMLCanvasElement);

RenderServer3D.set_Size(0, 0);