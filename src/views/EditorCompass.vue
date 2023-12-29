<template>
    <SPanel v-once id="compass" style="width: 60px; height: 60px; border-radius: 50%; pointer-events: all;">
        <canvas id="compass-canvas" style="width: 100%; height: 100%;"/>
    </SPanel>
</template>

<script setup lang="ts">

import SPanel from '@/components/SPanel.vue';

</script>