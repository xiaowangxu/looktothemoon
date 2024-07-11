import { Viewport } from "@/system/engine/nodes/Node";
import { SceneTree } from "@/system/engine/SceneTree";
import { Node3D } from "@/system/engine/nodes/node3ds/Node3D";
import { ViewportDomContainer } from "@/system/engine/nodes/ViewportDomContainer";
import { KeyInputEvent } from "@/system/engine/inputs/events/KeyInputEvent";
import { MouseButton, MouseButtonInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseButtonInputEvent";
import { ShortCut } from "@/system/engine/inputs/ShortCut";
import { Color } from "@/system/fivepebble/graphics/Color";
import { GrabbingSingleton } from "@/system/engine/singletions/GrabbingSingleton";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { World3D } from "@/system/engine/worlds/world3ds/World3D";
import { OrbitCamera3D } from "@/system/engine/nodes/node3ds/camera3ds/OrbitCamera3D";
import { BoxGeometry3DResource } from "@/system/engine/resources/geometry_resources/geometry3d_resources/BoxGeometry3DResource";
import { MeshInstance3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/geometry3ds/MeshInstance3D";
import { RenderServerRenderer3D } from "@/system/engine/render_server/renderer3d/RenderServerRenderer3D";
import { TestMaterial3DResource } from "@/system/engine/resources/material_resources/material3d_resources/TestMaterial3DResource";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { ImageTexture2DResource } from "@/system/engine/resources/texture_resources/texture2d_resources/ImageTexture2DResource";
import { Euler } from "@/system/fivepebble/linear_algebra/Euler";
import { MatcapMaterialResource } from "@/system/engine/resources/material_resources/material3d_resources/MatcapMaterial3DResource";
import { TorusGeometry3DResource } from "@/system/engine/resources/geometry_resources/geometry3d_resources/TorusGeometry3DResource";
import { WebGPURenderElementTextureSamplerCacheHash } from "@/system/sliverofstraw/render_element_object/texture_sampler/WebGPURenderElementTextureSamplerCache";
import { PolyLineGeometry3DResource } from "@/system/engine/resources/geometry_resources/geometry3d_resources/polyline_geometry3d_resources/PolyLineGeometry3DResource";
import { PureColorMaterial3DResource } from "@/system/engine/resources/material_resources/material3d_resources/PureColorMaterial3DResource";
import { PolyLineMaterial3DResource } from "@/system/engine/resources/material_resources/material3d_resources/polyline_material3d_resources/PolyLineMaterial3DResource";
import { PhongMaterialResource } from "@/system/engine/resources/material_resources/material3d_resources/PhongMaterial3DResource";
import { Pi, Tau } from "@/system/fivepebble/Scalar";
import { PointLight3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/light3ds/PointLight3D";
import { InterpolateTween, InterpolateTweenEasingType, InterpolateTweenTransitionType, MethodTweenAdaptor, PingPongTweenAdaptor, PropertyTweenAdaptor, TweenLoop } from "@/system/engine/Tween";
import { SpotLight3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/light3ds/SpotLight3D";
import { PbrMaterial3DResource } from "@/system/engine/resources/material_resources/material3d_resources/PbrMaterial3DResource";
import { SphereGeometry3DResource } from "@/system/engine/resources/geometry_resources/geometry3d_resources/SphereGeometry3DResource";
import { ImageTextureCubeMapResource } from "@/system/engine/resources/texture_resources/texture2d_resources/ImageTextureCubeMapResource";
import { CylinderGeometry3DResource } from "@/system/engine/resources/geometry_resources/geometry3d_resources/CylinderGeometry3DResource";

import f_image_url from 'res://test-image.png';
import matcap_6_image_url from 'res://matcap-11.png';
import matcap_7_image_url from 'res://f-texture.png';
import normal_image_url from 'res://normal_texture-0.png';
import studio from 'res://grass_road.png';
import cubemap_x from 'res://cubemap/x.png';
import cubemap_x_ from 'res://cubemap/x_.png';
import cubemap_y from 'res://cubemap/y.png';
import cubemap_y_ from 'res://cubemap/y_.png';
import cubemap_z from 'res://cubemap/z.png';
import cubemap_z_ from 'res://cubemap/z_.png';
import huli from 'res://huli.obj?url';
import cubemap from 'res://cubemap.jpg';
import { ClassLoader, ClassSaver } from "@/system/engine/classes/saver_loader/ClassSaverLoader";
import { ObjLoader } from "@/system/engine/loaders/ObjLoader";
import { ResourceInstanceCache } from "@/system/engine/resources/Resource";
import type { ArrayGeometry3DResource } from "@/system/engine/resources/geometry_resources/geometry3d_resources/ArrayGeometry3DResource";

const viewport_scale = 1;
const bg_color = Color.create(0.25, 0.25, 0.25).linear_rgb;

import matcap_0 from 'res://matcap-0.png';
import matcap_1 from 'res://matcap-1.jpg';
import matcap_2 from 'res://matcap-2.jpg';
import matcap_3 from 'res://matcap-3.jpg';
import matcap_4 from 'res://matcap-4.jpg';
import matcap_5 from 'res://matcap-5.jpg';
import matcap_6 from 'res://matcap-6.jpg';
import matcap_7 from 'res://matcap-7.jpg';
import matcap_8 from 'res://matcap-8.jpg';
import matcap_9 from 'res://matcap-9.jpg';
import matcap_10 from 'res://matcap-10.png';
import matcap_11 from 'res://matcap-11.png';
import matcap_12 from 'res://matcap-12.png';
import matcap_13 from 'res://matcap-13.png';
import matcap_14 from 'res://matcap-14.png';
import monkey from 'res://monkey.stl?url';
import box from 'res://pole.glb?url';

import { ImageLoader } from "@/system/engine/loaders/ImageLoader";
import { PackedSceneResource } from "@/system/engine/resources/packed_scene/PackedScene";
import { LineGrabber3D } from "@/system/engine/nodes/node3ds/gizmo3ds/grabber3ds/LineGrabber3D";
import { TranslateGrabber3D } from "@/system/engine/nodes/node3ds/gizmo3ds/grabber3ds/TranslateGrabber3D";
import { OrthographicCamera3D } from "@/system/engine/nodes/node3ds/camera3ds/OrthographicCamera3D";
import { InfiniteLine3D } from "@/system/engine/nodes/node3ds/gizmo3ds/InfiniteLine3D";
import { Ray3 } from "@/system/fivepebble/geometries/Ray3";
import { InfiniteGrid3D } from "@/system/engine/nodes/node3ds/gizmo3ds/InfiniteGrid3D";
import { StlLoader } from "@/system/engine/loaders/StlLoader";
import { AmbientLight3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/light3ds/AmbientLight3D";
import { DirectionalLight3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/light3ds/DirectionalLight3D";
import { NormalMaterial3DResource } from "@/system/engine/resources/material_resources/material3d_resources/NormalMaterial3DResource";
import { Plane3 } from "@/system/fivepebble/geometries/Plane3";
import { SignalEmitter } from "@/system/utils/SignalEmitter";
import type { ColorData } from "@/sundesign/colorpicker/SunColorPickerConstants";
import { PlaneGeometry3DResource, PlaneGeometryDirection } from "@/system/engine/resources/geometry_resources/geometry3d_resources/PlaneGeometry3DResource";
import { GltfLoader } from "@/system/engine/loaders/GltfLoader";
import { MultiGeometry3DResource } from "@/system/engine/resources/geometry_resources/geometry3d_resources/MultiGeometry3DResource";
import { GeometryPickingShape3DResource } from "@/system/engine/resources/picking_shape_resources/picking_shape3d_resources/GeometryPickingShape3DResource";
import { PickingShape3D } from "@/system/engine/nodes/node3ds/physics3ds/PickingShape3D";
import { PickingArea3D } from "@/system/engine/nodes/node3ds/physics3ds/PickingArea3D";
import { Quaternion } from "@/system/fivepebble/linear_algebra/Quaternion";
import { SpherePickingShape3DResource } from "@/system/engine/resources/picking_shape_resources/picking_shape3d_resources/SpherePickingShape3DResource";

(window as any).set_Color = new SignalEmitter<(color: ColorData) => void>();

const red = 0xDA2530FF;
const green = 0x1BAF4AFF;
const blue = 0x0A4DFFFF;
const grey = 0x606060ff;

export async function createEditor() {

	// {
	// 	let i = 0;
	// 	for (const url of [matcap_0, matcap_1, matcap_2, matcap_3, matcap_4, matcap_5, matcap_6, matcap_7, matcap_8, matcap_9, matcap_10, matcap_11, matcap_12, matcap_13, matcap_14]) {
	// 		const class_saver = (await new ImageLoader().parse(url, true)).expect();
	// 		class_saver.save(undefined, `download://matcap-${i++}.texture.lttmbin`);
	// 	}
	// }

	const ResInstCache = new ResourceInstanceCache();

	// viewport
	const EditorViewport = new Viewport();
	// EditorViewport.update_mode = ViewportUpdateMode.Once;
	EditorViewport.scale = viewport_scale;
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
	// const EditorViewportContainer0 = new ViewportDomContainer();
	// EditorViewportContainer0.dom = (document.querySelector('#viewport-1') ?? undefined) as HTMLElement;
	// const EditorViewport0 = new Viewport();
	// EditorViewport0.scale = viewport_scale;
	// EditorViewport0.renderer_3d = new RenderServerRenderer3D();
	// EditorViewportContainer0.add_Child(EditorViewport0);
	// const EditorCamera0 = new OrbitCamera3D();
	// EditorViewport0.add_Child(EditorCamera0);
	// EditorViewport.add_Child(EditorViewportContainer0);
	// EditorCamera0.set_Zoom(0.3);
	// // viewport 1
	// const EditorViewportContainer1 = new ViewportDomContainer();
	// EditorViewportContainer1.dom = (document.querySelector('#viewport-2') ?? undefined) as HTMLElement;
	// const EditorViewport1 = new Viewport();
	// EditorViewport1.scale = viewport_scale;
	// EditorViewport1.renderer_3d = new RenderServerRenderer3D();
	// EditorViewportContainer1.add_Child(EditorViewport1);
	// const EditorCamera1 = new OrbitCamera3D();
	// EditorViewport1.add_Child(EditorCamera1);
	// EditorViewport.add_Child(EditorViewportContainer1);
	// EditorCamera1.set_Zoom(0.3);

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
	EditorSceneTree.get_InputActionMap().add_Action('test_A', new ShortCut().set([new KeyInputEvent().set_Key('a', 'KeyA', true, true)]));
	EditorSceneTree.get_InputActionMap().add_Action('test_B', new ShortCut().set([new KeyInputEvent().set_Key('a', 'KeyA', true, false)]));

	const box_geo = new BoxGeometry3DResource();
	const tor_geo = new TorusGeometry3DResource();
	const sph_geo = new SphereGeometry3DResource();

	World.signal_input.connect((evt, prop) => {
		if (!prop && evt instanceof KeyInputEvent && evt.key === ' ' && evt.pressed) {
			// EditorSceneTree.start_Tween(new MethodTweenAdaptor(
			// 	new InterpolateTween(2, InterpolateTweenTransitionType.Cubic, InterpolateTweenEasingType.InOut),
			// 	(v) => {
			// 		sph_geo.option = {
			// 			radius: v * 0.5 + 0.1,
			// 			phi_segments: Math.round(v * 100)
			// 		};
			// 	}
			// ))
			// const EditorCamera = new OrbitCamera3D();
			// EditorViewport.add_Child(EditorCamera);
			// const func: SignalEmitterListener<typeof World.signal_input> = (evt, prop) => {
			// 	if (!prop && evt instanceof KeyInputEvent && evt.key === 'a' && evt.pressed) {
			// 		EditorCamera.queue_Free();
			// 		World.signal_input.disconnect(func);
			// 	}
			// }
			// World.signal_input.connect(func);
			// World.get_SceneTree()?.get_ActiveViewports()[0]?.emulate_InputEvent(new MouseButtonInputEvent().set_Button(MouseButton.WheelUp, true, false, false).set_Compose(true));
		}
	});

	const box_mat_test = new MatcapMaterialResource();
	box_mat_test.matcap_texture = new ClassLoader(ResInstCache).fetch<ImageTexture2DResource>('sys://textures/matcaps/matcap-2.texture.lttmbin').expect();
	// box_mat_test.color = Vector4.create(0.55, 0.5, 0.7, 1.0);

	const box_mat_test_2 = new PbrMaterial3DResource();
	box_mat_test_2.roughness = 0.4;
	box_mat_test_2.metallic = 1;
	box_mat_test_2.color = Vector4.create(0.2, 0.2, 0.2, 1.0);
	box_mat_test_2.color = Vector4.create(0.2, 0.2, 0.2, 1.0);

	const box_mat1 = new TestMaterial3DResource();
	box_mat1.color = Vector4.create(1.0, 1.0, 1.0, 1.0);
	const mesh = new MeshInstance3D();
	mesh.geometry = sph_geo;
	mesh.material = box_mat_test_2;
	mesh.local_position = Vector3.create(0, 0, 0);
	mesh.local_rotation = Euler.create(0, 0, 0);
	mesh.local_scale = Vector3.create(100, 100, 100);
	// mesh.render_queue = 1;
	// World.add_Child(mesh);

	const phong = new PhongMaterialResource();
	phong.roughness = 0.1;
	const _mesh = new MeshInstance3D();
	_mesh.geometry = box_geo;
	_mesh.material = phong;
	_mesh.local_position = Vector3.create(100, 0, 0);
	_mesh.local_rotation = Euler.create(0, 0, 0);
	_mesh.local_scale = Vector3.create(100, 100, 100);
	// _mesh.render_queue = 1;
	// World.add_Child(_mesh);

	const pure = new PureColorMaterial3DResource();
	pure.color = Color.create(1.0, 1.0, 1.0, 1);
	const mesh2 = new MeshInstance3D();
	mesh2.geometry = box_geo;
	const box_mat2 = new TestMaterial3DResource();
	box_mat2.color = Vector4.create(1.0, 1.0, 1.0, 0.5);
	mesh2.material = pure; // box_mat2;
	// mesh2.render_queue = 1;
	mesh2.local_position = Vector3.create(200, 0, 0);
	mesh2.local_scale = Vector3.create(100, 100, 100);
	World.add_Child(mesh2);

	const mesh3 = new MeshInstance3D();
	mesh3.geometry = box_geo;
	const box_mat3 = new MatcapMaterialResource();
	box_mat3.matcap_texture = new ClassLoader(ResInstCache).fetch<ImageTexture2DResource>('sys://textures/matcaps/matcap-10.texture.lttmbin').expect();
	box_mat3.depth_bias = 0.3;
	box_mat3.depth_bias_slope_scale = 2;
	mesh3.material = box_mat3;
	mesh3.local_position = Vector3.create(400, 0, 100);
	mesh3.local_scale = Vector3.create(100, 100, 100);
	World.add_Child(mesh3);

	const mesh4 = new MeshInstance3D();
	mesh4.geometry = box_geo;
	const box_mat4 = new TestMaterial3DResource();
	box_mat4.color = Vector4.create(1.0, 1.0, 1.0, 0.75);
	mesh4.material = box_mat4;
	mesh4.local_position = Vector3.create(-200, 0, -100);
	mesh4.local_scale = Vector3.create(100, 100, 100);
	// mesh4.render_queue = 1;
	World.add_Child(mesh4);

	const mesh5 = new MeshInstance3D();
	mesh5.geometry = box_geo;
	mesh5.material = box_mat3;
	mesh5.local_position = Vector3.create(475, 0, 100);
	mesh5.local_scale = Vector3.create(50, 50, 50);
	World.add_Child(mesh5);

	// const tween = new TweenLoop(
	//     new PingPongTweenAdaptor(
	//         new PropertyTweenAdaptor(
	//             new InterpolateTween(2.0, InterpolateTweenTransitionType.Sine, InterpolateTweenEasingType.InOut),
	//             mesh2, 'local_position', Vector3.create(200, 200, 200)
	//         )
	//     ),
	//     Infinity
	// );

	// const tween2 = new TweenLoop(
	//     new PingPongTweenAdaptor(
	//         new PropertyTweenAdaptor(
	//             new InterpolateTween(2.0, InterpolateTweenTransitionType.Sine, InterpolateTweenEasingType.InOut),
	//             box_mat2, 'color', Vector4.create(0.0, 1.0, 0.0, 0.9995)
	//         )
	//     ),
	//     Infinity
	// );

	// const tween3 = new TweenLoop(
	//     new PingPongTweenAdaptor(
	//         new PropertyTweenAdaptor(
	//             new InterpolateTween(4.0, InterpolateTweenTransitionType.Sine, InterpolateTweenEasingType.InOut),
	//             box_mat, 'shift', -2.0
	//         )
	//     ),
	//     Infinity
	// );


	// EditorViewport.signal_input.connect((evt, pro) => {
	//     if (!pro && evt instanceof MouseMotionInputEvent) {
	//         console.log(evt.position_normalized);
	//     }
	// });

	EditorSceneTree.start_Loop(Infinity, 60);
	// EditorSceneTree.start_Tween(tween);
	// EditorSceneTree.start_Tween(tween2);
	// EditorSceneTree.start_Tween(tween3);

	// {
	// 	for (let i = 0; i < 5000; i++) {
	// 		const mesh = new MeshInstance3D();
	// 		mesh.geometry = sph_geo;
	// 		mesh.material = box_mat_test;
	// 		mesh.local_position = Vector3.create((Math.random() - 0.5) * 10000, (Math.random() - 0.5) * 10000, (Math.random() - 0.5) * 10000);
	// 		mesh.local_rotation = Euler.create(Math.random() * Tau, Math.random() * Tau, Math.random() * Tau);
	// 		mesh.local_scale = Vector3.create(100, 100, 100);
	// 		mesh.block_input = true;
	// 		mesh.block_physics_process = true;
	// 		mesh.block_process = true;
	// 		// mesh.render_queue = 1;
	// 		World.add_Child(mesh);
	// 	}
	// }

	{
		const image = new Image();
		image.src = f_image_url;
		image.onload = () => {
			const { naturalWidth, naturalHeight } = image;
			const texture = ImageTexture2DResource.create_Image(image, naturalWidth, naturalHeight, Infinity, true);
			texture.default_sampler_hash =
				WebGPURenderElementTextureSamplerCacheHash.WrapMirrorRepeat | WebGPURenderElementTextureSamplerCacheHash.FilterLinear | WebGPURenderElementTextureSamplerCacheHash.DepthCompareDisabled | WebGPURenderElementTextureSamplerCacheHash.AllLod | WebGPURenderElementTextureSamplerCacheHash.AnisotropyLod1;
			box_mat4.texture = texture;
		}
	}

	{
		const image = new Image();
		image.src = matcap_7_image_url;
		image.onload = () => {
			const { naturalWidth, naturalHeight } = image;
			const texture = ImageTexture2DResource.create_Image(image, naturalWidth, naturalHeight);
			pure.albedo_texture = texture;
		};
	}

	const pbr = new PbrMaterial3DResource();
	pbr.metallic = 0;
	pbr.roughness = 1;

	{
		const image = new Image();
		image.src = normal_image_url;
		image.onload = () => {
			const { naturalWidth, naturalHeight } = image;
			const texture = ImageTexture2DResource.create_Image(image, naturalWidth, naturalHeight, Infinity, true);
			pbr.normal_texture = texture;
			// box_mat_test_2.normal_texture = texture;
		};
	}


	{
		const image = new Image();
		image.src = cubemap;
		image.onload = () => {
			const { naturalWidth, naturalHeight } = image;
			const texture = ImageTextureCubeMapResource.create_Image(image, naturalWidth, naturalHeight, Infinity, true);
			// EditorViewport.world_3d?.visual_world.set_BackgroundTexture(texture);
		};
	}

	// {
	// 	const promises = Promise.all([
	// 		cubemap_x,
	// 		cubemap_x_,
	// 		cubemap_y,
	// 		cubemap_y_,
	// 		cubemap_z,
	// 		cubemap_z_,
	// 	].map(url => {
	// 		return new Promise<HTMLImageElement>((resolve, reject) => {
	// 			const image = new Image();
	// 			image.src = url;
	// 			image.onload = () => { resolve(image) };
	// 		});
	// 	}));
	// 	promises.then((images) => {
	// 		const image_options = images.map(img => ({ image: img, width: img.naturalWidth, height: img.naturalHeight }));
	// 		const texture = ImageTextureCubeMapResource.create_Images(image_options, Infinity, true);
	// 		// EditorViewport.world_3d?.visual_world.set_BackgroundTexture(texture);

	// 	});
	// }

	// {
	// 	const multi_geo = new MultiGeometry3DResource();
	// 	multi_geo.base_geometry = box_geo;
	// 	multi_geo.set_Count(20 * 20 * 20);
	// 	for (let i = 0; i < 20; i++) {
	// 		for (let j = 0; j < 20; j++)
	// 			for (let k = 0; k < 20; k++)
	// 				multi_geo.set_TransformColor((i * 20 * 20) + (j * 20) + k, Matrix4.new.set_BasisPosition(Matrix3.new.set_Euler(Euler.create(Math.random() * Tau, Math.random() * Tau, Math.random() * Tau)), Vector3.create(i * 2, j * 2, k * 2)),); // Vector4.create(Math.random(), Math.random(), Math.random(), 1.0)
	// 	}
	// 	multi_geo.commit();
	// 	const mesh = new MeshInstance3D();
	// 	mesh.geometry = multi_geo;
	// 	mesh.material = box_mat_test_2;
	// 	mesh.local_position = Vector3.create(-20, 50, -20);
	// 	mesh.local_scale = Vector3.create(1, 1, 1);
	// 	World.add_Child(mesh);
	// }

	{
		// compass
		// viewport 0
		const CompassViewportContainer = new ViewportDomContainer();
		CompassViewportContainer.dom = (document.querySelector('#compass-viewport') ?? undefined) as HTMLElement;
		const CompassViewport = new Viewport();
		CompassViewport.scale = 1.5;
		CompassViewport.world_3d = new World3D();
		CompassViewport.renderer_3d = new RenderServerRenderer3D(6, 6, 6, 6);
		CompassViewport.background = false;
		CompassViewportContainer.add_Child(CompassViewport);

		const compass_box_geo = new BoxGeometry3DResource();
		const compass_box_mat_0 = new PureColorMaterial3DResource();
		compass_box_mat_0.color = Color.color8code(blue);
		const compass_box_mat_1 = new PureColorMaterial3DResource();
		compass_box_mat_1.color = Color.color8code(green);
		const compass_box_mat_2 = new PureColorMaterial3DResource();
		compass_box_mat_2.color = Color.color8code(red);
		const compass_box_mat_0_n = new PureColorMaterial3DResource();
		compass_box_mat_0_n.color = Color.color8code(0x365ff650);
		const compass_box_mat_1_n = new PureColorMaterial3DResource();
		compass_box_mat_1_n.color = Color.color8code(0x04b97350);
		const compass_box_mat_2_n = new PureColorMaterial3DResource();
		compass_box_mat_2_n.color = Color.color8code(0xef4a5650);
		const mesh = new MeshInstance3D();
		mesh.geometry = compass_box_geo;
		mesh.set_SurfaceMaterial(2, compass_box_mat_0);
		mesh.set_SurfaceMaterial(0, compass_box_mat_1);
		mesh.set_SurfaceMaterial(4, compass_box_mat_2);
		mesh.set_SurfaceMaterial(3, compass_box_mat_0_n);
		mesh.set_SurfaceMaterial(1, compass_box_mat_1_n);
		mesh.set_SurfaceMaterial(5, compass_box_mat_2_n);
		CompassViewport.add_Child(mesh);

		const CompassCamera = new OrthographicCamera3D();
		CompassCamera.zoom = 0.45;
		CompassCamera.local_position = Vector3.create(0, 0, 10);
		CompassViewport.add_Child(CompassCamera);

		CompassViewport.signal_process.connect(() => {
			const camera = CompassViewport.get_SceneTree()?.get_ActiveViewports()[0]?.get_Camera3D();
			if (camera !== undefined) {
				CompassCamera.local_rotation = camera.global_rotation;
				const dir = CompassCamera.to_Global(Vector3.create(0, 0, -1), Vector3.new);
				dir.direction_to(dir, CompassCamera.global_position);
				CompassCamera.local_position = dir;
			}
		});

		EditorViewportContainer.add_Child(CompassViewportContainer);
	}

	const polyline = new MeshInstance3D();
	const polyline_geo = new PolyLineGeometry3DResource();
	const polyline_mat = new PolyLineMaterial3DResource();
	polyline_mat.color = Color.color8(0xff, 0xbb, 0x00);
	polyline.geometry = polyline_geo;
	polyline.material = polyline_mat;
	polyline.local_position = Vector3.create(400, 0, 100);
	polyline.local_scale = Vector3.create(100, 100, 100);
	World.add_Child(polyline);

	const light1 = new AmbientLight3D();
	light1.intensity = 0.4;
	World.add_Child(light1);

	const light2 = new DirectionalLight3D();
	light2.local_rotation = Euler.create(-Pi / 2, 0, 0);
	light2.intensity = 0.5;
	World.add_Child(light2);
	const light2_1 = new DirectionalLight3D();
	light2_1.local_rotation = Euler.create(-Pi / 3, 0, 0);
	light2_1.intensity = 0.2;
	World.add_Child(light2_1);
	const light2_2 = new DirectionalLight3D();
	light2_2.local_rotation = Euler.create(Pi + Pi / 3, 0, 0);
	light2_2.intensity = 0.2;
	World.add_Child(light2_2);

	// const light3 = new PointLight3D();
	// light3.color = Vector3.create(1, 1, 1);
	// light3.local_position = Vector3.create(0, 100, 0);
	// light3.intensity = 0.5;
	// light3.radius = 100;
	// World.add_Child(light3);
	// const light4 = new PointLight3D();
	// light4.color = Vector3.create(1, 1, 1);
	// light4.local_position = Vector3.create(-25, 60, 20);
	// light4.intensity = 0.1;
	// light4.radius = 0.4;
	// World.add_Child(light4);
	// const light5 = new PointLight3D();
	// light5.color = Vector3.create(1, 1, 1);
	// light5.local_position = Vector3.create(0, 60, -23);
	// light5.intensity = 0.1;
	// light5.radius = 0.4;
	// World.add_Child(light5);

	const light6 = new SpotLight3D();
	light6.color = Vector3.create(1, 0, 0);
	light6.angle = Pi / 10;
	light6.local_position = Vector3.create(200, -50, 200);
	light6.local_rotation = Euler.create(0, Pi / 4, 0);
	light6.intensity = 1;
	World.add_Child(light6);

	// let t = 0;
	// light6.signal_process.connect((delta) => {
	// 	t += delta;
	// 	light6.local_rotation = Euler.create(0, ((Math.sin(t) + 1) / 2 * 0.8 + 0.1) * Pi / 2, 0);
	// });



	// EditorSceneTree.start_Tween(new TweenLoop(
	// 	new PingPongTweenAdaptor(
	// 		new PropertyTweenAdaptor(
	// 			new InterpolateTween(2.0, InterpolateTweenTransitionType.Cubic, InterpolateTweenEasingType.InOut),
	// 			box_mat_test_2,
	// 			"metallic",
	// 			1.0,
	// 			0.0,
	// 		)
	// 	),
	// 	Infinity,
	// ));

	// EditorSceneTree.start_Tween(new TweenLoop(
	// 	new PingPongTweenAdaptor(
	// 		new PropertyTweenAdaptor(
	// 			new InterpolateTween(5.0, InterpolateTweenTransitionType.Cubic, InterpolateTweenEasingType.InOut),
	// 			light4,
	// 			'local_position',
	// 			Vector3.create(25, 60, 20)
	// 		)
	// 	),
	// 	Infinity,
	// ));

	// World.signal_input.connect((evt, prop) => {
	// 	if (!prop && evt instanceof KeyInputEvent && evt.key === ' ' && evt.pressed) {
	// 		light1.color = Color.create(1, 0, 0).get_PlainColor();
	// 	}
	// });

	const pln_geo = new BoxGeometry3DResource();
	pln_geo.option = {
		// height: 2.3,
	}
	const normal = new NormalMaterial3DResource();
	const ground = new MeshInstance3D();
	ground.geometry = pln_geo;
	ground.material = pbr;
	box_mat_test_2.roughness = 0.3;
	box_mat_test_2.metallic = 1;
	ground.local_scale = Vector3.create(200, 200, 200);
	ground.local_rotation = Euler.create(0, Pi / 4, 0);
	ground.local_position = Vector3.create(0, -150, 0);
	// World.add_Child(ground);

	// const light6 = new SpotLight3D();
	// light6.color = Vector3.create(1, 0, 0);
	// light6.distance = 10;
	// light6.intensity = 100;
	// light6.local_rotation = Euler.create(-Pi / 2, 0.3, 0);
	// light6.local_position = Vector3.create(200, 200, 0);
	// World.add_Child(light6);



	{
		// fetch(huli).then(r => r.text()).then(d => {
		// 	const hili_geo = new ObjLoader().parse(d).expect();
		// 	hili_geo.save(undefined, 'download://huli.geometry.lttmbin');
		// });

		// const node = new Node3D();
		// node.name = 'fox';
		// World.add_Child(node);
		// const huli_geo = new ClassLoader(ResInstCache).fetch<ArrayGeometry3DResource>('sys://geometries/huli.geometry.lttmbin').expect();
		// const huli = new MeshInstance3D();
		// huli.geometry = huli_geo;
		// // huli.material = box_mat3;
		// huli.local_position = Vector3.create(-200, -200, 100);
		// huli.local_scale = Vector3.create(100, 100, 100);
		// node.add_Child(huli);
		// const light6 = new SpotLight3D();
		// light6.color = Vector3.create(1, 0, 0);
		// light6.distance = 10;
		// light6.intensity = 100;
		// light6.local_rotation = Euler.create(-Pi / 2, 0.3, 0);
		// light6.local_position = Vector3.create(200, 200, 0);
		// huli.add_Child(light6);
		// const packed_scene = new PackedSceneResource();
		// packed_scene.parse(node).expect();
		// console.log(packed_scene);
		// const class_saver = new ClassSaver();
		// class_saver.save(packed_scene, "download://test.scene.lttmbin").expect();
		// console.log(class_saver.get_Data().expect());
	}

	// {
	// 	fetch('http://10.8.20.41:8084/group1/M00/00/00/4ZMEAGEcs9CEPKuPAAAAAItr2p0243.stl').then(r => r.arrayBuffer()).then(d => {
	// 		const class_saver = new StlLoader().parse(d).expect();
	// 		class_saver.save(undefined, 'sys://geometries/traffic_light.geometry.lttmbin');
	// 		const huli = new MeshInstance3D();
	// 		huli.geometry = new ClassLoader(ResInstCache).fetch<ArrayGeometry3DResource>('sys://geometries/traffic_light.geometry.lttmbin').expect();
	// 		const mat = new PbrMaterial3DResource();
	// 		mat.metallic = 0;
	// 		mat.roughness = 0.5;
	// 		// mat.color = Vector4.create(0.5, 0.4, 1, 1.0);
	// 		huli.material = mat;
	// 		huli.local_position = Vector3.create(0, 100, 0);
	// 		huli.local_scale = Vector3.create(0.1, 0.1, 0.1);
	// 		World.add_Child(huli);
	// 	});

	let move_target: MeshInstance3D | undefined = undefined;
	const transform = new TranslateGrabber3D();
	World.add_Child(transform);
	transform.visible = false;
	transform.signal_grabbing.connect((position) => {
		if (move_target !== undefined) {
			move_target.global_position = position;
		}
	});

	let idx = 0;
	for (let i = 0; i <= 10; i++) {
		for (let j = 0; j <= 10; j++) {
			const shp = new PickingShape3D();
			shp.shape = new SpherePickingShape3DResource();
			const area = new PickingArea3D();
			area.add_Child(shp);
			const mesh = new MeshInstance3D();
			mesh.add_Child(area);
			mesh.geometry = sph_geo;
			const mat = new PbrMaterial3DResource();
			// mat.color = Color.hsv(idx++ / 121, 1, 0.5, 1);
			mesh.material = mat;
			mat.roughness = i / 10;
			mat.metallic = j / 10;
			// mat.cube_texture = texture;
			mesh.local_position = Vector3.create(-80 + (i * 15), 20, -80 + (j * 15));
			mesh.local_scale = Vector3.create(10, 10, 10);
			World.add_Child(mesh);
			area.signal_mouse_entered.connect(() => {
				pointer.visible = true;
			});
			area.signal_input.connect((evt, prop) => {
				if (!prop && area.is_mouse_hover && evt instanceof MouseButtonInputEvent && evt.click) {
					move_target = mesh;
					transform.set_TranslatePosition(move_target.global_position);
					transform.visible = true;
				}
			});
			area.signal_mouse_exited.connect(() => {
				pointer.visible = false;
			});
			area.signal_mouse_moved.connect((evt, res) => {
				pointer.global_position = res.position;
				pointer.global_rotation = Euler.new.set_Quaternion(Quaternion.new.set_Rotate(Vector3.create(0, 1, 0), res.normal));
				// const normal = res.normal.clone();
				// normal.add_Number(normal, 1).div_Number(normal, 2);
				// pointer.color = Vector4.create(normal.x, normal.y, normal.z, 1);
			});
		}
	}
	// }

	// {
	// 	const packed_scene = new ClassLoader(ResInstCache).fetch<PackedSceneResource>("sys://test.scene.lttmbin").expect();
	// 	const scene = packed_scene.instantiate(ResInstCache).expect();
	// 	scene.get_Child<MeshInstance3D>(0)!.material = box_mat_test;
	// 	scene.get_Child<MeshInstance3D>(0)!.local_position = Vector3.create(-200, -200, 200);
	// 	const spot = scene.get_Child<MeshInstance3D>(0)!.get_Child<SpotLight3D>(0)!;
	// 	spot.global_position = Vector3.create(50, 75, 0);
	// 	spot.color = Vector3.create(1, 0, 0);
	// 	World.add_Child(scene);
	// 	const translate_grabber1 = new TranslateGrabber3D();
	// 	World.add_Child(translate_grabber1);
	// 	translate_grabber1.set_TranslatePosition(spot.global_position);
	// 	translate_grabber1.signal_grabbing.connect((position) => {
	// 		spot.global_position = position;//position.snap(position, Vector3.create(1, 1, 1));
	// 		// translate_grabber1.set_TranslatePosition(spot.global_position);
	// 	});
	// 	EditorSceneTree.start_Tween(new TweenLoop(
	// 		new MethodTweenAdaptor(
	// 			new InterpolateTween(5, InterpolateTweenTransitionType.Linear, InterpolateTweenEasingType.In),
	// 			(v) => {
	// 				spot.color = Color.hsv(v, 1, 0.5).get_PlainColor(false, Vector3.new);
	// 			}
	// 		),
	// 		Infinity
	// 	));
	// }

	{
		const grid = new InfiniteGrid3D();
		grid.plane = Plane3.create(Vector3.new.normalize(Vector3.create(0, 1, 0)), 0);
		grid.up = Vector3.create(0, 0, -1);
		World.add_Child(grid);
	}

	// {
	// 	const plane = new MeshInstance3D();
	// 	const plane_geo = new PlaneGeometry3DResource();
	// 	plane_geo.option = {
	// 		direction:PlaneGeometryDirection.ZNegative,
	// 		width: 2,
	// 		width_segments: 4,
	// 		depth_segments: 4,
	// 	}
	// 	plane.geometry = plane_geo;
	// 	plane.material = new NormalMaterial3DResource();
	// 	plane.local_scale = Vector3.create(100, 100, 100);
	// 	World.add_Child(plane);
	// }

	{
		const line_x = new InfiniteLine3D();
		const line_x_mat = new PolyLineMaterial3DResource();
		line_x_mat.color = Color.color8code(red);
		line_x.material = line_x_mat;
		World.add_Child(line_x);
		(window as any).set_Color.connect((c: ColorData) => {
			line_x_mat.color = Color.create(c[0], c[1], c[2], c[3]);
		})
	}
	{
		const line_x = new InfiniteLine3D();
		const line_x_mat = new PolyLineMaterial3DResource();
		line_x_mat.color = Color.color8code(green);
		line_x.material = line_x_mat;
		line_x.ray = Ray3.create(Vector3.new, Vector3.create(0, 1, 0));
		World.add_Child(line_x);
	}
	{
		const line_x = new InfiniteLine3D();
		const line_x_mat = new PolyLineMaterial3DResource();
		line_x_mat.color = Color.color8code(blue);
		line_x.material = line_x_mat;
		line_x.ray = Ray3.create(Vector3.new, Vector3.create(0, 0, 1));
		World.add_Child(line_x);
	}

	// {
	// 	for (let i = 0; i < 16; i++) {
	// 		const light3 = new PointLight3D();
	// 		light3.color = Vector3.create(Math.random(), Math.random(), Math.random());
	// 		light3.local_position = Vector3.create((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 100 + 200, (Math.random() - 0.5) * 200);
	// 		light3.intensity = 0.1;
	// 		light3.radius = 0.5;
	// 		light3.block_process = true;
	// 		light3.block_input = true;
	// 		light3.block_physics_process = true;
	// 		World.add_Child(light3);
	// 		EditorSceneTree.start_Tween(
	// 			new TweenLoop(
	// 				new PingPongTweenAdaptor(
	// 					new PropertyTweenAdaptor(
	// 						new InterpolateTween(2, InterpolateTweenTransitionType.Cubic, InterpolateTweenEasingType.InOut),
	// 						light3, "local_position",
	// 						Vector3.create((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200)
	// 					)
	// 				),
	// 				Infinity
	// 			)
	// 		);
	// 	}
	// }

	{
		// fetch(monkey).then(r => r.arrayBuffer()).then(d => {
		// 	const class_saver = new StlLoader().parse(d).expect();
		// 	class_saver.save(undefined, 'sys://geometries/monkey.geometry.lttmbin');
		// 	const monkey = new MeshInstance3D();
		// 	monkey.geometry = new ClassLoader(ResInstCache).fetch<ArrayGeometry3DResource>('sys://geometries/monkey.geometry.lttmbin').expect();
		// 	monkey.material = box_mat_test;
		// 	monkey.local_position = Vector3.create(0, 100, 0);
		// 	monkey.local_scale = Vector3.create(100, 100, 100);
		// 	World.add_Child(monkey);
		// });

	}

	// {
	// 	const mat = new NormalMaterial3DResource();
	// 	// mat.metallic = 0;
	// 	// mat.roughness = 0.75;
	// 	const root = new Node3D();
	// 	root.stop_input = true;
	// 	root.stop_process = true;
	// 	root.stop_physics_process = true;
	// 	root.local_scale = Vector3.create(100, 100, 100);
	// 	World.add_Child(root);
	// 	const geo = new TorusGeometry3DResource(); //new ClassLoader(ResInstCache).fetch<ArrayGeometry3DResource>('sys://geometries/huli.geometry.lttmbin').expect();
	// 	for (let i = 0; i < 25; i++) {
	// 		for (let j = 0; j < 25; j++) {
	// 			for (let k = 0; k < 25; k++) {
	// 				const node = new MeshInstance3D();
	// 				node.material = mat;
	// 				node.geometry = geo;
	// 				node.global_position = Vector3.create(i * 5, k * -5, j * 5);
	// 				root.add_Child(node);
	// 			}
	// 		}
	// 	}
	// }

	{
		fetch(box).then(r => r.arrayBuffer()).then(async d => {
			const node = (await new GltfLoader().parse(d)).expect();
			node.local_scale = Vector3.create(1, 1, 1);
			node.local_rotation = Euler.create(0, Pi, 0);
			World.add_Child(node);
			// const res = packed_scene.parse(node);
			// console.log(res);
			// const class_saver = new ClassSaver();
			// class_saver.save(packed_scene, "download://pole.scene.lttmbin").expect();
			// for (let i = 1; i < 25; i++) {
			// 	node.block_physics_process = true;
			// 	node.block_process = true;
			// 	node.block_input = true;
			// 	node.local_scale = Vector3.create(1, 1, 1);
			// 	node.global_position = Vector3.create(0, 0, i * 100);
			// 	World.add_Child(node);
			// }
		});
	}

	const pointer = new LineGrabber3D();
	pointer.offset_length = 0;
	pointer.enabled = false;
	pointer.color = Color.create(1, 0.2, 0.2, 1);
	World.add_Child(pointer);
	pointer.visible = false;

	{


		const box = new TorusGeometry3DResource();
		const shp = new GeometryPickingShape3DResource();
		shp.base_geometry = box;

		const shape = new PickingShape3D();
		shape.shape = shp;

		const area = new PickingArea3D();
		area.add_Child(shape);

		const mesh = new MeshInstance3D();
		mesh.geometry = box;
		mesh.material = new NormalMaterial3DResource();
		mesh.local_position = Vector3.create(100, 0, -200);
		mesh.local_scale = Vector3.create(100, 200, 100);
		mesh.local_rotation = Euler.create(Math.random() * Tau, Math.random() * Tau, Math.random() * Tau);
		mesh.add_Child(area);

		area.signal_mouse_entered.connect(() => {
			pointer.visible = true;
		});
		area.signal_input.connect((evt, prop) => {
			if (!prop && area.is_mouse_hover && evt instanceof MouseButtonInputEvent && evt.click) {
				move_target = mesh;
				transform.set_TranslatePosition(move_target.global_position);
				transform.visible = true;
			}
		});
		area.signal_mouse_exited.connect(() => {
			pointer.visible = false;
		});
		area.signal_mouse_moved.connect((evt, res) => {
			pointer.global_position = res.position;
			pointer.global_rotation = Euler.new.set_Quaternion(Quaternion.new.set_Rotate(Vector3.create(0, 1, 0), res.normal));
			// const normal = res.normal.clone();
			// normal.add_Number(normal, 1).div_Number(normal, 2);
			// pointer.color = Vector4.create(normal.x, normal.y, normal.z, 1);
		});

		World.add_Child(mesh);
	}

	{
		const geo = new PolyLineGeometry3DResource();
		const mat = new PolyLineMaterial3DResource();
		mat.color = Color.create(1, 0.8, 0, 1);
		mat.width = 10;
		geo.set_PointCount(360);
		for (let i = 0; i < 360; i++) {
			geo.set_Point(i, Vector3.create(
				Math.cos(i / 10) * 100,
				i,
				Math.sin(i / 10) * 100,
			));
		}
		geo.commit();
		const mesh = new MeshInstance3D();
		mesh.geometry = geo;
		mesh.material = mat;
		mesh.local_position = Vector3.create(0, 100, 0);
		World.add_Child(mesh);
	}

	return EditorSceneTree;
}