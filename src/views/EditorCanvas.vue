<template>
    <canvas ref="canvas_dom" v-once class="editor-canvas" />
</template>
<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue';
import { WebGLRenderer, Scene, PerspectiveCamera, BoxGeometry, MeshBasicMaterial, Mesh, GridHelper, MOUSE } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

const canvas_dom = ref<HTMLCanvasElement>();

let Renderer: WebGLRenderer;
let OrbitControl: OrbitControls;
const World: Scene = new Scene();
const Camera: PerspectiveCamera = new PerspectiveCamera(35, 1);
World.add(Camera);
const geometry = new BoxGeometry(1, 1, 1);
const material = new MeshBasicMaterial({ color: 0x00ff00 });
const cube = new Mesh(geometry, material);
const grid = new GridHelper(100, 100);
World.add(cube);
World.add(grid);
Camera.position.z = 5;

function on_WindowResized() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (Renderer) {
        Renderer.setPixelRatio(window.devicePixelRatio);
        Renderer.setSize(w, h, true);
    }
    Camera.aspect = w / h;
    Camera.updateProjectionMatrix();
}

function render() {
    if (Renderer) {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        Renderer.render(World, Camera);
    }
    requestAnimationFrame(render);
}

onMounted(() => {
    window.addEventListener("resize", on_WindowResized);
    Renderer = new WebGLRenderer({
        canvas: canvas_dom.value,
        antialias: true,
    });
    Renderer.setClearColor(0xffffff, 0);
    OrbitControl = new OrbitControls(Camera, canvas_dom.value);
    OrbitControl.mouseButtons = {
        MIDDLE: MOUSE.ROTATE,
    };
    OrbitControl.zoomToCursor = true;
    on_WindowResized();
    requestAnimationFrame(render);
});

onUnmounted(() => {
    window.removeEventListener("resize", on_WindowResized);
});
</script>
<style scoped>
.editor-canvas {
    position: fixed;
    inset: 0px;
}
</style>