import { Viewport, ViewportUpdateMode } from "@/system/engine/nodes/Node";
import { SceneTree } from "@/system/engine/SceneTree";
import { Node3D } from "@/system/engine/nodes/node3ds/Node3D";
import { ViewportDomContainer } from "@/system/engine/nodes/ViewportDomContainer";
import { KeyInputEvent } from "@/system/engine/inputs/events/KeyInputEvent";
import { MouseButton, MouseButtonInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseButtonInputEvent";
import { ShortCut } from "@/system/engine/inputs/ShortCut";
import { Color } from "@/system/fivepebble/graphics/Color";
import { GrabbingSingleton } from "@/system/engine/singletions/GrabbingSingletion";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { World3D } from "@/system/engine/worlds/world3ds/World3D";
import { OrbitCamera3D } from "@/system/engine/nodes/node3ds/camera3ds/OrbitCamera3D";
import { BoxGeometry3DResource } from "@/system/engine/resources/geometry_3d_resources/BoxGeometry3DResource";
import { MeshInstance3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/geometry3ds/MeshInstance3D";
import { RenderServerRenderer3D } from "@/system/engine/render_server/renderer3d/RenderServerRenderer3D";
import { TestMaterial3DResource } from "@/system/engine/resources/material_3d_resources/TestMaterial3DResource";
import { InterpolateTween, InterpolateTweenEasingType, InterpolateTweenTransitionType, PingPongTweenAdaptor, PropertyTweenAdaptor, TweenLoop } from "@/system/engine/Tween";

const bg_color = Color.create(0.25, 0.25, 0.25).linear_rgb;

export function createEditor() {

    // viewport
    const EditorViewport = new Viewport();
    // viewport container
    const EditorViewportContainer = new ViewportDomContainer();
    EditorViewportContainer.dom = (document.querySelector('#viewport-0') ?? undefined) as HTMLElement;
    EditorViewportContainer.add_Child(EditorViewport);
    // camera
    const EditorCamera = new OrbitCamera3D();
    EditorViewport.add_Child(EditorCamera);
    EditorCamera.set_Zoom(0.3);

    EditorViewport.world_3d = new World3D();
    EditorViewport.renderer_3d = new RenderServerRenderer3D();

    // // viewport 0
    const EditorViewportContainer0 = new ViewportDomContainer();
    EditorViewportContainer0.dom = (document.querySelector('#viewport-1') ?? undefined) as HTMLElement;
    const EditorViewport0 = new Viewport();
    EditorViewport0.renderer_3d = new RenderServerRenderer3D();
    EditorViewportContainer0.add_Child(EditorViewport0);
    const EditorCamera0 = new OrbitCamera3D();
    EditorViewport0.add_Child(EditorCamera0);
    EditorViewport.add_Child(EditorViewportContainer0);
    EditorCamera0.set_Zoom(0.3);
    // viewport 1
    const EditorViewportContainer1 = new ViewportDomContainer();
    EditorViewportContainer1.dom = (document.querySelector('#viewport-2') ?? undefined) as HTMLElement;
    const EditorViewport1 = new Viewport();
    EditorViewport1.renderer_3d = new RenderServerRenderer3D();
    EditorViewportContainer1.add_Child(EditorViewport1);
    const EditorCamera1 = new OrbitCamera3D();
    EditorViewport1.add_Child(EditorCamera1);
    EditorViewport.add_Child(EditorViewportContainer1);
    EditorCamera1.set_Zoom(0.3);

    // World 
    const World = new Node3D();
    World.local_scale = Vector3.create(0.01, 0.01, 0.01);

    const EditorSceneTree = new SceneTree(EditorViewportContainer);
    EditorSceneTree.register_Singleton(GrabbingSingleton);
    EditorViewport.add_Child(World);

    EditorSceneTree.get_InputActionMap().add_Action('switch_FrontView', new ShortCut().set([new KeyInputEvent().set_Key('1', '1', true, false)]));
    EditorSceneTree.get_InputActionMap().add_Action('switch_LeftView', new ShortCut().set([new KeyInputEvent().set_Key('2', '2', true, false)]));
    EditorSceneTree.get_InputActionMap().add_Action('switch_TopView', new ShortCut().set([new KeyInputEvent().set_Key('3', '3', true, false)]));
    EditorSceneTree.get_InputActionMap().add_Action('switch_CameraType', new ShortCut().set([new KeyInputEvent().set_Key('`', 'Backquote', true, false)]));
    EditorSceneTree.get_InputActionMap().add_Action('zoomIn', new ShortCut().set([
        new MouseButtonInputEvent().set_Button(MouseButton.WheelUp, true, false, false).set_Compose(true),
        new MouseButtonInputEvent().set_Button(MouseButton.WheelUp, true, false, false),
    ]));
    EditorSceneTree.get_InputActionMap().add_Action('zoomOut', new ShortCut().set([
        new MouseButtonInputEvent().set_Button(MouseButton.WheelDown, true, false, false).set_Compose(true),
        new MouseButtonInputEvent().set_Button(MouseButton.WheelDown, true, false, false),
    ]));

    const box_geo = new BoxGeometry3DResource();
    const box_mat = new TestMaterial3DResource();
    const mesh = new MeshInstance3D();
    mesh.geometry = box_geo;
    mesh.material = box_mat;
    mesh.local_position = Vector3.create(0, 0, 0);
    mesh.local_scale = Vector3.create(100, 100, 100);
    World.add_Child(mesh);


    const mesh2 = new MeshInstance3D();
    mesh2.geometry = box_geo;
    mesh2.material = box_mat;
    mesh2.local_position = Vector3.create(200, 0, 0);
    mesh2.local_scale = Vector3.create(100, 100, 100);
    World.add_Child(mesh2);

    const tween = new TweenLoop(
        new PingPongTweenAdaptor(
            new PropertyTweenAdaptor(
                new InterpolateTween(2.0, InterpolateTweenTransitionType.Sine, InterpolateTweenEasingType.InOut),
                mesh2, 'local_position', Vector3.create(200, 200, 200)
            )
        ),
        Infinity
    );


    // EditorViewport.signal_input.connect((evt, pro) => {
    //     if (!pro && evt instanceof MouseMotionInputEvent) {
    //         console.log(evt.position_normalized);
    //     }
    // });

    EditorSceneTree.start_Loop(Infinity, 60);
    EditorSceneTree.start_Tween(tween);

    return EditorSceneTree;
}