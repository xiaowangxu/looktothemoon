<template>
    <div class="__sun-design__ __sun-design-panel-separator__"
        :class="[overrideVertical === undefined ? undefined : (overrideVertical ? 'vertical' : 'horizontal')]">
    </div>
</template>

<script setup lang="ts">

// props
const props = withDefaults(
    defineProps<{
        overrideVertical?: boolean,
    }>(),
    {
        overrideVertical: undefined,
    }
);

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-panel-separator__
    background-color: border-color-normal

    .__sun-design__.__sun-design-panel__ &
        &:first-child, &:last-child
            display: none

    .__sun-design__.__sun-design-panel__ &:not(.horizontal):not(.vertical), &.horizontal
        border-left: solid-border
        width: 0px
        min-height: 100%
        min-width: unset

    .__sun-design__.__sun-design-panel__.vertical &:not(.vertical):not(.horizontal), &.vertical
        border-top: solid-border
        height: 0px
        min-width: 100%
        min-height: unset

</style>