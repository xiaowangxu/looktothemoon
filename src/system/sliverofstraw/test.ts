import { mat4 } from "../math/linear_algebra/Matrix4";
import { vec3 } from "../math/linear_algebra/Vector3";
import { RenderDevice } from "./RenderDevice";
import { RenderStateBufferType, RenderStateBufferUsage, RenderStateDataType, RenderStatePrimitiveType, RenderStateShaderType } from "./RenderState";
import { RenderDeviceArrayMesh } from "./render_device_objects/RenderDeviceArrayMesh";
import { RenderDeviceIndexAttributeBuffer, RenderDeviceVector3AttributeBuffer } from "./render_device_objects/RenderDeviceAttributeBuffer";
import { WebGL2RenderState } from "./render_states/WebGL2RenderState";

const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
const render_device = new RenderDevice(canvas, WebGL2RenderState);

const arraymesh = new RenderDeviceArrayMesh(render_device);
const positionbuffer = new RenderDeviceVector3AttributeBuffer(
  render_device,
  [
    vec3(-0.5, 0.5),
    vec3(-0.5, -0.5),
    vec3(0.5, -0.5),
    vec3(0.5, 0.5),
  ],
  RenderStateBufferUsage.StaticDraw
);
const colorbuffer = new RenderDeviceVector3AttributeBuffer(
  render_device,
  [
    vec3(255, 0, 0),
    vec3(0, 255, 0),
    vec3(0, 0, 255),
    vec3(255, 0, 255),
  ],
  RenderStateBufferUsage.StaticDraw
);
const indexbuffer = new RenderDeviceIndexAttributeBuffer(
  render_device,
  [0, 1, 2, 0, 2, 3],
  RenderStateBufferUsage.StaticDraw
);
arraymesh.set_AttributeBuffer(RenderStatePrimitiveType.Triangles, 6, new Map([
  ['a_position', positionbuffer],
  ['a_color', colorbuffer],
]), indexbuffer);
console.log(arraymesh);

// arraymesh.dispose();

// shader
console.groupCollapsed('shader');
const f_vertexShaderSource = `#version 300 es
in vec4 a_position;
in vec4 a_color;

out vec4 v_color;

void main() {
  gl_Position = a_position;
  v_color = a_color;
}
`;
const f_fragmentShaderSource = `#version 300 es
precision highp float;
 
in vec4 v_color;

layout(location = 0) out vec4 outColor;
 
void main() {
  vec2 uv = gl_FragCoord.xy / vec2(2048, 2048);
  outColor = vec4(v_color.rgb / 255.0, 1.0);
}
`;
const vert_shader = render_device.render_state.create_Shader(RenderStateShaderType.Vertex, f_vertexShaderSource).expect();
console.log('vertex shader: ', vert_shader);
const frag_shader = render_device.render_state.create_Shader(RenderStateShaderType.Fragment, f_fragmentShaderSource).expect();
console.log('fragment shader: ', frag_shader);
console.groupEnd();
// program
console.groupCollapsed('program');
const program = render_device.render_state.create_Program(vert_shader, frag_shader).expect();
console.log('program: ', program);
console.groupEnd();

arraymesh.bound_Program(program);


function render() {
  const render_state = render_device.render_state as WebGL2RenderState;
  const u_matrix_location = render_state.get_ProgramUniformLocation(program, 'u_matrix');
  const matrix = mat4(0.007731665305301682, 0.001708220592758516, -0.006433581723898327, 0, 0.00502100215732466, -0.0071292079162409965, 0.0037545994086515887, 0, 0.004548078590723006, 0.005559101878833951, 0.007602278881962978, 0, -0.6560196560196561, 0.3464052287581699, 0, 1);
  render_state.gl.viewport(0, 0, 2048, 2048);
  render_state.gl.clearColor(0.5, 0.5, 1, 1);
  render_state.gl.clear(render_state.gl.COLOR_BUFFER_BIT | render_state.gl.DEPTH_BUFFER_BIT);
  render_state.use_ProgramProxy(program.program);
  render_state.set_CapabilityProxy(render_state.gl.CULL_FACE, true);
  render_state.set_CapabilityProxy(render_state.gl.DEPTH_TEST, true);
  render_state.gl.uniformMatrix4fv(u_matrix_location, false, matrix.typed_array_f32);
  render_state.bind_VertexArrayProxy(arraymesh.vertex_array.vertex_array);
  // render_state.gl.drawArrays(vertex_array_view0.primitive_type, vertex_array_view0.offset, vertex_array_view0.count);
  render_state.gl.drawElements(arraymesh.vertex_array.primitive_type, arraymesh.vertex_array.count, arraymesh.index.data_type, arraymesh.vertex_array.offset);
}
render();

let time = 0;

function animation() {
	requestAnimationFrame(animation);
	time += 0.033;
	render();
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