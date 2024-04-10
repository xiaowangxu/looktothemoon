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
import { BoxGeometryResource, SphereGeometryResource, TorusGeometryResource } from "@/system/engine/resources/geometry_resources/PrimitiveGeometryResource";
import { Color } from "@/system/fivepebble/graphics/Color";
import { Euler } from "@/system/fivepebble/linear_algebra/Euler";
import { MultiGeometryResource } from "@/system/engine/resources/geometry_resources/GeometryResource";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { MultiLineGeometryResource, MultiSegmentGeometryResource } from "@/system/engine/resources/geometry_resources/MultiLineSegmentGeometryResource";
import { MultiLineSegmentMaterialResource } from "@/system/engine/resources/material_resources/MultiLineMaterialResource";
import type { Config } from "@/system/engine/ConfiguredObject";
import { RenderServerDevice } from "@/system/engine/render_server/RenderServer";
import { ClassLoader } from "@/system/engine/classes/saver_loader/ClassSaverLoader";
import { ResourceInstanceCache } from "@/system/engine/resources/Resource";
import { MaterialOverrideResource } from "@/system/engine/resources/material_resources/MaterialResource";
import { EditorRenderer3DPipeline } from "@/system/engine/renderer/renderer_3d/editor_renderer_3d/EditorRenderer3DPipeline";
import { EditorRenderer3D } from "@/system/engine/renderer/renderer_3d/editor_renderer_3d/EditorRenderer3D";
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
import { tween_parallel, PropertyTween, TweenTransitionType, TweenEasingType } from "@/system/engine/Tween";
import { InfiniteLine3D } from "@/system/engine/nodes/node3ds/gizmo3ds/InfiniteLine3D";
import { Bvh3Strategy } from "@/system/fivepebble/bvh/Bvh3";
import { Bvh3Visualization } from './nodes/Bvh3Visualization';

import huli from 'res://huli.obj?url';
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { Pi, Tau } from "@/system/fivepebble/Scalar";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Ray3 } from "@/system/fivepebble/geometries/Ray3";
import { GridGeometryResource } from "@/system/engine/resources/geometry_resources/HelperGeometryResource";
import { PickingArea3D } from "@/system/engine/nodes/node3ds/physics3ds/PickingArea3D";
import { PickingBoxResource, PickingBvh3Resource, PickingPointResource, PickingPolyLineResource } from "@/system/engine/resources/picking_shape_resources/PickingShapeResource";
import { PickingShape3D } from "@/system/engine/nodes/node3ds/physics3ds/PickingShape3D";
import { LineGrabber3D } from "@/system/engine/nodes/node3ds/gizmo3ds/grabber3ds/LineGrabber3D";
import { FixSizeNode3D } from "@/system/engine/nodes/node3ds/gizmo3ds/FixSizeNode3D";
import { PlaceholderTextureResource } from "@/system/engine/resources/texture_resources/PlaceholderTextureResource";
import { ImageTextureResource } from "@/system/engine/resources/texture_resources/ImageTextureResource";
import { MatcapMaterialResource } from "@/system/engine/resources/material_resources/MatcapMaterialResource";
import { RenderStateTextureMagFilter, RenderStateTextureMinFilter } from "@/system/sliverofstraw/RenderState";
import { Dom3D } from "@/system/engine/nodes/node3ds/Dom3D";
import { PlainMaterialResource } from "@/system/engine/resources/material_resources/PlainMaterialResource";
import { NormalMaterialResource } from "@/system/engine/resources/material_resources/NormalMaterialResource";
import { UvMaterialResource } from "@/system/engine/resources/material_resources/UvMaterialResource";
import { BillboardGeometryResource } from "@/system/engine/resources/geometry_resources/BillboardGeometryResource";
import { BillboardMaterialResource } from "@/system/engine/resources/material_resources/BillboardMaterialResource";

// import png_url2 from 'res://matcap-2.jpg';
// import png_url3 from 'res://matcap-3.jpg';
// import png_url4 from 'res://matcap-4.jpg';
// import png_url5 from 'res://matcap-5.jpg';
// import png_url6 from 'res://matcap-6.jpg';
// import png_url7 from 'res://matcap-7.jpg';
// import png_url8 from 'res://matcap-8.jpg';
// import png_url9 from 'res://matcap-9.jpg';
// import png_url10 from 'res://matcap-10.png';
// import png_url11 from 'res://matcap-11.png';
// import png_url12 from 'res://matcap-12.png';
// import png_url13 from 'res://matcap-13.png';
// import png_url14 from 'res://matcap-14.png';
// import normal_texture_url from 'res://normal_texture.png';
// import normal_texture_url from 'res://normal_texture-0.png';
// const image_loader = new ImageLoader();
// image_loader.parse(normal_texture_url, 4, false).then(r => {
//     console.log(r.expect().save(undefined, `download://normal-1.lttmbin`));
// });
// let i = 2;
// for (const url of [png_url2, png_url3, png_url4, png_url5, png_url6, png_url7, png_url8, png_url9]) {
//     const image_loader = new ImageLoader();
//     image_loader.parse(url).then(r => {
//         console.log(r.expect().save(undefined, `download://matcap-${i++}.lttmbin`));
//     });
// }

