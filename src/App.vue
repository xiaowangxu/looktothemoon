<template>
    <EditorUI />
    <!-- <DemoVue /> -->
</template>

<script setup lang="ts">
// import DemoVue from './sundesign/Demo.vue';
import EditorUI from './views/EditorUI.vue';

import SunWindow from './sundesign/window/SunWindow';
import SunWindowItem from '../dev/stories/SunWindowItem.vue';

const win = new SunWindow(SunWindowItem);

</script>

