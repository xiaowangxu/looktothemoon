import { World3D } from "@/system/engine/worlds/world3ds/World3D";
import { Viewport } from "@/system/engine/nodes/Node";
import { SceneTree } from "@/system/engine/SceneTree";
import { Node3D } from "@/system/engine/nodes/node3ds/Node3D";
import { ViewportDomContainer } from "@/system/engine/nodes/ViewportDomContainer";
import { KeyInputEvent } from "@/system/engine/inputs/events/KeyInputEvent";
import { MouseButton, MouseButtonInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseButtonInputEvent";
import { ShortCut } from "@/system/engine/inputs/ShortCut";
import { EditorOrbitCamera3D } from "./nodes/EditorOrbitCamera3D";
import { DependencyGraph } from "./singletons/DependencyGraph";
import { vec3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { MeshInstance3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/geometry3ds/MeshInstance3D";
import { BoxGeometryResource, CylinderGeometryResource, TorusGeometryResource } from "@/system/engine/resources/geometry_resources/PrimitiveGeometryResource";
import { NormalMaterialResource, PlainColorMaterialResource, UVMaterialResource } from "@/system/engine/resources/material_resources/PrimitiveMaterialResource";
import { color, color8 } from "@/system/fivepebble/graphics/Color";
import { Euler } from "@/system/fivepebble/linear_algebra/Euler";
import { MultiGeometryResource } from "@/system/engine/resources/geometry_resources/GeometryResource";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { SignalEmitter } from "@/system/utils/SignalEmitter";
import { ActionInputEvent } from "@/system/engine/inputs/events/ActionInputEvent";
import { MultiLineGeometryResource } from "@/system/engine/resources/geometry_resources/MultiLineGeometryResource";
import { MultiLineMaterialResource } from "@/system/engine/resources/material_resources/MultiLineMaterialResource";
import type { Config } from "@/system/engine/ConfiguredObject";
import { RenderServerDevice } from "@/system/engine/render_server/RenderServer";
import { StandardMaterialResource } from "../system/engine/resources/material_resources/PrimitiveMaterialResource";
import { ClassLoader, ClassSaver } from "@/system/engine/classes/saver_loader/ClassSaverLoader";
import { ResourceInstanceCache } from "@/system/engine/resources/Resource";
import { ImageTextureResource } from "@/system/engine/resources/texture_resources/TextureResource";
import { ImageLoader } from "@/system/engine/loaders/ImageLoader";

const DefaultConfig: Config = {
	render_server: new RenderServerDevice(document.getElementById('render-server-canvas') as HTMLCanvasElement),
	render_server_size: undefined,
	render_server_pixel_ratio: undefined,
	render_server_scale: 1,
	physics_fps: 60,
}
const DefaultInstanceCache = new ResourceInstanceCache(DefaultConfig);

// viewport container
const EditorViewportContainer = new ViewportDomContainer(DefaultConfig);
EditorViewportContainer.dom = (document.querySelector('#viewport-0') ?? undefined) as HTMLElement;

// viewport
export const EditorViewport = new Viewport(DefaultConfig);
EditorViewport.debug = true;
EditorViewport.world_3d = new World3D(DefaultConfig);
const renderer = new EditorRenderer3D(DefaultConfig);
const pipeline = new EditorRenderer3DPipeline(DefaultConfig);
renderer.render_pipeline = pipeline;
EditorViewport.renderer_3d = renderer;
EditorViewport.transparent = false;
EditorViewportContainer.add_Child(EditorViewport);
// camera
const EditorCamera = new EditorOrbitCamera3D(DefaultConfig);
EditorViewport.add_Child(EditorCamera);
EditorCamera.set_Zoom(0.3);

// // viewport 0
// const EditorViewportContainer0 = new ViewportDomContainer(DefaultConfig);
// EditorViewportContainer0.dom = (document.querySelector('#viewport-1') ?? undefined) as HTMLElement;
// const EditorViewport0 = new Viewport(DefaultConfig);
// const renderer0 = new EditorRenderer3D(DefaultConfig);
// const pipeline0 = new EditorRenderer3DPipeline(DefaultConfig);
// renderer0.render_pipeline = pipeline0;
// EditorViewport0.renderer_3d = renderer0;
// EditorViewportContainer0.add_Child(EditorViewport0);
// const EditorCamera0 = new EditorOrbitCamera3D(DefaultConfig);
// EditorViewport0.add_Child(EditorCamera0);
// EditorViewport.add_Child(EditorViewportContainer0);

// World 
const World = new Node3D(DefaultConfig);
World.local_scale = vec3(0.01, 0.01, 0.01);
const ambient_light = new AmbientLight3D(DefaultConfig);
ambient_light.intensity = 0.05;
World.add_Child(ambient_light);
const directional_light0 = new DirectionalLight3D(DefaultConfig);
directional_light0.color = vec3(0.9, 0.9, 1);
directional_light0.intensity = 0.2;
directional_light0.local_rotation = Euler.from_Quaternion(Quaternion.make_Rotate(vec3(0, 0, -1), vec3(-1, -1, 1).normalize()));
World.add_Child(directional_light0);
const directional_light1 = new DirectionalLight3D(DefaultConfig);
directional_light1.color = vec3(1, 0.9, 0.8);
directional_light1.intensity = 0.1;
directional_light1.local_rotation = Euler.from_Quaternion(Quaternion.make_Rotate(vec3(0, 0, -1), vec3(1, 1, -1).normalize()));
World.add_Child(directional_light1);

export const EditorSceneTree = new SceneTree(DefaultConfig, EditorViewportContainer);
EditorSceneTree.register_Singleton(DependencyGraph);
EditorViewport.add_Child(World);

EditorSceneTree.get_InputActionMap().add_Action('switch_FrontView', new ShortCut(DefaultConfig).set([new KeyInputEvent(DefaultConfig).set_Key('1', '1', true, false)]));
EditorSceneTree.get_InputActionMap().add_Action('switch_LeftView', new ShortCut(DefaultConfig).set([new KeyInputEvent(DefaultConfig).set_Key('2', '2', true, false)]));
EditorSceneTree.get_InputActionMap().add_Action('switch_TopView', new ShortCut(DefaultConfig).set([new KeyInputEvent(DefaultConfig).set_Key('3', '3', true, false)]));
EditorSceneTree.get_InputActionMap().add_Action('switch_CameraType', new ShortCut(DefaultConfig).set([new KeyInputEvent(DefaultConfig).set_Key('`', 'Backquote', true, false)]));
EditorSceneTree.get_InputActionMap().add_Action('zoomIn', new ShortCut(DefaultConfig).set([
	new MouseButtonInputEvent(DefaultConfig).set_Button(MouseButton.WheelUp, true, false, false).set_Compose(true),
	new MouseButtonInputEvent(DefaultConfig).set_Button(MouseButton.WheelUp, true, false, false),
]));
EditorSceneTree.get_InputActionMap().add_Action('zoomOut', new ShortCut(DefaultConfig).set([
	new MouseButtonInputEvent(DefaultConfig).set_Button(MouseButton.WheelDown, true, false, false).set_Compose(true),
	new MouseButtonInputEvent(DefaultConfig).set_Button(MouseButton.WheelDown, true, false, false),
]));

// viewport 0
// const EditorViewportContainer0 = new ViewportDomContainer(DefaultConfig);
// EditorViewportContainer0.dom = (document.querySelector('#viewport-1') ?? undefined) as HTMLElement;
// const EditorViewport0 = new Viewport(DefaultConfig);
// EditorViewportContainer0.add_Child(EditorViewport0);
// const EditorCamera0 = new EditorOrbitCamera3D(DefaultConfig);
// // EditorCamera0.zoom_to_cursor = false;
// EditorViewport0.add_Child(EditorCamera0);
// EditorViewport.add_Child(EditorViewportContainer0);

const geometry = new TorusGeometryResource(DefaultConfig);
// geometry.phi_segments = 32;
// geometry.theta_segments = 64;
geometry.build();

const multi_geometry = new MultiGeometryResource(DefaultConfig);
multi_geometry.set_OverrideGeometry(geometry);

const count = 2;

multi_geometry.set_InstanceCount(count * count, false, false);

for (let i = 0; i < count; i++) {
	for (let j = 0; j < count; j++) {
		multi_geometry.set_InstanceTransform(i * count + j, Matrix4.from_BasisPosition(undefined, vec3(i * 2, j * 2, 0)), false);
	}
}

multi_geometry.commit_InstanceTransforms();

const geometry2 = new BoxGeometryResource(DefaultConfig);
geometry2.build();

const material1 = new NormalMaterialResource(DefaultConfig);
material1.remap = true;

const material2 = new StandardMaterialResource(DefaultConfig);
material2.color = color(1, 1, 1, 1);

const material3 = new PlainColorMaterialResource(DefaultConfig);
// material3.color = color(1, 0, 1, 1);
material3.texture = new ImageTextureResource(DefaultConfig);

import url from 'res://image.png';
import { RenderStateTextureFormat } from "@/system/sliverofstraw/RenderState";
import { EditorRenderer3DPipeline } from "@/system/engine/renderer/renderer_3d/EditorRenderer3DPipeline";
import { EditorRenderer3D } from "@/system/engine/renderer/renderer_3d/EditorRenderer3D";
import { TranslateGrabber3D } from "@/system/engine/nodes/node3ds/gizmo3ds/grabber3ds/TranslateGrabber3D";
import { PointLight3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/light3ds/PointLight3D";
import { PropertyTween, TweenEasingType, TweenTransitionType, tween_parallel } from "@/system/engine/Tween";
import { AmbientLight3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/light3ds/AmbientLight3D";
import { DirectionalLight3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/light3ds/DirectionalLight3D";
import { SpotLight3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/light3ds/SpotLight3D";
import { Quaternion } from "@/system/fivepebble/linear_algebra/Quaternion";
import { ClassBinaryDecoder, ClassBinaryEncoder, type ClassBinaryDecoderOption } from "@/system/engine/classes/saver_loader/encoder_decoders/ClassBinaryEncoderDecoder";
{
	new ImageLoader().parse(url).then(res => {
		(material3.texture as ImageTextureResource).set_Image(res.expect(), RenderStateTextureFormat.SRGBA8, 4);
	});
}

const material4 = new NormalMaterialResource(DefaultConfig);

const Mesh1 = new MeshInstance3D(DefaultConfig);
Mesh1.geometry = multi_geometry;
Mesh1.material = material2;
Mesh1.local_scale = vec3(100, 100, 100);
Mesh1.local_position = vec3(0, 0, -100);
Mesh1.local_visible = true;

// Mesh1.set_SurfaceMaterial(2, material3);
// Mesh1.set_SurfaceMaterial(3, material3);
// Mesh1.set_SurfaceMaterial(4, material4);
// Mesh1.set_SurfaceMaterial(5, material4);

World.add_Child(Mesh1);

const TranslateGrabber = new TranslateGrabber3D(DefaultConfig);
World.add_Child(TranslateGrabber);

const point_light = new PointLight3D(DefaultConfig);
point_light.radius = 100.0;
World.add_Child(point_light);

TranslateGrabber.signal_grabbing.connect(pos => {
	// EditorViewport.world_3d?.visual_world.set_LightGlobalPosition(3, pos);
	// debugger
	point_light.global_position = pos;
});

const TranslateGrabber2 = new TranslateGrabber3D(DefaultConfig);
World.add_Child(TranslateGrabber2);

const spot_light = new SpotLight3D(DefaultConfig);
spot_light.color = vec3(1, 0, 0);
spot_light.intensity = 0.5;
World.add_Child(spot_light);

TranslateGrabber2.signal_grabbing.connect(pos => {
	// EditorViewport.world_3d?.visual_world.set_LightGlobalPosition(3, pos);
	// debugger
	spot_light.global_position = pos;
});

// const mat = new PlainColorMaterialResource(DefaultConfig);
// for (let i = 0; i <= 1000; i++) {
// 	const Mesh2 = new MeshInstance3D(DefaultConfig);
// 	Mesh2.geometry = geometry2;
// 	const m = new MaterialOverrideResource(DefaultConfig);
// 	m.set_OverrideMaterial(mat);
// 	m.set_UniformOverride('u_color', color(0, 0, 0, 0.25));
// 	m.material.transparent = true;
// 	Mesh2.material = m;
// 	Mesh2.local_scale = vec3(1, 100, 100);
// 	Mesh2.local_position = vec3(i * 50, 0, 0);
// 	World.add_Child(Mesh2);
// }

// for (let i = 0; i <= 100; i++) {
// 	for (let j = 0; j <= 100; j++) {
// 		const Mesh2 = new MeshInstance3D();
// 		Mesh2.geometry = geometry2;
// 		Mesh2.material = material1;
// 		Mesh2.local_scale = vec3(10, 10, 10);
// 		Mesh2.local_position = vec3((i / 100 * 2 - 1) * 2000, (j / 100 * 2 - 1) * 2000, 0);
// 		World.add_Child(Mesh2);
// 	}
// }

EditorViewport.signal_input.connect((evt, pro) => {
	if (pro && evt instanceof KeyInputEvent && evt.key === ' ' && evt.pressed && !evt.echo) {
		EditorSceneTree.start_Tween(
			tween_parallel(
				new PropertyTween(point_light, 'radius', Math.random() * 10, 0.4, TweenTransitionType.Linear, TweenEasingType.Out),
				new PropertyTween(point_light, 'color', vec3(Math.random(), Math.random(), Math.random()), 0.4, TweenTransitionType.Linear, TweenEasingType.Out)
			)
		);
	}
});

export const signal = new SignalEmitter<(...args: any[]) => void>();

const multi_line_geometry = new MultiLineGeometryResource(DefaultConfig);
const multi_line_material = new MultiLineMaterialResource(DefaultConfig);
multi_line_material.color = color8(0xd8, 0x2d, 0x4e);
const MeshLine = new MeshInstance3D(DefaultConfig);
MeshLine.geometry = multi_line_geometry;
MeshLine.material = multi_line_material;
MeshLine.local_scale = vec3(100, 100, 100);
MeshLine.local_position = vec3(0, 0, -100);
MeshLine.render_queue = 1;
World.add_Child(MeshLine);

signal.connect((action) => {
	if (action === 'orth') {
		EditorViewport.push_InputEvent(new ActionInputEvent(DefaultConfig).set_Action('switch_CameraTypeOrth', true, false));
	}
	else if (action === 'persp') {
		EditorViewport.push_InputEvent(new ActionInputEvent(DefaultConfig).set_Action('switch_CameraTypePersp', true, false));
	}
	else if (action === '顶视图') {
		EditorViewport.push_InputEvent(new ActionInputEvent(DefaultConfig).set_Action('switch_TopView', true, false));
	}
	else if (action === '底视图') {
		EditorViewport.push_InputEvent(new ActionInputEvent(DefaultConfig).set_Action('switch_BottomView', true, false));
	}
	else if (action === '左视图') {
		EditorViewport.push_InputEvent(new ActionInputEvent(DefaultConfig).set_Action('switch_LeftView', true, false));
	}
	else if (action === '右视图') {
		EditorViewport.push_InputEvent(new ActionInputEvent(DefaultConfig).set_Action('switch_RightView', true, false));
	}
	else if (action === '前视图') {
		EditorViewport.push_InputEvent(new ActionInputEvent(DefaultConfig).set_Action('switch_FrontView', true, false));
	}
	else if (action === '后视图') {
		EditorViewport.push_InputEvent(new ActionInputEvent(DefaultConfig).set_Action('switch_BackView', true, false));
	}
});

// function create_CompassScene() {
// 	const CompassConfig: Config = {
// 		render_server: new RenderServerDevice(document.getElementById('compass-canvas')! as HTMLCanvasElement),
// 		render_server_size: vec2(50, 50),
// 		render_server_pixel_ratio: undefined,
// 		render_3d_pipeline: Renderer3DPipeline,
// 		render_queue_max_solid_count: 6,
// 		render_queue_max_transparent_count: 0,
// 		disabled_render_queue1: true,
// 		physics_fps: 0
// 	}

// 	const red = color8(0xd8, 0x2d, 0x4e);
// 	const green = color8(0x04, 0xa9, 0x73);
// 	const blue = color8(0x46, 0x6f, 0xd6);
// 	const neg_color = color8(128, 128, 128, 255);
// 	const sphere_radius = 0.4;
// 	const distance = 0.8;
// 	const camera_zoom = 0.55;

// 	const viewport = new Viewport(CompassConfig);
// 	viewport.transparent = true;
// 	viewport.world_3d = new World3D(CompassConfig);
// 	viewport.update_mode = ViewportUpdateMode.Always;
// 	viewport.color_map = false;
// 	viewport.position = vec2(0, 0);
// 	viewport.size = vec2(50, 50);

// 	const red_mat = new PlainColorMaterialResource(CompassConfig);
// 	red_mat.color = red;
// 	const green_mat = new PlainColorMaterialResource(CompassConfig);
// 	green_mat.color = green;
// 	const blue_mat = new PlainColorMaterialResource(CompassConfig);
// 	blue_mat.color = blue;
// 	const neg_mat = new PlainColorMaterialResource(CompassConfig);
// 	neg_mat.color = neg_color;

// 	const box = new BoxGeometryResource(CompassConfig);
// 	box.build();
// 	const box_mesh = new MeshInstance3D(CompassConfig);
// 	box_mesh.geometry = box;
// 	box_mesh.set_SurfaceMaterial(0, green_mat);
// 	box_mesh.set_SurfaceMaterial(1, neg_mat);
// 	box_mesh.set_SurfaceMaterial(2, blue_mat);
// 	box_mesh.set_SurfaceMaterial(3, neg_mat);
// 	box_mesh.set_SurfaceMaterial(4, red_mat);
// 	box_mesh.set_SurfaceMaterial(5, neg_mat);
// 	viewport.add_Child(box_mesh);

// 	const camera = new OrthographicCamera3D(CompassConfig);
// 	camera.zoom = camera_zoom;
// 	camera.local_position = vec3(0, 0, 5);
// 	viewport.add_Child(camera);

// 	const last_lookat = vec3(0, 0, 0);

// 	const CompassSceneTree = new SceneTree(CompassConfig, viewport);

// 	EditorSceneTree.add_LinkedTree(CompassSceneTree);

// 	viewport.signal_resized.connect((size) => {
// 		viewport.update_mode = ViewportUpdateMode.Once;
// 	});

// 	viewport.signal_notification.connect((what: NodeNotification) => {
// 		if (what === NodeNotification.InternalAfterProcess) {
// 			const active_camera = EditorViewport.get_Camera3D();
// 			if (active_camera === undefined) return;
// 			const lookat_global_position = active_camera.to_Global(vec3(0, 0, 1));
// 			const lookat = lookat_global_position.sub(active_camera.global_position).normalize();
// 			if (lookat.equal(last_lookat)) return;
// 			last_lookat.copy(lookat);
// 			camera.local_position = lookat.mult_Number(5);
// 			camera.local_rotation = active_camera.global_rotation;
// 			viewport.update_mode = ViewportUpdateMode.Once;
// 		}
// 	});
// }

export function createEditorViewport() {
	EditorSceneTree.start_Loop();
	// create_CompassScene();
}

const cylinder = new BoxGeometryResource(DefaultConfig);
const mat1 = new NormalMaterialResource(DefaultConfig);
const mat2 = new NormalMaterialResource(DefaultConfig);
const mat3 = new UVMaterialResource(DefaultConfig);
mat2.remap = false;
const mesh = new MeshInstance3D(DefaultConfig);
mesh.geometry = cylinder;
mesh.material = mat3;
mesh.set_SurfaceMaterial(0, mat1);
mesh.set_SurfaceMaterial(2, mat2);
mesh.set_SurfaceMaterial(4, mat1);
mesh.name = '测试';

console.time("save");
const data0 = new ClassSaver().save(mesh, ClassBinaryEncoder, undefined, { little_endian: true }).expect();
console.timeEnd("save");

console.time('load');
const load = new ClassLoader(DefaultInstanceCache).load<MeshInstance3D, ArrayBuffer, ClassBinaryDecoderOption>(data0, ClassBinaryDecoder, undefined, { validate: true }).expect();
console.timeEnd('load');

load.local_scale = vec3(100, 100, 100);
World.add_Child(load);