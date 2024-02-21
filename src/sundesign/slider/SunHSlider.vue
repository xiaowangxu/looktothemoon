<template>
    <div class="__sun-design__ __sun-design-hslider-container__ sized" :data-size="size">
        <div ref="track_container_ref" class="__sun-design-hslider-track-container__"
            @mousedown.self="onContainerMouseDown">
            <div class="__sun-design__ __sun-design-hslider-track__ colored no-pressed-color no-hover-color"
                :class="{ bordered: !flat, flat, disabled }" :style="colorScheme"></div>
        </div>
        <div ref="container_ref" class="__sun-design-hslider-nob-container__">
            <button class="__sun-design__ __sun-design-hslider-nob__ colored active" :class="{ bordered: !flat, flat }"
                :disabled="disabled" :style="{ '--Percentage': display_percentage, ...colorScheme }"
                @mousedown="onMouseDown" @keydown.arrow-left="decrease" @keydown.arrow-right="increase" />
        </div>
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import { type Size, type ColorScheme, useInputModel } from '../SunDesignConstants';
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        flat?: boolean,
        disabled?: boolean,
        colorScheme?: ColorScheme,
        min: number,
        modelValue: number,
        modelModifiers?: Record<string, boolean>,
        max: number,
        step?: number,
        valueSnap?: boolean,
        // ticks?: number[],
        // tickValueOnly?: boolean,
    }>(),
    {
        size: 'normal',
        flat: false,
        disabled: false,
        step: 1,
        // tickValueOnly: false,
    }
);

// emits
const emits = defineEmits<{
    (event: 'update:modelValue', value: number): void,
    (event: 'input', value: number): void,
    (event: 'change', value: number): void,
}>();

const { value, setValueOnInput, setValueOnChange } = useInputModel(props, 'modelValue', 'modelModifiers', emits, { emitInput: 'input', emitChange: 'change' });

// datas
const container_ref = ref<HTMLDivElement | null>(null);
const track_container_ref = ref<HTMLDivElement | null>(null);
function unlerp(min: number, max: number, value: number) {
    return Math.min(1, Math.max(0, (value - min) / (max - min)));
}
function lerp(min: number, max: number, value: number) {
    return min + (max - min) * value;
}
const percentage = computed(() => unlerp(props.min, props.max, value.value));
const display_percentage = computed(() => dragging.value ? unlerp(props.min, props.max, dragging_new_value.value) : percentage.value)

function formatValue(val: number) {
    let delta = val - props.min;
    if (props.step !== undefined && props.valueSnap === true) {
        delta = Math.round(delta / props.step) * props.step;
    }
    return Math.min(props.max, Math.max(props.min, props.min + delta));
}

function increase() {
    if (dragging.value) return;
    const val = formatValue(value.value + (props.step ?? 0));
    if (val !== value.value) {
        setValueSafe(val, true);
        setValueSafe(val, false);
    }
}
function decrease() {
    if (dragging.value) return;
    const val = formatValue(value.value - (props.step ?? 0));
    if (val !== value.value) {
        setValueSafe(val, true);
        setValueSafe(val, false);
    }
}

// nob dragging
const dragging = ref(false);
const dragging_new_value = ref(0);
let last_percentage = 0;
let last_mouse_pos = 0;
let total_range = 0;
function onMouseDown(evt: MouseEvent, value_override?: number) {
    if (props.disabled || container_ref.value === null) return;
    dragging_new_value.value = value_override ?? value.value;
    last_percentage = value_override !== undefined ? unlerp(props.min, props.max, value_override) : percentage.value;
    const container_bbox = container_ref.value.getBoundingClientRect();
    total_range = container_bbox.width
    last_mouse_pos = evt.clientX;
    dragging.value = true;
    window.addEventListener('mousemove', onMouseMove, { capture: true });
    window.addEventListener('mouseup', onMouseUp, { capture: true });
}
function onMouseMove(evt: MouseEvent) {
    const delta = evt.clientX - last_mouse_pos;
    const delta_percentage = delta / total_range;
    const val = props.min + (props.max - props.min) * (last_percentage + delta_percentage);
    const new_drag_value = formatValue(val);
    if (new_drag_value === dragging_new_value.value) return;
    dragging_new_value.value = new_drag_value;
    setValueSafe(dragging_new_value.value);
}
function onMouseUp(evt: MouseEvent) {
    dragging.value = false;
    removeDraggingEvents();
    setValueSafe(dragging_new_value.value, false);
}
function removeDraggingEvents() {
    window.removeEventListener('mousemove', onMouseMove, { capture: true });
    window.removeEventListener('mouseup', onMouseUp, { capture: true });
}

