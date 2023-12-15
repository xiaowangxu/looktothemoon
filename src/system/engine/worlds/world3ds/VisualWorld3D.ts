import { Scene, Matrix4, Mesh, Object3D, Vector3, Euler, AmbientLight, HemisphereLight, DirectionalLight, PointLight, Light, Color, SpotLight, Quaternion } from "three";
import { Rid, type RID } from "../../Rid";
import { GeometryResource } from "../../resources/resources/GeometryResource";
import type { MaterialResource } from "../../resources/resources/MaterialResource";
import { SignalEmitter } from "../../../utils/SignalEmitter";
import { Matrix4 as MyMat4 } from "../../../fivepebble/linear_algebra/Matrix4";
import { RenderServer } from "../../render_server/RenderServer";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import type { WebGL2RenderStateFrameBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateFrameBuffer";
import { RenderStateTextureType, RenderStateTextureFormat, RenderStateTextureMinFilter, RenderStateTextureMagFilter, RenderStateTextureDataFormat, RenderStateDataType, RenderStateShaderType, RenderState, RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { WebGL2RenderStateFrameBufferAttachmentPoint } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { WebGL2RenderStateFloatUniformSlot } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateUniformSlot";
import { RenderDeviceVector2AttributeBuffer, RenderDeviceIndexAttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { vec2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { SceneTree } from "../../SceneTree";

// #region sky

const quad_position = new RenderDeviceVector2AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, [
	/* 0 */vec2(-1, 1),			//   1  0 ------ 2
	/* 1 */vec2(-1, -1),		//   |  |        |
	/* 2 */vec2(1, 1),			//   |  |        |
	/* 3 */vec2(1, -1),			//  -1  1 ------ 3
	/*                        *///     -1 ------ 1
]);
const quad_index = new RenderDeviceIndexAttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, [0, 1, 2, 3]);
const quad_surface = RenderServer.create_Geometry();
quad_surface.set_Geometry(RenderStatePrimitiveType.TriangleStrip, { position: quad_position }, quad_index);

const quad_vert_shader_code = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

out vec2 v_uv;

void main() {
	gl_Position = vec4(a_position, 1.0, 1.0);
	v_uv = (a_position + 1.0) / 2.0;
}
`;
const quad_vert_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Vertex, quad_vert_shader_code).expect();
const sky_frag_shader_code = `#version 300 es
precision highp float;

const float PI = 3.1415926535;
const float TAU = 6.283185307;
const float EPSILON = 0.00001;

in vec2 v_uv;

uniform float time;

layout(location = 0) out vec4 o_color;

// Optical length at zenith for molecules.
const float rayleigh_zenith_size = 8.4e3;
const float mie_zenith_size = 1.25e3;
const vec3 UP = vec3( 0.0, 1.0, 0.0 );

float henyey_greenstein(float cos_theta, float g) {
	const float k = 0.0795774715459;
	return k * (1.0 - g * g) / (pow(1.0 + g * g - 2.0 * g * cos_theta, 1.5));
}

void main() {
	float theta = (v_uv.x - 0.5) * TAU;
	float gamma = v_uv.y * PI;
	float singamma = sin(gamma);
	vec3 normal = normalize(vec3(singamma * cos(theta), cos(gamma), singamma * sin(theta)));
	
	float rayleigh = 2.0;
	vec4 rayleigh_color = vec4(0.06, 0.28, 0.6, 1.0);
	float mie  = 0.005;
	float mie_eccentricity = 0.8;
	vec4 mie_color = vec4(0.79, 0.5, 0.49, 1.0);	
	float turbidity = 10.0;
	float sun_disk_scale = 1.0;
	vec4 ground_color = vec4(0.1, 0.07, 0.034, 1.0);
	float exposure = 3.0;
	float date = time / 5.0;
	vec3 LIGHT0_DIRECTION = vec3(cos(date), (sin(date) + 1.0) / 2.0, 0.0);
	float LIGHT0_ENERGY = 1.0;
	float LIGHT0_SIZE = 0.025;
	vec3 LIGHT0_COLOR = vec3(1.0, 1.0, 1.0);
	vec3 EYEDIR = normal;

	float zenith_angle = clamp(dot(UP, normalize(LIGHT0_DIRECTION)), -1.0, 1.0 );
	float sun_energy = max(0.0, 1.0 - exp(-((PI * 0.5) - acos(zenith_angle)))) * LIGHT0_ENERGY;
	float sun_fade = 1.0 - clamp(1.0 - exp(LIGHT0_DIRECTION.y), 0.0, 1.0);

	// Rayleigh coefficients.
	float rayleigh_coefficient = rayleigh - ( 1.0 * ( 1.0 - sun_fade ) );
	vec3 rayleigh_beta = rayleigh_coefficient * rayleigh_color.rgb * 0.0001;
	// mie coefficients from Preetham
	vec3 mie_beta = turbidity * mie * mie_color.rgb * 0.000434;

	// Optical length.
	float zenith = acos(max(0.0, dot(UP, EYEDIR)));
	float optical_mass = 1.0 / (cos(zenith) + 0.15 * pow(93.885 - degrees(zenith), -1.253));
	float rayleigh_scatter = rayleigh_zenith_size * optical_mass;
	float mie_scatter = mie_zenith_size * optical_mass;

	// Light extinction based on thickness of atmosphere.
	vec3 extinction = exp(-(rayleigh_beta * rayleigh_scatter + mie_beta * mie_scatter));

	// In scattering.
	float cos_theta = dot(EYEDIR, normalize(LIGHT0_DIRECTION));

	float rayleigh_phase = (3.0 / (16.0 * PI)) * (1.0 + pow(cos_theta * 0.5 + 0.5, 2.0));
	vec3 betaRTheta = rayleigh_beta * rayleigh_phase;

	float mie_phase = henyey_greenstein(cos_theta, mie_eccentricity);
	vec3 betaMTheta = mie_beta * mie_phase;

	vec3 Lin = pow(sun_energy * ((betaRTheta + betaMTheta) / (rayleigh_beta + mie_beta)) * (1.0 - extinction), vec3(1.5));
	// Hack from https://github.com/mrdoob/three.js/blob/master/examples/jsm/objects/Sky.js
	Lin *= mix(vec3(1.0), pow(sun_energy * ((betaRTheta + betaMTheta) / (rayleigh_beta + mie_beta)) * extinction, vec3(0.5)), clamp(pow(1.0 - zenith_angle, 5.0), 0.0, 1.0));

	// Hack in the ground color.
	Lin  *= mix(ground_color.rgb, vec3(1.0), smoothstep(-0.1, 0.1, dot(UP, EYEDIR)));

	// Solar disk and out-scattering.
	float sunAngularDiameterCos = cos(LIGHT0_SIZE * sun_disk_scale);
	float sunAngularDiameterCos2 = cos(LIGHT0_SIZE * sun_disk_scale*0.5);
	float sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos2, cos_theta);
	vec3 L0 = (sun_energy * extinction) * sundisk * LIGHT0_COLOR;

	vec3 color = Lin + L0;
	o_color = vec4(pow(color, vec3(1.0 / (1.2 + (1.2 * sun_fade)))), 1.0);
	o_color.rgb *= exposure;
}
`;

const quad_frag_shader = RenderServer.render_state.create_Shader(RenderStateShaderType.Fragment, sky_frag_shader_code).expect();
const sky_program = RenderServer.render_state.create_Program(quad_vert_shader, quad_frag_shader).expect();

const uniform_time_location = RenderServer.render_state.get_ProgramUniformLocation(sky_program, 'time');
const uniform_time_slot = new WebGL2RenderStateFloatUniformSlot(RenderServer.render_state, sky_program, uniform_time_location!, 0);

// #endregion

export class VisualWorld3D {
    private readonly scene: Scene = new Scene();

    // signal
    public signal_before_render: SignalEmitter<() => void> = new SignalEmitter();

    public readonly sky_texture: WebGL2RenderStateTexture;
	public readonly sky_frame_buffer: WebGL2RenderStateFrameBuffer;

    private readonly random = Math.random();

    constructor() {
        this.scene.matrixAutoUpdate = false;
        this.scene.matrixWorldAutoUpdate = false;

        this.sky_texture = RenderServer.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 4, undefined, undefined, undefined, RenderStateTextureMinFilter.Linear, RenderStateTextureMagFilter.Linear).expect();
		RenderServer.render_state.alloc_Texture2D(this.sky_texture, 2048, 1024, 0, RenderStateTextureDataFormat.RGBA);
		this.sky_frame_buffer = RenderServer.render_state.create_FrameBuffer().expect();
		RenderServer.render_state.set_FrameBufferAttachment(this.sky_frame_buffer, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.sky_texture);
		RenderServer.render_state.enable_FrameBuffer(this.sky_frame_buffer);
    }

    public get_VisualScene() {
        return this.scene;
    }

    public trigger_BeforeRender(scene_tree: SceneTree) {
        this.signal_before_render.trigger();
        this.update_Sky(scene_tree);
    }

    private update_Sky(scene_tree: SceneTree) {
        // sky
		uniform_time_slot.value = scene_tree.time * (this.random + 1.0) * 2;
		uniform_time_slot.commit();
		RenderServer.render_state.use_FrameBuffer(this.sky_frame_buffer);
		RenderServer.render_state.set_ViewportProxy(0, 0, this.sky_texture.width, this.sky_texture.height);
		RenderServer.render_state.set_ScissorProxy(0, 0, this.sky_texture.width, this.sky_texture.height);
		RenderServer.render_state.draw_Elements(sky_program, quad_surface.vertex_array, RenderStateDataType.UnsignedInt, 1);
        RenderServer.render_state.generate_Mipmap(this.sky_texture);
    }
}