<template>
    <EditorMenuBar id="top-left-panel" />
</template>

<script setup lang="ts">

import EditorMenuBar from './EditorMenuBar.vue';

</script>

<style scoped>
#top-left-panel {
    position: fixed;
    top: 14px;
    left: 14px;
}
</style>