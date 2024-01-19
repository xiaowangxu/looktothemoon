<template>
    <div ref="div_ref" class="__sun-design__ __sun-design-panel__"
        :class="{ vertical, 'not-container': !container, 'drop-shadow': dropShadow, bordered }" :data-size="size"
        :data-control-size="controlSize">
        <slot />
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import { type Size } from '../SunDesignConstants';
import { ref } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        controlSize?: Size,
        vertical?: boolean,
        bordered?: boolean,
        dropShadow?: boolean,
        container?: boolean,
    }>(),
    {
        size: 'normal',
        vertical: false,
        bordered: true,
        dropShadow: true,
        container: false,
    }
);

// datas
const div_ref = ref<HTMLDivElement | undefined>();

// exposes
defineExpose({
    div: div_ref,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-panel__
    display: flex
    gap: 0
    flex-direction: row
    overflow: hidden
    background-color: var(--panel-color)
    position: relative

    &.not-container
        &.bordered
            border: solid-border
        
        &.drop-shadow
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.1)

        &[data-size="small"]
            border-radius: panel-border-radius-small

        &[data-size="normal"]
            border-radius: panel-border-radius-normal

        &[data-size="large"]
            border-radius: panel-border-radius-large
    
    &.vertical
        flex-direction: column

    &[data-control-size="small"]
        border-top-left-radius: border-radius-size-small !important
        border-top-right-radius: border-radius-size-small !important

    &[data-control-size="normal"]
        border-top-left-radius: border-radius-size-normal !important
        border-top-right-radius: border-radius-size-normal !important

    &[data-control-size="large"]
        border-top-left-radius: border-radius-size-large !important
        border-top-right-radius: border-radius-size-large !important

</style>