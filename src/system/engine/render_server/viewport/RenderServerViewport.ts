import type { WebGPURenderStateCanvasTextureView } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateCanvasTextureView";
import { ReadonlyRef } from "@/system/utils/RefCounted";
import { RenderServer, RenderServerSingleton } from "../RenderServer";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import type { Disposable } from "@/system/utils/Type";
import { RenderServerObject } from "../RenderServerObject";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";

export class RenderServerViewport extends RenderServerObject implements Disposable {

    static readonly #tmp_matrix4_0: Matrix4 = Matrix4.new;
    static readonly #tmp_matrix3_0: Matrix3 = Matrix3.new;

    protected readonly canvas: HTMLCanvasElement;

    protected readonly canvas_texture_view_ref: ReadonlyRef<WebGPURenderStateCanvasTextureView>;
    public get canvas_texture_view() { return this.canvas_texture_view_ref.expect; }

    protected readonly _raw_size: Vector2 = Vector2.new;
    public get raw_size() { return this._raw_size.clone(); }
    public get_RawSize(target: Vector2) { return target.copy(this._raw_size); }

    protected readonly _size: Vector2 = Vector2.new;
    public get size() { return this._size.clone(); }
    public get_Size(target: Vector2) { return target.copy(this._size); }

    protected _raw_pixel_ratio: number = window.devicePixelRatio;
    public get raw_pixel_ratio() { return this._raw_pixel_ratio; }

    protected _scale: number = 1.0;
    public get scale() { return this._scale; }

    protected _pixel_ratio: number = 1.0;
    public get pixel_ratio() { return this._pixel_ratio; }

    //#region World Env Uniform

