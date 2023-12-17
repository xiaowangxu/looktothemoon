import type { Viewport } from "./nodes/Node";
import type { Camera3D } from "./nodes/camera3ds/Camera3D";
import { World3D } from "./worlds/world3ds/World3D";
import { RenderServer, RenderServerPlainColorTexture } from "./render_server/RenderServer";
import { RenderServerLightType } from "./render_server/RenderServerLightData";
import { vec3 } from "../fivepebble/linear_algebra/Vector3";
import { color } from "../fivepebble/graphics/Color";
import { Deg2Rad } from "../fivepebble/Scalar";
import { RenderStateBufferUsage, RenderStateDataType, RenderStatePrimitiveType, RenderStateShaderType, RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureType, RenderStateUniformType } from "../sliverofstraw/RenderState";
import { RenderDeviceAttributeBufferView, RenderDeviceIndexAttributeBuffer, RenderDeviceVector2AttributeBuffer } from "../sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { Vector2, vec2 } from "../fivepebble/linear_algebra/Vector2";
import { WebGL2RenderStateTextureUniformSlot } from "../sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateUniformSlot";

const RS = RenderServer;
const lights_data = RenderServer.create_LightsData(64, 64);

function update_Lights() {
	for (let i = 0; i < lights_data.max_light_count; i++) {
		const radius = Math.random() * 4.0;
		lights_data.set_Light(
			i,
			RenderServerLightType.PointLight,
			undefined,
			vec3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.75) * 2),
			vec3(0, 0, 0),
			color(Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2),
			2.0,
			undefined,
			radius,
			radius + Math.random(),
		);
	}

	lights_data.set_Light(0, RenderServerLightType.SpotLight, undefined, vec3(-2, 2, -2.2), vec3(1, -1, 1), color(0, 0, 5), 2.0, 0xffffffff, 45 * Deg2Rad, 0 * Deg2Rad, 3, 7);
	lights_data.set_Light(1, RenderServerLightType.SpotLight, undefined, vec3(0.3, 0.3, 5.0), vec3(0, 0, -1), color(10, 0, 0), 2.0, 0xffffffff, 12 * Deg2Rad, 4 * Deg2Rad, 10, 11);
	lights_data.set_Light(2, RenderServerLightType.SpotLight, undefined, vec3(-0.3, 0.3, 5.0), vec3(0, 0, -1), color(0, 10, 0), 2.0, 0xffffffff, 12 * Deg2Rad, 4 * Deg2Rad, 10, 11);
	lights_data.set_Light(3, RenderServerLightType.SpotLight, undefined, vec3(0.0, -0.15, 5.0), vec3(0, 0, -1), color(0, 0, 10), 2.0, 0xffffffff, 12 * Deg2Rad, 4 * Deg2Rad, 10, 11);

	lights_data.set_Light(10, RenderServerLightType.DirectionalLight, undefined, vec3(-1, -1, -1), undefined, color(0, 0.12, 0));
	lights_data.set_Light(11, RenderServerLightType.DirectionalLight, undefined, vec3(1, 1, 1), undefined, color(0.4, 0.4, 0.4));
}

update_Lights();

// #region quad surface

const quad_position = new RenderDeviceVector2AttributeBuffer(RS, RenderStateBufferUsage.StaticDraw, [
	/* 0 */vec2(-1, 1),			//   1  0 ------ 2
	/* 1 */vec2(-1, -1),		//   |  |        |
	/* 2 */vec2(1, 1),			//   |  |        |
	/* 3 */vec2(1, -1),			//  -1  1 ------ 3
	/*                        *///     -1 ------ 1
]);
const quad_index = new RenderDeviceIndexAttributeBuffer(RS, RenderStateBufferUsage.StaticDraw, [0, 1, 2, 3]);
const quad_surface = RS.create_Geometry();
quad_surface.set_Geometry(RenderStatePrimitiveType.TriangleStrip, { position: quad_position }, quad_index);

// #endregion

// #region quad shader

const quad_vert_shader_code = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

out vec2 v_uv;

void main() {
	gl_Position = vec4(a_position, 1.0, 1.0);
	v_uv = (a_position + 1.0) / 2.0;
}
`;
const quad_vert_shader = RS.render_state.create_Shader(RenderStateShaderType.Vertex, quad_vert_shader_code).expect();

// #endregion 

// #region full screen quad

const onscreen_frag_shader_code = `#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D screen;

layout(location = 0) out vec4 o_color;

