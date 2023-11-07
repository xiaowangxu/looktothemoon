import { createApp } from 'vue';
import App from './App.vue';
import { createEditorViewport } from './app/EditorScene';
import './app/EditorSceneStyle.css';

createApp(App).mount('#app');

createEditorViewport();

// import { ThreeMaterialResource } from './system/engine/resources/MaterialResource';
// import { MeshBasicMaterial, BoxGeometry } from 'three';
// import { ClassLoader, ClassSaver } from './system/engine/classes/ClassSaverLoader';
// import { ThreeGeometryResource } from './system/engine/resources/GeometryResource';

// const mat = new ThreeGeometryResource(new BoxGeometry(1, 2, 3));

// const saver = new ClassSaver();

// const result = saver.dump(mat);

// if (result !== undefined) {
//     console.error(result.message);
// }
// else {
//     // saver.print();
//     const json = saver.get_JsonString(2)!;
//     // console.log(json);
//     const loader = new ClassLoader();
//     const result = loader.load(json);
//     if (result.failed) {
//         console.error(result.error);
//     }
//     else {
//         console.log(result.value);
//     }
// }