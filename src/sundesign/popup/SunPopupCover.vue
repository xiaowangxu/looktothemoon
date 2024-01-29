<template>
    <div ref="div_ref" class="__sun-design-popup-cover__" :class="{ 'stop-events': stopEvents }"
        @mousedown.self="onMouseDownSelf" @contextmenu.prevent @click.stop.self="onClickSelf" @keydown.esc.stop="onEsc"
        tabindex="-1">
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
}>();

// datas
const mouse_down_self = ref(false);
const div_ref = ref<HTMLDivElement | null>(null);

function onMouseDownSelf() {
    mouse_down_self.value = true;
}

function onClickSelf(evt: Event) {
    if (mouse_down_self.value === true) {
        emits('click', evt);
    }
    mouse_down_self.value = false;
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