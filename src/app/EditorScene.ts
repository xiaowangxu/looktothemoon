import { World3D } from "@/system/engine/World";
import { NodeNotification, Node3D, SceneTree, Viewport, ViewportUpdateMode } from "@/system/engine/SceneTree";
import { ViewportDomContainer } from "@/system/engine/nodes/ViewportDomContainer";
import { Euler, BoxGeometry, SphereGeometry, Vector3, MeshBasicMaterial, Color, DoubleSide, Vector2 } from "three";
import { MeshInstance3D } from "@/system/engine/nodes/MeshInstance3D";
import { PolyLineGeometryResource, ThreeGeometryResource } from "@/system/engine/resources/GeometryResource";
import { NormalMaterialResource, PolyLineMaterialResource, ThreeMaterialResource } from "@/system/engine/resources/MaterialResource";
import { PerspectiveCamera3D } from "@/system/engine/nodes/PerspectiveCamera3D";
import { OrthographicCamera3D } from "@/system/engine/nodes/OrthographicCamera3D";
import { ActionInputEvent, KeyInputEvent, MouseButton, MouseButtonInputEvent, MouseMotionInputEvent, ShortCut } from "@/system/engine/InputEvent";
import { InterpolateCamera3D } from "@/system/engine/nodes/InterpolateCamera3D";
import { CallbackTween, EasingType, MethodTween, PropertyTween, TransitionType, TweenBase, TweenParallel, TweenSequence } from "@/system/engine/Tween";
import { OrbitCamera3D } from "../system/engine/nodes/OrbitCamera3D";

// viewport container
const EditorViewportContainer = new ViewportDomContainer();
EditorViewportContainer.dom = document.querySelector('#viewport') ?? undefined;

// viewport
export const EditorViewport = new Viewport();
EditorViewport.world_3d = new World3D();
EditorViewport.transparent = true;
EditorViewportContainer.add_Child(EditorViewport);

// Cube test
const node2 = new Node3D();
const Cube = new MeshInstance3D();
const Cube2 = new MeshInstance3D();
Cube.geometry = new ThreeGeometryResource(new BoxGeometry());
Cube2.geometry = Cube.geometry;
const mat = new NormalMaterialResource();
Cube.material = [mat, mat, mat, mat, mat, mat];
Cube2.material = [mat, mat, mat, mat, mat, mat];
node2.add_Child(Cube);
EditorViewport.add_Child(node2);
Cube.local_position = new Vector3(2, 0, 0);
Cube.add_Child(Cube2);
Cube2.local_scale = new Vector3(0.25, 1, 0.25);
Cube2.local_position = new Vector3(0, 1, 0);
const Sphere = new MeshInstance3D();
Sphere.geometry = new ThreeGeometryResource(new SphereGeometry(1, undefined, undefined, Math.PI, Math.PI));
Sphere.material = new ThreeMaterialResource(new MeshBasicMaterial({ side: DoubleSide }));

EditorViewport.add_Child(Sphere);


const polyline_geometry = new PolyLineGeometryResource();
const points: Vector3[] = []
const colors: Color[] = []
for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const rad = t * Math.PI * 2;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    points.push(new Vector3(cos, 0, sin).multiplyScalar(1));
    colors.push(new Color().setHSL(t, 1, 0.5));
}
polyline_geometry.points = points;
polyline_geometry.colors = colors;
polyline_geometry.compute_LineDistances();

const line_mesh = new MeshInstance3D();
line_mesh.geometry = polyline_geometry;
line_mesh.material = new PolyLineMaterialResource();
(line_mesh.material as PolyLineMaterialResource).width = 5;
(line_mesh.material as PolyLineMaterialResource).vertex_colors = true;
EditorViewport.add_Child(line_mesh);
line_mesh.visual_layer = 1;
line_mesh.local_rotation = new Euler(0.12, 2, 0.324);

// camera
const EditorCamera = new OrbitCamera3D();
EditorViewport.add_Child(EditorCamera);

// scenetree
export const EditorSceneTree = new SceneTree(EditorViewportContainer);

// viewport 0
const EditorViewportContainer0 = new ViewportDomContainer();
EditorViewportContainer0.dom = document.querySelector('#viewport0') ?? undefined;
const EditorViewport0 = new Viewport();
EditorViewport0.transparent = true;
EditorViewportContainer0.add_Child(EditorViewport0);
const EditorCamera0 = new OrbitCamera3D();
EditorViewport0.add_Child(EditorCamera0);
EditorViewport.add_Child(EditorViewportContainer0);

