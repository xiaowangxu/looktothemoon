import { World3D } from "@/system/engine/World";
import { NodeNotification, Node3D, SceneTree, Viewport } from "@/system/engine/SceneTree";
import { ViewportDomContainer } from "@/system/engine/nodes/ViewportDomContainer";
import { Euler, BoxGeometry, SphereGeometry, Vector3, MeshBasicMaterial, MeshMatcapMaterial, Color, TorusKnotGeometry, Vector2, Box3, ConeGeometry, Quaternion } from "three";
import { MeshInstance3D } from "@/system/engine/nodes/visual_instances/MeshInstance3D";
import { PolyLineGeometryResource, ThreeGeometryResource } from "@/system/engine/resources/GeometryResource";
import { NormalMaterialResource, LineMaterialResource, ThreeMaterialResource } from "@/system/engine/resources/MaterialResource";
import { OrthographicCamera3D } from "@/system/engine/nodes/camera_3ds/OrthographicCamera3D";
import { ActionInputEvent, InputEventFromViewport, KeyInputEvent, MouseButton, MouseButtonInputEvent, ShortCut } from "@/system/engine/InputEvent";
import { Axis } from "./nodes/Axis";
import { WireframeBox } from "./nodes/WireframeBox";
import { PickingArea3D } from "@/system/engine/nodes/physics_3ds/PickingArea3D";
import { PickingShape3D } from "@/system/engine/nodes/physics_3ds/PickingShape3D";
import { PickingBVHResource, PickingSphereResource } from "@/system/engine/resources/PickingShapeResource";
import { FixSizeNode3D } from "@/system/engine/nodes/node_3ds/FixSizeNode3D";
import { LineGrabber, PointGrabber, AngleGrabber, TranslateGrabber, RotateGrabber, TransformGrabber } from "./nodes/Grabbers";
import { EditorOrbitCamera3D } from "./nodes/EditorOrbitCamera3D";

// viewport container
const EditorViewportContainer = new ViewportDomContainer();
EditorViewportContainer.dom = document.querySelector('#viewport') ?? undefined;

// viewport
export const EditorViewport = new Viewport();
EditorViewport.transparent = true;
EditorViewport.clear_color = new Color(0xf2f2f2);
EditorViewport.world_3d = new World3D();
EditorViewportContainer.add_Child(EditorViewport);
// camera
const EditorCamera = new EditorOrbitCamera3D();
EditorViewport.add_Child(EditorCamera);

// World 
const World = new Node3D();
const EditorWorld = new Node3D();
World.local_scale = new Vector3(0.01, 0.01, 0.01);

const axis = new Axis();
World.add_Child(axis);
axis.local_scale = new Vector3(100000, 100000, 100000);
axis.local_position = new Vector3(-500, 0, -500);
const wireframe_box = new WireframeBox();
wireframe_box.box = new Box3(new Vector3(-100, -100, -300), new Vector3(200, 400, -200));
// World.add_Child(wireframe_box);

// Cube test
const node2 = new Node3D();
const Cube = new MeshInstance3D();
const Cube2 = new MeshInstance3D();
Cube.geometry = new ThreeGeometryResource(new BoxGeometry(100, 100, 100));
Cube2.geometry = Cube.geometry;
const mat = new NormalMaterialResource();
Cube.material = [mat, mat, mat, mat, mat, mat];
Cube2.material = [mat, mat, mat, mat, mat, mat];
// node2.add_Child(Cube);
World.add_Child(node2);
node2.local_position = new Vector3(200, 0, 0);
Cube.add_Child(Cube2);
Cube2.local_scale = new Vector3(0.25, 1, 0.25);
Cube2.local_position = new Vector3(0, 100, 0);

