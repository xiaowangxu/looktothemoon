import { Ref } from "@/system/utils/RefCounted";
import type { Config } from "../../ConfiguredObject";
import type { EditorRenderer3D } from "./EditorRenderer3D";
import { Renderer3DPipeline } from "./Renderer3DPipeline";
import type { WebGL2RenderStateFrameBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateFrameBuffer";
import type { WebGL2RenderStateRenderBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateRenderBuffer";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { RenderStateBufferUsage, RenderStateDataType, RenderStateFrameBufferPart, RenderStatePrimitiveType, RenderStateShaderType, RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureMinFilter, RenderStateTextureMagFilter, RenderStateTextureType } from "@/system/sliverofstraw/RenderState";
import { WebGL2RenderStateFrameBufferAttachmentPoint } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { Cacher } from "@/system/utils/Cacher";
import { RenderDeviceVector2AttributeBuffer, RenderDeviceIndexAttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { WebGL2RenderStateIntUniformSlot, WebGL2RenderStateUintUniformSlot } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateUniformSlot";
import { RenderServerDevice } from "../../render_server/RenderServer";
import { vec2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { RenderServerShaderPass } from "../../render_server/RenderServerShader";
import { RenderServerMaterialCullFace } from "../../render_server/RenderServerMaterial";
import type { Viewport } from "../../nodes/Node";
import type { World3D } from "../../worlds/world3ds/World3D";

// #region quad surface

const QuadGeometry = new Cacher((config: Config) => {
    const quad_position = new RenderDeviceVector2AttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [
		/* 0 */vec2(-1, 1),			//   1  0 ------ 2
		/* 1 */vec2(-1, -1),		//   |  |        |
		/* 2 */vec2(1, 1),			//   |  |        |
		/* 3 */vec2(1, -1),			//  -1  1 ------ 3
        /*                        *///     -1 ------ 1
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

// #endregion

// #region ssao

// let str = '';
// for (let i = 0; i < 64; i++) {
//     const x = Math.random() * 2.0 - 1.0;
//     const y = Math.random();
//     const z = Math.random() * 2.0 - 1.0;
//     const sample = vec3(x, y, z).normalize();
//     sample.mult_Number(Math.random());
//     str += `\nvec3(${sample.x},${sample.y},${sample.z}),`;
// }
// console.log(str);

const ssao_frag_shader_code = `#version 300 es
precision highp float;

${RenderServerDevice.ConstantsCode}

${RenderServerDevice.WorldUniformsCode}

in vec2 v_uv;

uniform sampler2D u_depth;
uniform sampler2D u_normal;

const float bias = 0.025;
const float radius = 0.5;
const int kernelSize = 64;
const vec3 samples[kernelSize] = vec3[](
    vec3(-0.6461535025531936,0.3415344845091158,0.6825246127645016),
    vec3(0.21316628344767577,-0.623366284516482,0.7523128411300857),
    vec3(0.3799144135773504,0.024133323545212117,0.924706775713707),
    vec3(-0.08423802786032628,-0.8570409587920366,0.508315600404935),
    vec3(0.009846245178737214,0.47599411945621445,0.8793933418550447),
    vec3(-0.8855378614254795,-0.33440506396940356,0.3224840293310777),
    vec3(0.08555443733251479,-0.6294937180380744,0.7722810998615194),
    vec3(0.706550302187274,0.6921413241323758,0.14740101053708285),
    vec3(-0.5599783319468491,0.5745346195806277,0.5969373825229644),
    vec3(0.1700456217488921,0.637026876091111,0.7518518774743022),
    vec3(-0.640420420967183,0.08269414241711674,0.7635596657878895),
    vec3(-0.37719919359879706,0.19630480692985658,0.9050884990566663),
    vec3(0.4025581250773821,-0.627372571804153,0.6665962886800567),
    vec3(0.18507612333267376,-0.78564176421444,0.5903506135290887),
    vec3(0.20188305726290817,0.6607471409713764,0.722949823216199),
    vec3(0.6294354710752066,0.09537512675236554,0.7711773939563471),
    vec3(0.47081107921457804,-0.7573287198248655,0.4525374435527238),
    vec3(0.5477404357334903,0.5174077002302778,0.6574721947009633),
    vec3(0.2711279470778007,-0.4505144114982932,0.8506035512186179),
    vec3(-0.4537535112805829,0.471738817080832,0.7560226448061721),
    vec3(0.16784231845837558,0.9694285697537001,0.17898939711561884),
    vec3(-0.5414292136449984,-0.0035888610577260146,0.8407386791911428),
    vec3(0.7540838436876407,0.3781096272305008,0.5370201732569136),
    vec3(0.26390041862393865,0.6251155536734335,0.7345659355059059),
    vec3(0.1814880691005595,-0.5894612083651781,0.7871451991893329),
    vec3(0.6161940362909589,0.18260516995136772,0.7661333183894881),
    vec3(0.08261796006877171,0.9756301732826078,0.20327330777705066),
    vec3(-0.7873137209948928,0.3886473002533235,0.4786338691933314),
    vec3(-0.6834760573685718,0.7295988291725818,0.02336723077111548),
    vec3(-0.3716528441089272,-0.3549713260160245,0.8578283751264996),
    vec3(0.6399379411027141,-0.2591665717591502,0.7234031515136139),
    vec3(-0.6358320462419872,-0.7425152725669697,0.210686209744554),
    vec3(0.8325322102368441,0.44429714454223834,0.33089298310748216),
    vec3(-0.6562251874395587,-0.4865345249134194,0.5767604870630347),
    vec3(0.2680331623525847,0.929292549425359,0.25411332405403214),
    vec3(0.6107612797017136,-0.17009768026534314,0.7733288035405601),
    vec3(0.6923427993585343,0.5073835870215343,0.5130529639301868),
    vec3(-0.17937879186262323,-0.8967413978834633,0.40457151945226916),
    vec3(-0.23525951208887652,0.6746932063076695,0.699601343147639),
    vec3(-0.717189546295273,0.6951308175358738,0.04931836571388366),
    vec3(0.9676944961419178,0.2181253237212629,0.12644645225602),
    vec3(-0.949297253866882,0.304422069391244,0.0784979456313922),
    vec3(0.8742329846002038,-0.23289970168584567,0.4259981427091718),
    vec3(0.3647441448601729,0.7354733923131597,0.5709996479767694),
    vec3(0.3154811337040074,-0.7597761996194768,0.568517177197505),
    vec3(-0.6593422130955403,-0.7514469825106265,0.02439832998279667),
    vec3(0.2553875748271308,-0.6900798392501166,0.6771757542059889),
    vec3(-0.10838678854633545,-0.6915280575627578,0.7141717228174825),
    vec3(0.33617729000362245,-0.9023426297322606,0.2697454508489227),
    vec3(0.7150513514953425,0.25996391592094736,0.6489378453625054),
    vec3(-0.4916618314675892,0.7366527364019604,0.4643397349241608),
    vec3(0.1597354967506508,0.380251895968289,0.9109846687460467),
    vec3(-0.36640774864824965,-0.7297541814074718,0.577238422533386),
    vec3(-0.1659754649141276,-0.3679361429598238,0.9149181054883477),
    vec3(0.4520723191074955,0.49008498157084934,0.7452833884741233),
    vec3(-0.4317767545374975,0.7061727986106393,0.5611495457928155),
    vec3(-0.6788326630325183,0.19782778976736792,0.7071424051744722),
    vec3(-0.2626542813285348,0.7690145897308462,0.582777220969462),
    vec3(-0.6992155958314731,0.5177923208294436,0.49293880252633454),
    vec3(-0.668810351925821,-0.732322243037798,0.1280501679379906),
    vec3(0.6501589946906978,-0.6001596259214834,0.46594173995958554),
    vec3(0.5845334015542828,-0.6841744036050019,0.4361491578796405),
    vec3(0.6823074466804337,-0.48978982693520084,0.5427360994398778),
    vec3(0.6255710141037082,-0.4906184897928708,0.6065924527939832)
);

layout(location = 0) out vec4 o_color;

vec3 get_world_pos(in vec2 uv, float depth) {
    vec4 clip_pos = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 view_pos = camera_inv_projection * clip_pos;

    view_pos /= view_pos.w;

    vec4 world_pos = camera_world * view_pos;

    return world_pos.xyz;
}

//generating noise/pattern texture for dithering
vec3 rand(vec2 coord) {
    float width = screen_size.x;
    float height = screen_size.y;
    float noiseX = ((fract(1.0-coord.s*(width/2.0))*0.25)+(fract(coord.t*(height/2.0))*0.75))*2.0-1.0;
    float noiseY = ((fract(1.0-coord.s*(width/2.0))*0.75)+(fract(coord.t*(height/2.0))*0.25))*2.0-1.0;
    float noiseZ = ((fract(1.0-coord.s*(width/2.0))*0.5)+(fract(coord.t*(height/2.0))*0.5))*2.0-1.0;
    noiseX = clamp(fract(sin(dot(coord ,vec2(12.9898,78.233))) * 43758.5453),0.0,1.0)*2.0-1.0;
    noiseY = clamp(fract(sin(dot(coord ,vec2(12.9898,78.233)*2.0)) * 43758.5453),0.0,1.0)*2.0-1.0;
    noiseZ = clamp(fract(sin(dot(coord ,vec2(12.9898,78.233)*3.0)) * 43758.5453),0.0,1.0)*2.0-1.0;
    return vec3(noiseX, noiseY, noiseZ) * 0.002;
}

void main() {
    vec2 noiseScale = screen_size / 4.0; // screen = 800x600
    
    float depth = texture(u_depth, v_uv).r;
    float sampleDepth = depth * 2.0 - 1.0;
    vec3 fragPos   = get_world_pos(v_uv, depth);
    vec3 normal    = texture(u_normal, v_uv).rgb;
    vec3 randomVec = rand(v_uv);

    vec3 tangent   = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN       = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;
    for(int i = 0; i < kernelSize; ++i)
    {
        // get sample position
        vec3 samplePos = TBN * samples[i]; // from tangent to view-space
        samplePos = fragPos + samplePos * radius; 

        vec4 offset = vec4(samplePos, 1.0);
        offset      = camera_projection * camera_view * offset;    // from view to clip-space
        offset.xyz /= offset.w;               // perspective divide
        offset.xyz  = offset.xyz * 0.5 + 0.5; // transform to range 0.0 - 1.0

        occlusion += (abs(sampleDepth - samplePos.z) <= bias ? 1.0 : 0.0);
    }

    occlusion = (occlusion / float(kernelSize));
    o_color = vec4(0.0, 0.0, 0.0, occlusion);

    // o_color = vec4(texture(u_normal, v_uv).rgb, 1.0);
    // o_color = vec4(fragPos, 1.0);
}`;

const SSAOProgramUniform = new Cacher((config: Config) => {
    const ssao_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, ssao_frag_shader_code).expect();
    const ssao_program = config.render_server.render_state.create_Program(QuadVertexShader.get(config), ssao_frag_shader).expect();

    const uniform_depth_location = config.render_server.render_state.get_ProgramUniformLocation(ssao_program, 'u_depth');
    const uniform_depth_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, ssao_program, uniform_depth_location!, 0);
    uniform_depth_slot.commit();

    const uniform_normal_location = config.render_server.render_state.get_ProgramUniformLocation(ssao_program, 'u_normal');
    const uniform_normal_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, ssao_program, uniform_normal_location!, 1);
    uniform_normal_slot.commit();

    return ssao_program;
});

// #endregion

// #region fog

const fog_frag_shader_code = `#version 300 es
precision highp float;

${RenderServerDevice.ConstantsCode}

${RenderServerDevice.WorldUniformsCode}

in vec2 v_uv;

uniform sampler2D u_depth;
uniform sampler2D u_normal;

layout(location = 0) out vec4 o_color;

void main() {
    float depth = texture(u_depth, v_uv).r;
    o_color = vec4(vec3(0.95, 0.95, 0.95), pow(depth, 10.0));
}`;

const FogProgramUniform = new Cacher((config: Config) => {
    const fog_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, fog_frag_shader_code).expect();
    const fog_program = config.render_server.render_state.create_Program(QuadVertexShader.get(config), fog_frag_shader).expect();

    const uniform_depth_location = config.render_server.render_state.get_ProgramUniformLocation(fog_program, 'u_depth');
    const uniform_depth_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, fog_program, uniform_depth_location!, 0);
    uniform_depth_slot.commit();

    const uniform_normal_location = config.render_server.render_state.get_ProgramUniformLocation(fog_program, 'u_normal');
    const uniform_normal_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, fog_program, uniform_normal_location!, 1);
    uniform_normal_slot.commit();

    return fog_program;
});

// #endregion

// #region oit composite

const oit_frag_shader_code = `#version 300 es
precision highp float;

${RenderServerDevice.WorldUniformsCode}

uniform sampler2D u_color;
uniform sampler2D u_accum;
uniform bool u_colormap;

in vec2 v_uv;

layout(location = 0) out vec4 o_color;

void main() {
	ivec2 uv = ivec2(v_uv * screen_size);
	vec4 color = texelFetch(u_color, uv, 0);
	float color_a = 1.0 - color.a;
	float a = texelFetch(u_accum, uv, 0).r;
	o_color = vec4(color_a * color.rgb / max(a, 0.00001), color_a);
	if (u_colormap) {
		float r = o_color.r;
		o_color.r = r <= 0.0031308 ? (12.92 * r) : (1.055 * pow(r, 1.0 / 2.4) - 0.055);
		float g = o_color.g;
		o_color.g = g <= 0.0031308 ? (12.92 * g) : (1.055 * pow(g, 1.0 / 2.4) - 0.055);
		float b = o_color.b;
		o_color.b = b <= 0.0031308 ? (12.92 * b) : (1.055 * pow(b, 1.0 / 2.4) - 0.055);
	}
}`;

const OiTPorgramUniform = new Cacher((config: Config) => {
    const oit_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, oit_frag_shader_code).expect();
    const oit_program = config.render_server.render_state.create_Program(QuadVertexShader.get(config), oit_frag_shader).expect();

    const uniform_oit_color_location = config.render_server.render_state.get_ProgramUniformLocation(oit_program, 'u_color');
    const uniform_oit_color_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, oit_program, uniform_oit_color_location!, 0);
    uniform_oit_color_slot.commit();

    const uniform_oit_accum_location = config.render_server.render_state.get_ProgramUniformLocation(oit_program, 'u_accum');
    const uniform_oit_accum_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, oit_program, uniform_oit_accum_location!, 1);
    uniform_oit_accum_slot.commit();

    const uniform_oit_colormap_location = config.render_server.render_state.get_ProgramUniformLocation(oit_program, 'u_colormap');
    const uniform_oit_colormap_slot = new WebGL2RenderStateUintUniformSlot(config.render_server.render_state, oit_program, uniform_oit_colormap_location!, 0);
    uniform_oit_colormap_slot.commit();

    return { oit_program, uniform_oit_colormap_slot };
});

