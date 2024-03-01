<template>
    <div class="__sun-design__ __sun-design-button-like__ sized colored border-masked" :class="{
        'no-pressed-color': noPressedColor, 'no-hover-color': noHoverColor, 'equal-padding': squared, squared, disabled, active, flat, bordered: !flat, hover, 'no-vertical-padding': noVerticalPadding
    }" :data-size="size" :data-border-mask="borderMask" :style="colorScheme">
        <slot></slot>
    </div>
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
        hover?: boolean,
        colorScheme?: ColorScheme,
        squared?: boolean,
        disabled?: boolean,
        noVerticalPadding?: boolean,
        noPressedColor?: boolean,
        noHoverColor?: boolean,
    }>(),
    {
        size: 'normal',
        borderMask: 15,
        disabled: false,
        noVerticalPadding: false,
        noPressedColor: false,
        noHoverColor: false,
    }
);

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-button-like__
    display: inline-flex
    flex-wrap: nowrap
    justify-content: center
    align-items: center
    text-wrap: nowrap
    color: var(--font-color-normal)

    &.no-vertical-padding
        padding-top: 0
        padding-bottom: 0
    
    &[data-size="small"]
        > svg, > .__sun-design-icon__
            min-width: content-size-small
            min-height: content-size-small
            max-width: content-size-small
            max-height: content-size-small
    
    &[data-size="normal"] 
        > svg, > .__sun-design-icon__
            min-width: content-size-normal
            min-height: content-size-normal
            max-width: content-size-normal
            max-height: content-size-normal
    
    &[data-size="large"]
        > svg, > .__sun-design-icon__
            min-width: content-size-large
            min-height: content-size-large
            max-width: content-size-large
            max-height: content-size-large

</style>