<template>
    <div class="__sun-design__ __sun-design-panel-container__" :class="{ vertical, gap }">
        <slot />
    </div>
</template>

<script setup lang="ts">

// props
const props = withDefaults(
    defineProps<{
        vertical?: boolean,
        gap?: boolean,
    }>(),
    {
        vertical: false,
        gap: false,
    }
)

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-panel-container__
    padding: panel-padding
    display: flex
    gap: 0
    flex-direction: row

    &.vertical
        flex-direction: column

    &.gap
        gap: panel-padding

</style>