const sphere_geo = new ThreeGeometryResource(new SphereGeometry(100));
class Sphere extends MeshInstance3D {
    constructor() {
        super();
        this.geometry = sphere_geo;
        this.material = new ThreeMaterialResource(new MeshMatcapMaterial({}));
        const area = new PickingArea3D();
        const shape = new PickingShape3D();
        const sphere_shape = new PickingSphereResource();
        sphere_shape.radius = 100;
        shape.shape = sphere_shape;
        area.signal_mouse_entered.connect(() => {
            ((this.material as ThreeMaterialResource).get_Material() as MeshMatcapMaterial).color = new Color(0x0000ff);
        });
        area.signal_mouse_exited.connect(() => {
            ((this.material as ThreeMaterialResource).get_Material() as MeshMatcapMaterial).color = new Color(0xffffff);
        });
        area.signal_input.connect((event, prop) => {
            if (!prop && area.is_mouse_hover) {
                if (event instanceof MouseButtonInputEvent && event.click) {
                    this.queue_Free();
                }
            }
        });
        area.add_Child(shape);
        this.add_Child(area);
    }
}

// const sph1 = new Sphere();
// sph1.local_position = new Vector3(-200, 0, 0);
// World.add_Child(sph1);
// const sph2 = new Sphere();
// sph2.local_position = new Vector3(-200, 200, 0);
// World.add_Child(sph2);
// const sph3 = new Sphere();
// sph3.local_position = new Vector3(-400, 200, 0);
// World.add_Child(sph3);

const Torus = new MeshInstance3D();
Torus.geometry = new ThreeGeometryResource(new TorusKnotGeometry(50, 10, 360));
Torus.material = new ThreeMaterialResource(new MeshMatcapMaterial({}));
const area = new PickingArea3D();
const shape = new PickingShape3D();
const sphere_shape = new PickingBVHResource();
sphere_shape.compute_BVH(Torus.geometry);
shape.shape = sphere_shape;
area.signal_mouse_entered.connect((evt) => {
    ((Torus.material as ThreeMaterialResource).get_Material() as MeshMatcapMaterial).color = new Color(0x0000ff);
    evt.viewport!.cursor_style = 'crosshair';
});
area.signal_mouse_exited.connect((evt) => {
    ((Torus.material as ThreeMaterialResource).get_Material() as MeshMatcapMaterial).color = new Color(0xffffff);
    evt.viewport!.cursor_style! = 'default';
});
area.add_Child(shape);
Torus.add_Child(area);
World.add_Child(Torus);

// scenetree
export const EditorSceneTree = new SceneTree(EditorViewportContainer);

// viewport 0
const EditorViewportContainer0 = new ViewportDomContainer();
EditorViewportContainer0.dom = document.querySelector('#viewport0') ?? undefined;
const EditorViewport0 = new Viewport();
EditorViewport0.transparent = true;
EditorViewportContainer0.add_Child(EditorViewport0);
const EditorCamera0 = new EditorOrbitCamera3D();
EditorViewport0.add_Child(EditorCamera0);
EditorViewport.add_Child(EditorViewportContainer0);

// // viewport 1
// const EditorViewportContainer1 = new ViewportDomContainer();
// EditorViewportContainer1.dom = document.querySelector('#viewport1') ?? undefined;
// const EditorViewport1 = new Viewport();
// EditorViewport1.transparent = true;
// EditorViewportContainer1.add_Child(EditorViewport1);
// const EditorCamera1 = new EditorOrbitCamera3D();
// EditorViewport1.add_Child(EditorCamera1);
// EditorViewport.add_Child(EditorViewportContainer1);

// // viewport 2
// const EditorViewportContainer2 = new ViewportDomContainer();
// EditorViewportContainer2.dom = document.querySelector('#viewport2') ?? undefined;
// const EditorViewport2 = new Viewport();
// EditorViewport2.transparent = true;
// EditorViewportContainer2.add_Child(EditorViewport2);
// const EditorCamera2 = new EditorOrbitCamera3D();
// EditorViewport2.add_Child(EditorCamera2);
// EditorViewport.add_Child(EditorViewportContainer2);

// EditorViewport.get_Input().signal_mouse_entered.connect(() => (EditorCompassViewportContainer as any).target = EditorViewport);
// EditorViewport0.get_Input().signal_mouse_entered.connect(() => (EditorCompassViewportContainer as any).target = EditorViewport0);
// EditorViewport1.get_Input().signal_mouse_entered.connect(() => (EditorCompassViewportContainer as any).target = EditorViewport1);
// EditorViewport2.get_Input().signal_mouse_entered.connect(() => (EditorCompassViewportContainer as any).target = EditorViewport2);

