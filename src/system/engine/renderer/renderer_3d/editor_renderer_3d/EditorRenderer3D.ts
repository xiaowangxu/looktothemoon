import type { Viewport } from "../../../nodes/Node";
import { World3D } from "../../../worlds/world3ds/World3D";
import { RenderServerDevice } from "../../../render_server/RenderServer";
import { RenderStateBufferUsage, RenderStateDataType, RenderStatePrimitiveType, RenderStateShaderType, RenderStateUniformType } from "../../../../sliverofstraw/RenderState";
import { RenderDeviceIndexAttributeBuffer, RenderDeviceVector2AttributeBuffer } from "../../../../sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { Vector2 } from "../../../../fivepebble/linear_algebra/Vector2";
import { WebGL2RenderStateIntUniformSlot, WebGL2RenderStateUintUniformSlot } from "../../../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateUniformSlot";
import { Ref } from "../../../../utils/RefCounted";
import type { WebGL2RenderStateTexture } from "../../../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { type Config } from "../../../ConfiguredObject";
import { Cacher } from "@/system/utils/Cacher";
import { Renderer3D } from "../Renderer3D";
import { Renderer3DQueue } from "../Renderer3DQueue";
import { Frustum3 } from "@/system/fivepebble/graphics/Frustum3";
import { Color } from "@/system/fivepebble/graphics/Color";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";

// #region quad surface

const QuadGeometry = new Cacher((config: Config) => {
    const quad_position = new RenderDeviceVector2AttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [
		/* 0 */Vector2.create(0, 4),			//   1  0 
		/* 1 */Vector2.create(0, 0),		    //   |  | \
		/* 2 */Vector2.create(4, 0),			//  -1  1 - 2
        /*                                     *///    -1 -- 1
    ]);
    const quad_index = new RenderDeviceIndexAttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [0, 1, 2]);
    const quad_surface = config.render_server.create_Geometry();
    quad_surface.set_Geometry(RenderStatePrimitiveType.Triangles, { position: quad_position }, quad_index);
    return new Ref(quad_surface);
});

// #endregion

// #region quad shader

const quad_vert_shader_code = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

out vec2 v_uv;

void main() {
	gl_Position = vec4(a_position - vec2(1.0), 1.0, 1.0);
	v_uv = a_position / 2.0;
}`;

const QuadVertexShader = new Cacher((config: Config) => {
    const quad_vert_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Vertex, quad_vert_shader_code).expect();
    return new Ref(quad_vert_shader);
});

// #endregion

// #region on screen

const onscreen_frag_shader_code = `#version 300 es
precision highp float;
precision highp sampler2DArray;

${RenderServerDevice.WorldUniformsCode}

in vec2 v_uv;

uniform sampler2D u_screen;

layout(location = 0) out vec4 o_color;

