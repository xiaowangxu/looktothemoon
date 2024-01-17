<template>
    <input class="__sun-design__ __sun-design-lineedit__ colored sized"
        :class="{ 'equal-padding': false, flat, bordered: bordered && !flat, 'no-background': noBackground }" :data-size="size" :data-border-mask="borderMask"
        :style="colorScheme">
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import type { Size, BorderMask, ColorScheme } from '../SunDesignConstants';

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

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-lineedit__, .__sun-design__.__sun-design-lineedit__.flat
    min-width: 0

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