EditorViewport.add_Child(World);
EditorViewport.add_Child(EditorWorld);

const red = 0xff4a56;
const green = 0x04b973;
const blue = 0x466fd6;
const neg_color = 0x404040;
function create_CompassScene() {
    const sphere_radius = 0.4;
    const distance = 1.5;
    const line_width = 2;
    const camera_zoom = 4;

    const viewport_container = new ViewportDomContainer();
    (viewport_container as any).target! = EditorViewport;
    const viewport = new Viewport();
    viewport.transparent = true;
    viewport.world_3d = new World3D();
    const sphere_geometry = new ThreeGeometryResource(new SphereGeometry(sphere_radius));
    const sphere_shape = new PickingSphereResource();
    sphere_shape.radius = sphere_radius;
    const line_geometry = new PolyLineGeometryResource();
    const sphere_neg_material = new ThreeMaterialResource(new MeshBasicMaterial({ color: neg_color }));
    line_geometry.points = [new Vector3(0, 0, 0), new Vector3(distance, 0, 0)];

    const sphere_mesh_x = new MeshInstance3D();
    // const sphere_area_x = new PickingArea3D();
    // const sphere_shape_x = new PickingShape3D();
    // sphere_shape_x.shape = sphere_shape;
    // sphere_mesh_x.add_Child(sphere_area_x);
    // sphere_area_x.add_Child(sphere_shape_x);
    // sphere_area_x.signal_mouse_entered.connect(() => {
    //     sphere_mesh_x.local_scale = new Vector3(hover_sphere_scale, hover_sphere_scale, hover_sphere_scale);
    // });
    // sphere_area_x.signal_mouse_exited.connect(() => {
    //     sphere_mesh_x.local_scale = new Vector3(1, 1, 1);
    // });
    // sphere_area_x.signal_input.connect((evt, prop) => {
    //     if (!prop && sphere_area_x.is_mouse_hover && evt instanceof MouseButtonInputEvent && evt.click) {
    //         if (evt.button === MouseButton.Left) {
    //             ((viewport_container as any).target as Viewport | undefined)?.push_InputEvent(new ActionInputEvent('switch_RightView', true, false));
    //         }
    //         else if (evt.button === MouseButton.Right) {
    //             ((viewport_container as any).target as Viewport | undefined)?.push_InputEvent(new ActionInputEvent('switch_LeftView', true, false));
    //         }
    //     }
    // });
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
    const line_x_material = new LineMaterialResource();
    line_x_material.color = new Color(red);
    line_x_material.width = line_width;
    line_mesh_x.geometry = line_geometry;
    line_mesh_x.material = line_x_material;

    const sphere_mesh_y = new MeshInstance3D();
    // const sphere_area_y = new PickingArea3D();
    // const sphere_shape_y = new PickingShape3D();
    // sphere_shape_y.shape = sphere_shape;
    // sphere_mesh_y.add_Child(sphere_area_y);
    // sphere_area_y.add_Child(sphere_shape_y);
    // sphere_area_y.signal_mouse_entered.connect(() => {
    //     sphere_mesh_y.local_scale = new Vector3(hover_sphere_scale, hover_sphere_scale, hover_sphere_scale);
    // });
    // sphere_area_y.signal_mouse_exited.connect(() => {
    //     sphere_mesh_y.local_scale = new Vector3(1, 1, 1);
    // });
    // sphere_area_y.signal_input.connect((evt, prop) => {
    //     if (!prop && sphere_area_y.is_mouse_hover && evt instanceof MouseButtonInputEvent && evt.click) {
    //         if (evt.button === MouseButton.Left) {
    //             ((viewport_container as any).target as Viewport | undefined)?.push_InputEvent(new ActionInputEvent('switch_TopView', true, false));
    //         }
    //         else if (evt.button === MouseButton.Right) {
    //             ((viewport_container as any).target as Viewport | undefined)?.push_InputEvent(new ActionInputEvent('switch_BottomView', true, false));
    //         }
    //     }
    // });
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
    const line_y_material = new LineMaterialResource();
    line_y_material.color = new Color(green);
    line_y_material.width = line_width;
    line_mesh_y.geometry = line_geometry;
    line_mesh_y.material = line_y_material;
    line_mesh_y.local_rotation = new Euler(0, 0, Math.PI / 2);

    const sphere_mesh_z = new MeshInstance3D();
    // const sphere_area_z = new PickingArea3D();
    // const sphere_shape_z = new PickingShape3D();
    // sphere_shape_z.shape = sphere_shape;
    // sphere_mesh_z.add_Child(sphere_area_z);
    // sphere_area_z.add_Child(sphere_shape_z);
    // sphere_area_z.signal_mouse_entered.connect(() => {
    //     sphere_mesh_z.local_scale = new Vector3(hover_sphere_scale, hover_sphere_scale, hover_sphere_scale);
    // });
    // sphere_area_z.signal_mouse_exited.connect(() => {
    //     sphere_mesh_z.local_scale = new Vector3(1, 1, 1);
    // });
    // sphere_area_z.signal_input.connect((evt, prop) => {
    //     if (!prop && sphere_area_z.is_mouse_hover && evt instanceof MouseButtonInputEvent && evt.click) {
    //         if (evt.button === MouseButton.Left) {
    //             ((viewport_container as any).target as Viewport | undefined)?.push_InputEvent(new ActionInputEvent('switch_FrontView', true, false));
    //         }
    //         else if (evt.button === MouseButton.Right) {
    //             ((viewport_container as any).target as Viewport | undefined)?.push_InputEvent(new ActionInputEvent('switch_BackView', true, false));
    //         }
    //     }
    // });
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
    const line_z_material = new LineMaterialResource();
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
EditorViewport.add_Child(EditorCompassViewportContainer);

EditorSceneTree.get_InputActionMap().add_Action('switch_FrontView', new ShortCut([new KeyInputEvent('1', '1', true, false, undefined, false, false, false, false)]));
EditorSceneTree.get_InputActionMap().add_Action('switch_LeftView', new ShortCut([new KeyInputEvent('2', '2', true, false, undefined, false, false, false, false)]));
EditorSceneTree.get_InputActionMap().add_Action('switch_TopView', new ShortCut([new KeyInputEvent('3', '3', true, false, undefined, false, false, false, false)]));
EditorSceneTree.get_InputActionMap().add_Action('switch_CameraType', new ShortCut([
    new KeyInputEvent('`', 'Backquote', true, false, undefined, false, false, false, false),
    new KeyInputEvent('`', 'Backquote', true, false, undefined, true, false, false, false),
]));
EditorSceneTree.get_InputActionMap().add_Action('zoomIn', new ShortCut([
    new MouseButtonInputEvent(MouseButton.WheelUp, true, false, false, undefined, new Vector2(0, 0), new Vector2(0, 0), false, false, false, false),
    new MouseButtonInputEvent(MouseButton.WheelUp, true, false, false, undefined, new Vector2(0, 0), new Vector2(0, 0), true, false, false, false),
]));
EditorSceneTree.get_InputActionMap().add_Action('zoomOut', new ShortCut([
    new MouseButtonInputEvent(MouseButton.WheelDown, true, false, false, undefined, new Vector2(0, 0), new Vector2(0, 0), false, false, false, false),
    new MouseButtonInputEvent(MouseButton.WheelDown, true, false, false, undefined, new Vector2(0, 0), new Vector2(0, 0), true, false, false, false),
]));

const transform_grabber = new TransformGrabber();
// transform_grabber.local_scale = new Vector3(100, 100, 100);
transform_grabber.signal_grabbing.connect(({ local_position, local_rotation }) => {
    Torus.global_position = transform_grabber.to_Global(local_position);
    Torus.local_rotation = local_rotation;
})
EditorWorld.add_Child(transform_grabber);

console.log(EditorSceneTree);

export function createEditorViewport() {
    EditorCompassViewportContainer.dom = document.querySelector('#compass') ?? undefined;
    EditorSceneTree.start_Loop();
}