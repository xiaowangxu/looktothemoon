<template>
    <SunPanel v-once id="compass" style="width: 60px; height: 60px; border-radius: 50%; pointer-events: all;">
        <canvas id="compass-canvas" style="width: 100%; height: 100%;"/>
    </SunPanel>
</template>

<script setup lang="ts">

import SunPanel from '@/sundesign/panel/SunPanel.vue';

</script>