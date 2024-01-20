<template>
    <button ref="button_ref" class="__sun-design__ __sun-design-button__ colored sized border-masked"
        :class="{ 'equal-padding': squared, squared, active, flat, bordered: bordered && !flat, rounded, hover }"
        :data-size="size" :data-border-mask="borderMask" :style="colorScheme">
        <slot>Button</slot>
    </button>
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
        active?: boolean,
        borderMask?: BorderMask,
        hover?: boolean,
        // equalPadding?: boolean,
        colorScheme?: ColorScheme,
        rounded?: boolean,
        squared?: boolean,
    }>(),
    {
        size: 'normal',
        bordered: true,
        borderMask: 15,
    }
);

const button_ref = ref<HTMLButtonElement>();

// exposes
defineExpose({
    button: button_ref,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-button__
    overflow: hidden
    display: inline-flex
    flex-wrap: nowrap
    justify-content: center
    align-items: center
    text-wrap: nowrap

    &[data-size="small"]
        svg, .__sun-design-icon__
            min-width: content-size-small
            min-height: content-size-small
            max-width: content-size-small
            max-height: content-size-small
    
    &[data-size="normal"] 
        svg, .__sun-design-icon__
            min-width: content-size-normal
            min-height: content-size-normal
            max-width: content-size-normal
            max-height: content-size-normal
    
    &[data-size="large"]
        svg, .__sun-design-icon__
            min-width: content-size-large
            min-height: content-size-large
            max-width: content-size-large
            max-height: content-size-large
</style>