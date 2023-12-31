import { World3D } from "@/system/engine/worlds/world3ds/World3D";
import { NodeNotification, Viewport, ViewportUpdateMode } from "@/system/engine/nodes/Node";
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
import { BoxGeometryResource, CylinderGeometryResource, SphereGeometryResource } from "@/system/engine/resources/geometry_resources/PrimitiveGeometryResource";
import { NormalMaterialResource, PlainColorMaterialResource, UVMaterialResource } from "@/system/engine/resources/material_resources/PrimitiveMaterialResource";
import { color, color8 } from "@/system/fivepebble/graphics/Color";
import { OrthographicCamera3D } from "@/system/engine/nodes/camera3ds/OrthographicCamera3D";
import { euler } from "@/system/fivepebble/linear_algebra/Euler";
import { LineGrabber3D } from "@/system/engine/nodes/node3ds/gizmo3ds/grabber3ds/LineGrabber3D";
import { MultiGeometryResource } from "@/system/engine/resources/geometry_resources/GeometryResource";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { SignalEmitter } from "@/system/utils/SignalEmitter";
import { ActionInputEvent } from "@/system/engine/inputs/events/ActionInputEvent";
import { MultiLineGeometryResource } from "@/system/engine/resources/geometry_resources/MultiLineGeometryResource";
import { MultiLineMaterialResource } from "@/system/engine/resources/material_resources/MultiLineMaterialResource";
import type { Config } from "@/system/engine/ConfiguredObject";
import { RenderServerDevice } from "@/system/engine/render_server/RenderServer";
import { vec2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { StandardMaterialResource } from "../system/engine/resources/material_resources/PrimitiveMaterialResource";
import { RenderServerMaterialCullFace } from "@/system/engine/render_server/RenderServerMaterial";
import { ClassLoader, ClassSaver } from "@/system/engine/classes/saver_loader/ClassSaverLoader";
import { ClassJsonDecoder, ClassJsonEncoder } from "@/system/engine/classes/saver_loader/encoder_decoders/ClassJsonEncoderDecoder";
import { ClassDecoder } from "@/system/engine/classes/saver_loader/encoder_decoders/ClassEncoderDecoder";
import { ResourceInstanceCache } from "@/system/engine/resources/Resource";
import { Renderer3DPipeline } from "@/system/engine/renderer/renderer_3d/Renderer3DPipeline";
import { Pi } from "@/system/fivepebble/Scalar";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";

const DefaultConfig: Config = {
	render_server: new RenderServerDevice(document.getElementById('render-server-canvas') as HTMLCanvasElement),
	render_server_size: undefined,
	render_server_pixel_ratio: undefined,
	render_3d_pipeline: Renderer3DPipeline,
	physics_fps: 45,
}
const DefaultInstanceCache = new ResourceInstanceCache(DefaultConfig);

// viewport container
const EditorViewportContainer = new ViewportDomContainer(DefaultConfig);
EditorViewportContainer.dom = (document.querySelector('#viewport-0') ?? undefined) as HTMLElement;

// viewport
export const EditorViewport = new Viewport(DefaultConfig);
EditorViewport.debug = true;
EditorViewport.world_3d = new World3D(DefaultConfig);
EditorViewport.transparent = false;
EditorViewportContainer.add_Child(EditorViewport);
// camera
const EditorCamera = new EditorOrbitCamera3D(DefaultConfig);
EditorViewport.add_Child(EditorCamera);
EditorCamera.set_Zoom(0.3);

// World 
const World = new Node3D(DefaultConfig);
World.local_scale = vec3(0.01, 0.01, 0.01);
// World.block_input = true;
// World.block_process = true;
// World.block_physics_process = true;

const EditorWorld = new Node3D(DefaultConfig);

export const EditorSceneTree = new SceneTree(DefaultConfig, EditorViewportContainer);
EditorSceneTree.register_Singleton(DependencyGraph);
EditorViewport.add_Child(World);
EditorViewport.add_Child(EditorWorld);

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
// EditorCamera0.zoom_to_cursor = false;
// EditorViewport0.add_Child(EditorCamera0);
// EditorViewport.add_Child(EditorViewportContainer0);

const geometry = new SphereGeometryResource(DefaultConfig);
// geometry.theta = Pi / 2;
geometry.build();

const multi_geometry = new MultiGeometryResource(DefaultConfig);
multi_geometry.set_OverrideGeometry(geometry);

const count = 2;

multi_geometry.set_InstanceCount(count * count, false, false);

for (let i = 0; i < count; i++) {
	for (let j = 0; j < count; j++) {
		multi_geometry.set_InstanceTransform(i * count + j, Matrix4.from_BasisPosition(Matrix3.make_Scale(j + 1, j + 1, j + 1), vec3(i * 2, j * 2, 0)), false);
	}
}

multi_geometry.commit_InstanceTransforms();

const geometry2 = new BoxGeometryResource(DefaultConfig);
geometry2.build();

const material1 = new NormalMaterialResource(DefaultConfig);
material1.remap = false;

const material2 = new StandardMaterialResource(DefaultConfig);
material2.color = color(1, 1, 1, 1);

const material3 = new PlainColorMaterialResource(DefaultConfig);
material3.set_UniformOverride('u_texture', DefaultConfig.render_server.empty_texture);

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

const LineGrabber1 = new LineGrabber3D(DefaultConfig);
const LineGrabber2 = new LineGrabber3D(DefaultConfig);
const LineGrabber3 = new LineGrabber3D(DefaultConfig);
LineGrabber1.color = color8(0x04, 0xa9, 0x73);
LineGrabber2.local_rotation = euler(0, 0, -Math.PI / 2);
LineGrabber2.color = color8(0xd8, 0x2d, 0x4e);
LineGrabber3.color = color8(0x46, 0x6f, 0xd6);
LineGrabber3.local_rotation = euler(Math.PI / 2);
World.add_Child(LineGrabber1);
World.add_Child(LineGrabber2);
World.add_Child(LineGrabber3);

// for (let i = 0; i <= 100; i++) {
// 	const Mesh2 = new MeshInstance3D();
// 	Mesh2.geometry = geometry2;
// 	const mat = new PlainColorMaterialResource();
// 	mat.color = color(Math.random(), Math.random(), Math.random(), 0.5);
// 	Mesh2.material = mat;
// 	Mesh2.local_scale = vec3(100, 100, 100);
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
		// EditorViewportContainer0.queue_Free();
		// EditorSceneTree.start_Tween(
		// 	new PropertyMethodTween<Color>(
		// 		(color) => {
		// 			material3.set_UniformOverride('u_color', color);
		// 		},
		// 		color(1, 1, 1, 1),
		// 		color(Math.random(), Math.random(), Math.random(), 1),
		// 		2, TransitionType.Cubic, EasingType.Out
		// 	)
		// );
	}
});