    protected readonly world_env_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.world_env_uniform_layout).expect());
    public get world_env_uniform_group() { return this.world_env_uniform_group_ref.expect; }

    protected readonly world_env_uniform_camera_matrix_buffer_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.size).expect());
    protected readonly world_env_uniform_camera_matrix_array_buffer = new ArrayBuffer(RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.size);
    protected readonly world_env_uniform_camera_world = new Float32Array(this.world_env_uniform_camera_matrix_array_buffer, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[0].offset, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[0].size / Float32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_camera_view = new Float32Array(this.world_env_uniform_camera_matrix_array_buffer, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[1].offset, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[1].size / Float32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_camera_projection = new Float32Array(this.world_env_uniform_camera_matrix_array_buffer, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[2].offset, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[2].size / Float32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_camera_inv_projection = new Float32Array(this.world_env_uniform_camera_matrix_array_buffer, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[3].offset, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[3].size / Float32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_camera_normal_view = new Float32Array(this.world_env_uniform_camera_matrix_array_buffer, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[4].offset, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[4].size / Float32Array.BYTES_PER_ELEMENT);

    protected readonly world_env_uniform_params_buffer_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.size).expect());
    protected readonly world_env_uniform_params_array_buffer = new ArrayBuffer(RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.size);
    protected readonly world_env_uniform_screen_size = new Float32Array(this.world_env_uniform_params_array_buffer, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[0].offset, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[0].size / Float32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_time = new Float32Array(this.world_env_uniform_params_array_buffer, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[1].offset, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[1].size / Float32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_camera_is_orthogonal = new Uint32Array(this.world_env_uniform_params_array_buffer, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[2].offset, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[2].size / Uint32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_pixel_ratio: Float32Array = new Float32Array(this.world_env_uniform_params_array_buffer, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[3].offset, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[3].size / Float32Array.BYTES_PER_ELEMENT);

    //#endregion

     //#region World Env Uniform

     protected readonly lights_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.lights_uniform_layout).expect());
     public get lights_uniform_group() { return this.lights_uniform_group_ref.expect; }
 
     //#endregion

    constructor(canvas: HTMLCanvasElement) {
        super();
        this.canvas = canvas;
        const canvas_ctx = canvas.getContext('webgpu')!;
        canvas_ctx.configure({
            device: RenderServer.render_state.device,
            format: 'rgba16float',
        });
        this.canvas_texture_view_ref = new ReadonlyRef(RenderServer.render_state.create_CanvasTextureView(canvas_ctx).expect());

        this.world_env_uniform_group_ref.expect.set_BufferUniform(0, this.world_env_uniform_camera_matrix_buffer_ref.expect);
        this.world_env_uniform_group_ref.expect.set_BufferUniform(1, this.world_env_uniform_params_buffer_ref.expect);
    }

    public set_PixelRatio(ratio: number = window.devicePixelRatio) {
        this._raw_pixel_ratio = ratio;
        this._pixel_ratio = this._raw_pixel_ratio * this._scale;
        this.set_RawSize(this._raw_size.x, this._raw_size.y);
    }

    public set_Scale(scale: number) {
        this._scale = scale;
        this._pixel_ratio = this._raw_pixel_ratio * this._scale;
        this.set_RawSize(this._raw_size.x, this._raw_size.y);
    }

    public set_RawSize(width: number, height: number) {
        this._raw_size.set(
            Math.max(Math.floor(width)),
            Math.max(Math.floor(height)),
        );
        width = Math.max(Math.floor(width * this.pixel_ratio), 1);
        height = Math.max(Math.floor(height * this.pixel_ratio), 1);
        this._size.set(width, height);
    }

    public update_Size() {
        const canvas_width = this.canvas.width;
        const canvas_height = this.canvas.height;
        if (canvas_width !== this._size.x || canvas_height !== this._size.y) {
            this.canvas.width = this._size.x;
            this.canvas.height = this._size.y;
        }
    }

    public set_WorldEnvUniform(camera_world: Matrix4, camera_projection: Matrix4, camera_is_orthogonal: boolean, time: number, pixel_ratio_override?: number, screen_width_override?: number, screen_height_override?: number) {
        // camera world
        {
            this.world_env_uniform_camera_world[0] = camera_world.n11;
            this.world_env_uniform_camera_world[1] = camera_world.n21;
            this.world_env_uniform_camera_world[2] = camera_world.n31;
            this.world_env_uniform_camera_world[3] = camera_world.n41;
            this.world_env_uniform_camera_world[4] = camera_world.n12;
            this.world_env_uniform_camera_world[5] = camera_world.n22;
            this.world_env_uniform_camera_world[6] = camera_world.n32;
            this.world_env_uniform_camera_world[7] = camera_world.n42;
            this.world_env_uniform_camera_world[8] = camera_world.n13;
            this.world_env_uniform_camera_world[9] = camera_world.n23;
            this.world_env_uniform_camera_world[10] = camera_world.n33;
            this.world_env_uniform_camera_world[11] = camera_world.n43;
            this.world_env_uniform_camera_world[12] = camera_world.n14;
            this.world_env_uniform_camera_world[13] = camera_world.n24;
            this.world_env_uniform_camera_world[14] = camera_world.n34;
            this.world_env_uniform_camera_world[15] = camera_world.n44;
        }
        // camera view
        {
            const matrix = RenderServerViewport.#tmp_matrix4_0.inverse(camera_world);
            this.world_env_uniform_camera_view[0] = matrix.n11;
            this.world_env_uniform_camera_view[1] = matrix.n21;
            this.world_env_uniform_camera_view[2] = matrix.n31;
            this.world_env_uniform_camera_view[3] = matrix.n41;
            this.world_env_uniform_camera_view[4] = matrix.n12;
            this.world_env_uniform_camera_view[5] = matrix.n22;
            this.world_env_uniform_camera_view[6] = matrix.n32;
            this.world_env_uniform_camera_view[7] = matrix.n42;
            this.world_env_uniform_camera_view[8] = matrix.n13;
            this.world_env_uniform_camera_view[9] = matrix.n23;
            this.world_env_uniform_camera_view[10] = matrix.n33;
            this.world_env_uniform_camera_view[11] = matrix.n43;
            this.world_env_uniform_camera_view[12] = matrix.n14;
            this.world_env_uniform_camera_view[13] = matrix.n24;
            this.world_env_uniform_camera_view[14] = matrix.n34;
            this.world_env_uniform_camera_view[15] = matrix.n44;
        }
        // camera normal view
        {
            // transpose( inverse( mat3( inverse( camera_world ) ) ) )
            const matrix = RenderServerViewport.#tmp_matrix4_0.get_Basis(RenderServerViewport.#tmp_matrix3_0);
            matrix.inverse(matrix);
            // transpose by writing code
            this.world_env_uniform_camera_normal_view[0] = matrix.n11;
            this.world_env_uniform_camera_normal_view[1] = matrix.n12;
            this.world_env_uniform_camera_normal_view[2] = matrix.n13;
            this.world_env_uniform_camera_normal_view[3] = matrix.n21;
            this.world_env_uniform_camera_normal_view[4] = matrix.n22;
            this.world_env_uniform_camera_normal_view[5] = matrix.n23;
            this.world_env_uniform_camera_normal_view[6] = matrix.n31;
            this.world_env_uniform_camera_normal_view[7] = matrix.n32;
            this.world_env_uniform_camera_normal_view[8] = matrix.n33;
        }
        // camera projection
        {
            this.world_env_uniform_camera_projection[0] = camera_projection.n11;
            this.world_env_uniform_camera_projection[1] = camera_projection.n21;
            this.world_env_uniform_camera_projection[2] = camera_projection.n31;
            this.world_env_uniform_camera_projection[3] = camera_projection.n41;
            this.world_env_uniform_camera_projection[4] = camera_projection.n12;
            this.world_env_uniform_camera_projection[5] = camera_projection.n22;
            this.world_env_uniform_camera_projection[6] = camera_projection.n32;
            this.world_env_uniform_camera_projection[7] = camera_projection.n42;
            this.world_env_uniform_camera_projection[8] = camera_projection.n13;
            this.world_env_uniform_camera_projection[9] = camera_projection.n23;
            this.world_env_uniform_camera_projection[10] = camera_projection.n33;
            this.world_env_uniform_camera_projection[11] = camera_projection.n43;
            this.world_env_uniform_camera_projection[12] = camera_projection.n14;
            this.world_env_uniform_camera_projection[13] = camera_projection.n24;
            this.world_env_uniform_camera_projection[14] = camera_projection.n34;
            this.world_env_uniform_camera_projection[15] = camera_projection.n44;
        }
        // camera inv projection
        {
            const matrix = RenderServerViewport.#tmp_matrix4_0.inverse(camera_projection);
            this.world_env_uniform_camera_inv_projection[0] = matrix.n11;
            this.world_env_uniform_camera_inv_projection[1] = matrix.n21;
            this.world_env_uniform_camera_inv_projection[2] = matrix.n31;
            this.world_env_uniform_camera_inv_projection[3] = matrix.n41;
            this.world_env_uniform_camera_inv_projection[4] = matrix.n12;
            this.world_env_uniform_camera_inv_projection[5] = matrix.n22;
            this.world_env_uniform_camera_inv_projection[6] = matrix.n32;
            this.world_env_uniform_camera_inv_projection[7] = matrix.n42;
            this.world_env_uniform_camera_inv_projection[8] = matrix.n13;
            this.world_env_uniform_camera_inv_projection[9] = matrix.n23;
            this.world_env_uniform_camera_inv_projection[10] = matrix.n33;
            this.world_env_uniform_camera_inv_projection[11] = matrix.n43;
            this.world_env_uniform_camera_inv_projection[12] = matrix.n14;
            this.world_env_uniform_camera_inv_projection[13] = matrix.n24;
            this.world_env_uniform_camera_inv_projection[14] = matrix.n34;
            this.world_env_uniform_camera_inv_projection[15] = matrix.n44;
        }
        // camera is orth
        {
            this.world_env_uniform_camera_is_orthogonal[0] = camera_is_orthogonal ? 1 : 0;
        }
        // time
        {
            this.world_env_uniform_time[0] = time;
        }
        // screen size
        {
            this.world_env_uniform_screen_size[0] = screen_width_override ?? this._size.x;
            this.world_env_uniform_screen_size[1] = screen_height_override ?? this._size.y;
        }
        // pixel ratio
        {
            this.world_env_uniform_pixel_ratio[0] = pixel_ratio_override ?? this._pixel_ratio;
        }
        this.world_env_uniform_camera_matrix_buffer_ref.expect.update_Data(0, this.world_env_uniform_camera_matrix_array_buffer);
        this.world_env_uniform_params_buffer_ref.expect.update_Data(0, this.world_env_uniform_params_array_buffer);
    }

    public render() {
        const encoder = RenderServer.render_state.device.createCommandEncoder();
        const render_pass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    clearValue: [0, 0, 0, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                    view: this.canvas_texture_view.texture_view,
                }
            ]
        });
        render_pass.end();
        RenderServer.render_state.device.queue.submit([encoder.finish()]);
    }

    public dispose() {
        this.canvas_texture_view_ref.clear();
        this.world_env_uniform_group_ref.clear();
        this.world_env_uniform_camera_matrix_buffer_ref.clear();
        this.world_env_uniform_params_buffer_ref.clear();
    }
}