<template>
    <span ref="span_ref" class="__sun-design__ __sun-design-label__ sized"
        :class="{ 'no-horizontal-padding': noHorizontalPadding, 'no-vertical-padding': noVerticalPadding, 'equal-padding': squared, bold, italic }"
        :style="{ '--font-color-normal': color }" :data-size="size">
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
        noVerticalPadding?: boolean,
        noHorizontalPadding?: boolean,
        squared?: boolean,
        sized?: boolean,
        bold?: boolean,
        italic?: boolean,
    }>(),
    {
        size: 'normal',
        noVerticalPadding: false,
        noHorizontalPadding: true,
        squared: false,
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
    border-radius: 0 !important

    &.no-vertical-padding[data-size]
        padding-top: 0
        padding-bottom: 0

    &.no-horizontal-padding[data-size]
        padding-left: 0
        padding-right: 0

    &.bold
        font-weight: bold
    
    &.italic
        font-style: italic

</style>