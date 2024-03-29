import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import type { WebGL2RenderStateFrameBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateFrameBuffer";
import { RenderStateTextureType, RenderStateTextureFormat, RenderStateTextureMinFilter, RenderStateTextureMagFilter, RenderStateTextureDataFormat, RenderStateDataType, RenderStateShaderType, RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { WebGL2RenderStateFrameBufferAttachmentPoint } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { WebGL2RenderStateFloatUniformSlot } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateUniformSlot";
import { RenderDeviceVector2AttributeBuffer, RenderDeviceIndexAttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import type { SceneTree } from "../../SceneTree";
import { Ref, RefArray } from "@/system/utils/RefCounted";
import type { RenderServerGeometry } from "../../render_server/RenderServerGeometry";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import type { RenderServerMaterial } from "../../render_server/RenderServerMaterial";
import { WorldObject } from "../WorldObject";
import { RID, type Rid } from "../../Rid";
import { GeometryResource } from "../../resources/geometry_resources/GeometryResource";
import type { MaterialResource } from "../../resources/material_resources/MaterialResource";
import type { Renderer3DQueue } from "../../renderer/renderer_3d/Renderer3DQueue";
import type { Frustum3 } from "@/system/fivepebble/graphics/Frustum3";
import { ConfiguredObject, type Config } from "../../ConfiguredObject";
import { Cacher } from "@/system/utils/Cacher";
import type { WebGL2RenderStateProgram } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateProgram";
import { RenderServerLightType, RenderServerLightsData } from "../../render_server/RenderServerLightData";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { RenderServerPlainColorTexture } from "../../render_server/RenderServer";
import type { Viewport } from "../../nodes/Node";

// #region sky

const SkyQuadGeometry = new Cacher((config: Config) => {
    const quad_position = new RenderDeviceVector2AttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [
	      /* 0 */Vector2.create(-1, 1),			//   1  0 ------ 2
	      /* 1 */Vector2.create(-1, -1),		//   |  |        |
	      /* 2 */Vector2.create(1, 1),			//   |  |        |
	      /* 3 */Vector2.create(1, -1),			//  -1  1 ------ 3
        /*                    *///     -1 ------ 1
    ]);
    const quad_index = new RenderDeviceIndexAttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [0, 1, 2, 3]);
    const quad_surface = config.render_server.create_Geometry();
    quad_surface.set_Geometry(RenderStatePrimitiveType.TriangleStrip, { position: quad_position }, quad_index);
    return new Ref(quad_surface);
});

const quad_vert_shader_code = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

out vec2 v_uv;

void main() {
	gl_Position = vec4(a_position, 1.0, 1.0);
	v_uv = (a_position + 1.0) / 2.0;
}
`;
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

const SkyProgramUniform = new Cacher((config: Config) => {
    const quad_vert_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Vertex, quad_vert_shader_code).expect();
    const quad_frag_shader = config.render_server.render_state.create_Shader(RenderStateShaderType.Fragment, sky_frag_shader_code).expect();
    const sky_program = config.render_server.render_state.create_Program(quad_vert_shader, quad_frag_shader).expect();
    const uniform_time_location = config.render_server.render_state.get_ProgramUniformLocation(sky_program, 'time');
    const uniform_time_slot = new WebGL2RenderStateFloatUniformSlot(config.render_server.render_state, sky_program, uniform_time_location!, 0);
    return { sky_program: new Ref(sky_program), uniform_time_slot: new Ref(uniform_time_slot) };
});

// #endregion

export class VisualWorld3DMesh extends WorldObject {

    static readonly #const_vector3_zero: Vector3 = new Vector3(0, 0, 0);
    static readonly #tmp_box3_0 = Box3.new;
    static readonly #tmp_vetcor3_0 = Vector3.new;
    static readonly #tmp_vetcor4_0 = Vector4.new;
    static readonly #tmp_matrix4_0 = Matrix4.new;
    static get_WorldSpaceHalfWidth(camera: Camera3, distance: number, size: number, resolution: Vector2) {
        // transform into clip space, adjust the x and y values by the pixel width offset, then
        // transform back into world space to get world offset. Note clip space is [-1, 1] so full
        // width does not need to be halved.
        const clip_to_world = VisualWorld3DMesh.#tmp_vetcor4_0.set(0, 0, - distance, 1.0);
        const projection = camera.get_Projection(VisualWorld3DMesh.#tmp_matrix4_0);
        clip_to_world.transform(clip_to_world, projection);
        clip_to_world.mult_Number(clip_to_world, 1.0 / clip_to_world.w);
        clip_to_world.x = size / resolution.x;
        clip_to_world.y = size / resolution.y;
        clip_to_world.transform(clip_to_world, projection.inverse(projection));
        clip_to_world.mult_Number(clip_to_world, 1.0 / clip_to_world.w);
        return Math.abs(Math.max(clip_to_world.x, clip_to_world.y));
    }

    public readonly geometry_ref: Ref<RenderServerGeometry> = new Ref();
    protected readonly surface_materials_ref: RefArray<RenderServerMaterial> = new RefArray();
    public readonly material_override_ref: Ref<RenderServerMaterial> = new Ref();

    private is_surface_materials_empty: boolean = false;

    public readonly global_transform: Matrix4 = Matrix4.new;
    public _visible: boolean = true;
    public layer: number = 0xffffffff;
    public cast_shadow: boolean = true;
    public render_queue: number = 0;
    public bbox_enlargment: number = 0;

    //editor

    public editor_highlighted: boolean = false;

    public get visible() { return this._visible && !this.is_bbox_empty; }

    public get has_geometry() { return !this.geometry_ref.is_empty && this.geometry_ref.expect.has_geometry; }

    // global transformed
    private bbox: Box3 = Box3.new;
    private is_bbox_empty: boolean = true;
    private _bbox_override: Box3 | undefined = undefined;

    constructor(config: Config, rid: Rid) {
        super(config, rid);
    }

    private update_BBox() {
        if (this._bbox_override === undefined) {
            if (!this.has_geometry) {
                this.bbox.set(VisualWorld3DMesh.#const_vector3_zero, VisualWorld3DMesh.#const_vector3_zero);
                this.is_bbox_empty = true;
            }
            else {
                this.bbox.apply_Matrix4(this.geometry_ref.expect.bbox, this.global_transform);
                this.is_bbox_empty = this.bbox.is_empty;
                if (!this.is_bbox_empty && this.bbox_enlargment > 0) this.bbox.enlarge(this.bbox, this.bbox_enlargment);
            }
        }
        else {
            this.bbox.apply_Matrix4(this._bbox_override, this.global_transform);
            this.is_bbox_empty = this.bbox.is_empty;
        }
    }

    private update_SurfaceMaterialsEmpty() {
        const count = this.surface_materials_ref.length;
        for (let i = 0; i < count; i++) {
            if (!this.surface_materials_ref.get(i, true)!.is_empty) {
                this.is_surface_materials_empty = false;
            }
        }
        this.is_surface_materials_empty = true;
    }

    private on_geometry_bbox_changed = (bbox: Box3) => { this.update_BBox(); }
    public set_Geometry(geometry: RenderServerGeometry | undefined) {
        if (!this.geometry_ref.is_empty) {
            this.geometry_ref.expect.singal_bbox_changed.disconnect(this.on_geometry_bbox_changed);
        }
        this.geometry_ref.value = geometry;
        if (!this.geometry_ref.is_empty) {
            this.geometry_ref.expect.singal_bbox_changed.connect(this.on_geometry_bbox_changed);
            const surface_count = this.geometry_ref.expect.surface_count;
            if (surface_count === 0) this.surface_materials_ref.clear();
            else {
                this.surface_materials_ref.resize(surface_count);
            }
        }
        else {
            this.surface_materials_ref.clear();
        }
        this.update_SurfaceMaterialsEmpty();
        this.update_BBox();
    }

    public set_BBoxOverride(bbox: Box3 | undefined) {
        if (bbox === undefined) {
            if (this._bbox_override === undefined) return;
            this._bbox_override = undefined
        }
        else {
            if (this._bbox_override === undefined) this._bbox_override = bbox.clone();
            else this._bbox_override.copy(bbox);
        }
        this.update_BBox();
    }

    public set_BBoxEnlargement(amount: number) {
        this.bbox_enlargment = Math.max(0, Math.min(65536, amount));
        this.update_BBox();
    }

    public set_EditorHighlighted(highlighted: boolean) {
        this.editor_highlighted = highlighted;
    }

    public set_SurfaceMaterial(surface_idx: number, material: RenderServerMaterial | undefined) {
        if (this.geometry_ref.is_empty) return;
        const geometry = this.geometry_ref.expect;
        if (surface_idx < 0 || surface_idx >= geometry.surface_count || surface_idx >= this.surface_materials_ref.length) return;
        this.surface_materials_ref.set(surface_idx, material);
        if (material === undefined) this.update_SurfaceMaterialsEmpty();
        else this.is_surface_materials_empty = false;
    }

    public set_MaterialOverride(material: RenderServerMaterial | undefined) {
        this.material_override_ref.value = material;
    }

    public set_GlobalTransform(mat: Matrix4) {
        this.global_transform.copy(mat);
        this.update_BBox();
    }

    public set_Visible(visible: boolean) {
        this._visible = visible;
    }

    public set_Layer(layer: number) {
        this.layer = layer & 0xffffffff;
    }

    public set_RenderQueue(render_queue: number) {
        this.render_queue = render_queue;
    }

    public set_CastShadow(cast: boolean) {
        this.cast_shadow = cast;
    }

    public clear_Materials() {
        this.material_override_ref.clear();
        this.surface_materials_ref.clear();
    }

    // fill render queue

    public fill_RenderQueue(queue: Renderer3DQueue, frustum: Frustum3, camera: Camera3, base_size: Vector2): boolean {
        // bbox test
        const need_enlarge = this.geometry_ref.expect.bbox_pixel_enlargement > 0;
        if (!need_enlarge && !frustum.contain_Box(this.bbox, false)) {
            return false;
        }
        else if (need_enlarge) {
            const position = camera.get_GlobalTransform(VisualWorld3DMesh.#tmp_matrix4_0).get_Position(VisualWorld3DMesh.#tmp_vetcor3_0);
            const distance = this.bbox.get_FarestDistanceToPoint(position);
            const amount = VisualWorld3DMesh.get_WorldSpaceHalfWidth(camera, distance, this.geometry_ref.expect.bbox_pixel_enlargement, base_size);
            const bbox = VisualWorld3DMesh.#tmp_box3_0.enlarge(this.bbox, amount);
            if (!frustum.contain_Box(bbox, false)) {
                return false;
            }
        }

        if (this.is_surface_materials_empty) {
            if (this.material_override_ref.is_empty) return false;
            const geometry = this.geometry_ref.expect;
            const vertex_array = geometry.get_Geometry();
            if (vertex_array !== undefined) queue.add(vertex_array, this.material_override_ref.expect, geometry.is_indexed, geometry.instance_count, this.global_transform, this.layer);
        }
        else {
            const surface_materials_count = this.surface_materials_ref.length;
            for (let i = 0; i < surface_materials_count; i++) {
                let material = this.surface_materials_ref.get(i, false);
                if (material === undefined) {
                    if (this.material_override_ref.is_empty) continue;
                    else material = this.material_override_ref.expect;
                }
                const geometry = this.geometry_ref.expect;
                const vertex_array_view = geometry.get_Surface(i);
                if (vertex_array_view !== undefined) queue.add(vertex_array_view, material, geometry.is_indexed, geometry.instance_count, this.global_transform, this.layer);
            }
        }
        return true;
    }

    public dispose(): void {
        this.geometry_ref.clear();
        this.clear_Materials();
    }
}

export class VisualWorld3DLight extends WorldObject {

    public type: RenderServerLightType = RenderServerLightType.SpotLight;
    public readonly position: Vector3 = new Vector3();
    public readonly direction: Vector3 = new Vector3(0, 0, -1);
    public readonly color: Vector3 = new Vector3(1, 1, 1);
    public intensity: number = 1.0;
    public attenuation: number = 2.0;
    public layer: number = 0xffffffff;
    public mask: number = 0xffffffff;
    public visible: boolean = true;
    public param_0: number = 0;
    public param_1: number = 0;
    public param_2: number = 0;
    public param_3: number = 0;
    public cast_shadow: boolean = false;
    public shadow_bias: number = 0;
    public shadow_normal_bias: number = 0;
    public shadow_opacity: number = 0;
    public shadows: Set<VisualWorld3DLightShadow> = new Set();
    public render_queue: number = 0;

    constructor(config: Config, rid: Rid) {
        super(config, rid);
    }

    public set_Type(type: RenderServerLightType) {
        this.type = type;
    }

    public set_GlobalPosition(position: Vector3) {
        this.position.copy(position);
    }

    public set_GlobalDirection(direction: Vector3) {
        this.direction.copy(direction);
    }

    public set_Color(color: Vector3) {
        this.color.copy(color);
    }

    public set_Intensity(intensity: number) {
        this.intensity = intensity;
    }

    public set_Attenuation(attenuation: number) {
        this.attenuation = attenuation;
    }

    public set_Mask(mask: number) {
        this.mask = mask & 0xffffffff;
        for (const shadow of this.shadows) {
            shadow.set_Mask(this.mask);
        }
    }

    public set_Layer(layer: number) {
        this.layer = layer & 0xffffffff;
    }

    public set_RenderQueue(render_queue: number) {
        this.render_queue = render_queue;
    }

    public set_Visible(visible: boolean) {
        this.visible = visible;
    }

    public set_Parameter0(val: number) {
        this.param_0 = val;
    }

    public set_Parameter1(val: number) {
        this.param_1 = val;
    }

    public set_Parameter2(val: number) {
        this.param_2 = val;
    }

    public set_Parameter3(val: number) {
        this.param_3 = val;
    }

    public set_CastShadow(cast: boolean) {
        this.cast_shadow = cast;
    }

    public add_Shadow(shadow: VisualWorld3DLightShadow) {
        shadow.light = this;
        shadow.set_Mask(this.layer);
        this.shadows.add(shadow);
    }

    public remove_Shadow(shadow: VisualWorld3DLightShadow) {
        shadow.light = undefined;
        shadow.set_Mask(0);
        this.shadows.delete(shadow);
    }

    public set_ShadowBias(bias: number) {
        this.shadow_bias = bias;
    }

    public set_ShadowNormalBias(bias: number) {
        this.shadow_normal_bias = bias;
    }

    public set_ShadowOpacity(opacity: number) {
        this.shadow_opacity = opacity;
    }

    // fill light data

    static readonly #color: Vector3 = new Vector3();

    public fill_LightData(lights_data: RenderServerLightsData, idx: number): number {
        if (idx >= lights_data.max_light_count) return idx;
        const color = VisualWorld3DLight.#color;
        color.mult_Number(this.color, this.intensity);
        const data_stride = !this.cast_shadow ? 0 : this.shadows.size;
        lights_data.set_Light(idx, this.type, this.position, this.direction, color, this.attenuation, this.mask, this.param_0, this.param_1, this.param_2, this.param_3, this.shadow_bias, this.shadow_normal_bias, this.shadow_opacity, data_stride);
        if (data_stride > 0) {
            let _idx = idx;
            for (const shadow of this.shadows) {
                shadow.fill_LightShadowData(lights_data, ++_idx);
            }
        }
        return idx + data_stride;
    }

    public dispose(): void {
        this.shadows.clear();
    }
}

export enum LightShadowMapSize {
    S128, S256, S512, S1024, S2048
}

export class VisualWorld3DLightShadow extends WorldObject {

    public light: VisualWorld3DLight | undefined = undefined;
    public readonly camera: Camera3 = new Camera3();
    public readonly global_projection: Matrix4 = Matrix4.new;
    public size: LightShadowMapSize = LightShadowMapSize.S512;

    public rect_min: Vector2 = Vector2.create(0, 0);
    public rect_max: Vector2 = Vector2.create(1, 1);
    public rect_layer: number = 0;

    public set_Projection(mat: Matrix4) {
        this.camera.projection = mat;
        this.update_GlobalProjection();
    }

    public set_GlobalTransform(mat: Matrix4) {
        this.camera.global_transform = mat;
        this.update_GlobalProjection();
        console.log(this);
    }

    public set_Mask(mask: number) {
        this.camera.mask = mask;
    }

    protected update_GlobalProjection() {
        this.camera.get_GlobalProjection(this.global_projection);
    }

    public fill_LightShadowData(lights_data: RenderServerLightsData, idx: number) {
        if (idx >= lights_data.max_light_count) return;
        lights_data.set_LightProjectionMatrixRegion(idx, this.global_projection, this.rect_min, this.rect_max, this.rect_layer);
    }

    public dispose(): void { }
}

export class VisualWorld3D extends ConfiguredObject {
    protected readonly meshes_map: Map<Rid, VisualWorld3DMesh> = new Map();
    protected readonly lights_map: Map<Rid, VisualWorld3DLight> = new Map();
    protected readonly light_shadows_map: Map<Rid, VisualWorld3DLightShadow> = new Map();

    public get render_server() { return this.config.render_server; }

    public get meshes() { return this.meshes_map.values(); }
    public get lights() { return this.lights_map.values(); }
    public get light_shadows() { return this.light_shadows_map.values(); }

    // light shadow maps
    public readonly lights_data: Ref<RenderServerLightsData> = new Ref(new RenderServerLightsData(this.render_server, 64, 64));
    public readonly shadows_texture: Ref<WebGL2RenderStateTexture> = new Ref(this.render_server.get_PlainColorTexture(RenderServerPlainColorTexture.Empty));

    public readonly sky_texture: Ref<WebGL2RenderStateTexture> = new Ref();
    public readonly sky_frame_buffer: Ref<WebGL2RenderStateFrameBuffer> = new Ref();
    private readonly sky_quad_geometry: RenderServerGeometry;
    private readonly sky_program: WebGL2RenderStateProgram;
    private readonly sky_uniform_time_slot: WebGL2RenderStateFloatUniformSlot;

    constructor(config: Config) {
        super(config);
        this.sky_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA32F, 0, undefined, undefined, undefined, RenderStateTextureMinFilter.Linear, RenderStateTextureMagFilter.Linear).expect();
        this.render_server.render_state.alloc_Texture2D(this.sky_texture.expect, 2048, 1024, 0, RenderStateTextureDataFormat.RGBA);
        this.sky_frame_buffer.value = this.render_server.render_state.create_FrameBuffer().expect();
        this.render_server.render_state.set_FrameBufferAttachment(this.sky_frame_buffer.expect, WebGL2RenderStateFrameBufferAttachmentPoint.Color0, this.sky_texture.expect);
        this.render_server.render_state.enable_FrameBuffer(this.sky_frame_buffer.expect);
        this.sky_quad_geometry = SkyQuadGeometry.get(this.config).expect;
        const { sky_program, uniform_time_slot } = SkyProgramUniform.get(this.config);
        this.sky_program = sky_program.expect;
        this.sky_uniform_time_slot = uniform_time_slot.expect;

        // shadows texture
        this.shadows_texture.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2DArray, false, RenderStateTextureFormat.D32F, 0, undefined, undefined, undefined, RenderStateTextureMinFilter.Nearest, RenderStateTextureMagFilter.Nearest).expect();
        this.render_server.render_state.alloc_Texture3D(this.shadows_texture.expect, 2048, 2048, 8, 0, RenderStateTextureDataFormat.Depth);
    }

    private rendered_once: boolean = true;

    public trigger_BeforeRender(scene_tree: SceneTree) {
        this.rendered_once = false;
    }

    public render(viewport: Viewport) {
        if (!this.rendered_once) {
            this.update_Sky(viewport.get_SceneTree()?.time ?? 0);
            this.update_LightsData(viewport.get_Camera3D()?.get_Camera()?.mask ?? 0xffffffff);
        }
        this.rendered_once = true;
    }

    private update_Sky(time: number) {
        this.render_server.set_RenderCapabilities(false, false, this.render_server.render_state.gl.ALWAYS, false);
        this.render_server.render_state.set_ViewportProxy(0, 0, this.sky_texture.expect.width, this.sky_texture.expect.height);
        this.render_server.render_state.set_ScissorProxy(0, 0, this.sky_texture.expect.width, this.sky_texture.expect.height);
        this.render_server.render_state.use_FrameBuffer(this.sky_frame_buffer.expect);
        this.sky_uniform_time_slot.value = time;
        this.sky_uniform_time_slot.commit();
        this.render_server.render_state.draw_Elements(this.sky_program, this.sky_quad_geometry.get_Geometry()!, RenderStateDataType.UnsignedInt, 1);
    }

    private update_LightsData(mask: number) {
        const lights_data = this.lights_data.expect;
        lights_data.clear_Lights();
        let light_idx = 0;
        for (const light of this.lights) {
            if (light_idx >= lights_data.max_light_count) break;
            if (!light.visible || (light.layer & mask) === 0) continue;
            light_idx = light.fill_LightData(lights_data, light_idx);
            light_idx++;
        }
        if (light_idx < lights_data.max_light_count) {
            lights_data.set_Light(light_idx, 0);
        }
        lights_data.commit_AllLightsData();
    }

    //#region Mesh

    public create_Mesh(): Rid {
        const rid = RID();
        const mesh = new VisualWorld3DMesh(this.config, rid);
        this.meshes_map.set(rid, mesh);
        return rid;
    }

    protected mesh_getter_cache: [undefined | Rid, VisualWorld3DMesh | undefined] = [undefined, undefined];
    protected set_MeshGetterCache(rid: Rid, mesh: VisualWorld3DMesh) {
        this.mesh_getter_cache[0] = rid;
        this.mesh_getter_cache[1] = mesh;
    }
    protected reset_MeshGetterCache(rid: Rid) {
        if (this.mesh_getter_cache[0] === rid) {
            this.mesh_getter_cache[0] = undefined;
            this.mesh_getter_cache[1] = undefined;
        }
    }
    protected clear_MeshGetterCache() {
        this.mesh_getter_cache[0] = undefined;
        this.mesh_getter_cache[1] = undefined;
    }

    protected get_Mesh(rid: Rid): VisualWorld3DMesh | undefined {
        if (this.mesh_getter_cache[0] === rid) {
            return this.mesh_getter_cache[1];
        }
        const mesh = this.meshes_map.get(rid);
        if (mesh !== undefined) {
            this.set_MeshGetterCache(rid, mesh);
        }
        return mesh;
    }

    public free_Mesh(rid: Rid) {
        const instance = this.get_Mesh(rid);
        if (instance === undefined) return;
        instance.dispose();
        this.reset_MeshGetterCache(rid);
        this.meshes_map.delete(rid);
    }

    public set_MeshGeometry(rid: Rid, geometry: GeometryResource | undefined) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            if (geometry === undefined) {
                instance.set_Geometry(undefined);
            }
            else {
                instance.set_Geometry(geometry.geometry);
            }
        }
    }

    public set_MeshBBoxOverride(rid: Rid, bbox: Box3 | undefined) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_BBoxOverride(bbox);
        }
    }

    public set_MeshBBoxEnlargment(rid: Rid, amount: number) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_BBoxEnlargement(amount);
        }
    }

    public set_MeshEditorHighlighted(rid: Rid, highlighted: boolean) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_EditorHighlighted(highlighted);
        }
    }

    public set_MeshSurfaceMaterial(rid: Rid, surface_idx: number, material: MaterialResource | undefined) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            if (material === undefined) {
                instance.set_SurfaceMaterial(surface_idx, undefined);
            }
            else {
                instance.set_SurfaceMaterial(surface_idx, material.material);
            }
        }
    }

    public set_MeshMaterialOverride(rid: Rid, material: MaterialResource | undefined) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            if (material === undefined) {
                instance.set_MaterialOverride(undefined);
            }
            else {
                instance.set_MaterialOverride(material.material);
            }
        }
    }

    public set_MeshGlobalTransform(rid: Rid, transform: Matrix4) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_GlobalTransform(transform);
        }
    }

    public set_MeshVisibility(rid: Rid, visible: boolean) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_Visible(visible);
        }
    }

    public set_MeshLayer(rid: Rid, layer: number) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_Layer(layer);
        }
    }

    public set_MeshRenderQueue(rid: Rid, render_queue: number) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_RenderQueue(render_queue);
        }
    }

    public set_MeshCastShadow(rid: Rid, cast: boolean) {
        const instance = this.get_Mesh(rid);
        if (instance) {
            instance.set_CastShadow(cast);
        }
    }

    //#endregion

    //#region Light

    public create_Light(): Rid {
        const rid = RID();
        const light = new VisualWorld3DLight(this.config, rid);
        this.lights_map.set(rid, light);
        return rid;
    }

    protected light_getter_cache: [undefined | Rid, VisualWorld3DLight | undefined] = [undefined, undefined];
    protected set_LightGetterCache(rid: Rid, light: VisualWorld3DLight) {
        this.light_getter_cache[0] = rid;
        this.light_getter_cache[1] = light;
    }
    protected reset_LightGetterCache(rid: Rid) {
        if (this.light_getter_cache[0] === rid) {
            this.light_getter_cache[0] = undefined;
            this.light_getter_cache[1] = undefined;
        }
    }
    protected clear_LightGetterCache() {
        this.light_getter_cache[0] = undefined;
        this.light_getter_cache[1] = undefined;
    }

    protected get_Light(rid: Rid): VisualWorld3DLight | undefined {
        if (this.light_getter_cache[0] === rid) {
            return this.light_getter_cache[1];
        }
        const light = this.lights_map.get(rid);
        if (light !== undefined) {
            this.set_LightGetterCache(rid, light);
        }
        return light;
    }

    public free_Light(rid: Rid) {
        const instance = this.get_Light(rid);
        if (instance === undefined) return;
        instance.dispose();
        this.reset_LightGetterCache(rid);
        this.lights_map.delete(rid);
    }

    public set_LightType(rid: Rid, type: RenderServerLightType) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Type(type);
        }
    }

    public set_LightGlobalPosition(rid: Rid, position: Vector3) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_GlobalPosition(position);
        }
    }

    public set_LightGlobalDirection(rid: Rid, direction: Vector3) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_GlobalDirection(direction);
        }
    }

    public set_LightColor(rid: Rid, color: Vector3) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Color(color);
        }
    }

    public set_LightIntensity(rid: Rid, intensity: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Intensity(intensity);
        }
    }

    public set_LightAttenuation(rid: Rid, attenuation: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Attenuation(attenuation);
        }
    }

    public set_LightLayer(rid: Rid, layer: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Layer(layer);
        }
    }

    public set_LightMask(rid: Rid, mask: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Mask(mask);
        }
    }

    public set_LightRenderQueue(rid: Rid, queue: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_RenderQueue(queue);
        }
    }

    public set_LightVisibility(rid: Rid, visible: boolean) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Visible(visible);
        }
    }

    public set_LightParameters(rid: Rid, val0?: number, val1?: number, val2?: number, val3?: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            if (val0 !== undefined) instance.set_Parameter0(val0);
            if (val1 !== undefined) instance.set_Parameter1(val1);
            if (val2 !== undefined) instance.set_Parameter2(val2);
            if (val3 !== undefined) instance.set_Parameter3(val3);
        }
    }

    public set_LightParameter0(rid: Rid, val: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Parameter0(val);
        }
    }

    public set_LightParameter1(rid: Rid, val: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Parameter1(val);
        }
    }

    public set_LightParameter2(rid: Rid, val: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Parameter2(val);
        }
    }

    public set_LightParameter3(rid: Rid, val: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_Parameter3(val);
        }
    }

    public set_LightShadowBias(rid: Rid, bias: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_ShadowBias(bias);
        }
    }

    public set_LightCastShadow(rid: Rid, cast: boolean) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_CastShadow(cast);
        }
    }

    public add_LightShadow(rid: Rid, shadow: Rid) {
        const instance = this.get_Light(rid);
        const shadow_instance = this.get_LightShadow(shadow);
        if (instance && shadow_instance && shadow_instance.light === undefined) {
            instance.add_Shadow(shadow_instance);
        }
    }

    public remove_LightShadow(rid: Rid, shadow: Rid) {
        const instance = this.get_Light(rid);
        const shadow_instance = this.get_LightShadow(shadow);
        if (instance && shadow_instance && shadow_instance.light === instance) {
            instance.remove_Shadow(shadow_instance);
        }
    }

    public set_LightShadowNormalBias(rid: Rid, bias: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_ShadowNormalBias(bias);
        }
    }

    public set_LightShadowOpacity(rid: Rid, opacity: number) {
        const instance = this.get_Light(rid);
        if (instance) {
            instance.set_ShadowOpacity(opacity);
        }
    }

    //#endregion

    //#region LightShadow

    public create_LightShadow(): Rid {
        const rid = RID();
        const light = new VisualWorld3DLightShadow(this.config, rid);
        this.light_shadows_map.set(rid, light);
        return rid;
    }

    protected light_shadow_getter_cache: [undefined | Rid, VisualWorld3DLightShadow | undefined] = [undefined, undefined];
    protected set_LightShadowGetterCache(rid: Rid, light: VisualWorld3DLightShadow) {
        this.light_shadow_getter_cache[0] = rid;
        this.light_shadow_getter_cache[1] = light;
    }
    protected reset_LightShadowGetterCache(rid: Rid) {
        if (this.light_shadow_getter_cache[0] === rid) {
            this.light_shadow_getter_cache[0] = undefined;
            this.light_shadow_getter_cache[1] = undefined;
        }
    }
    protected clear_LightShadowGetterCache() {
        this.light_shadow_getter_cache[0] = undefined;
        this.light_shadow_getter_cache[1] = undefined;
    }

    protected get_LightShadow(rid: Rid): VisualWorld3DLightShadow | undefined {
        if (this.light_shadow_getter_cache[0] === rid) {
            return this.light_shadow_getter_cache[1];
        }
        const shadow = this.light_shadows_map.get(rid);
        if (shadow !== undefined) {
            this.set_LightShadowGetterCache(rid, shadow);
        }
        return shadow;
    }

    public free_LightShadow(rid: Rid) {
        const instance = this.get_LightShadow(rid);
        if (instance === undefined) return;
        if (instance.light !== undefined) instance.light.remove_Shadow(instance);
        instance.dispose();
        this.reset_LightShadowGetterCache(rid);
        this.light_shadows_map.delete(rid);
    }

    public set_LightShadowProjection(rid: Rid, projection: Matrix4) {
        const instance = this.get_LightShadow(rid);
        if (instance) {
            instance.set_Projection(projection);
        }
    }

    public set_LightShadowGlobalTransform(rid: Rid, transform: Matrix4) {
        const instance = this.get_LightShadow(rid);
        if (instance) {
            instance.set_GlobalTransform(transform);
        }
    }

    //#endregion

    public dispose() {
        for (const mesh of this.meshes) {
            mesh.dispose();
        }
        for (const light of this.lights) {
            light.dispose();
        }
        for (const light_shadow of this.light_shadows) {
            light_shadow.dispose();
        }
        this.meshes_map.clear();
        this.lights_map.clear();
        this.sky_frame_buffer.clear();
        this.sky_texture.clear();
        this.shadows_texture.clear();
        this.lights_data.clear();
        this.clear_MeshGetterCache();
        this.clear_LightGetterCache();
        this.clear_LightShadowGetterCache();
    }
}