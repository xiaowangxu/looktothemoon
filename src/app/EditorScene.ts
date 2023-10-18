import { World3D } from "@/system/engine/Renderer";
import { Camera3D, Node3D, SceneTree, Viewport } from "@/system/engine/SceneTree";
import { ViewportDomContainer } from "@/system/engine/nodes/ViewportDomContainer";
import { Euler, Vector2, Vector3 } from "three";

// viewport container
const EditorViewportContainer = new ViewportDomContainer();
EditorViewportContainer.dom = document.querySelector('#viewport') ?? undefined;

// viewport
export const EditorViewport = new Viewport();
EditorViewport.world_3d = new World3D();
EditorViewport.transparent = true;
EditorViewportContainer.add_Child(EditorViewport);

// camera
const CameraArm0 = new Node3D();
const CameraArm1 = new Node3D();
CameraArm0.add_Child(CameraArm1);
export const EditorCamera = new Camera3D();
CameraArm1.add_Child(EditorCamera);
EditorViewport.add_Child(CameraArm0);
EditorCamera.local_position = new Vector3(0, 0, 5);
CameraArm1.local_rotation = new Euler(-0.3, 0, 0);
let time = 0;
CameraArm0.signal_process.connect((delta) => {
    time += delta;
    const rotation = CameraArm0.local_rotation;
    CameraArm0.local_rotation = new Euler(0, rotation.y + delta / 10, 0);
    EditorCamera.fov = (Math.sin(time / 10) + 1) / 2 * 100 + 20;
})

// scenetree
export const EditorSceneTree = new SceneTree(EditorViewportContainer);

export function createEditorViewport(el: string) {
    EditorSceneTree.start_Loop();
}