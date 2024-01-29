<template>
    <div ref="div_ref" class="__sun-design-panel-resize-conatiner__"
        :class="{ vertical: vertical, start: percentage === 0, end: percentage === 1 }" :style="{ '--Offset': offset }">
        <div class="__sun-design-panel-resize-conatiner-first__">
            <slot name="first" />
        </div>
        <div class="__sun-design-panel-resize-conatiner-second__">
            <slot name="second" />
        </div>
        <div class="__sun-design-panel-resize-conatiner-split__" @mousedown="onDragMouseDown" />
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        initialPercentage?: number,
        vertical?: boolean,
        min?: number,
        max?: number,
    }>(),
    {
        vertical: false,
        initialPercentage: 0.5,
        min: 0.1,
        max: 0.9,
    }
);

// datas
const percentage = ref(0.5);
setPercentageSafe(props.initialPercentage);
const offset = computed(() => `${Math.min(1, Math.max(1), percentage.value) * 100}%`);
const div_ref = ref<HTMLDivElement | null>(null);
let div_last_width = 0;
let div_last_height = 0;
let last_percentage = 0;
let mouse_last_x = 0;
let mouse_last_y = 0;

function onDragMouseDown(evt: MouseEvent) {
    if (div_ref.value === null) return;
    last_percentage = percentage.value;
    mouse_last_x = evt.clientX;
    mouse_last_y = evt.clientY;
    const { width, height } = div_ref.value.getBoundingClientRect();
    div_last_width = width;
    div_last_height = height;
    window.addEventListener('mousemove', onDragMouseMove, { capture: true });
    window.addEventListener('mouseup', onDragMouseUp, { capture: true });
}
function onDragMouseMove(evt: MouseEvent) {
    const mouse_delta_x = evt.clientX - mouse_last_x;
    const mouse_delta_y = evt.clientY - mouse_last_y;
    const percentage_delta_x = mouse_delta_x / div_last_width;
    const percentage_delta_y = mouse_delta_y / div_last_height;
    if (props.vertical) {
        setPercentageSafe(last_percentage + percentage_delta_y);
    }
    else {
        setPercentageSafe(last_percentage + percentage_delta_x);
    }
}
function onDragMouseUp(evt: MouseEvent) {
    removeDraggingEvents();
}
function removeDraggingEvents() {
    window.removeEventListener('mousemove', onDragMouseMove, { capture: true });
    window.removeEventListener('mouseup', onDragMouseUp, { capture: true });
}
function setPercentageSafe(val: number) {
    percentage.value = Math.min(props.max, Math.max(props.min, val));
}

onBeforeUnmount(() => {
    removeDraggingEvents();
});

// exposes
defineExpose({
    setPercentageSafe,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

split-size = 8px

.__sun-design-panel-resize-conatiner__
    position: relative
    // background-color: red
    overflow: hidden

.__sun-design-panel-resize-conatiner-first__
    position: absolute
    left: 0
    top: 0
    bottom: 0
    height: unset
    width: var(--Offset)
    border-right: solid-border
    border-bottom: none
    .__sun-design-panel-resize-conatiner__.vertical > &
        left: 0
        top: 0
        right: 0
        width: unset
        height: var(--Offset)
        border-right: none
        border-bottom: solid-border
    .__sun-design-panel-resize-conatiner__.start > &, .__sun-design-panel-resize-conatiner__.end > &
        border: none !important

.__sun-design-panel-resize-conatiner-second__
    position: absolute
    left: unset
    right: 0
    top: 0
    bottom: 0
    height: unset
    width: calc(100% - var(--Offset))
    .__sun-design-panel-resize-conatiner__.vertical > &
        bottom: 0
        left: 0
        right: 0
        top: unset
        width: unset
        height: calc(100% - var(--Offset))

.__sun-design-panel-resize-conatiner-split__
    position: absolute
    left: 'clamp(0%, calc(var(--Offset) - %s), calc(100% - %s))' % (split-size / 2 split-size)
    right: unset
    top: 0
    bottom: 0
    width: split-size
    height: unset
    // background-color: rgba(255, 0, 0, 0.2)
    cursor: e-resize
    .__sun-design-panel-resize-conatiner__.vertical > &
        left: 0
        right: 0
        top: 'clamp(0%, calc(var(--Offset) - %s), calc(100% - %s))' % (split-size / 2 split-size)
        bottom: unset
        height: split-size
        width: unset
        cursor: n-resize

</style>