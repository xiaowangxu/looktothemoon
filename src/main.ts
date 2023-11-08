import { createApp } from 'vue';
import App from './App.vue';
import { createEditorViewport } from './app/EditorScene';
import './app/EditorSceneStyle.css';

createApp(App).mount('#app');

createEditorViewport();

// import { ClassLoader } from './system/engine/classes/ClassSaverLoader';
// console.log(new ClassLoader().fetch('res://test.lttm').unwrap());
// console.log(new ClassLoader().fetch('res://test.lttm').unwrap());
// import { DefaultResourceInstanceCache } from '@/system/engine/Resource';
// console.log(DefaultResourceInstanceCache.paths);