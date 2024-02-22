import { createApp } from 'vue';
import App from './App.vue';
import { createEditor } from './app/EditorScene';
import '@/system/filesystem/VirtualFileSystem';
import sys_vfs from 'res://sys.vfs?url';
import { VFS } from '@/system/filesystem/VirtualFileSystem';
import { fspath } from './system/filesystem/FileSystemPath';

createApp(App).mount('#app');

VFS.touch(fspath('sys://'));
VFS.touch(fspath('user://'));

await fetch(sys_vfs).then(res => res.arrayBuffer()).then(array_buffer => VFS.load(array_buffer, fspath('sys://')));

window.VFS = VFS;
window.fspath = fspath;

createEditor();