const DConfig = new Cacher((canvas: HTMLCanvasElement) => {
    return {
        render_server: new RenderServerDevice(canvas),
        render_server_pixel_ratio: undefined,
        render_server_scale: 1,
        fps: Infinity,
        physics_fps: 40,
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

const bg_color = Color.create(0.25, 0.25, 0.25).linear_rgb;

export function createEditor() {
    const render_server_canvas = document.getElementById('render-server-canvas') as HTMLCanvasElement;
    const DefaultConfig = DConfig.get(render_server_canvas);
    const DefaultResourceCache = DInstanceCache.get(DefaultConfig);

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
    // EditorViewport.use_sky = true;
    EditorViewport.background_color = bg_color;
    EditorViewport.color_map = true;
    // EditorViewport.transparent = true;
    EditorViewportContainer.add_Child(EditorViewport);
    // camera
    const EditorCamera = new EditorOrbitCamera3D(DefaultConfig);
    EditorViewport.add_Child(EditorCamera);
    EditorCamera.set_Zoom(0.3);

    // viewport 0
    const EditorViewportContainer0 = new ViewportDomContainer(DefaultConfig);
    EditorViewportContainer0.dom = (document.querySelector('#viewport-1') ?? undefined) as HTMLElement;
    const EditorViewport0 = new Viewport(DefaultConfig);
    const renderer0 = new EditorRenderer3D(DefaultConfig);
    const pipeline0 = new EditorRenderer3DPipeline(DefaultConfig);
    renderer0.render_pipeline = pipeline0;
    EditorViewport0.renderer_3d = renderer0;
    // EditorViewport0.transparent = true;
    EditorViewport0.background_color = bg_color;
    EditorViewportContainer0.add_Child(EditorViewport0);
    const EditorCamera0 = new EditorOrbitCamera3D(DefaultConfig);
    EditorViewport0.add_Child(EditorCamera0);
    EditorViewport.add_Child(EditorViewportContainer0);
    // viewport 1
    const EditorViewportContainer1 = new ViewportDomContainer(DefaultConfig);
    EditorViewportContainer1.dom = (document.querySelector('#viewport-2') ?? undefined) as HTMLElement;
    const EditorViewport1 = new Viewport(DefaultConfig);
    const renderer1 = new EditorRenderer3D(DefaultConfig);
    const pipeline1 = new EditorRenderer3DPipeline(DefaultConfig);
    renderer1.render_pipeline = pipeline1;
    EditorViewport1.renderer_3d = renderer1;
    // EditorViewport1.transparent = true;
    EditorViewport1.background_color = bg_color;
    EditorViewport1.editor_highlight_color = Color.color8(0, 0, 255);
    EditorViewportContainer1.add_Child(EditorViewport1);
    const EditorCamera1 = new EditorOrbitCamera3D(DefaultConfig);
    EditorViewport1.add_Child(EditorCamera1);
    EditorViewport.add_Child(EditorViewportContainer1);

    // World 
    const World = new Node3D(DefaultConfig);
    World.local_scale = Vector3.create(0.01, 0.01, 0.01);
    const ambient_light = new AmbientLight3D(DefaultConfig);
    ambient_light.intensity = 0.075;
    World.add_Child(ambient_light);
    const directional_light0 = new DirectionalLight3D(DefaultConfig);
    directional_light0.color = Vector3.create(0.9, 0.9, 1);
    directional_light0.intensity = 0.3;
    directional_light0.local_rotation = Euler.new.set_Quaternion(Quaternion.new.set_Rotate(Vector3.create(0, 0, -1), Vector3.new.normalize(Vector3.create(-1, -1, 1))));
    directional_light0.layer = 0xffffffff;
    World.add_Child(directional_light0);
    const directional_light1 = new DirectionalLight3D(DefaultConfig);
    directional_light1.color = Vector3.create(1, 0.9, 0.8);
    directional_light1.intensity = 0.02;
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

    const material = new UvMaterialResource(DefaultConfig);

    const Mesh1 = new MeshInstance3D(DefaultConfig);
    Mesh1.geometry = multi_geometry;
    Mesh1.material = material;
    Mesh1.local_scale = Vector3.create(100, 100, 100);
    Mesh1.local_position = Vector3.create(0, 0, -400);
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
    const multi_line_material = new MultiLineSegmentMaterialResource(DefaultConfig);
    const points = new Array(120).fill(0).map((i, idx) => {
        return Vector3.create(Math.cos(idx / 35 * Tau), Math.sin(idx / 35 * Tau), idx / 8);
    });
    multi_line_geometry.set_PointsCount(points.length);
    points.forEach((p, i) => {
        multi_line_geometry.set_Point(i, p, false, false, false);
        multi_line_geometry.set_Color(i, Color.hsv(i / 119, 1, 1), false)
    });
    // multi_line_geometry.set_PointsCount(2);
    // multi_line_geometry.set_Point(0, Vector3.create(0, 0, 0), false, false, false);
    // multi_line_geometry.set_Point(1, Vector3.create(0, 0, -1), false, false, false);
    multi_line_geometry.commit_Points();
    multi_line_geometry.commit_Colors();
    multi_line_geometry.update_LengthPercentages();
    multi_line_geometry.update_BBox();
    // multi_line_material.line_width = 10;
    multi_line_material.dashed = true;
    multi_line_material.dash_gap = 0.5;
    multi_line_material.dash_scale = 2.0;
    multi_line_material.dash_offset = 0.0;
    multi_line_material.color = Color.color8(255, 255, 255).linear_rgb;
    const MeshLine = new MeshInstance3D(DefaultConfig);
    MeshLine.geometry = multi_line_geometry;
    MeshLine.material = multi_line_material;
    MeshLine.local_scale = Vector3.create(100, 100, 100);
    // MeshLine.local_rotation = Euler.create(-0.75, 0, 0);
    MeshLine.local_position = Vector3.create(800, 0, 0);
    // MeshLine.render_queue = 1;
    World.add_Child(MeshLine);

    const area = new PickingArea3D(DefaultConfig);
    const shape = new PickingPolyLineResource(DefaultConfig);
    shape.points = points;
    const s = new PickingShape3D(DefaultConfig);
    area.add_Child(s);
    s.shape = shape;
    MeshLine.add_Child(area);

    // EditorSceneTree.start_Tween(
    //     tween_loop(
    //         tween_sequence(
    //             tween_pingpong(
    //                 new PropertyTween(
    //                     MeshLine, "local_scale",
    //                     Vector3.create(200, 200, 200),
    //                     5,
    //                     TweenTransitionType.Linear,
    //                     TweenEasingType.In
    //                 )
    //             ),
    //             tween_wait(1)
    //         ),
    //         Infinity
    //     )
    // );

    area.signal_mouse_entered.connect((evt, result) => {
        multi_line_material.vertex_color = false;
        multi_line_material.color = Color.color8(255, 0, 0);
    });
    area.signal_mouse_exited.connect(() => {
        multi_line_material.vertex_color = true;
        multi_line_material.color = Color.color8(255, 255, 255);
    });
    area.signal_mouse_moved.connect((event, result) => {
        line_grabber.local_position = result.position;
        line_grabber.local_rotation = Euler.new.set_Quaternion(Quaternion.new.set_Rotate(Vector3.create(0, 1, 0), result.normal));
    });

    const bvh_viz = new Bvh3Visualization(DefaultConfig);
    bvh_viz.visualize_Bvh3(shape.bvh, 6);
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

    const infinite_line_x = new InfiniteLine3D(DefaultConfig);
    const multi_line_material_x = new MultiLineSegmentMaterialResource(DefaultConfig);
    multi_line_material_x.color = Color.color8code(0xd82d4e33).linear_rgb;
    // multi_line_material_x.line_width = 1;
    infinite_line_x.material = multi_line_material_x;
    infinite_line_x.render_queue = 1;
    World.add_Child(infinite_line_x);
    const infinite_line_y = new InfiniteLine3D(DefaultConfig);
    const multi_line_material_y = new MultiLineSegmentMaterialResource(DefaultConfig);
    // multi_line_material_y.line_width = 1;
    multi_line_material_y.color = Color.color8code(0x04b97344).linear_rgb;
    infinite_line_y.material = multi_line_material_y;
    infinite_line_y.render_queue = 1;
    infinite_line_y.ray = Ray3.create(Vector3.new, Vector3.create(0, 1, 0));
    World.add_Child(infinite_line_y);
    const infinite_line_z = new InfiniteLine3D(DefaultConfig);
    const multi_line_material_z = new MultiLineSegmentMaterialResource(DefaultConfig);
    // multi_line_material_z.line_width = 1;
    multi_line_material_z.color = Color.color8code(0x466fd644).linear_rgb;
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
    const ground_material = new MatcapMaterialResource(DefaultConfig);
    ground_material.texture = new ClassLoader(DefaultResourceCache).fetch<ImageTextureResource>('sys://textures/matcaps/matcap-13.lttmbin').expect();
    const normal_texture = new ClassLoader(DefaultResourceCache).fetch<ImageTextureResource>('sys://textures/normals/normal-1.lttmbin').expect();
    normal_texture.min_filter = RenderStateTextureMinFilter.LinearMipmapLinear;
    normal_texture.mag_filter = RenderStateTextureMagFilter.Linear;
    ground_material.normal_texture = normal_texture;
    // ground_material.color = Color.create(1.0, 1.0, 1.0, 0.98);
    ground.material = ground_material;
    // ground.top_level = true;
    ground.local_scale = Vector3.create(1000, 500, 1000);
    ground.local_position = Vector3.create(0, -400, 0);
    World.add_Child(ground);

    const grid_geo = new GridGeometryResource(DefaultConfig);
    grid_geo.build();
    const grid = new MeshInstance3D(DefaultConfig);
    grid.geometry = grid_geo;
    const grid_mat = new MatcapMaterialResource(DefaultConfig);
    grid_mat.color = Color.color8(0, 0, 0, 20);
    grid.material = grid_mat;
    grid.top_level = true;
    grid.cast_shadow = false;
    // World.add_Child(grid);

    EditorSceneTree.start_Loop();

    fetch(huli).then(r => r.text()).then(t => {
        const class_saver = new ObjLoader().parse(t).expect();
        class_saver.save(undefined, 'sys://huli.geometry.lttmbin');

        const huli_geo = new ClassLoader(DInstanceCache.get(DefaultConfig)).fetch<ArrayGeometryResource>('sys://huli.geometry.lttmbin').expect();
        const shape = new PickingBvh3Resource(DefaultConfig);
        shape.bvh.build(huli_geo.get_TriFaces()!, undefined, Bvh3Strategy.Center);
        // const normal_material = new MatcapMaterialResource(DefaultConfig);

        for (let i = 0; i <= 14; i++) {
            const override_material = new MatcapMaterialResource(DefaultConfig); // new MaterialOverrideResource(DefaultConfig);
            // override_material.set_OverrideMaterial(normal_material);
            // override_material.set_UniformOverride('u_texture', new ClassLoader(DefaultResourceCache).fetch<ImageTextureResource>(`sys://textures/matcaps/matcap-${i}.lttmbin`).expect())
            override_material.texture = new ClassLoader(DefaultResourceCache).fetch<ImageTextureResource>(`sys://textures/matcaps/matcap-${i}.lttmbin`).expect();
            const mesh = new MeshInstance3D(DefaultConfig);
            mesh.geometry = huli_geo;
            mesh.material = override_material;
            mesh.local_scale = Vector3.create(100, 100, 100);
            mesh.local_position = Vector3.create(-500 - (i % 5) * 300, -100 + Math.floor(i / 5) * 300, 250);
            World.add_Child(mesh);

            const area = new PickingArea3D(DefaultConfig);
            const s = new PickingShape3D(DefaultConfig);
            area.add_Child(s);
            s.shape = shape;
            mesh.add_Child(area);
            area.signal_mouse_moved.connect((event, result) => {
                line_grabber.local_position = result.position;
                line_grabber.local_rotation = Euler.new.set_Quaternion(Quaternion.new.set_Rotate(Vector3.create(0, 1, 0), result.normal));
            });

            mesh.editor_highlighted = i % 2 === 0;
        }
        // const tween = EditorSceneTree.start_Tween(new TweenLoop(
        //     new TweenPingPong(
        //         new PropertyTween(
        //             mesh, 'local_position', Vector3.create(-500, -300, 250), 2, TweenTransitionType.Quad, TweenEasingType.InOut,
        //         )
        //     ),
        //     Infinity
        // ));
        // EditorViewport.signal_input.connect((evt, pro) => {
        //     if (pro && evt instanceof KeyInputEvent && evt.key === ' ' && evt.pressed && !evt.echo) {
        //         EditorSceneTree.stop_Tween(
        //             tween!
        //         );
        //     }
        // });

        // const area = new PickingArea3D(DefaultConfig);
        // const shape = new PickingBvh3Resource(DefaultConfig);
        // shape.bvh.build(huli_geo.get_TriFaces()!, undefined, Bvh3Strategy.Center);
        // const s = new PickingShape3D(DefaultConfig);
        // area.add_Child(s);
        // s.shape = shape;
        // mesh.add_Child(area);
        // area.signal_mouse_moved.connect((event, result) => {
        //     line_grabber.local_position = result.position;
        //     line_grabber.local_rotation = Euler.new.set_Quaternion(Quaternion.new.set_Rotate(Vector3.create(0, 1, 0), result.normal));
        // });

        // const bvh_viz = new Bvh3Visualization(DefaultConfig);
        // bvh_viz.visualize_Bvh3(shape.bvh, 6);
        // let depth = 0;
        // bvh_viz.signal_input.connect((evt, prop) => {
        //     if (!prop) {
        //         if (evt instanceof KeyInputEvent && evt.pressed && evt.key === 'a' && !evt.echo) {
        //             depth = (depth + 1) % 10;
        //             bvh_viz.visualize_Bvh3(shape.bvh, depth);
        //         }
        //     }
        // });
        // mesh.add_Child(bvh_viz);
    });

    const box_geo = new BoxGeometryResource(DefaultConfig);
    const box_mesh = new MeshInstance3D(DefaultConfig);
    box_mesh.geometry = box_geo;
    box_mesh.material = new NormalMaterialResource(DefaultConfig);
    (box_mesh.material as NormalMaterialResource).normal_texture = new ClassLoader(DefaultResourceCache).fetch<ImageTextureResource>('sys://textures/normals/normal-1.lttmbin').expect();
    box_mesh.local_position = Vector3.create(400, 100, -100);
    box_mesh.local_rotation = Euler.create(0.32, 0.123, 1.23);
    box_mesh.local_scale = Vector3.create(300, 100, 100);
    box_mesh.editor_highlighted = true;

    World.add_Child(box_mesh);
    box_geo.build();
    const box_area = new PickingArea3D(DefaultConfig);
    const box_shape = new PickingShape3D(DefaultConfig);
    box_area.add_Child(box_shape);
    box_shape.shape = new PickingBoxResource(DefaultConfig);
    box_mesh.add_Child(box_area);
    const line_grabber = new LineGrabber3D(DefaultConfig);
    line_grabber.offset_length = 0;
    line_grabber.color = Color.color8code(0xff9900ff).linear_rgb;
    line_grabber.enabled = false;
    World.add_Child(line_grabber);
    line_grabber.local_position = Vector3.create(0, 0, -1);
    box_area.signal_mouse_moved.connect((event, result) => {
        line_grabber.local_position = result.position;
        line_grabber.local_rotation = Euler.new.set_Quaternion(Quaternion.new.set_Rotate(Vector3.create(0, 1, 0), result.normal));
    });

    const point_geo = new SphereGeometryResource(DefaultConfig);
    point_geo.build();
    const point_mat = new MatcapMaterialResource(DefaultConfig);
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

    // const box_geometry = new BoxGeometryResource(DefaultConfig);
    // box_geometry.width = 0.05;
    // box_geometry.build();
    // const transparent_material = new PlainColorMaterialResource(DefaultConfig);

    // for (let i = 0; i < 1000; i++) {
    // const point_light = new PointLight3D(DefaultConfig);
    // point_light.color = Vector3.create(Math.random(), Math.random(), Math.random());
    // point_light.local_position = Vector3.create(Math.random() * 600 - 400, Math.random() * 600 - 300, Math.random() * 400 - 400);
    // World.add_Child(point_light);
    // const mesh = new MeshInstance3D(DefaultConfig);
    // const mat = new MaterialOverrideResource(DefaultConfig);
    // mat.set_OverrideMaterial(transparent_material);
    // mat.set_UniformOverride('u_color', Color.create(Math.random(), Math.random(), Math.random(), 0.5));
    // mat.material.transparent = true;
    // mesh.geometry = box_geometry;
    // mesh.material = mat;
    // mesh.local_position = Vector3.create(i / 10, Math.random() * 10 - 5, Math.random() * 10 - 5);
    // mesh.top_level = true;
    // World.add_Child(mesh);

    // }

    const plane = new SphereGeometryResource(DefaultConfig);
    // plane.width = plane.height = 1;
    plane.build();
    const plain = new PlainMaterialResource(DefaultConfig);
    const __plain = new MaterialOverrideResource(DefaultConfig);
    __plain.set_OverrideMaterial(plain);
    const __plain2 = new MaterialOverrideResource(DefaultConfig);
    __plain2.set_OverrideMaterial(plain);

    plain.texture = new PlaceholderTextureResource(DefaultConfig);
    const tex1 = new ClassLoader(DefaultResourceCache).fetch<ImageTextureResource>('sys://f-texture.lttmbin').expect();
    tex1.min_filter = RenderStateTextureMinFilter.Linear;
    tex1.mag_filter = RenderStateTextureMagFilter.Linear;
    __plain.set_UniformOverride('u_texture', tex1);
    const tex2 = new ClassLoader(DefaultResourceCache).fetch<ImageTextureResource>('sys://test-texture.lttmbin').expect();
    tex2.min_filter = RenderStateTextureMinFilter.Linear;
    tex2.mag_filter = RenderStateTextureMagFilter.Linear;
    __plain2.set_UniformOverride('u_texture', tex2);

    console.log(__plain2)

    const plane_mesh = new MeshInstance3D(DefaultConfig);
    plane_mesh.geometry = plane;
    plane_mesh.material = plain;
    plane_mesh.top_level = true;
    plane_mesh.local_position = Vector3.create(-3, 0, 1);
    plane_mesh.render_queue = 0;
    World.add_Child(plane_mesh);

    const plane_mesh2 = new MeshInstance3D(DefaultConfig);
    plane_mesh2.geometry = plane;
    plane_mesh2.material = __plain;
    plane_mesh2.top_level = true;
    plane_mesh2.local_position = Vector3.create(-3, 0, 2.2);
    plane_mesh2.render_queue = 0;
    World.add_Child(plane_mesh2);

    const plane_mesh3 = new MeshInstance3D(DefaultConfig);
    plane_mesh3.geometry = plane;
    plane_mesh3.material = __plain2;
    plane_mesh3.top_level = true;
    plane_mesh3.local_position = Vector3.create(-3, 0, 3.4);
    plane_mesh3.render_queue = 0;
    World.add_Child(plane_mesh3);

    // new Promise<HTMLImageElement>((r, e) => {
    //     const image = new Image();
    //     image.src = png_url;
    //     image.onload = () => r(image);
    //     image.onerror = e;
    // }).then(img => {
    //     const image_texture = new ImageTextureResource(DefaultConfig);
    //     image_texture.set_Image(img);
    //     plain.texture = image_texture;
    // }).catch(err => {
    //     console.error(err);
    // });

    {
        const line_geo = new MultiSegmentGeometryResource(DefaultConfig);
        line_geo.set_PointsCount(24);
        line_geo.set_Point(0, Vector3.create(-0.5, 0.5, -0.5), false, false);
        line_geo.set_Point(1, Vector3.create(+0.5, 0.5, -0.5), false, false);
        line_geo.set_Point(2, Vector3.create(+0.5, 0.5, -0.5), false, false);
        line_geo.set_Point(3, Vector3.create(+0.5, -0.5, -0.5), false, false);
        line_geo.set_Point(4, Vector3.create(+0.5, -0.5, -0.5), false, false);
        line_geo.set_Point(5, Vector3.create(-0.5, -0.5, -0.5), false, false);
        line_geo.set_Point(6, Vector3.create(-0.5, -0.5, -0.5), false, false);
        line_geo.set_Point(7, Vector3.create(-0.5, 0.5, -0.5), false, false);

        line_geo.set_Point(8 + 0, Vector3.create(-0.5, 0.5, 0.5), false, false);
        line_geo.set_Point(8 + 1, Vector3.create(+0.5, 0.5, 0.5), false, false);
        line_geo.set_Point(8 + 2, Vector3.create(+0.5, 0.5, 0.5), false, false);
        line_geo.set_Point(8 + 3, Vector3.create(+0.5, -0.5, 0.5), false, false);
        line_geo.set_Point(8 + 4, Vector3.create(+0.5, -0.5, 0.5), false, false);
        line_geo.set_Point(8 + 5, Vector3.create(-0.5, -0.5, 0.5), false, false);
        line_geo.set_Point(8 + 6, Vector3.create(-0.5, -0.5, 0.5), false, false);
        line_geo.set_Point(8 + 7, Vector3.create(-0.5, 0.5, 0.5), false, false);

        line_geo.set_Point(16 + 0, Vector3.create(-0.5, 0.5, 0.5), false, false);
        line_geo.set_Point(16 + 1, Vector3.create(-0.5, 0.5, -0.5), false, false);
        line_geo.set_Point(16 + 2, Vector3.create(+0.5, 0.5, 0.5), false, false);
        line_geo.set_Point(16 + 3, Vector3.create(+0.5, 0.5, -0.5), false, false);
        line_geo.set_Point(16 + 4, Vector3.create(+0.5, -0.5, 0.5), false, false);
        line_geo.set_Point(16 + 5, Vector3.create(+0.5, -0.5, -0.5), false, false);
        line_geo.set_Point(16 + 6, Vector3.create(-0.5, -0.5, 0.5), false, false);
        line_geo.set_Point(16 + 7, Vector3.create(-0.5, -0.5, -0.5), false, false);

        line_geo.commit_Points();
        line_geo.update_BBox();
        const line_mat = new MultiLineSegmentMaterialResource(DefaultConfig);
        line_mat.color = Color.create(0, 0, 0);
        // line_mat.line_width = 3;
        const line_mesh = new MeshInstance3D(DefaultConfig);
        // line_mesh.render_queue = 1;
        line_mesh.geometry = line_geo;
        line_mesh.material = line_mat;

        const box_geo = new BoxGeometryResource(DefaultConfig);
        box_geo.build();
        const box_mat = new MatcapMaterialResource(DefaultConfig);
        box_mat.texture = new ClassLoader(DefaultResourceCache).fetch<ImageTextureResource>('sys://textures/matcaps/matcap-13.lttmbin').expect();
        const box_mesh = new MeshInstance3D(DefaultConfig);
        box_mesh.geometry = box_geo;
        box_mesh.material = box_mat;
        box_mat.polygon_offset = true;

        box_mesh.add_Child(line_mesh);
        box_mesh.top_level = true;
        box_mesh.local_position = Vector3.create(0, 7, -2);
        World.add_Child(box_mesh);
    }
    {
        const line_geo = new MultiSegmentGeometryResource(DefaultConfig);
        line_geo.set_PointsCount(24);
        line_geo.set_Point(0, Vector3.create(-0.5, 0.5, -0.5), false, false);
        line_geo.set_Point(1, Vector3.create(+0.5, 0.5, -0.5), false, false);
        line_geo.set_Point(2, Vector3.create(+0.5, 0.5, -0.5), false, false);
        line_geo.set_Point(3, Vector3.create(+0.5, -0.5, -0.5), false, false);
        line_geo.set_Point(4, Vector3.create(+0.5, -0.5, -0.5), false, false);
        line_geo.set_Point(5, Vector3.create(-0.5, -0.5, -0.5), false, false);
        line_geo.set_Point(6, Vector3.create(-0.5, -0.5, -0.5), false, false);
        line_geo.set_Point(7, Vector3.create(-0.5, 0.5, -0.5), false, false);

        line_geo.set_Point(8 + 0, Vector3.create(-0.5, 0.5, 0.5), false, false);
        line_geo.set_Point(8 + 1, Vector3.create(+0.5, 0.5, 0.5), false, false);
        line_geo.set_Point(8 + 2, Vector3.create(+0.5, 0.5, 0.5), false, false);
        line_geo.set_Point(8 + 3, Vector3.create(+0.5, -0.5, 0.5), false, false);
        line_geo.set_Point(8 + 4, Vector3.create(+0.5, -0.5, 0.5), false, false);
        line_geo.set_Point(8 + 5, Vector3.create(-0.5, -0.5, 0.5), false, false);
        line_geo.set_Point(8 + 6, Vector3.create(-0.5, -0.5, 0.5), false, false);
        line_geo.set_Point(8 + 7, Vector3.create(-0.5, 0.5, 0.5), false, false);

        line_geo.set_Point(16 + 0, Vector3.create(-0.5, 0.5, 0.5), false, false);
        line_geo.set_Point(16 + 1, Vector3.create(-0.5, 0.5, -0.5), false, false);
        line_geo.set_Point(16 + 2, Vector3.create(+0.5, 0.5, 0.5), false, false);
        line_geo.set_Point(16 + 3, Vector3.create(+0.5, 0.5, -0.5), false, false);
        line_geo.set_Point(16 + 4, Vector3.create(+0.5, -0.5, 0.5), false, false);
        line_geo.set_Point(16 + 5, Vector3.create(+0.5, -0.5, -0.5), false, false);
        line_geo.set_Point(16 + 6, Vector3.create(-0.5, -0.5, 0.5), false, false);
        line_geo.set_Point(16 + 7, Vector3.create(-0.5, -0.5, -0.5), false, false);

        line_geo.commit_Points();
        line_geo.update_BBox();
        const line_mat = new MultiLineSegmentMaterialResource(DefaultConfig);
        line_mat.color = Color.create(0.0, 0.0, 0.0);
        // line_mat.line_width = 3;
        const line_mesh = new MeshInstance3D(DefaultConfig);
        // line_mesh.render_queue = 1;
        line_mesh.geometry = line_geo;
        line_mesh.material = line_mat;

        const box_geo = new BoxGeometryResource(DefaultConfig);
        box_geo.build();
        const box_mat = new MatcapMaterialResource(DefaultConfig);
        box_mat.texture = new ClassLoader(DefaultResourceCache).fetch<ImageTextureResource>('sys://textures/matcaps/matcap-13.lttmbin').expect();
        const box_mesh = new MeshInstance3D(DefaultConfig);
        box_mesh.geometry = box_geo;
        box_mesh.material = box_mat;
        box_mat.polygon_offset = true;

        box_mesh.add_Child(line_mesh);
        box_mesh.top_level = true;
        box_mesh.local_scale = Vector3.create(0.5, 0.5, 0.5);
        box_mesh.local_position = Vector3.create(0.75, 7, -2);
        World.add_Child(box_mesh);
    }
    {
        const line_geo = new MultiLineGeometryResource(DefaultConfig);
        line_geo.set_PointsCount(33);
        for (let i = 0; i <= 32; i++) {
            const rad = i / 32 * Tau;
            line_geo.set_Point(i, Vector3.create(Math.cos(rad) / 2, 0, Math.sin(rad) / 2), false, false);
        }

        line_geo.commit_Points();
        line_geo.update_BBox();
        const line_mat = new MultiLineSegmentMaterialResource(DefaultConfig);
        line_mat.color = Color.create(0.8, 0.6, 0.0);
        // line_mat.line_width = 3;
        const line_mesh = new MeshInstance3D(DefaultConfig);
        // line_mesh.render_queue = 1;
        line_mesh.geometry = line_geo;
        line_mesh.material = line_mat;
        line_mesh.local_rotation = Euler.create(0.12, 0, 0.23);

        const box_geo = new SphereGeometryResource(DefaultConfig);
        box_geo.build();
        const box_mat = new MatcapMaterialResource(DefaultConfig);
        box_mat.texture = new ClassLoader(DefaultResourceCache).fetch<ImageTextureResource>('sys://textures/matcaps/matcap-11.lttmbin').expect();
        const box_mesh = new MeshInstance3D(DefaultConfig);
        box_mesh.geometry = box_geo;
        box_mesh.material = box_mat;
        box_mat.polygon_offset = true;

        box_mesh.add_Child(line_mesh);
        box_mesh.top_level = true;
        box_mesh.local_position = Vector3.create(2, 7, -2);
        World.add_Child(box_mesh);
    }

    const dom = new Dom3D(DefaultConfig);
    dom.dom = document.createElement('div');
    dom.dom.innerText = "Hello World !";
    dom.dom.dataset['size'] = 'small';
    dom.dom.classList.add('__sun-design__', 'bordered', 'sized');
    dom.dom.style.backgroundColor = 'var(--panel-color)';
    dom.dom.style.width = 'fit-content';
    dom.dom.style.padding = '3px 8px';
    dom.dom.style.borderRadius = '99999px';
    // dom.dom.style.fontWeight = 'bold';
    dom.top_level = true;
    dom.local_position = Vector3.create(0, 5, -3);
    World.add_Child(dom);

    // {
    //     const half_w = 1 / 2;
    //     const half_h = 1 / 2;
    //     const half_d = 1 / 2;
    //     const position_buffer = new RenderDeviceVector3AttributeBuffer(DefaultConfig.render_server, RenderStateBufferUsage.StaticDraw,
    //         new Float32Array([
    //             // top
    //             half_w, half_h, half_d,
    //             half_w, half_h, -half_d,
    //             -half_w, half_h, half_d,
    //             -half_w, half_h, -half_d,
    //             // bottom
    //             half_w, -half_h, half_d,
    //             half_w, -half_h, -half_d,
    //             -half_w, -half_h, half_d,
    //             -half_w, -half_h, -half_d,
    //             // front
    //             half_w, -half_h, half_d,
    //             half_w, half_h, half_d,
    //             -half_w, -half_h, half_d,
    //             -half_w, half_h, half_d,
    //             // back
    //             half_w, -half_h, -half_d,
    //             half_w, half_h, -half_d,
    //             -half_w, -half_h, -half_d,
    //             -half_w, half_h, -half_d,
    //             // right
    //             half_w, -half_h, -half_d,
    //             half_w, half_h, -half_d,
    //             half_w, -half_h, half_d,
    //             half_w, half_h, half_d,
    //             // left
    //             -half_w, -half_h, -half_d,
    //             -half_w, half_h, -half_d,
    //             -half_w, -half_h, half_d,
    //             -half_w, half_h, half_d,
    //         ]));
    //     const normal_buffer = new RenderDeviceVector3AttributeBuffer(DefaultConfig.render_server, RenderStateBufferUsage.StaticDraw,
    //         new Float32Array([
    //             // top
    //             0, 1, 0,
    //             0, 1, 0,
    //             0, 1, 0,
    //             0, 1, 0,
    //             // bottom
    //             0, -1, 0,
    //             0, -1, 0,
    //             0, -1, 0,
    //             0, -1, 0,
    //             // front
    //             0, 0, 1,
    //             0, 0, 1,
    //             0, 0, 1,
    //             0, 0, 1,
    //             // back
    //             0, 0, -1,
    //             0, 0, -1,
    //             0, 0, -1,
    //             0, 0, -1,
    //             // right
    //             1, 0, 0,
    //             1, 0, 0,
    //             1, 0, 0,
    //             1, 0, 0,
    //             // left
    //             -1, 0, 0,
    //             -1, 0, 0,
    //             -1, 0, 0,
    //             -1, 0, 0,
    //         ]));
    //     const uv_buffer = new RenderDeviceVector2AttributeBuffer(DefaultConfig.render_server, RenderStateBufferUsage.StaticDraw,
    //         new Float32Array([
    //             // top
    //             1, 0,
    //             1, 1,
    //             0, 0,
    //             0, 1,
    //             // bottom
    //             1, 1,
    //             1, 0,
    //             0, 1,
    //             0, 0,
    //             // front
    //             1, 0,
    //             1, 1,
    //             0, 0,
    //             0, 1,
    //             // back
    //             1, 1,
    //             1, 0,
    //             0, 1,
    //             0, 0,
    //             // right
    //             1, 0,
    //             1, 1,
    //             0, 0,
    //             0, 1,
    //             // left
    //             0, 0,
    //             0, 1,
    //             1, 0,
    //             1, 1,
    //         ]));
    //     const index_buffer = new RenderDeviceIndexAttributeBuffer(DefaultConfig.render_server, RenderStateBufferUsage.StaticDraw,
    //         new Uint32Array([
    //             // top
    //             0, 1, 2, 2, 1, 3,
    //             // bottom
    //             4, 6, 5, 5, 6, 7,
    //             // front
    //             8, 9, 10, 10, 9, 11,
    //             // back
    //             12, 14, 13, 13, 14, 15,
    //             // right
    //             16, 17, 18, 18, 17, 19,
    //             // left
    //             20, 22, 21, 21, 22, 23,
    //         ]));
    //     const instance_transfrom_buffer = new RenderDeviceMatrix4AttributeBuffer(DefaultConfig.render_server, RenderStateBufferUsage.StaticDraw, [
    //         Matrix4.new.set_BasisPosition(Matrix3.new.set_RotateY(0.3), Vector3.create(2, 1, 1))
    //     ], 1);

    //     const geo = new ArrayGeometryResource(DefaultConfig);
    //     geo.geometry.set_EmptyGeometry(RenderStatePrimitiveType.Triangles);
    //     geo.geometry.set_Attribute('position', position_buffer);
    //     geo.geometry.set_Attribute('normal', normal_buffer);
    //     geo.geometry.set_Attribute('uv', uv_buffer);
    //     geo.geometry.set_Attribute('instance_transform', instance_transfrom_buffer);
    //     geo.geometry.set_Index(index_buffer);
    //     geo.geometry.set_VertexCount(36);
    //     geo.geometry.set_BBox(Box3.create(Vector3.create(-half_w, -half_h, -half_d), Vector3.create(half_w, half_h, half_d)));

    //     const mesh = new MeshInstance3D(DefaultConfig);
    //     mesh.geometry = geo;
    //     mesh.material = __plain2;
    //     mesh.top_level = true;
    //     mesh.render_queue = 0;
    //     World.add_Child(mesh);
    // }

    {
        const mesh = new MeshInstance3D(DefaultConfig);
        mesh.geometry = new BillboardGeometryResource(DefaultConfig);
        mesh.material = new BillboardMaterialResource(DefaultConfig);
        mesh.local_position = Vector3.create(400, 450, -200);
        World.add_Child(mesh);
    }

    return EditorSceneTree;
}