<template>
    <SunButtonLike class="__sun-design-formatedit__" no-pressed-color squared>
        <slot name="default"></slot>
    </SunButtonLike>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunButtonLike from '../button/SunButtonLike.vue';

// props
const props = withDefaults(
    defineProps<{
        // value
        // modelValue: string,
        // modelModifiers?: Record<string, boolean>,
    }>(),
    {
    }
);

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-formatedit__
    gap: 0px !important

</style>