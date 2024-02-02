import type { Viewport } from "../../nodes/Node";
import { World3D } from "../../worlds/world3ds/World3D";
import { RenderServerDevice } from "../../render_server/RenderServer";
import { RenderStateBufferUsage, RenderStateDataType, RenderStatePrimitiveType, RenderStateShaderType } from "../../../sliverofstraw/RenderState";
import { RenderDeviceIndexAttributeBuffer, RenderDeviceVector2AttributeBuffer } from "../../../sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { Vector2, vec2 } from "../../../fivepebble/linear_algebra/Vector2";
import { WebGL2RenderStateIntUniformSlot, WebGL2RenderStateUintUniformSlot } from "../../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateUniformSlot";
import { Ref } from "../../../utils/RefCounted";
import type { WebGL2RenderStateTexture } from "../../../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { type Config } from "../../ConfiguredObject";
import { Cacher } from "@/system/utils/Cacher";
import { type RenderServerLightsData } from "../../render_server/RenderServerLightData";
import { Renderer3D } from "./Renderer3D";
import { Renderer3DQueue } from "./Renderer3DQueue";

const debug_text = document.getElementById('render-server-debug')!;

// #region quad surface
const QuadGeometry = new Cacher((config: Config) => {
    const quad_position = new RenderDeviceVector2AttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [
        /* 0 */ vec2(-1, 1),
        /* 1 */ vec2(-1, -1),
        /* 2 */ vec2(1, 1),
        /* 3 */ vec2(1, -1), //  -1  1 ------ 3
        /*                        */ //     -1 ------ 1
    ]);
    const quad_index = new RenderDeviceIndexAttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [0, 1, 2, 3]);
    const quad_surface = config.render_server.create_Geometry();
    quad_surface.set_Geometry(RenderStatePrimitiveType.TriangleStrip, { position: quad_position }, quad_index);
    return quad_surface;
});
// #endregion

// #region quad shader
const quad_vert_shader_code = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

out vec2 v_uv;

void main() {
	gl_Position = vec4(a_position, 1.0, 1.0);
	v_uv = (a_position + 1.0) / 2.0;
}`;
const QuadVertexShader = new Cacher((config: Config) => {
    const quad_vert_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Vertex, quad_vert_shader_code).expect();
    return quad_vert_shader;
});
// #endregion

// #region on screen
const onscreen_frag_shader_code = `#version 300 es
precision highp float;

${RenderServerDevice.WorldUniformsCode}

in vec2 v_uv;

uniform sampler2D u_screen;
uniform bool u_colormap;

layout(location = 0) out vec4 o_color;

