import { Matrix3 } from "../math/linear_algebra/Matrix3";
import { Matrix4, mat4 } from "../math/linear_algebra/Matrix4";
import { Vector3, vec3 } from "../math/linear_algebra/Vector3";
import { vec2 } from "../math/linear_algebra/Vector2";
import { RenderStateBufferUsage, RenderStatePrimitiveType, RenderStateShaderType, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType, RenderStateTextureWrap, RenderStateValueType } from "./RenderState";
import { RenderDeviceIndexAttributeBuffer, RenderDeviceVector3AttributeBuffer, RenderDeviceVector2AttributeBuffer, RenderDeviceMatrix4AttributeBuffer } from "./render_device_objects/RenderDeviceAttributeBuffer";
import { WebGL2RenderDevice } from "./webgl2/WebGL2RenderDevice";
import { WebGL2RenderState, WebGL2RenderStateFrameBufferAttachmentPoint } from "./webgl2/WebGL2RenderState";
import { process_WebGL2ShaderCode } from "./webgl2/WebGL2ShaderProcessor";
import { WebGL2RenderDeviceMaterialSet } from "./webgl2/webgl2_render_device_objects/WebGL2RenderDeviceMaterialSet";
import { WebGL2RenderDeviceRenderableSurface } from "./webgl2/webgl2_render_device_objects/WebGL2RenderDeviceRenderableSurface";
import { WebGL2RenderDeviceSurface } from "./webgl2/webgl2_render_device_objects/WebGL2RenderDeviceSurface";
import { vec4 } from "../math/linear_algebra/Vector4";

const calculights = `
ivec3 lights_size = textureSize(lights, 0);
int lights_count = lights_size.x * lights_size.y;
const int lights_max_count = 32;
for (int i = 0; i < lights_count; i++) {
	if (i >= lights_max_count) break;
	int x = i % lights_size.x;
	int y = i / lights_size.x;
	vec4 l_position_type = texelFetch(lights, ivec3(x, y, 0), 0);
	vec3 l_position = l_position_type.rgb;
	int l_type = int(l_position_type.a);
	if (l_type < 0) continue;
	vec4 l_color_intensity = texelFetch(lights, ivec3(x, y, 1), 0);
	float l_intensity = l_color_intensity.a;
	vec3 l_color = l_color_intensity.rgb;
	if (l_type == 0) {
		// ambient light
		light_color += vec4(l_color, 1.0) * l_intensity;
	}
	else if (l_type == 1) {
		// directional light
		vec3 l_dir = normalize(l_position);
		float dot_normal = dot(normal, l_dir);
		if (dot_normal > 0.0) {
			light_color += dot_normal * vec4(l_color, 1.0) * l_intensity;
		}
	}
	else if (l_type == 2) {
		// point light
		float l_distance = distance(l_position, v_world);
		vec3 l_lookat = normalize(l_position - v_world);
		float strength = pow(l_distance + 1.0, 2.0);
		float dot_normal = dot(normal, l_lookat);
		if (dot_normal > 0.0) {
			light_color += dot_normal * (1.0 / strength) * vec4(l_color, 1.0) * l_intensity;
		}
	}
}
`;

const onscreen = document.getElementById('test-canvas') as HTMLCanvasElement;
const on_screen_ctx = onscreen.getContext('2d');

const canvas = new OffscreenCanvas(1024, 1024);
const render_device = new WebGL2RenderDevice(canvas);

// #region surface

// texture
import { FImage } from './test-image';
import { EditorViewport } from "../../app/EditorScene";
const texture = render_device.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1, RenderStateTextureWrap.MirrorRepeat).expect();
render_device.render_state.alloc_Texture2D(texture, 256, 256, 0, FImage);
render_device.render_state.generate_Mipmap(texture);

