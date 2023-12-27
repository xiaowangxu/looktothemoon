import { World3D } from "@/system/engine/worlds/world3ds/World3D";
import { NodeNotification, Viewport, ViewportUpdateMode } from "@/system/engine/nodes/Node";
import { SceneTree } from "@/system/engine/SceneTree";
import { Node3D } from "@/system/engine/nodes/node3ds/Node3D";
import { ViewportDomContainer } from "@/system/engine/nodes/ViewportDomContainer";
import { KeyInputEvent } from "@/system/engine/inputs/events/KeyInputEvent";
import { MouseButton, MouseButtonInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseButton";
import { ShortCut } from "@/system/engine/inputs/ShortCut";
import { EditorOrbitCamera3D } from "./nodes/EditorOrbitCamera3D";
import { DependencyGraph } from "./singletons/DependencyGraph";
import { vec3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { vec2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { MeshInstance3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/geometry3ds/MeshInstance3D";
import { BoxGeometryResource, CylinderGeometryResource, TorusGeometryResource } from "@/system/engine/resources/geometry_resources/PrimitiveGeometryResource";
import { EasingType, PropertyMethodTween, PropertyTween, TransitionType, TweenLoop, TweenPingPong } from "@/system/engine/Tween";
import { NormalMaterialResource, PlainColorMaterialResource, UVMaterialResource } from "@/system/engine/resources/material_resources/PrimitiveMaterialResource";
import { color, color8, type Color } from "@/system/fivepebble/graphics/Color";
import { MaterialOverrideResource } from "@/system/engine/resources/material_resources/MaterialResource";
import { OrthographicCamera3D } from "@/system/engine/nodes/camera3ds/OrthographicCamera3D";
import { euler } from "@/system/fivepebble/linear_algebra/Euler";
import { RenderServer } from "@/system/engine/render_server/RenderServer";
import { LineGrabber3D } from "@/system/engine/nodes/node3ds/gizmo3ds/grabber3ds/LineGrabber3D";
import { RenderServerMaterialCullFace } from "@/system/engine/render_server/RenderServerMaterial";

// viewport container
const EditorViewportContainer = new ViewportDomContainer();
EditorViewportContainer.dom = document.querySelector('#viewport') ?? undefined;

// viewport
export const EditorViewport = new Viewport();
EditorViewport.debug = true;
EditorViewport.world_3d = new World3D();
EditorViewport.transparent = false;
EditorViewportContainer.add_Child(EditorViewport);
// camera
const EditorCamera = new EditorOrbitCamera3D();
EditorViewport.add_Child(EditorCamera);
EditorCamera.set_Zoom(0.3);

// World 
const World = new Node3D();
World.local_scale = vec3(0.01, 0.01, 0.01);
// World.block_input = true;
// World.block_process = true;
// World.block_physics_process = true;

const EditorWorld = new Node3D();

export const EditorSceneTree = new SceneTree(EditorViewportContainer);
EditorSceneTree.register_Singleton(DependencyGraph);
EditorViewport.add_Child(World);
EditorViewport.add_Child(EditorWorld);

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
// EditorViewportContainer0.add_Child(EditorViewport0);
// const EditorCamera0 = new EditorOrbitCamera3D();
// EditorCamera0.zoom_to_cursor = false;
// EditorViewport0.add_Child(EditorCamera0);
// EditorViewport.add_Child(EditorViewportContainer0);

const geometry = new TorusGeometryResource();
geometry.build();

const geometry2 = new BoxGeometryResource();
geometry2.width = 0.05;
geometry2.height = geometry2.depth = 2;
geometry2.build();

const material1 = new NormalMaterialResource();

const material2 = new PlainColorMaterialResource();
material2.color = color(0.5, 0.5, 1, 1);

const Mesh1 = new MeshInstance3D();
Mesh1.geometry = geometry2;
Mesh1.material = material2;
Mesh1.local_scale = vec3(100, 100, 100);
Mesh1.local_position = vec3(-25, 0, 0);
World.add_Child(Mesh1);

const LineGrabber1 = new LineGrabber3D();
const LineGrabber2 = new LineGrabber3D();
const LineGrabber3 = new LineGrabber3D();
LineGrabber1.color = color8(0x04, 0xa9, 0x73);
LineGrabber2.local_rotation = euler(0, 0, -Math.PI / 2);
LineGrabber3.color = color8(0x46, 0x6f, 0xd6);
LineGrabber3.local_rotation = euler(Math.PI / 2);
World.add_Child(LineGrabber1);
World.add_Child(LineGrabber2);
World.add_Child(LineGrabber3);

// for (let i = 0; i <= 100; i++) {
// 	for (let j = 0; j <= 100; j++) {
// 		const Mesh2 = new MeshInstance3D();
// 		Mesh2.geometry = geometry;
// 		const material = new MaterialOverrideResource();
// 		material.set_OverrideMaterial(material2);
// 		material.set_UniformOverride('u_color', color(Math.random(), Math.random(), Math.random(), 0.5));
// 		material.material.is_transparent = true;
// 		Mesh2.material = material;
// 		Mesh2.local_scale = vec3(10, 10, 10);
// 		Mesh2.local_position = vec3((i / 100 * 2 - 1) * 2000, (j / 100 * 2 - 1) * 2000, 0);
// 		World.add_Child(Mesh2);
// 	}
// }

// EditorViewport.signal_input.connect((evt, pro) => {
// 	if (pro && evt instanceof KeyInputEvent && evt.key === ' ' && evt.pressed && !evt.echo) {
// 		EditorSceneTree.start_Tween(
// 			new PropertyMethodTween<Color>(
// 				(color) => {
// 					material3.set_UniformOverride('u_color', color);
// 				},
// 				color(1, 1, 1, 1),
// 				color(Math.random(), Math.random(), Math.random(), 1),
// 				2, TransitionType.Cubic, EasingType.Out
// 			)
// 		);
// 	}
// });

function create_CompassScene() {
	const red = color8(0xf8, 0x2d, 0x4e);
	const green = color8(0x04, 0xa9, 0x73);
	const blue = color8(0x46, 0x6f, 0xd6);
	const neg_color = color8(0, 0, 0, 92);
	const sphere_radius = 0.4;
	const distance = 0.8;
	const camera_zoom = 0.55;

	const viewport_container = new ViewportDomContainer();
	const viewport = new Viewport();
	viewport.transparent = true;
	viewport.world_3d = new World3D();
	viewport.update_mode = ViewportUpdateMode.Once;
	viewport.color_map = false;
	viewport_container.add_Child(viewport);

	const red_mat = new PlainColorMaterialResource();
	red_mat.color = red;
	const green_mat = new PlainColorMaterialResource();
	green_mat.color = green;
	const blue_mat = new PlainColorMaterialResource();
	blue_mat.color = blue;
	const neg_mat = new PlainColorMaterialResource();
	neg_mat.color = neg_color;

	const box = new BoxGeometryResource();
	box.build();
	const box_mesh = new MeshInstance3D();
	box_mesh.geometry = box;
	box_mesh.set_SurfaceMaterial(0, green_mat);
	box_mesh.set_SurfaceMaterial(1, neg_mat);
	box_mesh.set_SurfaceMaterial(2, blue_mat);
	box_mesh.set_SurfaceMaterial(3, neg_mat);
	box_mesh.set_SurfaceMaterial(4, red_mat);
	box_mesh.set_SurfaceMaterial(5, neg_mat);
	viewport.add_Child(box_mesh);

	const camera = new OrthographicCamera3D();
	camera.zoom = camera_zoom;
	camera.local_position = vec3(0, 0, 5);
	viewport.add_Child(camera);

	const last_lookat = vec3(0, 0, 0);

	viewport.signal_resized.connect((size) => {
		viewport.update_mode = ViewportUpdateMode.Once;
	});

	viewport_container.signal_notification.connect((what: NodeNotification) => {
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

	return viewport_container;
}

const EditorCompass = create_CompassScene();
EditorViewport.add_Child(EditorCompass);

export function createEditorViewport() {
	EditorSceneTree.start_Loop();
	EditorCompass.dom = document.getElementById('compass')!;
}