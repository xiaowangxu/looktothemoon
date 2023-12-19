import { World3D } from "@/system/engine/worlds/world3ds/World3D";
import { Viewport } from "@/system/engine/nodes/Node";
import { SceneTree } from "@/system/engine/SceneTree";
import { Node3D } from "@/system/engine/nodes/node3ds/Node3D";
import { ViewportDomContainer } from "@/system/engine/nodes/ViewportDomContainer";
import { Color } from "three";
import { KeyInputEvent } from "@/system/engine/inputs/events/KeyInputEvent";
import { MouseButton, MouseButtonInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseButton";
import { ShortCut } from "@/system/engine/inputs/ShortCut";
import { EditorOrbitCamera3D } from "./nodes/EditorOrbitCamera3D";
import { DependencyGraph } from "./singletons/DependencyGraph";
import { vec3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { vec2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { MeshInstance3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/geometry3ds/MeshInstance3D";
import { BoxGeometryResource, TorusGeometryResource } from "@/system/engine/resources/geometry_resources/PrimitiveGeometryResource";
import { EasingType, PropertyTween, TransitionType } from "@/system/engine/Tween";

// viewport container
const EditorViewportContainer = new ViewportDomContainer();
EditorViewportContainer.dom = document.querySelector('#viewport') ?? undefined;

// viewport
export const EditorViewport = new Viewport();
EditorViewport.physics_picking = false;
EditorViewport.transparent = true;
EditorViewport.clear_color = new Color(0xf2f2f2);
EditorViewport.world_3d = new World3D();
EditorViewportContainer.add_Child(EditorViewport);
// camera
const EditorCamera = new EditorOrbitCamera3D();
EditorViewport.add_Child(EditorCamera);
EditorCamera.set_Zoom(0.3);
EditorCamera.zoom_to_cursor = false;

// World 
const World = new Node3D();
World.local_scale = vec3(0.01, 0.01, 0.01);
World.block_process = true;
World.block_physics_process = true;

export const EditorSceneTree = new SceneTree(EditorViewportContainer);
EditorSceneTree.register_Singleton(DependencyGraph);
EditorViewport.add_Child(World);

EditorSceneTree.get_InputActionMap().add_Action('switch_FrontView', new ShortCut([new KeyInputEvent('1', '1', true, false, undefined, false, false, false, false)]));
EditorSceneTree.get_InputActionMap().add_Action('switch_LeftView', new ShortCut([new KeyInputEvent('2', '2', true, false, undefined, false, false, false, false)]));
EditorSceneTree.get_InputActionMap().add_Action('switch_TopView', new ShortCut([new KeyInputEvent('3', '3', true, false, undefined, false, false, false, false)]));
EditorSceneTree.get_InputActionMap().add_Action('switch_CameraType', new ShortCut([
    new KeyInputEvent('`', 'Backquote', true, false, undefined, false, false, false, false),
    new KeyInputEvent('`', 'Backquote', true, false, undefined, true, false, false, false),
]));
EditorSceneTree.get_InputActionMap().add_Action('zoomIn', new ShortCut([
    new MouseButtonInputEvent(MouseButton.WheelUp, true, false, false, undefined, vec2(0, 0), vec2(0, 0), false, false, false, false),
    new MouseButtonInputEvent(MouseButton.WheelUp, true, false, false, undefined, vec2(0, 0), vec2(0, 0), true, false, false, false),
]));
EditorSceneTree.get_InputActionMap().add_Action('zoomOut', new ShortCut([
    new MouseButtonInputEvent(MouseButton.WheelDown, true, false, false, undefined, vec2(0, 0), vec2(0, 0), false, false, false, false),
    new MouseButtonInputEvent(MouseButton.WheelDown, true, false, false, undefined, vec2(0, 0), vec2(0, 0), true, false, false, false),
]));

// // viewport 0
// const EditorViewportContainer0 = new ViewportDomContainer();
// EditorViewportContainer0.dom = document.querySelector('#viewport0') ?? undefined;
// const EditorViewport0 = new Viewport();
// EditorViewport0.physics_picking = false;
// EditorViewportContainer0.add_Child(EditorViewport0);
// const EditorCamera0 = new EditorOrbitCamera3D();
// EditorCamera0.zoom_to_cursor = false;
// EditorViewport0.add_Child(EditorCamera0);
// EditorViewport.add_Child(EditorViewportContainer0);

// Box
const geometry = new TorusGeometryResource();

for (let i = 0; i <= 100; i++) {
    for (let j = 0; j <= 100; j++) {
        const Mesh2 = new MeshInstance3D();
        Mesh2.geometry = geometry;
        Mesh2.local_scale = vec3(2, 2, 2);
        Mesh2.local_position = vec3((i / 100 * 2 - 1) * 500, (j / 100 * 2 - 1) * 500, 0);
        World.add_Child(Mesh2);
    }
}

// // viewport 1
// const EditorViewportContainer1 = new ViewportDomContainer();
// EditorViewportContainer1.dom = document.querySelector('#viewport1') ?? undefined;
// const EditorViewport1 = new Viewport();
// EditorViewport1.physics_picking = false;
// EditorViewportContainer1.add_Child(EditorViewport1);
// const EditorCamera1 = new EditorOrbitCamera3D();
// EditorViewport1.add_Child(EditorCamera1);
// EditorViewport.add_Child(EditorViewportContainer1);

// // viewport 0
// const EditorViewportContainer2 = new ViewportDomContainer();
// EditorViewportContainer2.dom = document.querySelector('#viewport2') ?? undefined;
// const EditorViewport2 = new Viewport();
// EditorViewport2.physics_picking = false;
// EditorViewportContainer2.add_Child(EditorViewport2);
// const EditorCamera2 = new EditorOrbitCamera3D();
// EditorViewport2.add_Child(EditorCamera2);
// EditorViewport.add_Child(EditorViewportContainer2);

// EditorViewport.signal_input.connect((evt, pro) => {
//     if (pro && evt instanceof KeyInputEvent && evt.key === ' ' && evt.pressed) {
//         Mesh.local_position = vec3();
//         EditorSceneTree.start_Tween(
//             new PropertyTween(
//                 Mesh,
//                 'local_position',
//                 vec3(-100, -100, -100),
//                 2, TransitionType.Bounce, EasingType.Out
//             )
//         );
//         // EditorViewport.get_World3D()?.get_VisualWorld().cube_material2.expect.set_UniformOverride('u_color', new Vector4(Math.random(), Math.random(), Math.random(), 1.0))
//     }
// });

// EditorViewport0.signal_input.connect((evt, pro) => {
//     if (pro && evt instanceof KeyInputEvent && evt.key === ' ' && evt.pressed) {
//         const shader = EditorViewport0.get_RenderableWorld3D()?.get_VisualWorld().cube_shader.expect!;
//         const cube_vert_shader_code = `#version 300 es
// precision highp float;
// precision highp usampler2DArray;
// precision highp sampler3D;

// const float PI = 3.1415926535;
// const float TAU = 6.283185307;
// const float EPSILON = 0.00001;

// uniform WorldUniforms {
//     mat4 camera_world;
//     mat4 camera_projection;
//     vec2 screen_size;
//     float time;
//     bool camera_is_orthogonal;
// };

// uniform mat4 model_world;

// // attributes
// in vec3 a_position;
// in vec3 a_normal;
// in vec2 a_uv;

// // varyings
// out vec3 v_world;
// out vec3 v_normal;
// out vec2 v_uv;

// // extras

// void main() {
//     // code
//     v_normal = normalize(mat3(transpose(inverse(model_world))) * a_normal);
//     vec4 world = model_world * vec4(a_position + sin(time) * a_normal, 1.0);
//     gl_Position = camera_projection * inverse(camera_world) * world;
//     v_uv = a_uv;
//     v_world = world.xyz;
// }`;
//         const cube_frag_shader_code = `#version 300 es
// precision highp float;
// precision highp usampler2DArray;
// precision highp sampler3D;

// const float PI = 3.1415926535;
// const float TAU = 6.283185307;
// const float EPSILON = 0.00001;

// uniform WorldUniforms {
//     mat4 camera_world;
//     mat4 camera_projection;
//     vec2 screen_size;
//     float time;
//     bool camera_is_orthogonal;
// };

// uniform mat4 model_world;
// uniform uint light_mask;
// uniform usampler2DArray lights;

// // uniforms
// uniform sampler2D u_sky;

// // varyings
// in vec3 v_world;
// in vec3 v_normal;
// in vec2 v_uv;

// // outputs
// layout(location = 0) out vec4 o_color;

// // skybox_sample
// vec4 skybox(sampler2D sky, vec3 normal, float lod) {
//     float theta = atan(normal.z, normal.x);
//     float gamma = acos(normal.y);
//     return texture(sky, vec2(theta / TAU + 0.5, gamma / PI), lod);
// }

// // light function : ndf
// float ndf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
//         float roughness_sqr = roughness * roughness;
//         vec3 h = normalize(l + v);
//         float ndoth = max(dot(n, h), 0.0);
//         float ndoth_sqr = ndoth * ndoth;
//         float tan_ndoth_sqr = (1.0 - ndoth_sqr) / ndoth_sqr;
//         return (1.0 / PI) * pow(roughness / max(ndoth_sqr * (roughness_sqr + tan_ndoth_sqr), EPSILON), 2.0);
//     }

// // light function : gsf
// float gsf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
//         float ndotl = max(dot(n, l), 0.0);
//         float ndotv = max(dot(n, v), 0.0);
//         float roughness_sqr = roughness * roughness;
//         float ndotl_sqr = ndotl * ndotl;
//         float ndotv_sqr = ndotv * ndotv;
//         float smith_l = (2.0 * ndotl)/ (ndotl + sqrt(roughness_sqr + (1.0 - roughness_sqr) * ndotl_sqr));
//         float smith_v = (2.0 * ndotv)/ (ndotv + sqrt(roughness_sqr + (1.0 - roughness_sqr) * ndotv_sqr));
// 	    return smith_l * smith_v;
//     }

// // light function : fnl
// vec3 fnl(in vec3 l, in vec3 v, in vec3 n, in vec3 ior) {
//         vec3 h = normalize(l + v);
//         float ldoth = max(dot(l, h), 0.0);
//         vec3 f0 = vec3(
//             pow(ior.r - 1.0, 2.0) / pow(ior.r + 1.0, 2.0),
//             pow(ior.g - 1.0, 2.0) / pow(ior.g + 1.0, 2.0),
//             pow(ior.b - 1.0, 2.0) / pow(ior.b + 1.0, 2.0)
//         );
//         // SchlickFresnel
//         float x = clamp(1.0 - ldoth, 0.0, 1.0);
//         float x2 = x * x;
//         return f0 + (1.0 - f0) * x2 * x2 * x;
//     }

// // light function
// float beckmannDistribution(float x, float roughness) {
//     float NdotH = max(x, 0.0001);
//     float cos2Alpha = NdotH * NdotH;
//     float tan2Alpha = (cos2Alpha - 1.0) / cos2Alpha;
//     float roughness2 = roughness * roughness;
//     float denom = 3.141592653589793 * roughness2 * cos2Alpha * cos2Alpha;
//     return exp(tan2Alpha / roughness2) / denom;
// }

// void light(uint light_type, in vec3 light_direction, in vec3 view_direction, in vec3 normal, in vec3 light_color, in float light_attenuation, inout vec3 diffuse, inout vec3 specular) {
//     // code
//     float light_strength = dot(normal, light_direction);
//     if (light_strength > 0.0) {
//         diffuse += light_strength * light_color * light_attenuation;
//         if (light_type != uint(2)) {
//             vec3 half_direction = normalize(light_direction + view_direction);  
//             float beckmann = beckmannDistribution(dot(normal, half_direction), 0.01);
//             specular += beckmann * light_color * light_attenuation;
//         }
//     }
// }

// // extras

// void main() {
//     // code
//     vec3 normal = normalize(v_normal);
//     vec4 albedo_color = vec4(1.0, 0.2, 0.2, 1.0);


//     ivec3 lights_size = textureSize(lights, 0);
//     int lights_count = lights_size.x * lights_size.y;
//     const int LIGHT_MAX_COUNT = 64;

//     // see light function
//     // light_type, light_direction, view_direction, normal, light_color, light_attenuation, inout vec3 diffuse, inout vec3 specular

//     vec3 diffuse = vec3(0.0);
//     vec3 specular = vec3(0.0);

//     // vec2 view_position = gl_FragCoord.xy / screen_size * 4.0;
//     // int idx = int(view_position.x) + int(view_position.y) * 4;
//     int idx = 0;

//     for (int i = idx; i < lights_count; i++) {

//     	if (i >= LIGHT_MAX_COUNT) break;

//     	int x = i % lights_size.x;
//     	int y = i / lights_size.x;

//     	uint l_type_id = texelFetch(lights, ivec3(x, y, 0), 0).r;
//     	uint l_pos_x = texelFetch(lights, ivec3(x, y, 1), 0).r;
//     	uint l_pos_y = texelFetch(lights, ivec3(x, y, 2), 0).r;
//     	uint l_pos_z = texelFetch(lights, ivec3(x, y, 3), 0).r;
//     	uint l_dir_x = texelFetch(lights, ivec3(x, y, 4), 0).r;
//     	uint l_dir_y = texelFetch(lights, ivec3(x, y, 5), 0).r;
//     	uint l_dir_z = texelFetch(lights, ivec3(x, y, 6), 0).r;
//     	uint l_color_r = texelFetch(lights, ivec3(x, y, 7), 0).r;
//     	uint l_color_g = texelFetch(lights, ivec3(x, y, 8), 0).r;
//     	uint l_color_b = texelFetch(lights, ivec3(x, y, 9), 0).r;
//     	uint _l_attenuation = texelFetch(lights, ivec3(x, y, 10), 0).r;
//     	uint l_mask = texelFetch(lights, ivec3(x, y, 11), 0).r;
//     	uint l_param_0 = texelFetch(lights, ivec3(x, y, 12), 0).r;
//     	uint l_param_1 = texelFetch(lights, ivec3(x, y, 13), 0).r;
//     	uint l_param_2 = texelFetch(lights, ivec3(x, y, 14), 0).r;
//     	uint l_param_3 = texelFetch(lights, ivec3(x, y, 15), 0).r;

//     	uint l_type = l_type_id & uint(0xffff);
//     	uint l_id = l_type_id >> 16;
//     	vec3 l_position = vec3(uintBitsToFloat(l_pos_x), uintBitsToFloat(l_pos_y), uintBitsToFloat(l_pos_z));
//     	vec3 l_direction = vec3(uintBitsToFloat(l_dir_x), uintBitsToFloat(l_dir_y), uintBitsToFloat(l_dir_z));
//     	vec3 l_color = vec3(uintBitsToFloat(l_color_r), uintBitsToFloat(l_color_g), uintBitsToFloat(l_color_b));
//     	float l_attenuation = uintBitsToFloat(_l_attenuation);

//     	if (l_type == uint(0)) continue;
//     	if ((l_mask & light_mask) == uint(0)) continue;

//     	vec3 c_dir = camera_is_orthogonal ? normalize(mat3(camera_world) * vec3(0.0, 0.0, 1.0)) : normalize(camera_world[3].xyz - v_world);

//     	if (l_type == uint(1)) {
//     		// ambient light
//     		light(l_type, normal, c_dir, normal, l_color, 1.0, diffuse, specular);
//     	}
//     	else if (l_type == uint(2)) {
//     		// directional light
//     		vec3 l_dir = normalize(l_position);
//     		light(l_type, l_dir, c_dir, normal, l_color, 1.0, diffuse, specular);
//     	}
//     	else if (l_type == uint(3)) {
//     		// point light
//     		float l_distance = distance(l_position, v_world);
//     		vec3 l_dir = normalize(l_position - v_world);
//     		float near_distance = uintBitsToFloat(l_param_0);
//     		float far_distance = uintBitsToFloat(l_param_1);
//     		float distance_w = (l_distance - near_distance) / (far_distance - near_distance);
//     		float distance_strength = smoothstep(1.0, 0.0, distance_w);
//     		float l_atten = distance_strength / pow(max(l_distance, 1.0), l_attenuation);
//     		light(l_type, l_dir, c_dir, normal, l_color, l_atten, diffuse, specular);
//     	}
//     	else if (l_type == uint(4)) {
//     		// spot light
//     		vec3 l_dir = normalize(l_position - v_world);
//     		float l_dot_dir = dot(l_dir, -normalize(l_direction));
//     		float l_distance = distance(l_position, v_world);
//     		float angle_strength = smoothstep(cos(uintBitsToFloat(l_param_0)), cos(uintBitsToFloat(l_param_1)), l_dot_dir);
//     		float near_distance = uintBitsToFloat(l_param_2);
//     		float far_distance = uintBitsToFloat(l_param_3);
//     		float distance_w = (l_distance - near_distance) / (far_distance - near_distance);
//     		float distance_strength = smoothstep(1.0, 0.0, distance_w);
//     		float l_atten = (angle_strength * distance_strength) / pow(max(l_distance, 1.0), l_attenuation);
//     		light(l_type, l_dir, c_dir, normal, l_color, l_atten, diffuse, specular);
//     	}
//     }


//     o_color = albedo_color * vec4(diffuse, 1.0) + vec4(specular, 0.0);
// }`;
//         const vert_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Vertex, cube_vert_shader_code).expect();
//         const frag_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Fragment, cube_frag_shader_code).expect();
//         shader.set_Shaders(
//             vert_shader,
//             {
//                 model_world: { type: RenderStateUniformType.Mat4, default: Matrix4.make_Identity() }
//             },
//             {
//                 shading: {
//                     shader: frag_shader,
//                     uniforms: {
//                         model_world: { type: RenderStateUniformType.Mat4, default: Matrix4.make_Identity() },
//                         light_mask: { type: RenderStateUniformType.Uint, default: 0xffffffff },
//                         lights: { type: RenderStateUniformType.Int, default: RenderServerDevice.LightsTextureUnit },
//                         u_sky: { type: RenderStateUniformType.Tex2D, default: {} },
//                     }
//                 }
//             }
//         );
//         console.log(">>>>> set shader");
//     }
// });

export function createEditorViewport() {
    EditorSceneTree.start_Loop();
}