// #endregion

// #region sky

const skydome_frag_shader_code = `#version 300 es
precision highp float;
precision highp usampler2DArray;
precision highp sampler3D;

const float PI = 3.1415926535;
const float TAU = 6.283185307;
const float EPSILON = 0.00001;

${RenderServerDevice.WorldUniformsCode}

in vec2 v_uv;

uniform sampler2D sky;

${RenderServerDevice.FrameOutputBufferCode}

void main() {
	vec4 dir = mat4(mat3(camera_world)) * inverse(camera_projection) * vec4((v_uv * 2.0 - 1.0), 1.0, 1.0);
	vec3 R = normalize(dir.xyz);
	float theta = atan(R.z, R.x);
	float gamma = acos(R.y);
	// o_color = texture(sky, vec2(theta / TAU + 0.5, gamma / PI));
    o_color = vec4(0.8, 0.8, 0.8, 1.0);
    o_normal = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

const SkyDomeProgram = new Cacher((config: Config) => {
    const skydome_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, skydome_frag_shader_code).expect();
    const skydome_program = config.render_server.render_state.create_Program(QuadVertexShader.get(config), skydome_frag_shader).expect();

    const uniform_sky_location = config.render_server.render_state.get_ProgramUniformLocation(skydome_program, 'sky');
    const uniform_sky_slot = new WebGL2RenderStateIntUniformSlot(config.render_server.render_state, skydome_program, uniform_sky_location!, RenderServerDevice.SkyTextureUnit);
    uniform_sky_slot.commit();

    return skydome_program;
});

// #endregion

export class EditorRenderer3DPipeline extends Renderer3DPipeline {
    private get render_server() { return this.config.render_server; }

    private _msaa: 1 | 2 | 4 | 8 = 1;
    public get msaa() { return this._msaa; }
    public set msaa(msaa: 1 | 2 | 4 | 8) {
        if (this._msaa !== msaa) {
            this._msaa = msaa;
            this.dispose();
            this.alloc_Solid();
            this.alloc_Transparent();
            this.alloc_Result();
        }
    }

    //#region Solid

    //#region Frame Buffer
    private readonly solid_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly solid_color_depth_copy_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly solid_normal_src_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly solid_normal_copy_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    //#endregion

    //#region Render Buffer
    private readonly solid_color_renderbuffer: Ref<WebGL2RenderStateRenderBuffer> = new Ref();
    private readonly solid_normal_renderbuffer: Ref<WebGL2RenderStateRenderBuffer> = new Ref();
    private readonly solid_depth_renderbuffer: Ref<WebGL2RenderStateRenderBuffer> = new Ref();
    //#endregion

    //#region Texture
    private readonly solid_color_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    private readonly solid_normal_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    private readonly solid_depth_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    //#endregion

    //#endregion

    //#region Transaprent

    //#region Frame Buffer
    private readonly transparent_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly transparent_clear_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly transparent_depth_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly transparent_color_copy_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly transparent_accum_src_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly transparent_accum_copy_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    //#endregion

    //#region Render Buffer
    private readonly transparent_color_renderbuffer: Ref<WebGL2RenderStateRenderBuffer> = new Ref();
    private readonly transparent_accum_renderbuffer: Ref<WebGL2RenderStateRenderBuffer> = new Ref();
    //#endregion

    //#region Texture
    private readonly transparent_color_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    private readonly transparent_accum_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    //#endregion

    //#endregion

    //#region Result

    //#region Frame Buffer
    private readonly result_framebuffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    //#endregion

    //#region Texture
    private readonly result_color_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    //#endregion

    //#endregion

    public get texture() { return this.result_color_texture.expect; }

    private alloc_Solid() {
        // frame buffer
        this.solid_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.solid_color_depth_copy_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.solid_normal_src_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.solid_normal_copy_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();

        // render buffer
        this.solid_color_renderbuffer.value = this.render_server.render_state.create_RenderBuffer(RenderStateTextureFormat.RGBA32F, this.msaa).expect();
        this.solid_depth_renderbuffer.value = this.render_server.render_state.create_RenderBuffer(RenderStateTextureFormat.D32F, this.msaa).expect();
        this.solid_normal_renderbuffer.value = this.render_server.render_state.create_RenderBuffer(RenderStateTextureFormat.RGBA32F, this.msaa).expect();

        // texture
        this.solid_color_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0).expect();
        this.solid_normal_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0).expect();
        this.solid_depth_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.D32F, 0, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();

        this.resize_Solid();

        // link frame buffer
        this.render_server.render_state.set_FrameBufferAttachment(this.solid_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.solid_color_renderbuffer.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.solid_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color1, this.solid_normal_renderbuffer.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.solid_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, this.solid_depth_renderbuffer.expect);
        this.render_server.render_state.enable_FrameBuffer(this.solid_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.solid_color_depth_copy_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.solid_color_texture.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.solid_color_depth_copy_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, this.solid_depth_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.solid_color_depth_copy_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.solid_normal_src_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.solid_normal_renderbuffer.expect);
        this.render_server.render_state.enable_FrameBuffer(this.solid_normal_src_framebuffer.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.solid_normal_copy_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.solid_normal_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.solid_normal_copy_framebuffer.expect);
    }

    private resize_Solid() {
        this.render_server.render_state.alloc_RenderBuffer(this.solid_color_renderbuffer.expect, this.size.x, this.size.y);
        this.render_server.render_state.alloc_RenderBuffer(this.solid_normal_renderbuffer.expect, this.size.x, this.size.y);
        this.render_server.render_state.alloc_RenderBuffer(this.solid_depth_renderbuffer.expect, this.size.x, this.size.y);
        this.render_server.render_state.alloc_Texture2D(this.solid_color_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.RGBA);
        this.render_server.render_state.alloc_Texture2D(this.solid_normal_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.RGBA);
        this.render_server.render_state.alloc_Texture2D(this.solid_depth_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.Depth);
    }

    private alloc_Transparent() {
        // frame buffer
        this.transparent_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.transparent_clear_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.transparent_depth_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.transparent_color_copy_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.transparent_accum_src_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.transparent_accum_copy_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();

        // render buffer
        this.transparent_color_renderbuffer.value = this.render_server.render_state.create_RenderBuffer(RenderStateTextureFormat.RGBA32F, this.msaa).expect();
        this.transparent_accum_renderbuffer.value = this.render_server.render_state.create_RenderBuffer(RenderStateTextureFormat.R32F, this.msaa).expect();

        // texture
        this.transparent_color_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0).expect();
        this.transparent_accum_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.R32F, 0).expect();

        this.resize_Transparent();

        // link frame buffer
        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.transparent_color_renderbuffer.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color1, this.transparent_accum_renderbuffer.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color2, this.solid_normal_renderbuffer.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, this.solid_depth_renderbuffer.expect);
        this.render_server.render_state.enable_FrameBuffer(this.transparent_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_clear_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.transparent_color_renderbuffer.expect);
        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_clear_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color1, this.transparent_accum_renderbuffer.expect);
        this.render_server.render_state.enable_FrameBuffer(this.transparent_clear_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_depth_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, this.solid_depth_renderbuffer.expect);
        this.render_server.render_state.enable_FrameBuffer(this.transparent_depth_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_color_copy_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.transparent_color_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.transparent_color_copy_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_accum_src_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.transparent_accum_renderbuffer.expect);
        this.render_server.render_state.enable_FrameBuffer(this.transparent_accum_src_framebuffer.expect);

        this.render_server.render_state.set_FrameBufferAttachment(this.transparent_accum_copy_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.transparent_accum_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.transparent_accum_copy_framebuffer.expect);
    }

    private resize_Transparent() {
        this.render_server.render_state.alloc_RenderBuffer(this.transparent_color_renderbuffer.expect, this.size.x, this.size.y);
        this.render_server.render_state.alloc_RenderBuffer(this.transparent_accum_renderbuffer.expect, this.size.x, this.size.y);
        this.render_server.render_state.alloc_Texture2D(this.transparent_color_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.RGBA);
        this.render_server.render_state.alloc_Texture2D(this.transparent_accum_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.Red);
    }

    private alloc_Result() {
        // frame buffer
        this.result_framebuffer.value = this.render_server.render_state.create_FrameBuffer().expect();

        // texture
        this.result_color_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0).expect();

        this.resize_Result();

        // link frame buffer
        this.render_server.render_state.set_FrameBufferAttachment(this.result_framebuffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.result_color_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.result_framebuffer.expect);
    }

    private resize_Result() {
        this.render_server.render_state.alloc_Texture2D(this.result_color_texture.expect, this.size.x, this.size.y, 0, RenderStateTextureDataFormat.RGBA);
    }

    constructor(config: Config) {
        super(config);
        this.alloc_Result();
        this.alloc_Solid();
        this.alloc_Transparent();
    }

    private quad_geometry = QuadGeometry.get(this.config);

    private screen_quad_solid_program = OnscreenProgramUniform.get(this.config).onscreen_program;
    private screen_quad_solid_colormap_uniform_slot = OnscreenProgramUniform.get(this.config).uniform_colormap_slot;

    private ssao_quad_solid_program = FogProgramUniform.get(this.config);

    private oit_screen_quad_solid_program = OiTPorgramUniform.get(this.config).oit_program;
    private oit_screen_quad_solid_colormap_uniform_slot = OiTPorgramUniform.get(this.config).uniform_oit_colormap_slot;

    private sky_quad_solid_program = SkyDomeProgram.get(this.config);

    protected resize_Internal(): void {
        this.resize_Result();
        this.resize_Solid();
        this.resize_Transparent();
    }

    // render pipeline

    private set_CullFace(face: RenderServerMaterialCullFace) {
        switch (face) {
            case RenderServerMaterialCullFace.Back: {
                this.render_server.render_state.set_FaceWindingProxy(this.render_server.render_state.gl.CCW);
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
                return;
            }
            case RenderServerMaterialCullFace.Front: {
                this.render_server.render_state.set_FaceWindingProxy(this.render_server.render_state.gl.CW);
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
                return;
            }
            case RenderServerMaterialCullFace.None: {
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, false);
                return;
            }
            default: {
                const n: never = face;
                return;
            }
        }
    }

    private render_RenderQueue0Solid(renderer: EditorRenderer3D, transparent_bg: boolean) {
        const { x: width, y: height } = this.size;
        this.render_server.set_RenderCapabilities(true, true, this.render_server.render_state.gl.LEQUAL, false);
        this.render_server.render_state.set_ViewportProxy(0, 0, width, height);
        this.render_server.render_state.set_ScissorProxy(0, 0, width, height);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        if (transparent_bg) {
            this.render_server.render_state.set_ClearColorProxy(0, 0, 0, 0);
            this.render_server.render_state.clear_FrameBuffer(this.solid_framebuffer.expect, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth);
        }
        else {
            this.render_server.render_state.clear_FrameBuffer(this.solid_framebuffer.expect, RenderStateFrameBufferPart.Depth);
        }

        // render queue solid
        const render_queue = renderer.render_queue_0;
        for (let i = 0; i <= render_queue.solid_pointer; i++) {
            const geometry = render_queue.solid_geometry_queue[i];
            const indexed = render_queue.solid_indexed_queue[i];
            const instance_count = render_queue.solid_instance_count_queue[i];
            const material = render_queue.solid_material_queue[i];
            const transform = render_queue.solid_transform_queue[i];
            const layer = render_queue.solid_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.Shade);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                material.set_UniformOverride('model_world', transform);
                material.set_UniformOverride('layer', layer);
                material.commit_AllUniformOverride(RenderServerShaderPass.Shade);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }

        // draw sky
        if (!transparent_bg) {
            this.render_server.render_state.set_DepthFuncProxy(this.render_server.render_state.gl.LEQUAL);
            this.render_server.render_state.draw_Elements(this.sky_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
        }

        // blit
        this.render_server.render_state.blit_FrameBuffer(this.solid_framebuffer.expect, this.solid_color_depth_copy_framebuffer.expect, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
        this.render_server.render_state.blit_FrameBuffer(this.solid_normal_src_framebuffer.expect, this.solid_normal_copy_framebuffer.expect, RenderStateFrameBufferPart.Color, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
    }

    private compose_RenderQueue0Solid(renderer: EditorRenderer3D, color_map: boolean) {
        this.render_server.render_state.use_FrameBuffer(this.result_framebuffer.expect);
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, false);
        this.set_CullFace(RenderServerMaterialCullFace.None);
        this.render_server.render_state.active_Texture(this.solid_color_texture.expect, 0);
        this.screen_quad_solid_colormap_uniform_slot.value = color_map ? 1 : 0;
        this.screen_quad_solid_colormap_uniform_slot.commit();
        this.render_server.render_state.draw_Elements(this.screen_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
        // post process
        // this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, true);
        // this.render_server.render_state.gl.blendFunc(this.render_server.render_state.gl.SRC_ALPHA, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        // this.render_server.render_state.active_Texture(this.solid_depth_texture.expect, 0);
        // this.render_server.render_state.active_Texture(this.solid_normal_texture.expect, 1);
        // this.render_server.render_state.draw_Elements(this.ssao_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
    }

    private render_RenderQueue0Transparent(renderer: EditorRenderer3D) {
        const { x: width, y: height } = this.size;
        this.render_server.set_RenderCapabilities(true, false, this.render_server.render_state.gl.LEQUAL, true);
        this.render_server.render_state.gl.blendFuncSeparate(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ZERO, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        this.render_server.render_state.set_ClearColorProxy(0, 0, 0, 1);
        this.render_server.render_state.clear_FrameBuffer(this.transparent_clear_framebuffer.expect, RenderStateFrameBufferPart.Color);
        this.render_server.render_state.use_FrameBuffer(this.transparent_framebuffer.expect);

        this.render_server.render_state.active_Texture(this.solid_depth_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.solid_color_texture.expect, 1);

        // draw scene
        // render queue transparent
        const render_queue = renderer.render_queue_0;
        for (let i = 0; i <= render_queue.transparent_pointer; i++) {
            const geometry = render_queue.transparent_geometry_queue[i];
            const indexed = render_queue.transparent_indexed_queue[i];
            const instance_count = render_queue.transparent_instance_count_queue[i];
            const material = render_queue.transparent_material_queue[i];
            const transform = render_queue.transparent_transform_queue[i];
            const layer = render_queue.transparent_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.OiT);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                material.set_UniformOverride('model_world', transform);
                material.set_UniformOverride('layer', layer);
                material.commit_AllUniformOverride(RenderServerShaderPass.OiT);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }

        // blit
        this.render_server.render_state.blit_FrameBuffer(this.transparent_framebuffer.expect, this.transparent_color_copy_framebuffer.expect, RenderStateFrameBufferPart.Color, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
        this.render_server.render_state.blit_FrameBuffer(this.transparent_accum_src_framebuffer.expect, this.transparent_accum_copy_framebuffer.expect, RenderStateFrameBufferPart.Color, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);

        // depth

        this.render_server.set_RenderCapabilities(true, true, this.render_server.render_state.gl.LEQUAL, false);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        this.render_server.render_state.use_FrameBuffer(this.transparent_depth_framebuffer.expect);

        for (let i = 0; i <= render_queue.transparent_pointer; i++) {
            const geometry = render_queue.transparent_geometry_queue[i];
            const indexed = render_queue.transparent_indexed_queue[i];
            const instance_count = render_queue.transparent_instance_count_queue[i];
            const material = render_queue.transparent_material_queue[i];
            const transform = render_queue.transparent_transform_queue[i];
            const layer = render_queue.transparent_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.PreZ);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                material.set_UniformOverride('model_world', transform);
                material.set_UniformOverride('layer', layer);
                material.commit_AllUniformOverride(RenderServerShaderPass.PreZ);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }

        // blit
        this.render_server.render_state.blit_FrameBuffer(this.solid_framebuffer.expect, this.solid_color_depth_copy_framebuffer.expect, RenderStateFrameBufferPart.Depth, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
        this.render_server.render_state.blit_FrameBuffer(this.solid_normal_src_framebuffer.expect, this.solid_normal_copy_framebuffer.expect, RenderStateFrameBufferPart.Color, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
    }

    private compose_RenderQueue0Transparent(renderer: EditorRenderer3D, color_map: boolean) {
        this.render_server.render_state.use_FrameBuffer(this.result_framebuffer.expect);
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, true);
        this.set_CullFace(RenderServerMaterialCullFace.None);
        this.render_server.render_state.gl.blendFunc(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.render_server.render_state.active_Texture(this.transparent_color_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.transparent_accum_texture.expect, 1);
        this.oit_screen_quad_solid_colormap_uniform_slot.value = color_map ? 1 : 0;
        this.oit_screen_quad_solid_colormap_uniform_slot.commit();
        this.render_server.render_state.draw_Elements(this.oit_screen_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
    }

    private render_RenderQueue1Solid(renderer: EditorRenderer3D) {
        const { x: width, y: height } = this.size;
        this.render_server.set_RenderCapabilities(true, true, this.render_server.render_state.gl.LEQUAL, false);
        this.render_server.render_state.set_ViewportProxy(0, 0, width, height);
        this.render_server.render_state.set_ScissorProxy(0, 0, width, height);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        this.render_server.render_state.set_ClearColorProxy(0, 0, 0, 0);
        this.render_server.render_state.clear_FrameBuffer(this.solid_framebuffer.expect, RenderStateFrameBufferPart.Color | RenderStateFrameBufferPart.Depth);

        this.render_server.render_state.active_Texture(this.solid_depth_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.solid_color_texture.expect, 1);

        // render queue solid
        const render_queue = renderer.render_queue_1;
        for (let i = 0; i <= render_queue.solid_pointer; i++) {
            const geometry = render_queue.solid_geometry_queue[i];
            const indexed = render_queue.solid_indexed_queue[i];
            const instance_count = render_queue.solid_instance_count_queue[i];
            const material = render_queue.solid_material_queue[i];
            const transform = render_queue.solid_transform_queue[i];
            const layer = render_queue.solid_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.Shade);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                material.set_UniformOverride('model_world', transform);
                material.set_UniformOverride('layer', layer);
                material.commit_AllUniformOverride(RenderServerShaderPass.Shade);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }

        // blit
        this.render_server.render_state.blit_FrameBuffer(this.solid_framebuffer.expect, this.solid_color_depth_copy_framebuffer.expect, RenderStateFrameBufferPart.Color, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
    }

    private compose_RenderQueue1Solid(renderer: EditorRenderer3D) {
        this.render_server.render_state.use_FrameBuffer(this.result_framebuffer.expect);
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, true);
        this.render_server.render_state.gl.blendFunc(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.set_CullFace(RenderServerMaterialCullFace.None);
        this.render_server.render_state.active_Texture(this.solid_color_texture.expect, 0);
        this.screen_quad_solid_colormap_uniform_slot.value = 0;
        this.screen_quad_solid_colormap_uniform_slot.commit();
        this.render_server.render_state.draw_Elements(this.screen_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
    }

    private render_RenderQueue1Transparent(renderer: EditorRenderer3D) {
        const { x: width, y: height } = this.size;
        this.render_server.set_RenderCapabilities(true, false, this.render_server.render_state.gl.LEQUAL, true);
        this.render_server.render_state.gl.blendFuncSeparate(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ZERO, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        this.render_server.render_state.set_ClearColorProxy(0, 0, 0, 1);
        this.render_server.render_state.clear_FrameBuffer(this.transparent_clear_framebuffer.expect, RenderStateFrameBufferPart.Color);
        this.render_server.render_state.use_FrameBuffer(this.transparent_framebuffer.expect);

        this.render_server.render_state.active_Texture(this.solid_depth_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.solid_color_texture.expect, 1);

        // draw scene
        // render queue transparent
        const render_queue = renderer.render_queue_1;
        for (let i = 0; i <= render_queue.transparent_pointer; i++) {
            const geometry = render_queue.transparent_geometry_queue[i];
            const indexed = render_queue.transparent_indexed_queue[i];
            const instance_count = render_queue.transparent_instance_count_queue[i];
            const material = render_queue.transparent_material_queue[i];
            const transform = render_queue.transparent_transform_queue[i];
            const layer = render_queue.transparent_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.OiT);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                material.set_UniformOverride('model_world', transform);
                material.set_UniformOverride('layer', layer);
                material.commit_AllUniformOverride(RenderServerShaderPass.OiT);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }

        // blit
        this.render_server.render_state.blit_FrameBuffer(this.transparent_framebuffer.expect, this.transparent_color_copy_framebuffer.expect, RenderStateFrameBufferPart.Color, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
        this.render_server.render_state.blit_FrameBuffer(this.transparent_accum_src_framebuffer.expect, this.transparent_accum_copy_framebuffer.expect, RenderStateFrameBufferPart.Color, RenderStateTextureMagFilter.Nearest, 0, 0, width, height);
    }

    private compose_RenderQueue1Transparent(renderer: EditorRenderer3D) {
        this.render_server.render_state.use_FrameBuffer(this.result_framebuffer.expect);
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, true);
        this.set_CullFace(RenderServerMaterialCullFace.None);
        this.render_server.render_state.gl.blendFunc(this.render_server.render_state.gl.ONE, this.render_server.render_state.gl.ONE_MINUS_SRC_ALPHA);
        this.render_server.render_state.active_Texture(this.transparent_color_texture.expect, 0);
        this.render_server.render_state.active_Texture(this.transparent_accum_texture.expect, 1);
        this.oit_screen_quad_solid_colormap_uniform_slot.value = 0;
        this.oit_screen_quad_solid_colormap_uniform_slot.commit();
        this.render_server.render_state.draw_Elements(this.oit_screen_quad_solid_program, this.quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
    }

    protected render_Internal(renderer: EditorRenderer3D, world: World3D, viewport: Viewport, once: boolean): void {
        const { transparent: transparent_bg, color_map } = viewport;
        // render queue 0
        this.render_RenderQueue0Solid(renderer, transparent_bg);
        this.compose_RenderQueue0Solid(renderer, color_map);
        if (renderer.render_queue_0.transparent_pointer >= 0) {
            this.render_RenderQueue0Transparent(renderer);
            this.compose_RenderQueue0Transparent(renderer, color_map);
        }
        // render queue 1
        if (renderer.render_queue_1 !== undefined) {
            this.render_RenderQueue1Solid(renderer);
            this.compose_RenderQueue1Solid(renderer);
            if (renderer.render_queue_1.transparent_pointer >= 0) {
                this.render_RenderQueue1Transparent(renderer);
                this.compose_RenderQueue1Transparent(renderer);
            }
        }
    }

    public dispose(): void {
        // solid
        this.solid_framebuffer.clear();
        this.solid_color_depth_copy_framebuffer.clear();
        this.solid_normal_src_framebuffer.clear();
        this.solid_normal_copy_framebuffer.clear();
        this.solid_color_renderbuffer.clear();
        this.solid_depth_renderbuffer.clear();
        this.solid_color_texture.clear();
        this.solid_normal_texture.clear();
        this.solid_depth_texture.clear();
        // transparent
        this.transparent_framebuffer.clear();
        this.transparent_clear_framebuffer.clear();
        this.transparent_depth_framebuffer.clear();
        this.transparent_color_copy_framebuffer.clear();
        this.transparent_accum_src_framebuffer.clear();
        this.transparent_accum_copy_framebuffer.clear();
        this.transparent_color_renderbuffer.clear();
        this.transparent_accum_renderbuffer.clear();
        this.transparent_color_texture.clear();
        this.transparent_accum_texture.clear();
        // reuslt
        this.result_framebuffer.clear();
        this.result_color_texture.clear();
    }
}