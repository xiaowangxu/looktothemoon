<template>
    <input ref="input_ref" class="__sun-design__ __sun-design-lineedit__ colored sized border-masked"
        :class="{ 'equal-padding': false, flat, bordered: bordered && !flat, 'no-background': noBackground }"
        :data-size="size" :data-border-mask="borderMask" :style="colorScheme">
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import type { Size, BorderMask, ColorScheme } from '../SunDesignConstants';
import { ref } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        flat?: boolean,
        bordered?: boolean,
        borderMask?: BorderMask,
        // equalPadding?: boolean,
        colorScheme?: ColorScheme,
        noBackground?: boolean,
    }>(),
    {
        size: 'normal',
        flat: false,
        bordered: true,
        borderMask: 15,
        noBackground: false,
    }
);

// datas
const input_ref = ref<HTMLInputElement | undefined>();

// exposes
defineExpose({
    input: input_ref,
});


</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-lineedit__, .__sun-design__.__sun-design-lineedit__.flat

    &.no-background
        background-color: transparent !important

    &:focus-visible
        outline: none

    &:active
        background-color: var(--color-hover)
        color: var(--font-color-normal)
        
    &:disabled, &.disabled
        background-color: var(--color-disabled)
        color: var(--font-color-disabled)
</style>