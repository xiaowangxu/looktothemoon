import { Matrix3 } from "../math/linear_algebra/Matrix3";
import { Matrix4 } from "../math/linear_algebra/Matrix4";
import { Vector3, vec3 } from "../math/linear_algebra/Vector3";
import { Vector2, vec2 } from "../math/linear_algebra/Vector2";
import { Ref } from "../utils/RefCounted";
import { RenderStateBufferUsage, RenderStatePrimitiveType, RenderStateShaderType, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType, RenderStateTextureWrap, RenderStateValueType } from "./RenderState";
import { RenderDeviceIndexAttributeBuffer, RenderDeviceVector3AttributeBuffer, RenderDeviceVector2AttributeBuffer } from "./render_device_objects/RenderDeviceAttributeBuffer";
import { WebGL2RenderDevice } from "./webgl2/WebGL2RenderDevice";
import { WebGL2RenderState } from "./webgl2/WebGL2RenderState";
import { process_WebGL2ShaderCode } from "./webgl2/WebGL2ShaderProcessor";
import { WebGL2RenderDeviceMaterialSet } from "./webgl2/webgl2_render_device_objects/WebGL2RenderDeviceMaterialSet";
import { WebGL2RenderDeviceRenderableSurface } from "./webgl2/webgl2_render_device_objects/WebGL2RenderDeviceRenderableSurface";
import { WebGL2RenderDeviceSurface } from "./webgl2/webgl2_render_device_objects/WebGL2RenderDeviceSurface";
import { ImageLoader } from "../engine/loaders/ImageLoader";
import { vec4 } from "../math/linear_algebra/Vector4";

const onscreen = document.getElementById('test-canvas') as HTMLCanvasElement;
const on_screen_ctx = onscreen.getContext('2d');

const canvas = new OffscreenCanvas(2048, 2048);
const render_device = new WebGL2RenderDevice(canvas);

// texture
import { FImage } from './test-image';
const texture = render_device.render_state.create_Texture(RenderStateTextureType.Tex2D, RenderStateTextureFormat.RGBA8, RenderStateTextureWrap.MirrorRepeat).expect();
render_device.render_state.alloc_Texture(texture, 256, 256, 0, FImage);
render_device.render_state.generate_Mipmap(texture);

