import { createApp } from 'vue';
import App from './App.vue';
import { createEditorViewport } from './app/EditorScene';

createEditorViewport('#viewport');
createApp(App).mount('#app');