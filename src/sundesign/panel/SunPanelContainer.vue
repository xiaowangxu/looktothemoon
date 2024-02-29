<template>
    <div class="__sun-design__ __sun-design-panel-container__" :class="{ vertical, gap, 'no-padding': noPadding, minor }">
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
        minor?: boolean,
    }>(),
    {
        vertical: false,
        gap: false,
        noPadding: false,
        minor: false,
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

    &.minor
        background-color: var(--color-normal)

    &.no-padding
        padding: 0

    &.vertical
        flex-direction: column

    &.gap
        gap: panel-padding

</style>