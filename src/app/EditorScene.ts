import { World3D } from "@/system/engine/worlds/world3ds/World3D";
import { Viewport } from "@/system/engine/nodes/Node";
import { SceneTree } from "@/system/engine/SceneTree";
import { Node3D } from "@/system/engine/nodes/node3ds/Node3D";
import { ViewportDomContainer } from "@/system/engine/nodes/ViewportDomContainer";
import { KeyInputEvent } from "@/system/engine/inputs/events/KeyInputEvent";
import { MouseButton, MouseButtonInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseButtonInputEvent";
import { ShortCut } from "@/system/engine/inputs/ShortCut";
import { EditorOrbitCamera3D } from "./nodes/EditorOrbitCamera3D";
import { MeshInstance3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/geometry3ds/MeshInstance3D";
import { BoxGeometryResource, CylinderGeometryResource, SphereGeometryResource, TorusGeometryResource } from "@/system/engine/resources/geometry_resources/PrimitiveGeometryResource";
import { NormalMaterialResource, PlainColorMaterialResource } from "@/system/engine/resources/material_resources/PrimitiveMaterialResource";
import { Color } from "@/system/fivepebble/graphics/Color";
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
import { Bvh3 } from "@/system/fivepebble/bvh/Bvh3";
import { Bvh3Visualization } from './nodes/Bvh3Visualization';

import huli from 'res://huli.obj?url';
import stanford_bunny from 'res://stanford-bunny.obj?url';
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { Pi, Tau } from "@/system/fivepebble/Scalar";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Ray3 } from "@/system/fivepebble/geometries/Ray3";
import { GridGeometryResource, WireframeBoxGeometryResource } from "@/system/engine/resources/geometry_resources/HelperGeometryResource";
import { PickingArea3D } from "@/system/engine/nodes/node3ds/physics3ds/PickingArea3D";
import { PickingBoxResource, PickingPointResource, PickingPolyLineResource, PickingSphereResource } from "@/system/engine/resources/picking_shape_resources/PickingShapeResource";
import { PickingShape3D } from "@/system/engine/nodes/node3ds/physics3ds/PickingShape3D";
import { PointGrabber3D } from "../system/engine/nodes/node3ds/gizmo3ds/grabber3ds/PointGrabber3D";
import { Line3 } from "@/system/fivepebble/geometries/Line3";
import { LineGrabber3D } from "@/system/engine/nodes/node3ds/gizmo3ds/grabber3ds/LineGrabber3D";
import { RayPickingOption } from "@/system/engine/worlds/world3ds/PickingWorld3D";
import { FixSizeNode3D } from "@/system/engine/nodes/node3ds/gizmo3ds/FixSizeNode3D";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Box3 } from "@/system/fivepebble/geometries/Box3";

