<template>
    <div class="__sun-design__ __sun-design-panel-container__" :class="{ vertical, gap, 'no-padding': noPadding }">
        <slot />
    </div>
</template>

<script setup lang="ts">

// props
const props = withDefaults(
    defineProps<{
        vertical?: boolean,
        gap?: boolean,
        noPadding?: boolean,
    }>(),
    {
        vertical: false,
        gap: false,
        noPadding: false,
    }
)

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-panel-container__
    padding: panel-padding
    display: flex
    gap: (panel-padding / 2)
    flex-direction: row

    &.no-padding
        padding: 0

    &.vertical
        flex-direction: column

    &.gap
        gap: panel-padding

</style>