<template>
    <div class="__sun-design-popup-cover__" :class="{ 'stop-events': stopEvents }" @click.stop.self="emits('click', $event)">
        <slot />
    </div>
</template>

<script setup lang="ts">

// props
const props = withDefaults(
    defineProps<{
        stopEvents?: boolean,
    }>(),
    {
        stopEvents: true,
    }
)

// events
const emits = defineEmits<{
    (event: 'click', evt: Event): void
}>();

</script>

<style lang="stylus">

.__sun-design-popup-cover__
    position: fixed
    overscroll-behavior: auto
    inset: 0
    pointer-events: none

    &.stop-events
        pointer-events: all
        overscroll-behavior: none

</style>