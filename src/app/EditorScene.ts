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
import { Ref } from "@/system/utils/RefCounted";
import { GeometryResource } from "@/system/engine/resources/geometry_resources/GeometryResource";
import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { box3 } from "@/system/fivepebble/geometries/Box3";
import { RenderDeviceMatrix4AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { RenderServer } from "@/system/engine/render_server/RenderServer";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { NormalMaterialResource, PlainColorMaterialResource } from "@/system/engine/resources/material_resources/PrimitiveMaterialResource";
import { color } from "@/system/fivepebble/graphics/Color";
import { MaterialOverrideResource } from "@/system/engine/resources/material_resources/MaterialResource";
import { vec4 } from "@/system/fivepebble/linear_algebra/Vector4";

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
const geometry = new TorusGeometryResource();
const material1 = new PlainColorMaterialResource();
material1.color = color(1, 0, 0, 1);
material1.set_UniformOverride('u_texture', RenderServer.empty_texture);

const materialbase = new PlainColorMaterialResource();
const material2 = new MaterialOverrideResource();
material2.set_OverrideMaterial(materialbase);
material2.set_UniformOverride('u_color', vec4(0, 0, 1, 1));

const material3 = new NormalMaterialResource();

// const instance_transform = new RenderDeviceMatrix4AttributeBuffer(RenderServer, RenderStateBufferUsage.DynamicDraw, 100 * 100, 1);
// const multi_geometry = new GeometryResource();
// multi_geometry.geometry.set_Geometry(
//     RenderStatePrimitiveType.Triangles,
//     {
//         position: geometry.geometry.get_AttributeBuffer('position')!,
//         normal: geometry.geometry.get_AttributeBuffer('normal')!,
//         uv: geometry.geometry.get_AttributeBuffer('uv')!,
//         instance_transform
//     },
//     geometry.geometry.get_IndexAttributeBuffer()!,
//     undefined,
//     box3(vec3(-1000, -1000, -1000), vec3(1000, 1000, 1000))
// );
// multi_geometry.geometry.instance_count = instance_transform.item_count;

// const Mesh1 = new MeshInstance3D();
// Mesh1.geometry = geometry;
// Mesh1.material = material1;
// Mesh1.local_scale = vec3(100, 100, 100);
// Mesh1.local_position = vec3(100, 0, 0);
// World.add_Child(Mesh1);

// const Mesh2 = new MeshInstance3D();
// Mesh2.geometry = geometry;
// // Mesh2.material = material2;
// Mesh2.local_scale = vec3(100, 100, 100);
// Mesh2.local_position = vec3(-100, 0, 0);
// World.add_Child(Mesh2);

// // Mesh2.set_SurfaceMaterial(0, material1);
// // Mesh2.set_SurfaceMaterial(1, material1);
// Mesh2.set_SurfaceMaterial(2, material3);
// Mesh2.set_SurfaceMaterial(3, material3);
// Mesh2.set_SurfaceMaterial(4, material3);
// Mesh2.set_SurfaceMaterial(5, material3);

// for (let i = 0; i < 100; i++) {
//     for (let j = 0; j < 100; j++) {
//         const id = i * 100 + j;
//         const mat = Matrix4.from_BasisPosition(Matrix3.make_Scale(5, 5, 5), vec3((i / 100 * 2 - 1) * 1000, (j / 100 * 2 - 1) * 1000, 0));
//         instance_transform.update_Data(mat, id, false);
//     }
// }
// instance_transform.commit_Data();

for (let i = 0; i <= 100; i++) {
    for (let j = 0; j <= 100; j++) {
        const Mesh2 = new MeshInstance3D();
        Mesh2.geometry = geometry;
        Mesh2.material = material1;
        Mesh2.local_scale = vec3(10, 10, 10);
        Mesh2.local_position = vec3((i / 100 * 2 - 1) * 2000, (j / 100 * 2 - 1) * 2000, 0);
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

EditorViewport.signal_input.connect((evt, pro) => {
    if (pro && evt instanceof KeyInputEvent && evt.key === ' ' && evt.pressed) {
        // if (Mesh2.is_inside_tree) Mesh2.queue_Free();
        EditorSceneTree.start_Tween(
            new PropertyTween(
                material1,
                'color',
                color(Math.random(), Math.random(), Math.random(), Math.random() < 0.5 ? 0 : 1),
                2, TransitionType.Bounce, EasingType.Out
            )
        );
    }
});

export function createEditorViewport() {
    EditorSceneTree.start_Loop();
}