// container
function onContainerMouseDown(evt: MouseEvent) {
    window.addEventListener('mousemove', onContainerMouseMove, { capture: true });
    window.addEventListener('mouseup', onContainerMouseUp, { capture: true });
}
async function onContainerMouseMove(evt: MouseEvent) {
    const val = onClick(evt, true);
    removeContainerEvents();
    await nextTick();
    onMouseDown(evt, val);
}
function onContainerMouseUp(evt: MouseEvent) {
    onClick(evt, false);
    removeContainerEvents();
}
function onClick(evt: MouseEvent, drag_start: boolean) {
    if (props.disabled || container_ref.value === null || track_container_ref.value === null) return;
    const track_container_bbox = track_container_ref.value.getBoundingClientRect();
    const container_bbox = container_ref.value.getBoundingClientRect();
    const nob_width = track_container_bbox.width - container_bbox.width;
    const min = track_container_bbox.x + nob_width / 2;
    const max = min + container_bbox.width;
    const percentage = Math.min(1, Math.max(0, unlerp(min, max, evt.clientX)));
    const val = formatValue(lerp(props.min, props.max, percentage));
    if (drag_start) {
        setValueSafe(val);
    }
    else {
        setValueSafe(val);
        setValueSafe(val, false);
    }
    return val;
}
function removeContainerEvents() {
    window.removeEventListener('mousemove', onContainerMouseMove, { capture: true });
    window.removeEventListener('mouseup', onContainerMouseUp, { capture: true });
}

function setValueSafe(val: number, input: boolean = true) {
    if (input) {
        setValueOnInput(val);
    }
    else {
        setValueOnChange(val);
    }
}

onBeforeUnmount(() => {
    removeDraggingEvents();
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

track-small = 4px
track-normal = 5px
track-large = 6px
nob-width-small = content-size-small
nob-width-normal = content-size-normal
nob-width-large = content-size-large
nob-small = content-size-small
nob-normal = content-size-normal
nob-large = content-size-large
nob-border-radius-small = 4px
nob-border-radius-normal = 5px
nob-border-radius-large = 6px

.__sun-design-hslider-container__
    padding: 0px !important
    position: relative
    border-radius: 0px !important

.__sun-design-hslider-track-container__, .__sun-design-hslider-nob-container__
    position: absolute
    inset: 0
    display: flex
    flex-direction: row
    flex-wrap: nowrap
    align-items: center
    justify-content: flex-start

.__sun-design-hslider-nob-container__
    pointer-events: none
    .__sun-design-hslider-container__[data-size="small"] > &
        margin-left: nob-width-small
    .__sun-design-hslider-container__[data-size="normal"] > &
        margin-left: nob-width-normal
    .__sun-design-hslider-container__[data-size="large"] > &
        margin-left: nob-width-large

.__sun-design-hslider-track__
    width: 100%
    pointer-events: none

    .__sun-design-hslider-container__[data-size="small"] > .__sun-design-hslider-track-container__ > &
        height: track-small
        border-radius: (track-small / 2)
    .__sun-design-hslider-container__[data-size="normal"] > .__sun-design-hslider-track-container__ > &
        height: track-normal
        border-radius: (track-normal / 2)
    .__sun-design-hslider-container__[data-size="large"] > .__sun-design-hslider-track-container__ > &
        height: track-large
        border-radius: (track-large / 2)

.__sun-design-hslider-nob__
    padding: 0px
    pointer-events: initial

    .__sun-design-hslider-container__[data-size="small"] > .__sun-design-hslider-nob-container__ > &
        width: nob-width-small
        height: nob-small
        border-radius: nob-border-radius-small
        margin-left: 'calc(100% * var(--Percentage) - %s)' % (nob-width-small)
    .__sun-design-hslider-container__[data-size="normal"] > .__sun-design-hslider-nob-container__ > &
        width: nob-width-normal
        height: nob-normal
        border-radius: nob-border-radius-normal
        margin-left: 'calc(100% * var(--Percentage) - %s)' % (nob-width-normal)
    .__sun-design-hslider-container__[data-size="large"] > .__sun-design-hslider-nob-container__ > &
        width: nob-width-large
        height: nob-large
        border-radius: nob-border-radius-large
        margin-left: 'calc(100% * var(--Percentage) - %s)' % (nob-width-large)

</style>