const DConfig = new Cacher((canvas: HTMLCanvasElement) => {
    return {
        render_server: new RenderServerDevice(canvas),
        render_server_pixel_ratio: undefined,
        render_server_scale: 1.25,
        fps: Infinity,
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
    // EditorViewport.transparent = true;
    EditorViewportContainer.add_Child(EditorViewport);
    // camera
    const EditorCamera = new EditorOrbitCamera3D(DefaultConfig);
    EditorViewport.add_Child(EditorCamera);
    EditorCamera.set_Zoom(0.3);

    // // viewport 0
    const EditorViewportContainer0 = new ViewportDomContainer(DefaultConfig);
    EditorViewportContainer0.dom = (document.querySelector('#viewport-1') ?? undefined) as HTMLElement;
    const EditorViewport0 = new Viewport(DefaultConfig);
    const renderer0 = new EditorRenderer3D(DefaultConfig);
    const pipeline0 = new EditorRenderer3DPipeline(DefaultConfig);
    renderer0.render_pipeline = pipeline0;
    EditorViewport0.renderer_3d = renderer0;
    // EditorViewport0.transparent = true;
    EditorViewportContainer0.add_Child(EditorViewport0);
    const EditorCamera0 = new EditorOrbitCamera3D(DefaultConfig);
    EditorViewport0.add_Child(EditorCamera0);
    EditorViewport.add_Child(EditorViewportContainer0);
    // // viewport 1
    const EditorViewportContainer1 = new ViewportDomContainer(DefaultConfig);
    EditorViewportContainer1.dom = (document.querySelector('#viewport-2') ?? undefined) as HTMLElement;
    const EditorViewport1 = new Viewport(DefaultConfig);
    const renderer1 = new EditorRenderer3D(DefaultConfig);
    const pipeline1 = new EditorRenderer3DPipeline(DefaultConfig);
    renderer1.render_pipeline = pipeline1;
    EditorViewport1.renderer_3d = renderer1;
    // EditorViewport1.transparent = true;
    EditorViewportContainer1.add_Child(EditorViewport1);
    const EditorCamera1 = new EditorOrbitCamera3D(DefaultConfig);
    EditorViewport1.add_Child(EditorCamera1);
    EditorViewport.add_Child(EditorViewportContainer1);

    // World 
    const World = new Node3D(DefaultConfig);
    World.local_scale = Vector3.create(0.01, 0.01, 0.01);
    const ambient_light = new AmbientLight3D(DefaultConfig);
    ambient_light.intensity = 0.05;
    World.add_Child(ambient_light);
    const directional_light0 = new DirectionalLight3D(DefaultConfig);
    directional_light0.color = Vector3.create(0.9, 0.9, 1);
    directional_light0.intensity = 0.2;
    directional_light0.local_rotation = Euler.new.set_Quaternion(Quaternion.new.set_Rotate(Vector3.create(0, 0, -1), Vector3.new.normalize(Vector3.create(-1, -1, 1))));
    World.add_Child(directional_light0);
    const directional_light1 = new DirectionalLight3D(DefaultConfig);
    directional_light1.color = Vector3.create(1, 0.9, 0.8);
    directional_light1.intensity = 0.1;
    directional_light1.local_rotation = Euler.new.set_Quaternion(Quaternion.new.set_Rotate(Vector3.create(0, 0, -1), Vector3.new.normalize(Vector3.create(1, 1, -1))));
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

    multi_geometry.set_InstancesCount(count * count, false, false);

    for (let i = 0; i < count; i++) {
        for (let j = 0; j < count; j++) {
            multi_geometry.set_InstanceTransform(i * count + j, Matrix4.new.set_BasisPosition(Matrix3.new.set_RotateX(Pi / 2), Vector3.create(i * 2, j * 2, 0)), false, false);
        }
    }

    multi_geometry.commit_InstanceTransforms();
    multi_geometry.update_BBox();

    const material = new StandardMaterialResource(DefaultConfig);
    material.color = Color.create(1, 1, 1, 1);

    const Mesh1 = new MeshInstance3D(DefaultConfig);
    Mesh1.geometry = multi_geometry;
    Mesh1.material = material;
    Mesh1.local_scale = Vector3.create(100, 100, 100);
    Mesh1.local_position = Vector3.create(0, 0, -100);
    Mesh1.local_visible = true;

    World.add_Child(Mesh1);

    const TranslateGrabber = new TranslateGrabber3D(DefaultConfig);
    World.add_Child(TranslateGrabber);

    const point_light = new PointLight3D(DefaultConfig);
    point_light.color = Vector3.create(0, 1, 0);
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
    spot_light.color = Vector3.create(1, 0, 0);
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
    // 	Mesh2.local_scale = Vector3.create(1, 100, 100);
    // 	Mesh2.local_position = Vector3.create(i * 50, 0, 0);
    // 	World.add_Child(Mesh2);
    // }

    // for (let i = 0; i <= 100; i++) {
    // 	for (let j = 0; j <= 100; j++) {
    // 		const Mesh2 = new MeshInstance3D();
    // 		Mesh2.geometry = geometry2;
    // 		Mesh2.material = material1;
    // 		Mesh2.local_scale = Vector3.create(10, 10, 10);
    // 		Mesh2.local_position = Vector3.create((i / 100 * 2 - 1) * 2000, (j / 100 * 2 - 1) * 2000, 0);
    // 		World.add_Child(Mesh2);
    // 	}
    // }

    const multi_line_geometry = new MultiLineGeometryResource(DefaultConfig);
    const multi_line_material = new MultiLineMaterialResource(DefaultConfig);
    // multi_line_material.line_width = 10;
    const points = new Array(120).fill(0).map((i, idx) => {
        return Vector3.create(Math.cos(idx / 35 * Tau), Math.sin(idx / 35 * Tau), idx / 8);
    });
    multi_line_geometry.set_PointsCount(points.length);
    points.forEach((p, i) => multi_line_geometry.set_Point(i, p, false, false));
    multi_line_geometry.commit_Points();
    multi_line_geometry.update_BBox();
    multi_line_material.color = Color.color8(0, 0, 0).linear_rgb;
    const MeshLine = new MeshInstance3D(DefaultConfig);
    MeshLine.geometry = multi_line_geometry;
    MeshLine.material = multi_line_material;
    MeshLine.local_scale = Vector3.create(100, 100, 100);
    // MeshLine.local_rotation = Euler.create(-0.75, 0, 0);
    MeshLine.local_position = Vector3.create(800, 0, -400);
    // MeshLine.render_queue = 1;
    World.add_Child(MeshLine);

    const area = new PickingArea3D(DefaultConfig);
    const shape = new PickingPolyLineResource(DefaultConfig);
    shape.points = points;
    const s = new PickingShape3D(DefaultConfig);
    area.add_Child(s);
    s.shape = shape;
    MeshLine.add_Child(area);
    area.signal_mouse_entered.connect((evt, result) => {
        multi_line_material.color = Color.color8(255, 0, 0);
    });
    area.signal_mouse_exited.connect(() => {
        multi_line_material.color = Color.color8(0, 0, 0);
    });
    area.signal_mouse_moved.connect((event, result) => {
        line_grabber.local_position = result.position;
        line_grabber.local_rotation = Euler.new.set_Quaternion(Quaternion.new.set_Rotate(Vector3.create(0, 1, 0), result.normal));
    });

    const infinite_line_x = new InfiniteLine3D(DefaultConfig);
    const multi_line_material_x = new MultiLineMaterialResource(DefaultConfig);
    multi_line_material_x.color = Color.color8code(0xd82d4e33);
    // multi_line_material_x.line_width = 1;
    infinite_line_x.material = multi_line_material_x;
    infinite_line_x.render_queue = 1;
    World.add_Child(infinite_line_x);
    const infinite_line_y = new InfiniteLine3D(DefaultConfig);
    const multi_line_material_y = new MultiLineMaterialResource(DefaultConfig);
    // multi_line_material_y.line_width = 1;
    multi_line_material_y.color = Color.color8code(0x04b97344);
    infinite_line_y.material = multi_line_material_y;
    infinite_line_y.render_queue = 1;
    infinite_line_y.ray = Ray3.create(Vector3.new, Vector3.create(0, 1, 0));
    World.add_Child(infinite_line_y);
    const infinite_line_z = new InfiniteLine3D(DefaultConfig);
    const multi_line_material_z = new MultiLineMaterialResource(DefaultConfig);
    // multi_line_material_z.line_width = 1;
    multi_line_material_z.color = Color.color8code(0x466fd644);
    infinite_line_z.material = multi_line_material_z;
    infinite_line_z.render_queue = 1;
    infinite_line_z.ray = Ray3.create(Vector3.new, Vector3.create(0, 0, 1));
    World.add_Child(infinite_line_z);

    EditorViewport.signal_input.connect((evt, pro) => {
        if (pro && evt instanceof KeyInputEvent && evt.key === ' ' && evt.pressed && !evt.echo) {
            EditorSceneTree.start_Tween(
                tween_parallel(
                    // new MethodTween((v) => {
                    //     multi_line_geometry.set_Point(1, Vector3.create(1, v, 1));
                    // }, 0.4, TweenTransitionType.Linear, TweenEasingType.Out),
                    new PropertyTween(point_light, 'radius', Math.random() * 10, 0.4, TweenTransitionType.Linear, TweenEasingType.Out),
                    new PropertyTween(point_light, 'color', Vector3.create(Math.random(), Math.random(), Math.random()), 0.4, TweenTransitionType.Linear, TweenEasingType.Out)
                )
            );
        }
    });


    const ground = new MeshInstance3D(DefaultConfig);
    const geo = new BoxGeometryResource(DefaultConfig);
    geo.build();
    ground.geometry = geo;
    const ground_material = new PlainColorMaterialResource(DefaultConfig);
    ground_material.color = Color.create(0.8, 0.8, 0.8);
    ground.material = ground_material;
    ground.local_scale = Vector3.create(1000, 1, 1000);
    ground.local_position = Vector3.create(0, -100, 0);
    World.add_Child(ground);

    const grid_geo = new GridGeometryResource(DefaultConfig);
    grid_geo.build();
    const grid = new MeshInstance3D(DefaultConfig);
    grid.geometry = grid_geo;
    const grid_mat = new PlainColorMaterialResource(DefaultConfig);
    grid_mat.color = Color.color8(0, 0, 0, 20);
    grid.material = grid_mat;
    grid.top_level = true;
    World.add_Child(grid);

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
        mesh.local_scale = Vector3.create(100, 100, 100);
        mesh.local_position = Vector3.create(-500, -100, 250);
        World.add_Child(mesh);
    });

    // bvh

    const box = new TorusGeometryResource(DefaultConfig);
    box.build();

    const mesh_ = new MeshInstance3D(DefaultConfig);
    mesh_.geometry = box;
    mesh_.material = new NormalMaterialResource(DefaultConfig);
    mesh_.top_level = true;
    // World.add_Child(mesh_);
    // const tris = box.get_TriFaces();
    // console.log(tris);

    const bvh_viz = new Bvh3Visualization(DefaultConfig);
    bvh_viz.visualize_Bvh3(shape.bvh, 6);
    // bvh_viz.top_level = true;
    let depth = 0;
    bvh_viz.signal_input.connect((evt, prop) => {
        if (!prop) {
            if (evt instanceof KeyInputEvent && evt.pressed && evt.key === 'a' && !evt.echo) {
                depth = (depth + 1) % 10;
                bvh_viz.visualize_Bvh3(shape.bvh, depth);
            }
        }
    });
    // MeshLine.add_Child(bvh_viz);

    const box_geo = new BoxGeometryResource(DefaultConfig);
    const box_mesh = new MeshInstance3D(DefaultConfig);
    box_mesh.geometry = box_geo;
    box_mesh.material = new NormalMaterialResource(DefaultConfig);
    box_mesh.local_position = Vector3.create(400, 100, -100);
    box_mesh.local_rotation = Euler.create(0.32, 0.123, 1.23);
    box_mesh.local_scale = Vector3.create(300, 100, 100);
    World.add_Child(box_mesh);
    box_geo.build();
    const box_area = new PickingArea3D(DefaultConfig);
    const box_shape = new PickingShape3D(DefaultConfig);
    box_area.add_Child(box_shape);
    box_shape.shape = new PickingBoxResource(DefaultConfig);
    box_mesh.add_Child(box_area);
    const line_grabber = new LineGrabber3D(DefaultConfig);
    line_grabber.offset_length = 0;
    line_grabber.color = Color.color8code(0xff9900ff);
    line_grabber.enabled = false;
    World.add_Child(line_grabber);
    box_area.signal_mouse_moved.connect((event, result) => {
        line_grabber.local_position = result.position;
        line_grabber.local_rotation = Euler.new.set_Quaternion(Quaternion.new.set_Rotate(Vector3.create(0, 1, 0), result.normal));
    });

    const point_geo = new SphereGeometryResource(DefaultConfig);
    point_geo.build();
    const point_mat = new PlainColorMaterialResource(DefaultConfig);
    point_mat.color = Color.color8(0, 0, 0);
    const point_mesh = new MeshInstance3D(DefaultConfig);
    point_mesh.geometry = point_geo;
    point_mesh.material = point_mat;
    const size = new FixSizeNode3D(DefaultConfig);
    size.unit_pixel_count = 6;
    size.add_Child(point_mesh);
    World.add_Child(size);
    const point_area = new PickingArea3D(DefaultConfig);
    const point_shape = new PickingShape3D(DefaultConfig);
    point_area.add_Child(point_shape);
    point_shape.shape = new PickingPointResource(DefaultConfig);
    point_mesh.add_Child(point_area);
    size.global_position = Vector3.create(6, 1, -1);

    point_area.signal_mouse_entered.connect((evt, result) => {
        point_mat.color = Color.color8(255, 0, 0);
        line_grabber.local_position = result.position;
        line_grabber.local_rotation = Euler.new.set_Quaternion(Quaternion.new.set_Rotate(Vector3.create(0, 1, 0), result.normal));
    });
    point_area.signal_mouse_exited.connect(() => {
        point_mat.color = Color.color8(0, 0, 0);
    });

    return EditorSceneTree;
}