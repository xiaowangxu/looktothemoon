import { createApp } from 'vue';
import App from './App.vue';
import { createEditor } from './app/EditorScene';
import '@/system/filesystem/VirtualFileSystem';
import sys_vfs from 'res://sys.vfs.gz?url';
import { VFS } from '@/system/filesystem/VirtualFileSystem';
import { fspath } from './system/filesystem/FileSystemPath';
import { StlLoader } from './system/engine/loaders/StlLoader';
import { ObjLoader } from './system/engine/loaders/ObjLoader';

createApp(App).mount('#app');

VFS.touch(fspath('sys://'));
VFS.touch(fspath('user://'));

(async () => {
    await fetch(sys_vfs)
        .then(res => res.arrayBuffer())
        // .then(buffer => decompress(buffer))
        .then(array_buffer => VFS.load(array_buffer, fspath('sys://')));
    // http://10.8.20.41:8084/group1/M00/00/11/4ZMEAGMR1iuEMU5fAAAAAK_gSjk753.stl
    // http://10.8.20.41:8084/group1/M00/00/00/4ZMEAGEcsiuEK-WeAAAAABTJz9I673.stl
    await fetch('http://10.8.20.41:8084/group1/M00/00/11/4ZMEAGMR1iuEMU5fAAAAAK_gSjk753.stl')
        .then(res => res.arrayBuffer())
        .then(buffer => {
            const stl_loader = new StlLoader();
            const res = stl_loader.parse(buffer);
            res.expect().save(undefined, 'sys://traffic-light.geometry.lttmbin');
        });

    (window as any).VFS = VFS;
    (window as any).fspath = fspath;
    (window as any).scenetree = createEditor();
})();

// import { FPMesh } from './system/fivepebble/shape/fp_mesh/FPMesh';

// const shape = new FPMesh();
// const v0 = shape.create_Vertex();
// const v1 = shape.create_Vertex();
// const v2 = shape.create_Vertex();
// const v3 = shape.create_Vertex();
// const e0 = shape.create_Edge(v0, v1).expect();
// const e1 = shape.create_Edge(v1, v2).expect();
// const e2 = shape.create_Edge(v2, v0).expect();

// const e3 = shape.create_Edge(v1, v3).expect();
// const e4 = shape.create_Edge(v3, v0).expect();

// const f0 = shape.create_Face(v0, [e0, e1, e2]).expect();
// const f1 = shape.create_Face(v0, [e0, e3, e4]).expect();

// console.log([v0, v1, v2].map(v => v.id));
// console.log([e0, e1, e2].map(v => v.id));

// console.log(shape.get_FaceEdges(f0).map(v => v.id));
// // console.log(shape.get_FaceVertices(f0));
// // console.log(shape.get_EdgeFaces(e0));
// // console.log(shape.get_EdgeFaces(e3));

// shape.reverse_Face(f0);

// console.log(shape.get_FaceEdges(f0));


// import road from 'res://jd.obj?url';
// (async () => {
//     await fetch(road)
//         .then(res => res.text())
//         .then(text => {
//             // console.log(text);
//             const obj_loader = new ObjLoader();
//             const res = obj_loader.parse(text);
//             res.expect().save(undefined, 'download://traffic-light.geometry.lttmbin');
//         });
// })();