const texture2 = render_device.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1, RenderStateTextureWrap.MirrorRepeat, RenderStateTextureWrap.MirrorRepeat, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
render_device.render_state.alloc_Texture2D(texture2, 2, 2, 0, new Uint8ClampedArray([
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
surface.set_AttributeBuffer(RenderStatePrimitiveType.Triangles, {
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
const uniforms = { u_color: { type: RenderStateValueType.Vec4 }, u_texture: { type: RenderStateValueType.Tex2D } };
const varyings = { v_world: { type: RenderStateValueType.Vec3 }, v_normal: { type: RenderStateValueType.Vec3 }, v_uv: { type: RenderStateValueType.Vec2 } };
const outputs = { o_color: { type: RenderStateValueType.Vec4, location: 0 }, o_color1: { type: RenderStateValueType.Vec4, location: 1 } };

const f_vertexShaderSource = process_WebGL2ShaderCode(RenderStateShaderType.Vertex,
	attributes, uniforms, varyings, outputs,
	`vec4 world = model_world * vec4(a_position, 1.0);
gl_Position = camera_projection * inverse(camera_world) * world;
v_normal = normalize(mat3(transpose(inverse(model_world))) * a_normal);
v_uv = a_uv;
v_world = world.xyz;`
);
const f_fragmentShaderSource = process_WebGL2ShaderCode(RenderStateShaderType.Fragment,
	attributes, uniforms, varyings, outputs,
	``
);
const f_fragmentShaderSource2 = process_WebGL2ShaderCode(RenderStateShaderType.Fragment,
	attributes, uniforms, varyings, outputs,
	`vec3 normal = normalize(v_normal);
vec4 albedo_color = vec4(1.0, 1.0, 1.0, 1.0);
vec4 light_color = vec4(0.0, 0.0, 0.0, 1.0);

${calculights}

o_color = albedo_color * light_color;
// o_color = vec4(0.5, 0.5, 1.0, 0.2);
o_color1 = vec4(normal, 1.0);`
);

const vert_shader = render_device.render_state.create_Shader(RenderStateShaderType.Vertex, f_vertexShaderSource).expect();
const frag_shader = render_device.render_state.create_Shader(RenderStateShaderType.Fragment, f_fragmentShaderSource).expect();
const frag_shader2 = render_device.render_state.create_Shader(RenderStateShaderType.Fragment, f_fragmentShaderSource2).expect();

const material = new WebGL2RenderDeviceMaterialSet(render_device,
	vert_shader, {},
	{
		depth_prepass: {
			shader: frag_shader,
			uniforms: {}
		},
		test: {
			shader: frag_shader2,
			uniforms: {
				u_color: { type: RenderStateValueType.Vec4, default: vec4(1, 1, 1, 1) },
				u_texture: { type: RenderStateValueType.Tex2D, default: undefined },
			}
		}
	}
);

const renderable_surface = new WebGL2RenderDeviceRenderableSurface(render_device);
renderable_surface.set_Material(material);
renderable_surface.set_Surface(surface);

let stage = 'test';

const render_state = render_device.render_state as WebGL2RenderState;

material.set_Uniform<RenderStateValueType.Tex2D>(stage, 'u_texture', texture);
material.set_Uniform<RenderStateValueType.Tex2D>(stage, 'u_texture2', texture2);

// #endregion

// #region instance surface

const mat4buffer = new RenderDeviceMatrix4AttributeBuffer(render_device, RenderStateBufferUsage.DynamicDraw, [
	Matrix4.make_Identity(), Matrix4.make_Identity(),
	Matrix4.make_Identity(), Matrix4.make_Identity(),
	Matrix4.make_Identity(), Matrix4.make_Identity(),
	Matrix4.make_Identity(), Matrix4.make_Identity(),
	Matrix4.make_Identity(), Matrix4.make_Identity(),
	Matrix4.make_Identity(), Matrix4.make_Identity(),
	Matrix4.make_Identity(),
], 1);
const surface2 = new WebGL2RenderDeviceSurface(render_device);
surface2.set_AttributeBuffer(RenderStatePrimitiveType.Triangles, {
	a_position: positionbuffer,
	a_normal: normalbuffer,
	a_uv: uvbuffer,
	a_model_world: mat4buffer,
}, indexbuffer);
surface2.set_InstanceCount(13);
const attributes2 = {
	a_position: { type: RenderStateValueType.Vec3 },
	a_normal: { type: RenderStateValueType.Vec3 },
	a_uv: { type: RenderStateValueType.Vec2 },
	a_model_world: { type: RenderStateValueType.Mat4 },
};
const uniforms2 = { u_color: { type: RenderStateValueType.Vec4 }, u_texture: { type: RenderStateValueType.Tex2D }, u_texture2: { type: RenderStateValueType.Tex2D } };
const varyings2 = { v_world: { type: RenderStateValueType.Vec3 }, v_normal: { type: RenderStateValueType.Vec3 }, v_uv: { type: RenderStateValueType.Vec2 } };
const outputs2 = { o_color: { type: RenderStateValueType.Vec4, location: 0 }, o_color1: { type: RenderStateValueType.Vec4, location: 1 } };
const f_vertexShaderSource2 = process_WebGL2ShaderCode(RenderStateShaderType.Vertex,
	attributes2, uniforms2, varyings2, outputs2,
	`vec4 world = a_model_world * vec4(a_position, 1.0);
gl_Position = camera_projection * inverse(camera_world) * world;
v_normal = normalize(mat3(transpose(inverse(a_model_world))) * a_normal);
v_uv = a_uv;
v_world = world.xyz;`
);
const f_fragmentShaderSource3 = process_WebGL2ShaderCode(RenderStateShaderType.Fragment,
	attributes2, uniforms2, varyings2, outputs2,
	`vec3 normal = normalize(v_normal);
vec4 albedo_color = vec4(1.0, 1.0, 1.0, 1.0);
vec4 light_color = vec4(0.0, 0.0, 0.0, 1.0);

${calculights}

o_color = albedo_color * light_color;
// o_color = vec4(0.5, 0.5, 1.0, 0.2);
o_color1 = vec4(normal, 1.0);`
);
const vert_shader2 = render_device.render_state.create_Shader(RenderStateShaderType.Vertex, f_vertexShaderSource2).expect();
const frag_shader3 = render_device.render_state.create_Shader(RenderStateShaderType.Fragment, f_fragmentShaderSource3).expect();
const material2 = new WebGL2RenderDeviceMaterialSet(render_device,
	vert_shader2, {},
	{
		depth_prepass: {
			shader: frag_shader,
			uniforms: {}
		},
		test: {
			shader: frag_shader3,
			uniforms: {
				u_color: { type: RenderStateValueType.Vec4, default: vec4(1, 1, 1, 1) },
				u_texture: { type: RenderStateValueType.Tex2D, default: undefined },
				u_texture2: { type: RenderStateValueType.Tex2D, default: undefined },
			}
		}
	}
);

const renderable_surface2 = new WebGL2RenderDeviceRenderableSurface(render_device);
renderable_surface2.set_Material(material2);
renderable_surface2.set_Surface(surface2);
const texture3 = render_device.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1, RenderStateTextureWrap.MirrorRepeat, RenderStateTextureWrap.MirrorRepeat, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
render_device.render_state.alloc_Texture2D(texture3, 2, 2, 0, new Uint8ClampedArray([
	255, 255, 255, 255,
	255, 255, 255, 255,
	255, 0, 0, 255,
	0, 255, 0, 255,
]));
const texture4 = render_device.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA8, 1, RenderStateTextureWrap.MirrorRepeat, RenderStateTextureWrap.MirrorRepeat, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
render_device.render_state.alloc_Texture2D(texture4, 2, 2, 0, new Uint8ClampedArray([
	0, 0, 255, 255,
	255, 0, 255, 255,
	255, 255, 255, 255,
	255, 255, 255, 255,
]));
material2.set_Uniform<RenderStateValueType.Tex2D>(stage, 'u_texture', texture);
material2.set_Uniform<RenderStateValueType.Tex2D>(stage, 'u_texture2', texture4);

// #endregion

// #region full screen quad test

const position = new RenderDeviceVector2AttributeBuffer(render_device, RenderStateBufferUsage.StaticDraw, [
	/* 0 */vec2(-1, 1),			//  0 ------ 2
	/* 1 */vec2(-1, -1),		//  |        |
	/* 2 */vec2(1, 1),			//  |        |
	/* 3 */vec2(1, -1),			//  1 ------ 3
]);
const index = new RenderDeviceIndexAttributeBuffer(render_device, RenderStateBufferUsage.StaticDraw, [
	0, 1, 2, 3
]);
const quad_surface = new WebGL2RenderDeviceSurface(render_device);
quad_surface.set_AttributeBuffer(
	RenderStatePrimitiveType.TriangleStrip,
	{
		a_position: position,
	},
	index
);
const quad_attributes = {
	a_position: { type: RenderStateValueType.Vec3 },
	a_uv: { type: RenderStateValueType.Vec2 },
};
const quad_uniforms = { u_result: { type: RenderStateValueType.Tex2D }, u_result1: { type: RenderStateValueType.Tex2D } };
const quad_varyings = {};
const quad_outputs = { o_color: { type: RenderStateValueType.Vec4, location: 0 } };
const quad_vertexShaderSource = process_WebGL2ShaderCode(RenderStateShaderType.Vertex,
	quad_attributes, quad_uniforms, quad_varyings, quad_outputs,
	`gl_Position = vec4(a_position, 1.0);`
);
const quad_fragmentShaderSource = process_WebGL2ShaderCode(RenderStateShaderType.Fragment,
	quad_attributes, quad_uniforms, quad_varyings, quad_outputs,
	`vec2 uv = gl_FragCoord.xy / screen_size;
o_color = vec4(texture(u_result, uv).rgba);
float r = o_color.r;
o_color.r = r <= 0.0031308 ? (12.92 * r) : (1.055 * pow(r, 1.0 / 2.4) - 0.055);
float g = o_color.g;
o_color.g = g <= 0.0031308 ? (12.92 * g) : (1.055 * pow(g, 1.0 / 2.4) - 0.055);
float b = o_color.b;
o_color.b = b <= 0.0031308 ? (12.92 * b) : (1.055 * pow(b, 1.0 / 2.4) - 0.055);
// o_color.rgb = o_color.r > 1.0 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
`
);
const quad_vert_shader = render_device.render_state.create_Shader(RenderStateShaderType.Vertex, quad_vertexShaderSource).expect();
const quad_frag_shader = render_device.render_state.create_Shader(RenderStateShaderType.Fragment, quad_fragmentShaderSource).expect();
const quad_material = new WebGL2RenderDeviceMaterialSet(render_device,
	quad_vert_shader, {},
	{
		default: {
			shader: quad_frag_shader,
			uniforms: {}
		},
		test: {
			shader: quad_frag_shader,
			uniforms: {
				u_result: { type: RenderStateValueType.Tex2D, default: undefined },
				u_result1: { type: RenderStateValueType.Tex2D, default: undefined },
			}
		}
	}
);
const quad_renderable_surface = new WebGL2RenderDeviceRenderableSurface(render_device);
quad_renderable_surface.set_Material(quad_material);
quad_renderable_surface.set_Surface(quad_surface);

// #endregion

// #region frame buffer
const frame_buffer = render_device.render_state.create_FrameBuffer().expect();
const frame_buffer_depth_tex = render_device.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.D32F, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
render_device.render_state.alloc_Texture2D(frame_buffer_depth_tex, 1024, 1024, 0, undefined);
render_device.render_state.set_FrameBufferAttachment(frame_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_buffer_depth_tex);
render_device.render_state.enable_FrameBuffer(frame_buffer);

const frame_buffer2 = render_device.render_state.create_FrameBuffer().expect();
const frame_buffer_tex = render_device.render_state.create_Texture(RenderStateTextureType.Tex2D, true, RenderStateTextureFormat.RGBA32F, 1, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
render_device.render_state.alloc_Texture2D(frame_buffer_tex, 1024, 1024, 0, undefined);
render_device.render_state.set_FrameBufferAttachment(frame_buffer2, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, frame_buffer_tex);
render_device.render_state.set_FrameBufferAttachment(frame_buffer2, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, frame_buffer_depth_tex);
render_device.render_state.enable_FrameBuffer(frame_buffer2);

quad_material.set_Uniform<RenderStateValueType.Tex2D>('test', 'u_result', frame_buffer_tex);

// #endregion

const camera_world = Matrix4.from_BasisPosition(undefined, new Vector3(0, 0, 3));
const camera_projection = Matrix4.make_PerspectiveFovProjection(100 / 180 * Math.PI, 1, 0.01, 1000);

render_device.set_WorldUniform('camera_world', camera_world.typed_transposed_array_f32);
render_device.set_WorldUniform('camera_projection', camera_projection.typed_transposed_array_f32);
render_device.set_WorldUniform('screen_size', vec2(1024, 1024).typed_array_f32);
render_device.render_state.set_CapabilityProxy(render_state.gl.CULL_FACE, true);

function render(time: number) {
	const camera = EditorViewport.get_Camera3D()!.get_Camera()!;
	const camera_world = mat4(...camera.matrixWorld.elements).transpose();
	const camera_projection = mat4(...camera.projectionMatrix.elements).transpose();
	render_device.set_WorldUniform('camera_world', camera_world.typed_transposed_array_f32);
	render_device.set_WorldUniform('camera_projection', camera_projection.typed_transposed_array_f32);

	render_device.set_WorldUniform('time', new Float32Array([time]));
	// render_device.update_Lights();

	stage = 'depth_prepass';

	render_state.use_FrameBuffer(frame_buffer);
	render_state.set_ViewportProxy(0, 0, 1024, 1024);
	render_state.set_ScissorProxy(0, 0, 1024, 1024);
	render_state.set_ClearColorProxy(0.9, 0.9, 0.9, 1);
	render_state.set_DepthFuncProxy(render_state.gl.LEQUAL);
	render_state.set_DepthMaskProxy(true);
	render_state.gl.clear(render_state.gl.COLOR_BUFFER_BIT | render_state.gl.DEPTH_BUFFER_BIT);

	const model_world = Matrix4.from_BasisPosition(Matrix3.make_RotateY(time / 3).compose(Matrix3.make_RotateX(time / 2.12)), vec3(0, 0, -0.5));
	material.set_Uniform<RenderStateValueType.Mat4>(undefined, 'model_world', model_world);
	render_device.render_Renderable(stage, renderable_surface);

	const model_world_right0 = Matrix4.from_BasisPosition(Matrix3.make_Scale(0.5, 0.5, 0.5).compose(Matrix3.make_RotateY(time / 2)), vec3(2, 0, 0));
	const model_world_left0 = Matrix4.from_BasisPosition(Matrix3.make_Scale(0.5, 0.5, 0.5).compose(Matrix3.make_RotateY(-time / 2)), vec3(-2, 0, 0));
	const model_world_top0 = Matrix4.from_BasisPosition(Matrix3.make_Scale(0.5, 0.5, 0.5).compose(Matrix3.make_RotateX(-time / 2)), vec3(0, 2, 0));
	const model_world_bottom0 = Matrix4.from_BasisPosition(Matrix3.make_Scale(0.5, 0.5, 0.5).compose(Matrix3.make_RotateX(time / 2)), vec3(0, -2, 0));
	const model_world_left1 = Matrix4.from_BasisPosition(Matrix3.make_Scale(0.5, 0.5, 0.5).compose(Matrix3.make_RotateY(-time / 2)), vec3(-2, 2, 0));
	const model_world_top1 = Matrix4.from_BasisPosition(Matrix3.make_Scale(0.5, 0.5, 0.5).compose(Matrix3.make_RotateX(time / 2)), vec3(2, -2, 0));
	const model_world_bottom1 = Matrix4.from_BasisPosition(Matrix3.make_Scale(0.5, 0.5, 0.5).compose(Matrix3.make_RotateX(time / 2)), vec3(-2, -2, 0));
	const model_world_right1 = Matrix4.from_BasisPosition(Matrix3.make_Scale(0.5, 0.5, 0.5).compose(Matrix3.make_RotateY(time / 2)), vec3(2, 2, 0));

	const model_world_plane = Matrix4.from_BasisPosition(Matrix3.make_Scale(5, 5, 0.1).compose(Matrix3.make_RotateY(0)), vec3(0, 0, -1)); // Math.sin(time / 5) * 0.5

	const model_world_light1 = Matrix4.from_BasisPosition(Matrix3.make_Scale(0.0, 0.0, 0.0), vec3(1, 1, Math.sin(time) + 1.2));
	const model_world_light2 = Matrix4.from_BasisPosition(Matrix3.make_Scale(0.0, 0.0, 0.0), vec3(-1, -1, Math.sin(time) + 1.2));
	const model_world_light3 = Matrix4.from_BasisPosition(Matrix3.make_Scale(0.0, 0.0, 0.0), vec3(-1, 1, Math.sin(time) + 1.2));
	const model_world_light4 = Matrix4.from_BasisPosition(Matrix3.make_Scale(0.0, 0.0, 0.0), vec3(1, -1, Math.sin(time) + 1.2));

	mat4buffer.update_Data([
		model_world_right0, model_world_left0, model_world_top0, model_world_bottom0,
		model_world_right1, model_world_left1, model_world_top1, model_world_bottom1,
		model_world_light1, model_world_light2, model_world_light3, model_world_light4,
		model_world_plane
	], 0);
	render_device.render_Renderable(stage, renderable_surface2);

	stage = 'test';
	render_state.use_FrameBuffer(frame_buffer2);
	render_state.set_DepthFuncProxy(render_state.gl.EQUAL);
	render_state.set_DepthMaskProxy(false);
	// render_state.set_CapabilityProxy(render_state.gl.BLEND, true);
	// render_state.gl.blendFunc(render_state.gl.SRC_ALPHA, render_state.gl.ONE_MINUS_SRC_ALPHA);
	render_state.gl.clear(render_state.gl.COLOR_BUFFER_BIT);
	render_device.render_Renderable(stage, renderable_surface);
	render_device.render_Renderable(stage, renderable_surface2);

	render_state.use_FrameBuffer(undefined);
	render_state.set_DepthFuncProxy(render_state.gl.LEQUAL);
	// render_state.set_CapabilityProxy(render_state.gl.BLEND, false);
	render_state.gl.clear(render_state.gl.COLOR_BUFFER_BIT | render_state.gl.DEPTH_BUFFER_BIT);
	render_device.render_Renderable(stage, quad_renderable_surface);

	on_screen_ctx?.drawImage(canvas, 0, 0);
}

let time = 0;

function animation() {
	requestAnimationFrame(animation);
	time += 0.033;
	const x = (Math.sin(time) + 1) / 2;
	// surface.get_AttributeBuffer('a_position')?.update_Data([vec2(x, -0.5), vec2(0.5, x)], 2);
	render(time);
}

animation();