void main() {
    o_color = vec4(texture(u_screen, vec2(v_uv.x, v_uv.y)).rgba);
}`;

const OnscreenProgram = new Cacher((config: Config) => {
    const onscreen_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, onscreen_frag_shader_code).expect();
    const onscreen_program = config.render_server.render_state.create_Program(QuadVertexShader.get(config).expect, onscreen_frag_shader).expect();
    const program = new Ref(onscreen_program);

    const uniform_screen_slot = config.render_server.render_state.create_ProgramUniform(onscreen_program, 'u_screen', RenderStateUniformType.Int, 0).expect();
    uniform_screen_slot.commit();
    uniform_screen_slot.dispose();

    return program;
});

//#endregion

export class EditorRenderer3D extends Renderer3D {
    public readonly render_queue_0 = new Renderer3DQueue();
    public readonly render_queue_1 = new Renderer3DQueue();
    public readonly render_queue_highlight = new Renderer3DQueue(1024, 256);

    // cache items
    private readonly quad_geometry = QuadGeometry.get(this.config).expect;
    private readonly on_screen_program = OnscreenProgram.get(this.config).expect;

    constructor(config: Config) {
        super(config);
    }

    public set_Size(size: Vector2) {
        if (!this.base_size.equal(size)) {
            this.base_size.copy(size);
        }
    }

    public set_Position(position: Vector2) {
        if (!this.base_position.equal(position)) {
            this.base_position.copy(position);
        }
    }

    private render_OnScreen(texture: WebGL2RenderStateTexture | undefined, x: number, y: number, width: number, height: number) {
        this.render_server.render_state.use_FrameBuffer(undefined);
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, false);
        const _x = x;
        const _y = this.render_server.canvas.height - height - y;
        this.render_server.render_state.set_ViewportProxy(_x, _y, width, height);
        this.render_server.render_state.set_ScissorProxy(_x, _y, width, height);
        if (texture !== undefined) {
            this.render_server.render_state.active_Texture(texture, 0);
            this.render_server.render_state.draw_Elements(this.on_screen_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
        }
    }

    static readonly #size: Vector2 = Vector2.new;
    static readonly #bg_color: Color = Vector4.new;
    static readonly #frustum: Frustum3 = Frustum3.new;

    public render(world: World3D, viewport: Viewport, once: boolean): void {
        if (this._render_pipeline.is_empty) return;

        const pipeline = this._render_pipeline.expect;

        const time = viewport.get_SceneTree()!.time;
        const cam = viewport.get_Camera3D()!.get_Camera();
        const cam_world = cam.global_transform;
        const cam_projection = cam.projection;
        const cam_is_orthogonal = cam.is_orthogonal;
        const cam_frustum = cam.get_Frustum(EditorRenderer3D.#frustum);
        const cam_mask = cam.mask;
        const pixel_ratio = this.render_server.pixel_ratio;
        let { x: width, y: height } = this.base_size;
        width = Math.max(Math.floor(width * pixel_ratio), 1);
        height = Math.max(Math.floor(height * pixel_ratio), 1);
        let { x, y } = this.base_position;
        x = Math.max(Math.floor(x * pixel_ratio), 0);
        y = Math.max(Math.floor(y * pixel_ratio), 0);
        const size = EditorRenderer3D.#size;
        size.set(width, height);

        this.render_server.set_WorldUniforms(cam_world, cam_projection, cam_is_orthogonal, width, height, time);
        this.render_server.set_EnvironmentUniforms(viewport.get_BackgroundColor(EditorRenderer3D.#bg_color), viewport.use_sky);

        const world_3d = world.visual_world;
        const sky_texture = world_3d.sky_texture.expect;
        this.render_server.use_SkyTexture(sky_texture);
        const shadow_texture = world_3d.shadows_texture.expect;
        this.render_server.use_ShadowsTexture(shadow_texture);

        const editor_highlighted = viewport.editor_highlighted;

        // fill up lights data
        const lights_data = world_3d.lights_data.expect;

        lights_data.clear_Lights();
        let light_idx = 0;
        for (const light of world_3d.lights) {
            if (light_idx >= lights_data.max_light_count) break;
            if (!light.visible || (light.layer & cam_mask) === 0) continue;
            light_idx = light.fill_LightData(lights_data, light_idx, cam_frustum, cam, this.base_size);
            light_idx++;
        }
        // console.log(light_idx);
        if (light_idx < lights_data.max_light_count) {
            lights_data.set_Light(light_idx, 0);
        }
        lights_data.commit_AllLightsData();

        this.render_server.use_LightsData(lights_data);

        // fill up render queue

        let total_objects_count = 0;
        let rendered_objects_count = 0;
        this.render_queue_0.reset();
        this.render_queue_1.reset();
        this.render_queue_highlight.reset();
        for (const mesh of world_3d.meshes) {
            total_objects_count++;
            const render_queue = mesh.render_queue;
            const queue = render_queue === 0 ? this.render_queue_0 : this.render_queue_1;
            if (queue !== undefined) {
                if (editor_highlighted && mesh.editor_highlighted) {
                    queue.addtion_sync_queue = this.render_queue_highlight;
                }
                if (mesh.fill_RenderQueue(queue, cam, cam_frustum, this.base_size)) {
                    rendered_objects_count++;
                }
                queue.addtion_sync_queue = undefined;
            }
        }

        this.render_queue_0.sort();
        this.render_queue_1.sort();

        pipeline.set_Size(size);

        // console.time("GPU");
        pipeline.render(this, world, viewport, once);
        // console.timeEnd("GPU");

        this.render_OnScreen(pipeline.texture, x, y, width, height);

        if (once) {
            this.render_queue_0.clear();
            this.render_queue_1.clear();
            this.render_queue_highlight.clear();
        }

        // debug
        if (viewport.debug) {
            const delta = viewport.get_SceneTree()!.delta;
            const debug = document.getElementById('render-server-debug');
            if (debug) {
                debug.innerHTML = `FPS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${(1 / delta).toFixed(3)}<br>FrameDelta: ${(delta * 1000).toFixed(4)} ms<br>RenderObjs: ${rendered_objects_count} / ${total_objects_count}<br>Solid Objs: ${this.render_queue_0.solid_pointer + 1 + this.render_queue_1.solid_pointer + 1}<br>Trans Objs: ${this.render_queue_0.transparent_pointer + 1 + this.render_queue_1.transparent_pointer + 1}<br>Lights&nbsp;&nbsp;&nbsp;&nbsp;: ${light_idx}<br>Tweens : ${viewport.get_SceneTree()!.tween_processing_count}`;
            }
        }
    }

    public dispose() {
        this.render_queue_0.dispose();
        this.render_queue_1.dispose();
        super.dispose();
    }
}