void main() {
	o_color = vec4(texture(screen, vec2(v_uv.x, 1.0 - v_uv.y)).rgba);
	float r = o_color.r;
	o_color.r = r <= 0.0031308 ? (12.92 * r) : (1.055 * pow(r, 1.0 / 2.4) - 0.055);
	float g = o_color.g;
	o_color.g = g <= 0.0031308 ? (12.92 * g) : (1.055 * pow(g, 1.0 / 2.4) - 0.055);
	float b = o_color.b;
	o_color.b = b <= 0.0031308 ? (12.92 * b) : (1.055 * pow(b, 1.0 / 2.4) - 0.055);
	if (v_uv.x < 0.01) o_color = vec4(0.0, v_uv.y, 0.0, 1.0);
	if (v_uv.y < 0.01) o_color = vec4(v_uv.x, 0.0, 0.0, 1.0);
}
`;
const onscreen_frag_shader = RS.render_state.create_Shader(RenderStateShaderType.Fragment, onscreen_frag_shader_code).expect();
const onscreen_program = RS.render_state.create_Program(quad_vert_shader, onscreen_frag_shader).expect();

const uniform_screen_location = RS.render_state.get_ProgramUniformLocation(onscreen_program, 'screen');
const uniform_screen_slot = new WebGL2RenderStateTextureUniformSlot(RS.render_state, onscreen_program, RenderStateUniformType.Tex2D, uniform_screen_location!, undefined, undefined);

// #endregion

export class Renderer3D {
	public readonly canvas: HTMLCanvasElement;
	private readonly ctx: CanvasRenderingContext2D;

	private base_size: Vector2 = new Vector2(0, 0);
	private size: Vector2 = new Vector2(0, 0);
	private pixel_ratio: number = 1;

	private size_changed: boolean = true;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.canvas.style.width = '100%';
		this.canvas.style.height = '100%';
		const ctx = this.canvas.getContext('2d');
		if (ctx === null) throw new Error('<Renderer3D> constructor: can not create canvas 2d context');
		this.ctx = ctx;
	}

	public resize(width: number, height: number) {
		const size = vec2(width, height);
		if (!this.base_size.equal(size)) {
			this.base_size = size;
			this.size = this.base_size.mult_Number(this.pixel_ratio);
			this.size_changed = true;
		}
	}

	public set_PixelRatio(pixel_ratio: number) {
		if (this.pixel_ratio !== pixel_ratio) {
			this.pixel_ratio = pixel_ratio;
			this.size = this.base_size.mult_Number(this.pixel_ratio);
			this.size_changed = true;
		}
	}

	public render(world: World3D, viewport: Viewport, camera: Camera3D): void {
		const time = viewport.get_SceneTree()!.time;
		const cam = camera.get_Camera();
		const cam_world = cam.global_transform;
		const cam_projection = cam.projection;
		const cam_frustum = cam.get_Frustum();

		const sky_texture = world.get_VisualWorld().sky_texture.expect;

		const { x, y } = this.size;

		// resize
		if (this.size_changed) {
			this.size_changed = false;
			this.canvas.width = x;
			this.canvas.height = y;
			const rs_size_w = Math.max(RS.canvas.width, x);
			const rs_size_h = Math.max(RS.canvas.height, y);
			if (RS.canvas.width !== rs_size_w || RS.canvas.height !== rs_size_h) {
				RS.canvas.width = rs_size_w;
				RS.canvas.height = rs_size_h;
			}
		}

		// on screen
		uniform_screen_slot.texture = sky_texture;
		uniform_screen_slot.commit();
		RS.render_state.use_FrameBuffer(undefined);
		RS.render_state.set_ViewportProxy(0, 0, x, y);
		RS.render_state.set_ScissorProxy(0, 0, x, y);
		RS.render_state.draw_Elements(onscreen_program, quad_surface.vertex_array, RenderStateDataType.UnsignedInt, 1);

		this.ctx.drawImage(RS.canvas, 0, RS.canvas.height - y, x, y, 0, 0, x, y);
		this.ctx.beginPath();
		this.ctx.moveTo(100, 100);
		this.ctx.lineTo(200, 100);
		this.ctx.lineTo(200, 200);
		this.ctx.strokeStyle = `hsl(${(time * 100 + parseFloat(viewport.readable_name) * 4) % 360}deg, 50%, 50%)`;
		this.ctx.lineWidth = 5;
		this.ctx.stroke();
		this.ctx.closePath();
	}

	public dispose() {
	}
}