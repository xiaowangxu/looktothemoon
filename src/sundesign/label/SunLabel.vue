<template>
    <span ref="span_ref" class="__sun-design__ __sun-design-label__ sized" :style="{ '--font-color-normal': color }"
        :data-size="size">
        <slot />
    </span>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import type { Size } from '../SunDesignConstants';
import { ref } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        color?: string,
    }>(),
    {
        size: 'normal',
    }
);

// datas
const span_ref = ref<HTMLSpanElement | null>(null);

// exposes
defineExpose({
    span: span_ref,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-label__
    background-color: unset
    color: var(--font-color-normal)
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis

    &[data-size]
        padding-left: 0
        padding-right: 0

</style>