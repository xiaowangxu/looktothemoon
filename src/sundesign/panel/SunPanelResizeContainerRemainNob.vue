<template>
    <SunResizeObserver @resized="onResized">
        <div ref="div_ref" class="__sun-design-panel-resize-conatiner-remain-nob__"
            :class="{ 'flip-direction': flipDirection, vertical, start, end }"
            :style="{ '--NobSize': `${nobSize}px`, '--Offset': offset }" v-bind="$attrs">
            <div class="__sun-design-panel-resize-conatiner-remain-nob-first__">
                <slot name="first" />
            </div>
            <div ref="second_container_ref" class="__sun-design-panel-resize-conatiner-remain-nob-second__">
                <slot name="second" />
            </div>
            <div class="__sun-design-panel-resize-conatiner-remain-nob-split__" @mousedown="onDragMouseDown">
                <slot name="nob" :start="start" :end="end" />
            </div>
        </div>
    </SunResizeObserver>
</template>

<script setup lang="ts">

import SunResizeObserver from '../scrollcontainer/SunResizeObserver.vue';
import SunButton from '../button/SunButton.vue';
import { type BoxSize } from '../SunDesignConstants';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

defineOptions({
    inheritAttrs: false,
});

// props
const props = withDefaults(
    defineProps<{
        initialSize?: number,
        initialCollapse?: 'first' | 'second',
        vertical?: boolean,
        flipDirection?: boolean,
        min?: number,
        max?: number,
        expandIndicator?: boolean,
        nobSize?: number,
        firstSnap?: number,
        secondSnap?: number,
    }>(),
    {
        vertical: false,
        initialSize: 200,
        flipDirection: false,
        min: 0,
        max: Infinity,
        expandIndicator: true,
        hideBorder: false,
        nobSize: 8,
    }
);

// slots
defineSlots<{
    nob(props: { start: boolean, end: boolean }): void,
    first(props: {}): void,
    second(props: {}): void,
}>();