export const signal = new SignalEmitter<(...args: any[]) => void>();

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

const multi_line_geometry = new MultiLineGeometryResource(DefaultConfig);
const multi_line_material = new MultiLineMaterialResource(DefaultConfig);
multi_line_material.color = color8(0xd8, 0x2d, 0x4e);
multi_line_material.line_width = 4;
const MeshLine = new MeshInstance3D(DefaultConfig);
MeshLine.geometry = multi_line_geometry;
MeshLine.material = multi_line_material;
MeshLine.local_scale = vec3(100, 100, 100);
MeshLine.local_position = vec3(0, 0, -100);
MeshLine.render_queue = 1;
World.add_Child(MeshLine);

function create_CompassScene() {
	const CompassConfig: Config = {
		render_server: new RenderServerDevice(document.getElementById('compass-canvas')! as HTMLCanvasElement),
		render_server_size: vec2(50, 50),
		render_server_pixel_ratio: undefined,
		render_3d_pipeline: Renderer3DPipeline,
		render_queue_max_solid_count: 6,
		render_queue_max_transparent_count: 0,
		disabled_render_queue1: true,
		physics_fps: 0
	}

	const red = color8(0xd8, 0x2d, 0x4e);
	const green = color8(0x04, 0xa9, 0x73);
	const blue = color8(0x46, 0x6f, 0xd6);
	const neg_color = color8(128, 128, 128, 255);
	const sphere_radius = 0.4;
	const distance = 0.8;
	const camera_zoom = 0.55;

	const viewport = new Viewport(CompassConfig);
	viewport.transparent = true;
	viewport.world_3d = new World3D(CompassConfig);
	viewport.update_mode = ViewportUpdateMode.Always;
	viewport.color_map = false;
	viewport.position = vec2(0, 0);
	viewport.size = vec2(50, 50);

	const red_mat = new PlainColorMaterialResource(CompassConfig);
	red_mat.color = red;
	const green_mat = new PlainColorMaterialResource(CompassConfig);
	green_mat.color = green;
	const blue_mat = new PlainColorMaterialResource(CompassConfig);
	blue_mat.color = blue;
	const neg_mat = new PlainColorMaterialResource(CompassConfig);
	neg_mat.color = neg_color;

	const box = new BoxGeometryResource(CompassConfig);
	box.build();
	const box_mesh = new MeshInstance3D(CompassConfig);
	box_mesh.geometry = box;
	box_mesh.set_SurfaceMaterial(0, green_mat);
	box_mesh.set_SurfaceMaterial(1, neg_mat);
	box_mesh.set_SurfaceMaterial(2, blue_mat);
	box_mesh.set_SurfaceMaterial(3, neg_mat);
	box_mesh.set_SurfaceMaterial(4, red_mat);
	box_mesh.set_SurfaceMaterial(5, neg_mat);
	viewport.add_Child(box_mesh);

	const camera = new OrthographicCamera3D(CompassConfig);
	camera.zoom = camera_zoom;
	camera.local_position = vec3(0, 0, 5);
	viewport.add_Child(camera);

	const last_lookat = vec3(0, 0, 0);

	const CompassSceneTree = new SceneTree(CompassConfig, viewport);

	EditorSceneTree.add_LinkedTree(CompassSceneTree);

	viewport.signal_resized.connect((size) => {
		viewport.update_mode = ViewportUpdateMode.Once;
	});

	viewport.signal_notification.connect((what: NodeNotification) => {
		if (what === NodeNotification.InternalAfterProcess) {
			const active_camera = EditorViewport.get_Camera3D();
			if (active_camera === undefined) return;
			const lookat_global_position = active_camera.to_Global(vec3(0, 0, 1));
			const lookat = lookat_global_position.sub(active_camera.global_position).normalize();
			if (lookat.equal(last_lookat)) return;
			last_lookat.copy(lookat);
			camera.local_position = lookat.mult_Number(5);
			camera.local_rotation = active_camera.global_rotation;
			viewport.update_mode = ViewportUpdateMode.Once;
		}
	});
}

