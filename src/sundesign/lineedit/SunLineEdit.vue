<template>
    <input class="__sun-design__ __sun-design-lineedit__" :class="{ 'equal-padding': equalPadding }" :data-size="size"
        :data-border-mask="borderMask" :style="colorScheme">
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import type { Size, BorderMask, ColorScheme } from '../SunDesignConstants';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        borderMask?: BorderMask,
        equalPadding?: boolean,
        colorScheme?: ColorScheme,
    }>(),
    {
        size: 'normal',
        border_mask: 15,
        equal_padding: false,
    }
);

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-lineedit__
    &:active
        background-color: var(--color-hover)
        color: var(--font-color-normal)
        
    &:disabled, &.disabled
        background-color: var(--color-disabled)
        color: var(--font-color-disabled)
</style>