// datas
const size = ref(0);
const div_ref = ref<HTMLDivElement | null>(null);
let last_size = 0;
let open_size = props.initialSize;
let mouse_last_x = 0;
let mouse_last_y = 0;
let mouse_moved = false;
const container_rect = ref<BoxSize>({ width: 0, height: 0 });
onMounted(() => {
    if (div_ref.value !== null && (!props.flipDirection && props.initialCollapse === 'second' || props.flipDirection && props.initialCollapse === 'first')) {
        const { width, height } = div_ref.value.getBoundingClientRect();
        if (props.vertical) {
            setSize(Math.ceil(height));
        }
        else {
            setSize(Math.ceil(width));
        }
    }
});
const calc_max_size = computed(() => props.max <= 0 ? (props.vertical ? container_rect.value.height : container_rect.value.width) + props.max : props.max);
const max_size = computed(() => Math.max(0, Math.min(calc_max_size.value, props.vertical ? container_rect.value.height : container_rect.value.width)) - props.nobSize / 2);
const min_size = computed(() => Math.max(0, Math.min(props.min, props.vertical ? container_rect.value.height : container_rect.value.width)) + props.nobSize / 2);
const safe_size = computed(() => Math.min(max_size.value, Math.max(min_size.value, size.value)));
const start = computed(() => safe_size.value - min_size.value < 0.5);
const end = computed(() => max_size.value - safe_size.value < 0.5);
const offset = computed(() => `${safe_size.value}px`);
if (props.initialCollapse === undefined) {
    setSize(open_size);
}
else if (!props.flipDirection && props.initialCollapse === 'first' || props.flipDirection && props.initialCollapse === 'second') {
    setSize(0);
}

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
    const mouse_delta_x = (evt.clientX - mouse_last_x) * (props.flipDirection ? -1 : 1);
    const mouse_delta_y = (evt.clientY - mouse_last_y) * (props.flipDirection ? -1 : 1);
    if (props.vertical) {
        // fix chrome start up mouse move event fired after down even if mouse is not moved
        if (mouse_delta_y === 0) return;
        mouse_moved = true;
        setSize(last_size + mouse_delta_y);
    }
    else {
        if (mouse_delta_x === 0) return;
        mouse_moved = true;
        setSize(last_size + mouse_delta_x);
    }
}
function onDragMouseUp(evt: MouseEvent) {
    const is_one_closed = start.value || end.value;
    if (mouse_moved) {
        if (last_size > min_size.value && is_one_closed) {
            open_size = last_size;
        }
        else {
            open_size = props.initialSize;
        }
    }
    else if (is_one_closed) {
        setSize(open_size);
    }
    mouse_moved = false;
    removeDraggingEvents();
}
function removeDraggingEvents() {
    window.removeEventListener('mousemove', onDragMouseMove, { capture: true });
    window.removeEventListener('mouseup', onDragMouseUp, { capture: true });
}
function setSize(val: number) {
    if (props.firstSnap !== undefined && val <= props.firstSnap) {
        val = min_size.value;
    }
    if (props.secondSnap !== undefined && val >= props.secondSnap) {
        val = max_size.value;
    }
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

split-size = var(--NobSize,  8px)
split-size-half = calc(var(--NobSize,  8px) / 2)
resize-button-margin = panel-padding * 2

.__sun-design-panel-resize-conatiner-remain-nob__
    position: relative
    overflow: hidden

.__sun-design-panel-resize-conatiner-remain-nob-first__
    position: absolute
    left: 0
    top: 0
    bottom: 0
    height: unset
    width: 'calc(var(--Offset) - %s)' % (split-size-half)
    box-sizing: border-box
    overflow: hidden
    .__sun-design-panel-resize-conatiner-remain-nob__.flip-direction > &
        width: 'calc(100% - var(--Offset) - %s)' % (split-size-half)
    .__sun-design-panel-resize-conatiner-remain-nob__.vertical.flip-direction > &
        height: 'calc(100% - var(--Offset) - %s)' % (split-size-half)
    .__sun-design-panel-resize-conatiner-remain-nob__.vertical > &
        left: 0
        top: 0
        right: 0
        width: unset
        height: 'calc(var(--Offset) - %s)' % (split-size-half)

.__sun-design-panel-resize-conatiner-remain-nob-second__
    position: absolute
    left: unset
    right: 0
    top: 0
    bottom: 0
    height: unset
    overflow: hidden
    width: 'calc(100% - var(--Offset) - %s)' % (split-size-half)
    .__sun-design-panel-resize-conatiner-remain-nob__.flip-direction > &
        width: 'calc(var(--Offset) - %s)' % (split-size-half)
    .__sun-design-panel-resize-conatiner-remain-nob__.vertical.flip-direction > &
        height: 'calc(var(--Offset) - %s)' % (split-size-half)
    .__sun-design-panel-resize-conatiner-remain-nob__.vertical > &
        bottom: 0
        left: 0
        right: 0
        top: unset
        width: unset
        height: 'calc(100% - var(--Offset) - %s)' % (split-size-half)

.__sun-design-panel-resize-conatiner-remain-nob-split__
    position: absolute
    right: unset
    top: 0
    bottom: 0
    width: split-size
    height: unset
    cursor: e-resize
    left: 'calc(var(--Offset) - %s)' % (split-size-half)
    .__sun-design-panel-resize-conatiner-remain-nob__.flip-direction > &
        left: 'calc(100% - var(--Offset) - %s)' % (split-size-half)
    .__sun-design-panel-resize-conatiner-remain-nob__.vertical > &
        left: 0
        right: 0
        bottom: unset
        height: split-size
        width: unset
        cursor: n-resize
        top: 'calc(var(--Offset) - %s)' % (split-size-half)
    .__sun-design-panel-resize-conatiner-remain-nob__.vertical.flip-direction > &
        top: 'calc(100% - var(--Offset) - %s)' % (split-size-half)

</style>