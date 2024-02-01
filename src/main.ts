import { createApp } from 'vue';
import App from './App.vue';
import { createEditorViewport } from './app/EditorScene';
import './app/EditorSceneStyle.css';
import '@/system/filesystem/VirtualFileSystem';
import sys_vfs from 'res://sys.vfs?url';
import { VFS } from '@/system/filesystem/VirtualFileSystem';
import { fspath } from './system/filesystem/FileSystemPath';
import * as Icons from 'lucide-vue-next';
import SunWindow from './sundesign/window/SunWindow';
import WindowFileSystem from './views/WindowFileSystem.vue';

createApp(App).mount('#app');

VFS.touch(fspath('sys://'));
VFS.touch(fspath('user://'));

await fetch(sys_vfs).then(res => res.arrayBuffer()).then(array_buffer => VFS.load(array_buffer, fspath('sys://')));

const win = new SunWindow(WindowFileSystem);

window.VFS = VFS;
window.fspath = fspath;

createEditorViewport();