void main() {
	o_color = vec4(texture(u_screen, vec2(v_uv.x, v_uv.y)).rgba);
	if (u_colormap) {
		float r = o_color.r;
		o_color.r = r <= 0.0031308 ? (12.92 * r) : (1.055 * pow(r, 1.0 / 2.4) - 0.055);
		float g = o_color.g;
		o_color.g = g <= 0.0031308 ? (12.92 * g) : (1.055 * pow(g, 1.0 / 2.4) - 0.055);
		float b = o_color.b;
		o_color.b = b <= 0.0031308 ? (12.92 * b) : (1.055 * pow(b, 1.0 / 2.4) - 0.055);
	}
}`;
const OnscreenProgramUniform = new Cacher((config: Config) => {
    const onscreen_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, onscreen_frag_shader_code).expect();
    const onscreen_program = config.render_server.render_state.create_Program(QuadVertexShader.get(config), onscreen_frag_shader).expect();

    const uniform_screen_location = config.render_server.render_state.get_ProgramUniformLocation(onscreen_program, 'u_screen');
    const uniform_screen_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, onscreen_program, uniform_screen_location!, 0);
    uniform_screen_slot.commit();

    const uniform_colormap_location = config.render_server.render_state.get_ProgramUniformLocation(onscreen_program, 'u_colormap');
    const uniform_colormap_slot = new WebGL2RenderStateUintUniformSlot(config.render_server.render_state, onscreen_program, uniform_colormap_location!, 0);
    uniform_colormap_slot.commit();

    return { onscreen_program, uniform_colormap_slot };
});

export class EditorRenderer3D extends Renderer3D {
    public readonly render_queue_0 = new Renderer3DQueue();
    public readonly render_queue_1 = new Renderer3DQueue();

    private readonly lights_data: Ref<RenderServerLightsData> = new Ref(this.config.render_server.create_LightsData(64, 64));

    // cache items
    private readonly quad_geometry = QuadGeometry.get(this.config);
    private readonly on_screen_program = OnscreenProgramUniform.get(this.config).onscreen_program;
    private readonly on_screen_uniform_colormap_slot = OnscreenProgramUniform.get(this.config).uniform_colormap_slot;

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
            this.on_screen_uniform_colormap_slot.value = 0;
            this.on_screen_uniform_colormap_slot.commit();
            this.render_server.render_state.draw_Elements(this.on_screen_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
        }
    }

    static #size: Vector2 = new Vector2();

    public render(world: World3D, viewport: Viewport, once: boolean): void {
        if (this._render_pipeline.is_empty) return;

        const pipeline = this._render_pipeline.expect;

        const time = viewport.get_SceneTree()!.time;
        const cam = viewport.get_Camera3D()!.get_Camera();
        const cam_world = cam.global_transform;
        const cam_projection = cam.projection;
        const cam_is_orthogonal = cam.is_orthogonal;
        const cam_frustum = cam.get_Frustum();
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
        this.render_server.set_EnvironmentUniforms();

        const world_3d = world.visual_world;
        const sky_texture = world_3d.sky_texture.expect;
        this.render_server.use_SkyTexture(sky_texture);

        // update lights
        const lights_data = this.lights_data.expect;
        lights_data.clear_Lights();
        let light_idx = 0;
        for (const light of world_3d.lights) {
            if (light_idx >= lights_data.max_light_count) break;
            if (!light.visible) continue;
            light_idx = light.fill_LightData(lights_data, light_idx, 0);
            light_idx++;
        }
        lights_data.commit_AllLightsData();
        this.render_server.use_LightsData(lights_data);

        // fill up render queue
        let total_objects_count = 0;
        let rendered_objects_count = 0;
        this.render_queue_0.reset();
        this.render_queue_1.reset();
        for (const mesh of world_3d.meshes) {
            total_objects_count++;
            const render_queue = mesh.render_queue;
            const queue = render_queue === 0 ? this.render_queue_0 : this.render_queue_1;
            if (queue !== undefined) if (mesh.fill_RenderQueue(queue, cam_mask, cam_frustum)) rendered_objects_count++;
        }

        pipeline.set_Size(size);

        pipeline.render(this, world, viewport, once);

        this.render_server.use_LightsData(undefined);

        this.render_OnScreen(pipeline.texture, x, y, width, height);

        if (once) {
            this.render_queue_0.clear();
            this.render_queue_1.clear();
        }

        // debug
        if (viewport.debug) {
            const delta = viewport.get_SceneTree()!.delta;
            debug_text.innerHTML = `FPS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${(1 / delta).toFixed(3)}<br>FrameDelta: ${delta.toFixed(4)} ms<br>RenderObjs: ${rendered_objects_count} / ${total_objects_count}<br>Solid Objs: ${this.render_queue_0.solid_pointer + 1 + this.render_queue_1.solid_pointer + 1}<br>Trans Objs: ${this.render_queue_0.transparent_pointer + 1 + this.render_queue_1.transparent_pointer + 1}<br>Draw Calls: ${'???'}<br>Tweens : ${viewport.get_SceneTree()!.tween_processing_count}`;
        }
    }

    public dispose() {
        this.render_queue_0.dispose();
        this.render_queue_1.dispose();
        this.render_pipeline?.dispose();
    }
}