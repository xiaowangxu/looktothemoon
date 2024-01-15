<template>
    <button class="__sun-design__ __sun-design-button__" :class="{ 'equal-padding': equalPadding, active, flat, rounded, squared }"
        :data-size="size" :data-border-mask="borderMask" :style="colorScheme">
        <slot>Button</slot>
    </button>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import type { Size, BorderMask, ColorScheme } from '../SunDesignConstants';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        flat?: boolean,
        active?: boolean,
        borderMask?: BorderMask,
        equalPadding?: boolean,
        colorScheme?: ColorScheme,
        rounded?: boolean,
        squared?: boolean,
    }>(),
    {
        size: 'normal',
        flat: false,
        active: false,
        border_mask: 15,
        equal_padding: false,
    }
);

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-button__
    display: flex
    flex-wrap: nowrap
    align-items: center
    text-wrap: nowrap

    &[data-size="small"]
        > svg, > __sun-design-icon__
            width: content-size-small
            height: content-size-small
    
    &[data-size="normal"] 
        > svg, > __sun-design-icon__
            width: content-size-normal
            height: content-size-normal
    
    &[data-size="large"]
        > svg, > __sun-design-icon__
            width: content-size-large
            height: content-size-large
</style>