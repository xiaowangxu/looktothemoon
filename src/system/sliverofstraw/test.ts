import { Matrix4, mat4 } from "../math/linear_algebra/Matrix4";
import { Vector3, vec3 } from "../math/linear_algebra/Vector3";
import { RenderDevice } from "./RenderDevice";
import { RenderStateBufferUsage, RenderStatePrimitiveType, RenderStateShaderType } from "./RenderState";
import { RenderDeviceSurface } from "./render_device_objects/RenderDeviceSurface";
import { RenderDeviceIndexAttributeBuffer, RenderDeviceVector2AttributeBuffer, RenderDeviceVector3AttributeBuffer } from "./render_device_objects/RenderDeviceAttributeBuffer";
import { WebGL2RenderState } from "./webgl2/WebGL2RenderState";
import { vec2 } from "../math/linear_algebra/Vector2";
import { RenderDeviceRenderableSurface } from "./render_device_objects/RenderDeviceRenderableSurface";
import { RenderDeviceMaterial } from "./render_device_objects/RenderDeviceMaterial";
import { WebGL2RenderDevice } from "./webgl2/WebGL2RenderDevice";
import { WebGL2RenderDeviceRenderableSurface } from "./webgl2/webgl2_render_device_objects/WebGL2RenderDeviceRenderableSurface";
import { WebGL2RenderDeviceMaterial } from "./webgl2/webgl2_render_device_objects/WebGL2RenderDeviceMaterial";
import { WebGL2RenderDeviceSurface } from "./webgl2/webgl2_render_device_objects/WebGL2RenderDeviceSurface";
import { Matrix3 } from "../math/linear_algebra/Matrix3";

const onscreen = document.getElementById('test-canvas') as HTMLCanvasElement;
const on_screen_ctx = onscreen.getContext('2d');

const canvas = new OffscreenCanvas(2048, 2048); 
const render_device = new WebGL2RenderDevice(canvas);

