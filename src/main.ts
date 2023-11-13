import { createApp } from 'vue';
import App from './App.vue';
import { createEditorViewport } from './app/EditorScene';
import './app/EditorSceneStyle.css';

createApp(App).mount('#app');

createEditorViewport();

// import Monkey from 'res://Monkey.obj?raw';
// import { ObjLoader } from './system/engine/loaders/ObjLoader';
// import { ClassSaver } from './system/engine/classes/ClassSaverLoader';
// import { PackedSceneResource } from './system/engine/resources/PackedSceneResource';
// const obj = new ObjLoader().parse(Monkey);
// console.log(obj.unwrap());

// const string = new ClassSaver().save(new PackedSceneResource(obj.unwrap())).unwrap();
// console.log(string);
// navigator.clipboard.writeText(string);

import GltfFile from 'res://road.glb?raw-buffer';
import { GltfLoader } from './system/engine/loaders/GltfLoader';
const loader = new GltfLoader();
console.log(loader.parse(GltfFile.buffer).error);