// viewport 1
const EditorViewportContainer1 = new ViewportDomContainer();
EditorViewportContainer1.dom = document.querySelector('#viewport1') ?? undefined;
const EditorViewport1 = new Viewport();
EditorViewport1.transparent = true;
EditorViewportContainer1.add_Child(EditorViewport1);
const EditorCamera1 = new OrbitCamera3D();
EditorViewport1.add_Child(EditorCamera1);
EditorViewport.add_Child(EditorViewportContainer1);


// viewport 2
const EditorViewportContainer2 = new ViewportDomContainer();
EditorViewportContainer2.dom = document.querySelector('#viewport2') ?? undefined;
const EditorViewport2 = new Viewport();
EditorViewport2.transparent = true;
EditorViewportContainer2.add_Child(EditorViewport2);
const EditorCamera2 = new OrbitCamera3D();
EditorViewport2.add_Child(EditorCamera2);
EditorViewport.add_Child(EditorViewportContainer2);

function create_CompassScene() {
    const red = 0xf82d4e;
    const green = 0x04b973;
    const blue = 0x466fd6;
    const neg_color = 0x555555;
    const sphere_radius = 0.4;
    const distance = 1.4;
    const line_width = 2;
    const camera_zoom = 4;

    const viewport_container = new ViewportDomContainer();
    (viewport_container as any).target! = EditorViewport;
    const viewport = new Viewport();
    viewport.transparent = true;
    viewport.world_3d = new World3D();
    const sphere_geometry = new ThreeGeometryResource(new SphereGeometry(sphere_radius));
    const line_geometry = new PolyLineGeometryResource();
    const sphere_neg_material = new ThreeMaterialResource(new MeshBasicMaterial({ color: neg_color, opacity: 0.5, transparent: true }));
    line_geometry.points = [new Vector3(0, 0, 0), new Vector3(distance, 0, 0)];

    const sphere_mesh_x = new MeshInstance3D();
    const sphere_x_material = new ThreeMaterialResource(new MeshBasicMaterial({ color: red }));
    sphere_mesh_x.geometry = sphere_geometry;
    sphere_mesh_x.material = sphere_x_material;
    sphere_mesh_x.local_position = new Vector3(distance, 0, 0);
    const sphere_mesh_x_neg = new MeshInstance3D();
    const sphere_x_material_neg = sphere_neg_material;
    sphere_mesh_x_neg.geometry = sphere_geometry;
    sphere_mesh_x_neg.material = sphere_x_material_neg;
    sphere_mesh_x_neg.local_position = new Vector3(-distance, 0, 0);
    const line_mesh_x = new MeshInstance3D();
    const line_x_material = new PolyLineMaterialResource();
    line_x_material.color = new Color(red);
    line_x_material.width = line_width;
    line_mesh_x.geometry = line_geometry;
    line_mesh_x.material = line_x_material;

    const sphere_mesh_y = new MeshInstance3D();
    const sphere_y_material = new ThreeMaterialResource(new MeshBasicMaterial({ color: green }));
    sphere_mesh_y.geometry = sphere_geometry;
    sphere_mesh_y.material = sphere_y_material;
    sphere_mesh_y.local_position = new Vector3(0, distance, 0);
    const sphere_mesh_y_neg = new MeshInstance3D();
    const sphere_y_material_neg = sphere_neg_material;
    sphere_mesh_y_neg.geometry = sphere_geometry;
    sphere_mesh_y_neg.material = sphere_y_material_neg;
    sphere_mesh_y_neg.local_position = new Vector3(0, -distance, 0);
    const line_mesh_y = new MeshInstance3D();
    const line_y_material = new PolyLineMaterialResource();
    line_y_material.color = new Color(green);
    line_y_material.width = line_width;
    line_mesh_y.geometry = line_geometry;
    line_mesh_y.material = line_y_material;
    line_mesh_y.local_rotation = new Euler(0, 0, Math.PI / 2);

    const sphere_mesh_z = new MeshInstance3D();
    const sphere_z_material = new ThreeMaterialResource(new MeshBasicMaterial({ color: blue }));
    sphere_mesh_z.geometry = sphere_geometry;
    sphere_mesh_z.material = sphere_z_material;
    sphere_mesh_z.local_position = new Vector3(0, 0, distance);
    const sphere_mesh_z_neg = new MeshInstance3D();
    const sphere_z_material_neg = sphere_neg_material;
    sphere_mesh_z_neg.geometry = sphere_geometry;
    sphere_mesh_z_neg.material = sphere_z_material_neg;
    sphere_mesh_z_neg.local_position = new Vector3(0, 0, -distance);
    const line_mesh_z = new MeshInstance3D();
    const line_z_material = new PolyLineMaterialResource();
    line_z_material.color = new Color(blue);
    line_z_material.width = line_width;
    line_mesh_z.geometry = line_geometry;
    line_mesh_z.material = line_z_material;
    line_mesh_z.local_rotation = new Euler(0, -Math.PI / 2, 0);

    const camera = new OrthographicCamera3D();
    camera.zoom = camera_zoom;
    camera.local_position = new Vector3(0, 0, 5);

    viewport_container.add_Child(viewport);
    viewport.add_Child(sphere_mesh_x);
    viewport.add_Child(sphere_mesh_x_neg);
    viewport.add_Child(line_mesh_x);
    viewport.add_Child(sphere_mesh_y);
    viewport.add_Child(sphere_mesh_y_neg);
    viewport.add_Child(line_mesh_y);
    viewport.add_Child(sphere_mesh_z);
    viewport.add_Child(sphere_mesh_z_neg);
    viewport.add_Child(line_mesh_z);
    viewport.add_Child(camera);

    viewport_container.signal_notification.connect((what: NodeNotification) => {
        if (what === NodeNotification.InternalAfterProcess) {
            const active_camera = (viewport_container as any).target?.get_Camera3D();
            if (active_camera === undefined) return;
            const lookat_global_position = active_camera.to_Global(new Vector3(0, 0, 1));
            const lookat = lookat_global_position.sub(active_camera.global_position).normalize();
            // console.log(lookat);
            camera.local_position = lookat.multiplyScalar(5);
            camera.local_rotation = active_camera.global_rotation;
        }
    });

    return viewport_container;
}

