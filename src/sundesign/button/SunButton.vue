<template>
    <button class="__sun-design__ __sun-design-button__ colored"
        :class="{ 'equal-padding': equalPadding, active, flat, bordered: !flat, rounded, 'square-bordered': squareBorderd, squared }"
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
        squareBorderd?: boolean,
    }>(),
    {
        size: 'normal',
        borderMask: 15,
    }
);

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-button__
    display: inline-flex
    flex-wrap: nowrap
    justify-content: center
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