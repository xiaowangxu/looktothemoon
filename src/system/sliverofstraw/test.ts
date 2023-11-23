import { RenderDevice } from "./RenderDevice";
import { WebGL2RenderState } from "./render_states/webgl2/WebGL2RenderState";

const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
const render_device = new RenderDevice(canvas, WebGL2RenderState);

console.group('init');
console.log("canvas: ", canvas);
console.log("render device: ", render_device);
console.groupEnd();

const render_state: WebGL2RenderState = render_device.render_state as WebGL2RenderState;

const gl = render_state.gl;

console.group('render state test');

// buffer
console.groupCollapsed('buffer');
const buffer = render_state.create_Buffer(gl.ARRAY_BUFFER, gl.STATIC_DRAW, 2, gl.FLOAT, false, 0).expect();
console.log('buffer: ', buffer);
const bufferview = render_state.create_BufferView(buffer, 3, 0, 0, 0).expect();
console.log('bufferview: ', bufferview);
console.groupEnd();

// shader
console.groupCollapsed('shader');
const f_vertexShaderSource = `#version 300 es
in vec4 a_position;

void main() {
  gl_Position = a_position;
}
`;
const f_fragmentShaderSource = `#version 300 es
precision highp float;
 
layout(location = 0) out vec4 outColor;
 
void main() {
  vec2 uv = gl_FragCoord.xy / vec2(2048, 2048);
  outColor = vec4(uv, 0.0, 1.0);
}
`;
const vert_shader = render_state.create_Shader(gl.VERTEX_SHADER, f_vertexShaderSource).expect();
console.log('vertex shader: ', vert_shader);
const frag_shader = render_state.create_Shader(gl.FRAGMENT_SHADER, f_fragmentShaderSource).expect();
console.log('fragment shader: ', frag_shader);
console.groupEnd();

// program
console.groupCollapsed('program');
const program = render_state.create_Program(vert_shader, frag_shader).expect();
console.log('program: ', program);
console.groupEnd();

// buffer alloc data
console.groupCollapsed('buffer alloc data');
render_state.alloc_Buffer(buffer, 6 * Float32Array.BYTES_PER_ELEMENT, undefined);
console.log(">>>> alloc !");
console.groupEnd();

// buffer set data
console.groupCollapsed('buffer update data');
render_state.update_Buffer(buffer, new Float32Array([0, 0, 0.7, 0, 0.7, 0.7]));
console.log(">>>> set !");
console.groupEnd();

// vertex array
console.group('vertex array');
const vertex_array = render_state.create_VertexArray(render_state.gl.TRIANGLES,0, 3).expect();
console.log('vertex array: ', vertex_array);
console.groupEnd();

// vertex array view
console.group('vertex array view');
const vertex_array_view = render_state.create_VertexArrayView(vertex_array, 0, 3).expect();
console.log('vertex array view: ', vertex_array_view);
console.groupEnd();

// get attribute location
console.group('get attribute location');
const a_position_location = render_state.get_ProgramAttributeLocation(program, 'a_position');
console.log('get attribute location: ', a_position_location);
const b_position_location = render_state.get_ProgramAttributeLocation(program, 'b_position');
console.log('get error attribute location: ', b_position_location);
console.groupEnd();

// set vertex array buffer pointer
console.group('set vertex array buffer pointer');
render_state.set_VertexArrayAttributeBuffer(vertex_array, a_position_location, buffer);
console.log(">>>>> binded !!!");
render_state.set_VertexArrayAttribute(vertex_array, a_position_location, true);
console.log(">>>>> enabled !!!");
console.groupEnd();

render_state.gl.viewport(0, 0, 2048, 2048);
render_state.gl.clearColor(0.5, 0.5, 1, 1);
render_state.gl.clear(render_state.gl.COLOR_BUFFER_BIT | render_state.gl.DEPTH_BUFFER_BIT);
render_state.set_CapabilityProxy(render_state.gl.CULL_FACE, true);
render_state.use_ProgramProxy(program.program);
render_state.gl.bindVertexArray(vertex_array.vertex_array);
render_state.gl.drawArrays(vertex_array.primitive_type, vertex_array.offset, vertex_array.count);

// program dispose
console.groupCollapsed('program dispose');
program.dispose();
console.groupEnd();

// buffer dispose
console.groupCollapsed('buffer dispose');
bufferview.dispose();
console.groupEnd();

// vertex array dispose
console.groupCollapsed('vertex array dispose');
vertex_array_view.dispose();
console.groupEnd();

console.groupEnd();