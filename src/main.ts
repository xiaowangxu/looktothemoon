import { createApp } from 'vue';
import App from './App.vue';
import { createEditorViewport } from './app/EditorScene';
import './app/EditorSceneStyle.css';

// createApp(App).mount('#app');

createEditorViewport();

import '@/system/sliverofstraw/test';