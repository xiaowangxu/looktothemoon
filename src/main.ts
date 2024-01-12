import { createApp } from 'vue';
import App from './App.vue';
import { createEditorViewport } from './app/EditorScene';
import './app/EditorSceneStyle.css';
import '@/system/filesystem/VirtualFileSystem';
import sys_vfs from 'res://sys.vfs?url';
import { VFS } from '@/system/filesystem/VirtualFileSystem';
import { fspath } from './system/filesystem/FileSystemPath';

VFS.touch(fspath('res://'));
VFS.touch(fspath('sys://'));

createApp(App).mount('#app');

await fetch(sys_vfs).then(res => res.arrayBuffer()).then(array_buffer => VFS.load(array_buffer, fspath('sys://')));

createEditorViewport();
