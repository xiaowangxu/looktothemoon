<template>
    <div ref="div_ref" class="__sun-design-popup-cover__" :class="{ 'stop-events': stopEvents }"
        @mousedown.self="onMouseDownSelf" @click.stop.self="onClickSelf"
        @contextmenu.stop.self="onContextmenuSelf" @keydown.esc.stop="onEsc" tabindex="-1">
        <slot />
    </div>
</template>

<script setup lang="ts">

import { ref } from 'vue';

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
    (event: 'contextmenu', evt: Event): void
}>();

// datas
let mouse_down_self = false;
const div_ref = ref<HTMLDivElement | null>(null);

function onMouseDownSelf() {
    mouse_down_self = true;
}

function onClickSelf(evt: Event) {
    if (mouse_down_self === true) {
        emits('click', evt);
    }
    mouse_down_self = false;
}

function onContextmenuSelf(evt: Event) {
    if (mouse_down_self === true) {
        emits('contextmenu', evt);
    }
    mouse_down_self = false;
    // call preventDefault after evt is propogated
    evt.preventDefault();
}

function onEsc(evt: Event) {
    emits('click', evt);
}

// expose
defineExpose({
    div: div_ref,
});

</script>

<style lang="stylus">

.__sun-design-popup-cover__
    position: fixed
    overscroll-behavior: auto
    inset: 0
    pointer-events: none
    outline: none
    border: none
    // background-color: rgba(255, 0, 0, 0.1)

    &.stop-events
        pointer-events: all
        overscroll-behavior: none

</style>