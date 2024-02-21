<template>
    <SunResizeObserver @resized="onResized">
        <div ref="div_ref" class="__sun-design-panel-resize-conatiner__"
            :class="{ 'flip-direction': flipDirection, vertical, start, end }" :style="{ '--Offset': offset }"
            v-bind="$attrs">
            <div class="__sun-design-panel-resize-conatiner-first__">
                <slot name="first" />
            </div>
            <div class="__sun-design-panel-resize-conatiner-second__">
                <slot name="second" />
            </div>
            <div class="__sun-design-panel-resize-conatiner-split__" @mousedown="onDragMouseDown">
                <slot name="nob" />
            </div>
            <SunButton v-if="expandIndicator" class="__sun-design-panel-resize-button__" size="small"
                @click="setSize(initialSize)"></SunButton>
        </div>
    </SunResizeObserver>
</template>

<script setup lang="ts">

import SunResizeObserver from '../scrollcontainer/SunResizeObserver.vue';
import SunButton from '../button/SunButton.vue';
import { type BoxSize } from '../SunDesignConstants';
import { computed, onBeforeUnmount, ref, toRef } from 'vue';

defineOptions({
    inheritAttrs: false,
});

// props
const props = withDefaults(
    defineProps<{
        initialSize?: number,
        vertical?: boolean,
        flipDirection?: boolean,
        min?: number,
        max?: number,
        expandIndicator?: boolean,
    }>(),
    {
        vertical: false,
        initialSize: 200,
        flipDirection: false,
        min: 0,
        max: Infinity,
        expandIndicator: true,
    }
);

// datas
const size = ref(100);
const div_ref = ref<HTMLDivElement | null>(null);
let last_size = 0;
let mouse_last_x = 0;
let mouse_last_y = 0;
let mouse_moved = false;
const container_rect = ref<BoxSize>({ width: 0, height: 0 });
const max_size = computed(() => Math.max(0, Math.min(props.max, props.vertical ? container_rect.value.height : container_rect.value.width)));
const min_size = computed(() => Math.max(0, Math.min(props.min, props.vertical ? container_rect.value.height : container_rect.value.width)));
const safe_size = computed(() => Math.min(max_size.value, Math.max(min_size.value, size.value)));
const start = computed(() => safe_size.value - min_size.value < 0.5);
const end = computed(() => max_size.value - safe_size.value < 0.5);
const offset = computed(() => `${safe_size.value}px`);
setSize(props.initialSize);

function onResized(borderBoxSize: BoxSize, contentBoxSize: BoxSize, target: Element) {
    container_rect.value = borderBoxSize;
}

function onDragMouseDown(evt: MouseEvent) {
    if (div_ref.value === null) return;
    last_size = safe_size.value;
    mouse_moved = false;
    mouse_last_x = evt.clientX;
    mouse_last_y = evt.clientY;
    window.addEventListener('mousemove', onDragMouseMove, { capture: true });
    window.addEventListener('mouseup', onDragMouseUp, { capture: true });
}
function onDragMouseMove(evt: MouseEvent) {
    mouse_moved = true;
    const mouse_delta_x = (evt.clientX - mouse_last_x) * (props.flipDirection ? -1 : 1);
    const mouse_delta_y = (evt.clientY - mouse_last_y) * (props.flipDirection ? -1 : 1);
    if (props.vertical) {
        setSize(last_size + mouse_delta_y);
    }
    else {
        setSize(last_size + mouse_delta_x);
    }
}
function onDragMouseUp(evt: MouseEvent) {
    if (!mouse_moved && (start.value || end.value)) {
        setSize(props.initialSize);
    }
    removeDraggingEvents();
}
function removeDraggingEvents() {
    window.removeEventListener('mousemove', onDragMouseMove, { capture: true });
    window.removeEventListener('mouseup', onDragMouseUp, { capture: true });
}
function setSize(val: number) {
    size.value = val;
}

onBeforeUnmount(() => {
    removeDraggingEvents();
});

// exposes
defineExpose({
    setSize: setSize,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

split-size = 8px
resize-button-margin = panel-padding * 2

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
    box-sizing: border-box
    overflow: hidden
    // background-color: rgba(255, 0, 0, 0.1)
    .__sun-design-panel-resize-conatiner__.flip-direction > &
        width: calc(100% - var(--Offset))
    .__sun-design-panel-resize-conatiner__.vertical.flip-direction > &
        height: calc(100% - var(--Offset))
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
    overflow: hidden
    width: calc(100% - var(--Offset))
    // background-color: rgba(0, 255, 0, 0.1)
    .__sun-design-panel-resize-conatiner__.flip-direction > &
        width: var(--Offset)
    .__sun-design-panel-resize-conatiner__.vertical.flip-direction > &
        height: var(--Offset)
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
    .__sun-design-panel-resize-conatiner__.flip-direction > &
        left: 'clamp(0%, calc(100% - var(--Offset) - %s), calc(100% - %s))' % (split-size / 2 split-size)
    .__sun-design-panel-resize-conatiner__.vertical.flip-direction > &
        top: 'clamp(0%, calc(100% - var(--Offset) - %s), calc(100% - %s))' % (split-size / 2 split-size)
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

.__sun-design-panel-resize-button__
    position: absolute
    overflow: hidden
    display: none !important

    .__sun-design-panel-resize-conatiner__:not(.vertical).start > &
        margin: resize-button-margin 0
        min-width: (size-small / 2) !important
        min-height: size-small !important
        display: inline-block !important
        border-left: none !important
        border-top-left-radius: 0 !important
        border-bottom-left-radius: 0 !important
        padding: padding-extend-small padding-small !important
    .__sun-design-panel-resize-conatiner__:not(.vertical).end > &
        margin: resize-button-margin 0
        min-width: (size-small / 2) !important
        min-height: size-small !important
        right: 0
        display: inline-block !important
        border-right: none !important
        border-top-right-radius: 0 !important
        border-bottom-right-radius: 0 !important
        padding: padding-extend-small padding-small !important

    .__sun-design-panel-resize-conatiner__.vertical.start > &
        margin: 0 resize-button-margin
        min-height: (size-small / 2) !important
        min-width: size-small !important
        right: 0
        display: inline-block !important
        border-top: none !important
        border-top-left-radius: 0 !important
        border-top-right-radius: 0 !important
    .__sun-design-panel-resize-conatiner__.vertical.end > &
        margin: 0 resize-button-margin
        min-height: (size-small / 2) !important
        min-width: size-small !important
        right: 0
        bottom: 0
        display: inline-block !important
        border-bottom: none !important
        border-bottom-left-radius: 0 !important
        border-bottom-right-radius: 0 !important

</style>