const texture2 = render_device.render_state.create_Texture(RenderStateTextureType.Tex2D, RenderStateTextureFormat.RGBA8, RenderStateTextureWrap.MirrorRepeat, RenderStateTextureWrap.MirrorRepeat, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
render_device.render_state.alloc_Texture(texture2, 2, 2, 0, new Uint8ClampedArray([
	255, 0, 255, 255,
	255, 255, 0, 255,
	0, 255, 255, 255,
	255, 255, 255, 255,
]));

const surface = new WebGL2RenderDeviceSurface(render_device);
const positionbuffer = new RenderDeviceVector3AttributeBuffer(
	render_device,
	RenderStateBufferUsage.StaticDraw,
	[
		vec3(0.5, 0.5, 0.5),
		vec3(0.5, 0.5, -0.5),
		vec3(0.5, -0.5, 0.5),
		vec3(0.5, -0.5, -0.5),
		vec3(-0.5, 0.5, -0.5),
		vec3(-0.5, 0.5, 0.5),
		vec3(-0.5, -0.5, -0.5),
		vec3(-0.5, -0.5, 0.5),
		vec3(-0.5, 0.5, -0.5),
		vec3(0.5, 0.5, -0.5),
		vec3(-0.5, 0.5, 0.5),
		vec3(0.5, 0.5, 0.5),
		vec3(-0.5, -0.5, 0.5),
		vec3(0.5, -0.5, 0.5),
		vec3(-0.5, -0.5, -0.5),
		vec3(0.5, -0.5, -0.5),
		vec3(-0.5, 0.5, 0.5),
		vec3(0.5, 0.5, 0.5),
		vec3(-0.5, -0.5, 0.5),
		vec3(0.5, -0.5, 0.5),
		vec3(0.5, 0.5, -0.5),
		vec3(-0.5, 0.5, -0.5),
		vec3(0.5, -0.5, -0.5),
		vec3(-0.5, -0.5, -0.5),
	]
);
const normalbuffer = new RenderDeviceVector3AttributeBuffer(
	render_device,
	RenderStateBufferUsage.StaticDraw,
	[
		vec3(1, 0, 0),
		vec3(1, 0, 0),
		vec3(1, 0, 0),
		vec3(1, 0, 0),
		vec3(-1, 0, 0),
		vec3(-1, 0, 0),
		vec3(-1, 0, 0),
		vec3(-1, 0, 0),
		vec3(0, 1, 0),
		vec3(0, 1, 0),
		vec3(0, 1, 0),
		vec3(0, 1, 0),
		vec3(0, -1, 0),
		vec3(0, -1, 0),
		vec3(0, -1, 0),
		vec3(0, -1, 0),
		vec3(0, 0, 1),
		vec3(0, 0, 1),
		vec3(0, 0, 1),
		vec3(0, 0, 1),
		vec3(0, 0, -1),
		vec3(0, 0, -1),
		vec3(0, 0, -1),
		vec3(0, 0, -1),
	]
)
const uvbuffer = new RenderDeviceVector2AttributeBuffer(
	render_device,
	RenderStateBufferUsage.StaticDraw,
	[
		vec2(0, 1),
		vec2(1, 1),
		vec2(0, 0),
		vec2(1, 0),
		vec2(0, 1),
		vec2(1, 1),
		vec2(0, 0),
		vec2(1, 0),
		vec2(0, 1),
		vec2(1, 1),
		vec2(0, 0),
		vec2(1, 0),
		vec2(0, 1),
		vec2(1, 1),
		vec2(0, 0),
		vec2(1, 0),
		vec2(0, 1),
		vec2(1, 1),
		vec2(0, 0),
		vec2(1, 0),
		vec2(0, 1),
		vec2(1, 1),
		vec2(0, 0),
		vec2(1, 0),
	]
);
const indexbuffer = new RenderDeviceIndexAttributeBuffer(
	render_device,
	RenderStateBufferUsage.StaticDraw,
	[0, 2, 1, 2, 3, 1, 4, 6, 5, 6, 7, 5, 8, 10, 9, 10, 11, 9, 12, 14, 13, 14, 15, 13, 16, 18, 17, 18, 19, 17, 20, 22, 21, 22, 23, 21]
);
surface.set_AttributeBuffer(RenderStatePrimitiveType.Triangles, indexbuffer.element_count, {
	a_position: positionbuffer,
	a_normal: normalbuffer,
	a_uv: uvbuffer,
}, indexbuffer);

// shader
const attributes = {
	a_position: { type: RenderStateValueType.Vec3 },
	a_normal: { type: RenderStateValueType.Vec3 },
	a_uv: { type: RenderStateValueType.Vec2 },
};
const uniforms = { u_color: { type: RenderStateValueType.Vec4 }, u_texture: { type: RenderStateValueType.Tex2D }, u_texture2: { type: RenderStateValueType.Tex2D } };
const varyings = { v_world: { type: RenderStateValueType.Vec3 }, v_normal: { type: RenderStateValueType.Vec3 }, v_uv: { type: RenderStateValueType.Vec2 } };
const outputs = { o_color: { type: RenderStateValueType.Vec4, location: 0 } };

const f_vertexShaderSource = process_WebGL2ShaderCode(RenderStateShaderType.Vertex,
	attributes, uniforms, varyings, outputs,
	`vec4 world = model_world * vec4(a_position + (sin(time / 3.0) + 1.0) / 5.0 * a_normal, 1.0);
gl_Position = camera_projection * camera_view * world;
v_normal = normalize(mat3(transpose(inverse(model_world))) * a_normal);
v_uv = a_uv;
v_world = world.xyz;`
);
const f_fragmentShaderSource = process_WebGL2ShaderCode(RenderStateShaderType.Fragment,
	attributes, uniforms, varyings, outputs,
	`o_color = vec4((v_normal + 1.0) / 2.0, 1.0);`
);
const f_fragmentShaderSource2 = process_WebGL2ShaderCode(RenderStateShaderType.Fragment,
	attributes, uniforms, varyings, outputs,
	`//  / (sin(time) + 1.5)
if (v_uv.x <= 0.5) {
	o_color = vec4(texture(u_texture, vec2(v_uv.x * 2.0, v_uv.y)).rgb, 1.0) * u_color;
}
else {
	o_color = vec4(texture(u_texture2, vec2(v_uv.x * 2.0 - 1.0, v_uv.y)).rgb, 1.0);
}`
);

const vert_shader = render_device.render_state.create_Shader(RenderStateShaderType.Vertex, f_vertexShaderSource).expect();
const frag_shader = render_device.render_state.create_Shader(RenderStateShaderType.Fragment, f_fragmentShaderSource).expect();
const frag_shader2 = render_device.render_state.create_Shader(RenderStateShaderType.Fragment, f_fragmentShaderSource2).expect();

const material = new Ref(new WebGL2RenderDeviceMaterialSet(render_device,
	vert_shader, {},
	{
		default: {
			shader: frag_shader,
			uniforms: {}
		},
		test: {
			shader: frag_shader2,
			uniforms: {
				u_color: { type: RenderStateValueType.Vec4, default: vec4(1, 1, 1, 1) },
				u_texture: { type: RenderStateValueType.Tex2D, default: undefined },
				u_texture2: { type: RenderStateValueType.Tex2D, default: undefined },
			}
		}
	}
));

console.log(material.expect);

const renderable_surface = new WebGL2RenderDeviceRenderableSurface(render_device);
renderable_surface.set_Material(material.expect);
renderable_surface.set_Surface(surface);

const camera_world = Matrix4.from_BasisPosition(undefined, new Vector3(0, 0, 3));
const camera_projection = Matrix4.make_PerspectiveFovProjection(100 / 180 * Math.PI, 1, 0.01, 1000);

render_device.set_WorldUniform('camera_world', camera_world.typed_transposed_array_f32);
render_device.set_WorldUniform('camera_view', camera_world.inverse().typed_transposed_array_f32);
render_device.set_WorldUniform('camera_projection', camera_projection.typed_transposed_array_f32);

let stage = 'test';

const render_state = render_device.render_state as WebGL2RenderState;

material.expect.set_Uniform<RenderStateValueType.Tex2D>(stage, 'u_texture', texture);
material.expect.set_Uniform<RenderStateValueType.Tex2D>(stage, 'u_texture2', texture2);

function render(time: number) {
	render_device.set_WorldUniform('time', new Float32Array([time]));
	render_state.set_ViewportProxy(0, 0, 2048, 2048);
	render_state.set_ClearColorProxy(0.2, 0.2, 0.2, 1);
	render_state.gl.clear(render_state.gl.COLOR_BUFFER_BIT | render_state.gl.DEPTH_BUFFER_BIT);

	const model_world = Matrix4.from_BasisPosition(Matrix3.make_RotateX(time / 2).compose(Matrix3.make_RotateY(time * 0.15)), vec3(0, 0, 0));
	material.expect.set_Uniform<RenderStateValueType.Mat4>(stage, 'model_world', model_world);
	material.expect.set_Uniform<RenderStateValueType.Vec4>(stage, 'u_color', vec4(1, 0.0, 0.0, 1));
	render_device.render_Renderable(stage, renderable_surface);

	const model_world2 = Matrix4.from_BasisPosition(Matrix3.make_Scale(0.5, 0.5, 0.5), vec3(2, 0, 0));
	material.expect.set_Uniform<RenderStateValueType.Mat4>(stage, 'model_world', model_world2);
	material.expect.set_Uniform<RenderStateValueType.Vec4>(stage, 'u_color', vec4(0.0, 1, 0.0, 1));
	render_device.render_Renderable(stage, renderable_surface);

	const model_world3 = Matrix4.from_BasisPosition(Matrix3.make_Scale(0.5, 0.5, 0.5), vec3(-2, 0, 0));
	material.expect.set_Uniform<RenderStateValueType.Mat4>(stage, 'model_world', model_world3);
	material.expect.set_Uniform<RenderStateValueType.Vec4>(stage, 'u_color', vec4(0.0, 0.0, 1, 1));
	render_device.render_Renderable(stage, renderable_surface);

	on_screen_ctx?.drawImage(canvas, 0, 0);
}

// setInterval(() => {
// 	stage = stage === 'default' ? 'test' : 'default';
// }, 500);

// setTimeout(() => {
// 	console.log("> set uniform");
// 	material.expect.set_Uniform<RenderStateValueType.Tex2D>(stage, 'u_texture', undefined);
// }, 4000);

// setTimeout(() => {
// 	console.log("> set uniform");
// 	material.expect.set_Uniform<RenderStateValueType.Tex2D>(stage, 'u_texture2', undefined);
// }, 2000);

let time = 0;

function animation() {
	requestAnimationFrame(animation);
	time += 0.033;
	const x = (Math.sin(time) + 1) / 2;
// surface.get_AttributeBuffer('a_position')?.update_Data([vec2(x, -0.5), vec2(0.5, x)], 2);
	render(time);
}

animation();