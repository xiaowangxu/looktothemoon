import { createApp } from 'vue';
import App from './App.vue';
import { createEditorViewport } from './app/EditorScene';
import './app/EditorSceneStyle.css';
import './system/engine/ClassDataBase';

createApp(App).mount('#app');

createEditorViewport('#viewport');