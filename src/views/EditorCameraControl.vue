<template>
    <SunPanel :trap-focus="false" style="width: 60px; aspect-ratio: 1; border-radius: 50%; position: relative;">
        <div id="compass-viewport" style="position: absolute; inset: 0;"></div>
    </SunPanel>
</template>

<script setup lang="ts">

import SunPanel from '@/sundesign/panel/SunPanel.vue';

</script>