export function createEditorViewport() {
	EditorSceneTree.start_Loop();
	create_CompassScene();
}

const lttm = `{
	"type": "LTTMClassDescriptor",
	"meta": {
	  "version": "0.0.1",
	  "date": "2023-12-30T10:04:41.495Z",
	  "author": "LookToTheMoon ClassSaver v0.0.1"
	},
	"root": 0,
	"instances": [
	  {
		"type": "MeshInstance3D",
		"refid": 0,
		"property": {
		  "block_input": "boolean(false)",
		  "block_process": "boolean(false)",
		  "block_physics_process": "boolean(false)",
		  "top_level": "boolean(false)",
		  "local_transform": "matrix4(100,0,0,100,0,100,0,100,0,0,100,100,0,0,0,1)",
		  "local_visible": "boolean(true)",
		  "visual_layer": "number(4294967295)",
		  "cast_shadow": "boolean(false)",
		  "receive_shadow": "boolean(false)",
		  "geometry": "classref(1)",
		  "material": "classref(2)"
		}
	  },
	  {
		"type": "CylinderGeometryResource",
		"refid": 1,
		"unique": false,
		"property": {
		  "top_radius": "number(0.5)",
		  "bottom_radius": "number(0.5)",
		  "height": "number(1)",
		  "segments": "number(32)"
		}
	  },
	  {
		"type": "NormalMaterialResource",
		"refid": 2,
		"unique": false,
		"external": "res://test/material.lttm"
	  }
	]
  }`;
const loader0 = new ClassLoader(DefaultInstanceCache).load(lttm, ClassJsonDecoder, {},).expect() as MeshInstance3D;

loader0.local_position = vec3(-200, 0, 0);

World.add_Child(loader0);