const EditorCompassViewportContainer = create_CompassScene();

EditorViewport.get_Input().signal_mouse_entered.connect(() => (EditorCompassViewportContainer as any).target = EditorViewport);
EditorViewport0.get_Input().signal_mouse_entered.connect(() => (EditorCompassViewportContainer as any).target = EditorViewport0);
EditorViewport1.get_Input().signal_mouse_entered.connect(() => (EditorCompassViewportContainer as any).target = EditorViewport1);
EditorViewport2.get_Input().signal_mouse_entered.connect(() => (EditorCompassViewportContainer as any).target = EditorViewport2);

EditorViewport.add_Child(EditorCompassViewportContainer);

EditorSceneTree.get_InputActionMap().add_Action('switch_FrontView', new ShortCut([new KeyInputEvent('1', '1', true, false, undefined, false, false, false, false)]));
EditorSceneTree.get_InputActionMap().add_Action('switch_LeftView', new ShortCut([new KeyInputEvent('2', '2', true, false, undefined, false, false, false, false)]));
EditorSceneTree.get_InputActionMap().add_Action('switch_TopView', new ShortCut([new KeyInputEvent('3', '3', true, false, undefined, false, false, false, false)]));
EditorSceneTree.get_InputActionMap().add_Action('zoomIn', new ShortCut([new MouseButtonInputEvent(MouseButton.WheelUp, true, false, false, undefined, new Vector2(0, 0), new Vector2(0, 0), false, false, false, false)]));
EditorSceneTree.get_InputActionMap().add_Action('zoomOut', new ShortCut([new MouseButtonInputEvent(MouseButton.WheelDown, true, false, false, undefined, new Vector2(0, 0), new Vector2(0, 0), false, false, false, false)]));

// EditorViewport.signal_input.connect((event, p) => {
//     if (p && event instanceof MouseMotionInputEvent) {
//         const div = document.getElementById('test');
//         div!.style.left = event.position.x + 'px';
//         div!.style.top = event.position.y + 'px';
//     }
// })

console.log(EditorSceneTree);

export function createEditorViewport(el: string) {
    EditorCompassViewportContainer.dom = document.querySelector('#compass') ?? undefined;
    EditorSceneTree.start_Loop();
}