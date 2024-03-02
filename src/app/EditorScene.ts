import { World3D } from "@/system/engine/worlds/world3ds/World3D";
import { Viewport } from "@/system/engine/nodes/Node";
import { SceneTree } from "@/system/engine/SceneTree";
import { Node3D } from "@/system/engine/nodes/node3ds/Node3D";
import { ViewportDomContainer } from "@/system/engine/nodes/ViewportDomContainer";
import { KeyInputEvent } from "@/system/engine/inputs/events/KeyInputEvent";
import { MouseButton, MouseButtonInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseButtonInputEvent";
import { ShortCut } from "@/system/engine/inputs/ShortCut";
import { EditorOrbitCamera3D } from "./nodes/EditorOrbitCamera3D";
import { vec3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { MeshInstance3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/geometry3ds/MeshInstance3D";
import { BoxGeometryResource, TorusGeometryResource } from "@/system/engine/resources/geometry_resources/PrimitiveGeometryResource";
import { PlainColorMaterialResource } from "@/system/engine/resources/material_resources/PrimitiveMaterialResource";
import { color, color8, color8code } from "@/system/fivepebble/graphics/Color";
import { Euler } from "@/system/fivepebble/linear_algebra/Euler";
import { MultiGeometryResource } from "@/system/engine/resources/geometry_resources/GeometryResource";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { MultiLineGeometryResource } from "@/system/engine/resources/geometry_resources/MultiLineGeometryResource";
import { MultiLineMaterialResource } from "@/system/engine/resources/material_resources/MultiLineMaterialResource";
import type { Config } from "@/system/engine/ConfiguredObject";
import { RenderServerDevice } from "@/system/engine/render_server/RenderServer";
import { StandardMaterialResource } from "../system/engine/resources/material_resources/PrimitiveMaterialResource";
import { ClassLoader } from "@/system/engine/classes/saver_loader/ClassSaverLoader";
import { ResourceInstanceCache } from "@/system/engine/resources/Resource";
import huli from 'res://huli.obj?url';
import { MaterialOverrideResource } from "@/system/engine/resources/material_resources/MaterialResource";
import { EditorRenderer3DPipeline } from "@/system/engine/renderer/renderer_3d/EditorRenderer3DPipeline";
import { EditorRenderer3D } from "@/system/engine/renderer/renderer_3d/EditorRenderer3D";
import { TranslateGrabber3D } from "@/system/engine/nodes/node3ds/gizmo3ds/grabber3ds/TranslateGrabber3D";
import { PointLight3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/light3ds/PointLight3D";
import { AmbientLight3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/light3ds/AmbientLight3D";
import { DirectionalLight3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/light3ds/DirectionalLight3D";
import { SpotLight3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/light3ds/SpotLight3D";
import { Quaternion } from "@/system/fivepebble/linear_algebra/Quaternion";
import { ArrayGeometryResource } from "@/system/engine/resources/geometry_resources/ArrayGeometryResource";
import { ObjLoader } from "@/system/engine/loaders/ObjLoader";
import { Cacher } from "@/system/utils/Cacher";
import { Ref } from "@/system/utils/RefCounted";
import { GrabbingSingleton } from "@/system/engine/singletions/GrabbingSingletion";
import { tween_parallel, PropertyTween, TweenTransitionType, TweenEasingType, MethodTween } from "@/system/engine/Tween";
import { InfiniteLine3D } from "@/system/engine/nodes/node3ds/gizmo3ds/InfiniteLine3D";
import { ray3 } from "@/system/fivepebble/geometries/Ray3";

const DConfig = new Cacher((canvas: HTMLCanvasElement) => {
    return {
        render_server: new RenderServerDevice(canvas),
        render_server_pixel_ratio: undefined,
        render_server_scale: 1,
        physics_fps: 60,
    } as Config;
});

const DInstanceCache = new Cacher((config: Config) => {
    return new ResourceInstanceCache(config);
});

const DRenderer = new Cacher((config: Config) => {
    return new Ref(new EditorRenderer3D(config));
});

const DRenderPipeline = new Cacher((config: Config) => {
    return new Ref(new EditorRenderer3DPipeline(config));
});

export function createEditor() {
    const render_server_canvas = document.getElementById('render-server-canvas') as HTMLCanvasElement;
    const DefaultConfig: Config = DConfig.get(render_server_canvas);

    // viewport container
    const EditorViewportContainer = new ViewportDomContainer(DefaultConfig);
    EditorViewportContainer.dom = (document.querySelector('#viewport-0') ?? undefined) as HTMLElement;

    // viewport
    const EditorViewport = new Viewport(DefaultConfig);
    EditorViewport.debug = true;
    EditorViewport.world_3d = new World3D(DefaultConfig);
    const renderer = DRenderer.get(DefaultConfig).expect;
    const pipeline = DRenderPipeline.get(DefaultConfig).expect;
    renderer.render_pipeline = pipeline;
    EditorViewport.renderer_3d = renderer;
    EditorViewport.transparent = true;
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
    // EditorViewport0.transparent = true;
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

    const EditorSceneTree = new SceneTree(DefaultConfig, EditorViewportContainer);
    EditorSceneTree.register_Singleton(GrabbingSingleton);
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

    const geometry = new TorusGeometryResource(DefaultConfig);
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

    const material = new StandardMaterialResource(DefaultConfig);
    material.color = color(1, 1, 1, 1);

    const Mesh1 = new MeshInstance3D(DefaultConfig);
    Mesh1.geometry = multi_geometry;
    Mesh1.material = material;
    Mesh1.local_scale = vec3(100, 100, 100);
    Mesh1.local_position = vec3(0, 0, -100);
    Mesh1.local_visible = true;

    World.add_Child(Mesh1);

    const TranslateGrabber = new TranslateGrabber3D(DefaultConfig);
    World.add_Child(TranslateGrabber);

    const point_light = new PointLight3D(DefaultConfig);
    point_light.color = vec3(0, 1, 0);
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

    const multi_line_geometry = new MultiLineGeometryResource(DefaultConfig);
    const multi_line_material = new MultiLineMaterialResource(DefaultConfig);
    multi_line_material.color = color8(0xd8, 0x2d, 0x4e);
    const MeshLine = new MeshInstance3D(DefaultConfig);
    MeshLine.geometry = multi_line_geometry;
    MeshLine.material = multi_line_material;
    MeshLine.local_scale = vec3(100, 100, 100);
    MeshLine.local_position = vec3(0, 0, -50);
    MeshLine.render_queue = 1;
    World.add_Child(MeshLine);

    const infinite_line_x = new InfiniteLine3D(DefaultConfig);
    const multi_line_material_x = new MultiLineMaterialResource(DefaultConfig);
    multi_line_material_x.color = color8(0xd8, 0x2d, 0x4e);
    multi_line_material_x.line_width = 1;
    infinite_line_x.material = multi_line_material_x;
    infinite_line_x.render_queue = 1;
    // World.add_Child(infinite_line_x);
    const infinite_line_y = new InfiniteLine3D(DefaultConfig);
    const multi_line_material_y = new MultiLineMaterialResource(DefaultConfig);
    multi_line_material_y.line_width = 1;
    multi_line_material_y.color = color8code(0x04b973ff);
    infinite_line_y.material = multi_line_material_y;
    infinite_line_y.render_queue = 1;
    infinite_line_y.ray = ray3(vec3(), vec3(0, 1, 0));
    // World.add_Child(infinite_line_y);
    const infinite_line_z = new InfiniteLine3D(DefaultConfig);
    const multi_line_material_z = new MultiLineMaterialResource(DefaultConfig);
    multi_line_material_z.line_width = 1;
    multi_line_material_z.color = color8code(0x466fd6ff);
    infinite_line_z.material = multi_line_material_z;
    infinite_line_z.render_queue = 1;
    infinite_line_z.ray = ray3(vec3(), vec3(0, 0, 1));
    // World.add_Child(infinite_line_z);

    EditorViewport.signal_input.connect((evt, pro) => {
        if (pro && evt instanceof KeyInputEvent && evt.key === ' ' && evt.pressed && !evt.echo) {
            EditorSceneTree.start_Tween(
                tween_parallel(
                    new MethodTween((v) => {
                        multi_line_geometry.set_Point(1, vec3(1, v, 1));
                    }, 0.4, TweenTransitionType.Linear, TweenEasingType.Out),
                    new PropertyTween(point_light, 'radius', Math.random() * 10, 0.4, TweenTransitionType.Linear, TweenEasingType.Out),
                    new PropertyTween(point_light, 'color', vec3(Math.random(), Math.random(), Math.random()), 0.4, TweenTransitionType.Linear, TweenEasingType.Out)
                )
            );
        }
    });


    const ground = new MeshInstance3D(DefaultConfig);
    const geo = new BoxGeometryResource(DefaultConfig);
    geo.build();
    ground.geometry = geo;
    const ground_material = new PlainColorMaterialResource(DefaultConfig);
    ground_material.color = color(0.8, 0.8, 0.8);
    ground.material = ground_material;
    ground.local_scale = vec3(1000, 1, 1000);
    ground.local_position = vec3(0, -100, 0);
    World.add_Child(ground);

    EditorSceneTree.start_Loop();

    fetch(huli).then(r => r.text()).then(t => {
        const class_saver = new ObjLoader().parse(t).expect();
        class_saver.save(undefined, 'sys://huli.geometry.lttmbin');

        const huli_geo = new ClassLoader(DInstanceCache.get(DefaultConfig)).fetch<ArrayGeometryResource>('sys://huli.geometry.lttmbin').expect();

        const normal_material = new StandardMaterialResource(DefaultConfig);
        const override_material = new MaterialOverrideResource(DefaultConfig);
        override_material.set_OverrideMaterial(normal_material);

        const mesh = new MeshInstance3D(DefaultConfig);
        mesh.geometry = huli_geo;
        mesh.material = override_material;
        mesh.local_scale = vec3(100, 100, 100);
        mesh.local_position = vec3(-500, -100, 250);
        World.add_Child(mesh);

    });

    return EditorSceneTree;
}

