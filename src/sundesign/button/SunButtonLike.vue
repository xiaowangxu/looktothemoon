<template>
    <div class="__sun-design__ __sun-design-button-like__ sized" :class="{
        'equal-padding': equalPadding, squared,
        'no-vertical-padding': noVerticalPadding,
        'no-left-padding': noLeftPadding,
        'no-right-padding': noRightPadding,
    }" :data-size="size">
        <slot>Button</slot>
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import type { Size, BorderMask, ColorScheme } from '../SunDesignConstants';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        equalPadding?: boolean,
        squared?: boolean,
        noVerticalPadding?: boolean,
        noLeftPadding?: boolean,
        noRightPadding?: boolean,
    }>(),
    {
        size: 'normal',
        noVerticalPadding: false,
        noLeftPadding: false,
        noRightPadding: false,
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

    &.no-vertical-padding
        padding-top: 0
        padding-bottom: 0
    
    &.no-left-padding
        padding-left: 0
    
    &.no-right-padding
        padding-right: 0

    &[data-size="small"]
        > svg, > __sun-design-icon__
            min-width: content-size-small
            min-height: content-size-small
            max-width: content-size-small
            max-height: content-size-small

    &[data-size="normal"] 
        > svg, > __sun-design-icon__
            min-width: content-size-normal
            min-height: content-size-normal
            max-width: content-size-small
            max-height: content-size-small

    &[data-size="large"]
        > svg, > __sun-design-icon__
            min-width: content-size-large
            min-height: content-size-large
            max-width: content-size-small
            max-height: content-size-small

</style>