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
import { EasingType, PropertyMethodTween, PropertyTween, TransitionType } from "@/system/engine/Tween";
import { GeometryResource } from "@/system/engine/resources/geometry_resources/GeometryResource";
import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { box3 } from "@/system/fivepebble/geometries/Box3";
import { RenderDeviceMatrix4AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { RenderServer } from "@/system/engine/render_server/RenderServer";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { NormalMaterialResource, PlainColorMaterialResource } from "@/system/engine/resources/material_resources/PrimitiveMaterialResource";
import { color, color8, type Color } from "@/system/fivepebble/graphics/Color";
import { MaterialOverrideResource } from "@/system/engine/resources/material_resources/MaterialResource";
import { vec4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { OrthographicCamera3D } from "@/system/engine/nodes/camera3ds/OrthographicCamera3D";
import { euler } from "@/system/fivepebble/linear_algebra/Euler";

// viewport container
const EditorViewportContainer = new ViewportDomContainer();
EditorViewportContainer.dom = document.querySelector('#viewport') ?? undefined;

// viewport
export const EditorViewport = new Viewport();
EditorViewport.physics_picking = false;
EditorViewport.debug = false;
EditorViewport.world_3d = new World3D();
EditorViewportContainer.add_Child(EditorViewport);
// camera
const EditorCamera = new EditorOrbitCamera3D();
EditorViewport.add_Child(EditorCamera);
EditorCamera.set_Zoom(0.3);

// World 
const World = new Node3D();
World.local_scale = vec3(0.01, 0.01, 0.01);
World.block_input = true;
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
const geometry = new CylinderGeometryResource();

const material1 = new NormalMaterialResource();
// material1.color = color(1, 0, 0, 1);
material1.set_UniformOverride('u_texture', EditorViewport.get_World3D()?.get_VisualWorld().sky_texture.expect);

const material2 = new PlainColorMaterialResource();
material2.color = color(1, 0, 1, 1);

const material3 = new PlainColorMaterialResource();
material3.color = color(1, 1, 0, 1);

const Mesh1 = new MeshInstance3D();
Mesh1.geometry = geometry;
Mesh1.material = material1;
Mesh1.local_scale = vec3(100, 100, 100);
Mesh1.local_position = vec3(0, 0, 0);
World.add_Child(Mesh1);

// for (let i = 0; i <= 100; i++) {
//     for (let j = 0; j <= 100; j++) {
//         const Mesh2 = new MeshInstance3D();
//         Mesh2.geometry = geometry;
//         Mesh2.material = material1;
//         Mesh2.local_scale = vec3(10, 10, 10);
//         Mesh2.local_position = vec3((i / 100 * 2 - 1) * 2000, (j / 100 * 2 - 1) * 2000, 0);
//         World.add_Child(Mesh2);
//     }
// }

EditorViewport.signal_input.connect((evt, pro) => {
    // if (pro && evt instanceof KeyInputEvent && evt.key === ' ' && evt.pressed && !evt.echo) {
    //     EditorSceneTree.start_Tween(
    //         new PropertyMethodTween<Color>(
    //             (color) => {
    //                 material2.set_UniformOverride('u_color', color);
    //             },
    //             material1.color,
    //             color(Math.random(), Math.random(), Math.random(), 1),
    //             2, TransitionType.Bounce, EasingType.Out
    //         )
    //     );
    // }
});

function create_CompassScene() {
    const red = color8(0xf8, 0x2d, 0x4e);
    const green = color8(0x04, 0xa9, 0x73);
    const blue = color8(0x46, 0x6f, 0xd6);
    const neg_color = color8(0x55, 0x55, 0x55);
    const sphere_radius = 0.4;
    const distance = 0.8;
    const camera_zoom = 0.5;

    const viewport_container = new ViewportDomContainer();
    const viewport = new Viewport();
    viewport.transparent = true;
    viewport.world_3d = new World3D();
    viewport.update_mode = ViewportUpdateMode.Once;
    viewport.color_map = false;

    const sphere_geometry = new BoxGeometryResource();
    sphere_geometry.set_Parameter(sphere_radius, sphere_radius, sphere_radius);
    const line_geometry = new CylinderGeometryResource();
    line_geometry.set_Parameter(0.035, distance, 16);

    const sphere_neg_material = new PlainColorMaterialResource();
    sphere_neg_material.color = neg_color;

    const sphere_mesh_x = new MeshInstance3D();
    const sphere_x_material = new PlainColorMaterialResource();
    sphere_x_material.color = red;
    sphere_mesh_x.geometry = sphere_geometry;
    sphere_mesh_x.material = sphere_x_material;
    sphere_mesh_x.local_position = vec3(distance, 0, 0);
    const sphere_mesh_x_neg = new MeshInstance3D();
    const sphere_x_material_neg = sphere_neg_material;
    sphere_mesh_x_neg.geometry = sphere_geometry;
    sphere_mesh_x_neg.material = sphere_x_material_neg;
    sphere_mesh_x_neg.local_position = vec3(-distance, 0, 0);

    const line_mesh_x = new MeshInstance3D();
    const line_x_material = sphere_x_material;
    line_mesh_x.geometry = line_geometry;
    line_mesh_x.material = line_x_material;
    line_mesh_x.local_position = vec3(distance / 2, 0, 0);
    line_mesh_x.local_rotation = euler(0, 0, Math.PI / 2);

    const sphere_mesh_y = new MeshInstance3D();
    const sphere_y_material = new PlainColorMaterialResource();
    sphere_y_material.color = green;
    sphere_mesh_y.geometry = sphere_geometry;
    sphere_mesh_y.material = sphere_y_material;
    sphere_mesh_y.local_position = vec3(0, distance, 0);
    const sphere_mesh_y_neg = new MeshInstance3D();
    const sphere_y_material_neg = sphere_neg_material;
    sphere_mesh_y_neg.geometry = sphere_geometry;
    sphere_mesh_y_neg.material = sphere_y_material_neg;
    sphere_mesh_y_neg.local_position = vec3(0, -distance, 0);

    const line_mesh_y = new MeshInstance3D();
    const line_y_material = sphere_y_material
    line_mesh_y.geometry = line_geometry;
    line_mesh_y.material = line_y_material;
    line_mesh_y.local_position = vec3(0, distance / 2, 0);
    line_mesh_y.local_rotation = euler(0, 0, 0);

    const sphere_mesh_z = new MeshInstance3D();
    const sphere_z_material = new PlainColorMaterialResource();
    sphere_z_material.color = blue;
    sphere_mesh_z.geometry = sphere_geometry;
    sphere_mesh_z.material = sphere_z_material;
    sphere_mesh_z.local_position = vec3(0, 0, distance);
    const sphere_mesh_z_neg = new MeshInstance3D();
    const sphere_z_material_neg = sphere_neg_material;
    sphere_mesh_z_neg.geometry = sphere_geometry;
    sphere_mesh_z_neg.material = sphere_z_material_neg;
    sphere_mesh_z_neg.local_position = vec3(0, 0, -distance);

    const line_mesh_z = new MeshInstance3D();
    const line_z_material = sphere_z_material;
    line_mesh_z.geometry = line_geometry;
    line_mesh_z.material = line_z_material;
    line_mesh_z.local_position = vec3(0, 0, distance / 2);
    line_mesh_z.local_rotation = euler(Math.PI / 2, 0, 0);

    const camera = new OrthographicCamera3D();
    camera.zoom = camera_zoom;
    camera.local_position = vec3(0, 0, 5);

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