const surface = new WebGL2RenderDeviceSurface(render_device);
const positionbuffer = new RenderDeviceVector3AttributeBuffer(
  render_device,
  RenderStateBufferUsage.StaticDraw,
  [
    vec3(0.5, 0.5 ,0.5 ),
vec3(0.5, 0.5 ,-0.5 ),
vec3(0.5, -0.5, 0.5 ),
vec3(0.5, -0.5, -0.5),
vec3(-0.5, 0.5 ,-0.5),
vec3(-0.5, 0.5 ,0.5),
vec3(-0.5, -0.5 ,-0.5),
vec3(-0.5, -0.5 ,0.5 ),
vec3(-0.5, 0.5 ,-0.5),
vec3(0.5, 0.5 ,-0.5 ),
vec3(-0.5, 0.5 ,0.5 ),
vec3(0.5, 0.5 ,0.5 ),
vec3(-0.5, -0.5 ,0.5 ),
vec3(0.5, -0.5 ,0.5 ),
vec3(-0.5, -0.5 ,-0.5 ),
vec3(0.5, -0.5 ,-0.5 ),
vec3(-0.5, 0.5 ,0.5 ),
vec3(0.5, 0.5 ,0.5 ),
vec3(-0.5, -0.5 ,0.5 ),
vec3(0.5, -0.5 ,0.5 ),
vec3(0.5, 0.5 ,-0.5 ),
vec3(-0.5, 0.5 ,-0.5 ),
vec3(0.5, -0.5 ,-0.5 ),
vec3(-0.5, -0.5 ,-0.5),
  ]
);
const normalbuffer = new RenderDeviceVector3AttributeBuffer(
    render_device,
    RenderStateBufferUsage.StaticDraw,
    [vec3(1, 0, 0),
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
// const colorbuffer = new RenderDeviceVector3AttributeBuffer(
//   render_device,
//   RenderStateBufferUsage.StaticDraw,
//   [
//     vec3(255, 0, 0),
//     vec3(0, 255, 0),
//     vec3(0, 0, 255),
//     vec3(255, 0, 255),
//   ]
// );
const indexbuffer = new RenderDeviceIndexAttributeBuffer(
  render_device,
  RenderStateBufferUsage.StaticDraw,
  [0,2,1,2,3,1,4,6,5,6,7,5,8,10,9,10,11,9,12,14,13,14,15,13,16,18,17,18,19,17,20,22,21,22,23,21]
);
surface.set_AttributeBuffer(RenderStatePrimitiveType.Triangles, indexbuffer.element_count, {
    a_position: positionbuffer,
    a_normal: normalbuffer,
    // a_color: colorbuffer,
}, indexbuffer);

console.log(surface);

// arraymesh.dispose();

// shader
console.groupCollapsed('shader');
const f_vertexShaderSource = `#version 300 es

uniform WorldUniforms {
  mat4 model_world;
  mat4 camera_world;
  mat4 camera_projection;
  vec2 screen_size;
  float time;
};

in vec3 a_position;
in vec3 a_normal;

out vec3 v_normal;

void main() {
  gl_Position = camera_projection * inverse(camera_world) * model_world * vec4(a_position + (sin(time / 3.0) + 1.0) / 5.0 * a_normal, 1.0);
  v_normal = normalize(mat3(transpose(inverse(model_world))) * a_normal);
}
`;
const f_fragmentShaderSource = `#version 300 es
precision highp float;
 
in vec3 v_normal;

uniform WorldUniforms {
    mat4 model_world;
    mat4 camera_world;
    mat4 camera_projection;
    vec2 screen_size;
    float time;
};

layout(location = 0) out vec4 outColor;
 
void main() {
  outColor = vec4((v_normal + 1.0) / 2.0, 1.0);
}
`;
const vert_shader = render_device.render_state.create_Shader(RenderStateShaderType.Vertex, f_vertexShaderSource).expect();
console.log('vertex shader: ', vert_shader);
const frag_shader = render_device.render_state.create_Shader(RenderStateShaderType.Fragment, f_fragmentShaderSource).expect();
console.log('fragment shader: ', frag_shader);
console.groupEnd();
// program
console.groupCollapsed('program');
const program = render_device.create_Program(vert_shader, frag_shader);
console.log('program: ', program);
console.groupEnd();


// const f_fragmentShaderSource2 = `#version 300 es
// precision highp float;
 
// in vec4 v_color;

// layout(location = 0) out vec4 outColor;
 
// void main() {
//   vec2 uv = gl_FragCoord.xy / vec2(2048, 2048);
//   outColor = vec4(v_color.rg / 255.0, 0.0, 1.0);
// }
// `;
// const frag_shader2 = render_device.render_state.create_Shader(RenderStateShaderType.Fragment, f_fragmentShaderSource2).expect();
// const program2 = render_device.render_state.create_Program(vert_shader, frag_shader2).expect();

const material = new WebGL2RenderDeviceMaterial(render_device, program);
// const material2 = new RenderDeviceMaterial(render_device, program2);

const renderable_surface = new WebGL2RenderDeviceRenderableSurface(render_device);
renderable_surface.set_Material(material);
renderable_surface.set_Surface(surface);

const camera_world = Matrix4.from_BasisPosition(undefined, new Vector3(0,0,3));
const camera_projection = Matrix4.make_PerspectiveFovProjection(75/180* Math.PI, 1, 0.01, 1000);

console.log(camera_projection);
render_device.set_WorldUniform('camera_world', camera_world.typed_transposed_array_f32);
render_device.set_WorldUniform('camera_projection', camera_projection.typed_transposed_array_f32);

function render(time: number) {
  render_device.set_WorldUniform('model_world', Matrix4.from_BasisPosition(Matrix3.make_RotateX(time/2).compose(Matrix3.make_RotateY(time*0.15)), vec3(0, 0, 0)).typed_transposed_array_f32);
  const render_state = render_device.render_state as WebGL2RenderState;
  // const u_matrix_location = render_state.get_ProgramUniformLocation(program, 'u_matrix');
  // const matrix = mat4(0.007731665305301682, 0.001708220592758516, -0.006433581723898327, 0, 0.00502100215732466, -0.0071292079162409965, 0.0037545994086515887, 0, 0.004548078590723006, 0.005559101878833951, 0.007602278881962978, 0, -0.6560196560196561, 0.3464052287581699, 0, 1);
  render_state.gl.viewport(0, 0, 2048, 2048);
  render_state.gl.clearColor(0.2, 0.2, 0.2, 1);
  render_state.gl.clear(render_state.gl.COLOR_BUFFER_BIT | render_state.gl.DEPTH_BUFFER_BIT);

  render_device.render_Renderable(renderable_surface);

  on_screen_ctx?.drawImage(canvas, 0, 0);

  // render_state.use_ProgramProxy(program.program);
  // render_state.set_CapabilityProxy(render_state.gl.CULL_FACE, true);
  // render_state.set_CapabilityProxy(render_state.gl.DEPTH_TEST, true);
  // render_state.gl.uniformMatrix4fv(u_matrix_location, false, matrix.typed_array_f32);
  // render_state.bind_VertexArrayProxy(surface.vertex_array.vertex_array);
  // // render_state.gl.drawArrays(vertex_array_view0.primitive_type, vertex_array_view0.offset, vertex_array_view0.count);
  // render_state.gl.drawElements(surface.vertex_array.primitive_type, surface.vertex_array.count, surface.index.data_type, surface.vertex_array.offset);
}

// setTimeout(() => {
//   console.log(">>>> set mat");
//   renderable_surface.set_Material(material2);
// }, 2000);

// setTimeout(() => {
//   console.log(">>>> set sur");
//   surface.set_AttributeBuffer(RenderStatePrimitiveType.Triangles, 6,{
//     a_position: positionbuffer,
//     a_color: colorbuffer,
//   }, indexbuffer);
// }, 4000);

let time = 0;

function animation() {
	requestAnimationFrame(animation);
	time += 0.033;
  const x = (Math.sin(time) + 1) / 2;
//   surface.get_AttributeBuffer('a_position')?.update_Data([vec2(x, -0.5), vec2(0.5, x)], 2);
	render(time);
}

animation();



























// console.group('init');
// console.log("canvas: ", canvas);
// console.log("render device: ", render_device);
// console.groupEnd();

// const render_state: WebGL2RenderState = render_device.render_state as WebGL2RenderState;

// const gl = render_state.gl;

// console.group('render state test');

// // buffer
// console.groupCollapsed('buffer');
// const buffer = render_state.create_Buffer(RenderStateBufferType.Array, RenderStateBufferUsage.StaticDraw, 2, RenderStateDataType.Float, false, 0).expect();
// console.log('buffer: ', buffer);
// const bufferview = render_state.create_BufferView(buffer, 3, 0, 0, 0).expect();
// console.log('bufferview: ', bufferview);
// const color_buffer = render_state.create_Buffer(RenderStateBufferType.Array, RenderStateBufferUsage.StaticDraw, 3, RenderStateDataType.UnsignedByte, true, 0).expect();
// const index_buffer = render_state.create_Buffer(RenderStateBufferType.Index, RenderStateBufferUsage.StaticDraw, 1, RenderStateDataType.UnsignedShort, false, 0).expect();
// console.groupEnd();

// // shader
// console.groupCollapsed('shader');
// const f_vertexShaderSource = `#version 300 es
// in vec4 a_position;
// in vec4 a_color;

// out vec4 v_color;

// void main() {
//   gl_Position = a_position;
//   v_color = a_color;
// }
// `;
// const f_fragmentShaderSource = `#version 300 es
// precision highp float;
 
// in vec4 v_color;

// layout(location = 0) out vec4 outColor;
 
// void main() {
//   vec2 uv = gl_FragCoord.xy / vec2(2048, 2048);
//   outColor = vec4(v_color.rgb, 1.0); // vec4(uv, 0.0, 1.0);
// }
// `;
// const vert_shader = render_state.create_Shader(gl.VERTEX_SHADER, f_vertexShaderSource).expect();
// console.log('vertex shader: ', vert_shader);
// const frag_shader = render_state.create_Shader(gl.FRAGMENT_SHADER, f_fragmentShaderSource).expect();
// console.log('fragment shader: ', frag_shader);
// console.groupEnd();

// // program
// console.groupCollapsed('program');
// const program = render_state.create_Program(vert_shader, frag_shader).expect();
// console.log('program: ', program);
// console.groupEnd();

// // buffer alloc data
// console.groupCollapsed('buffer alloc data');
// render_state.alloc_Buffer(buffer, 4 * 2 * Float32Array.BYTES_PER_ELEMENT, new Float32Array([
//   -0.5, 0.5,
//   -0.5, -0.5,
//   0.5, -0.5,
//   0.5, 0.5,
// ]));
// render_state.alloc_Buffer(color_buffer, 4 * 3 * Uint8Array.BYTES_PER_ELEMENT, new Uint8Array([
//   // left column front
//   200, 70, 120,
//   80, 70, 200,
//   70, 200, 210,
//   210, 160, 70,
// ]));
// render_state.alloc_Buffer(index_buffer, 6 * 1 * Uint16Array.BYTES_PER_ELEMENT, new Uint16Array([
//   0, 1, 2, 0, 2, 3
// ]));
// console.log(">>>> alloc !");
// console.groupEnd();

// // buffer set data
// console.groupCollapsed('buffer update data');
// console.log(">>>> set !");
// console.groupEnd();

// // vertex array
// console.group('vertex array');
// const vertex_array = render_state.create_VertexArray(RenderStatePrimitiveType.Triangles, 0, 6).expect();
// console.log('vertex array: ', vertex_array);
// console.groupEnd();

// // vertex array view
// console.group('vertex array view');
// const vertex_array_view0 = render_state.create_VertexArrayView(vertex_array, 0, 6).expect();
// const vertex_array_view1 = render_state.create_VertexArrayView(vertex_array, 6 / 2, 6 / 2).expect();
// console.log('vertex array view: ', vertex_array_view0);
// console.log('vertex array view: ', vertex_array_view1);
// console.groupEnd();

// // get attribute location
// console.group('get attribute location');
// const a_position_location = render_state.get_ProgramAttributeLocation(program, 'a_position');
// console.log('get attribute location: ', a_position_location);
// const b_position_location = render_state.get_ProgramAttributeLocation(program, 'b_position');
// console.log('get error attribute location: ', b_position_location);
// const a_color_location = render_state.get_ProgramAttributeLocation(program, 'a_color');
// console.groupEnd();

// // get uniform location
// console.group('get uniform location');
// const u_matrix_location = render_state.get_ProgramUniformLocation(program, 'u_matrix');
// console.log('get uniform location: ', u_matrix_location);
// console.groupEnd();

// // set vertex array buffer pointer
// console.group('set vertex array buffer pointer');
// render_state.set_VertexArrayAttributeBuffer(vertex_array, a_position_location, buffer);
// console.log(">>>>> binded !!!");
// render_state.set_VertexArrayAttribute(vertex_array, a_position_location, true);
// console.log(">>>>> enabled !!!");
// render_state.set_VertexArrayAttributeBuffer(vertex_array, a_color_location, color_buffer);
// render_state.set_VertexArrayAttribute(vertex_array, a_color_location, true);
// console.groupEnd();

// console.group('set index buffer');
// render_state.set_VertexArrayIndexBuffer(vertex_array, index_buffer);
// console.groupEnd();

// const matrix = mat4(0.007731665305301682, 0.001708220592758516, -0.006433581723898327, 0, 0.00502100215732466, -0.0071292079162409965, 0.0037545994086515887, 0, 0.004548078590723006, 0.005559101878833951, 0.007602278881962978, 0, -0.6560196560196561, 0.3464052287581699, 0, 1);

// render_state.gl.viewport(0, 0, 2048, 2048);
// render_state.gl.clearColor(0.5, 0.5, 1, 1);
// render_state.gl.clear(render_state.gl.COLOR_BUFFER_BIT | render_state.gl.DEPTH_BUFFER_BIT);
// render_state.use_ProgramProxy(program.program);
// render_state.set_CapabilityProxy(render_state.gl.CULL_FACE, true);
// render_state.set_CapabilityProxy(render_state.gl.DEPTH_TEST, true);
// render_state.gl.uniformMatrix4fv(u_matrix_location, false, matrix.typed_array_f32);
// render_state.bind_VertexArrayProxy(vertex_array_view0.vertex_array_ref.expect.vertex_array);
// // render_state.gl.drawArrays(vertex_array_view0.primitive_type, vertex_array_view0.offset, vertex_array_view0.count);
// render_state.gl.drawElements(vertex_array_view0.primitive_type, vertex_array_view0.count, index_buffer.data_type, vertex_array_view0.offset);

// // program dispose
// console.groupCollapsed('program dispose');
// program.dispose();
// console.groupEnd();

// // buffer dispose
// console.groupCollapsed('buffer dispose');
// bufferview.dispose();
// console.groupEnd();

// // vertex array dispose
// console.group('vertex array dispose');
// vertex_array_view0.dispose();
// // vertex_array_view1.dispose();
// console.groupEnd();

// console.groupEnd();