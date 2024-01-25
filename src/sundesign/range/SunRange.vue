<template>
    <div class="__sun-design__ __sun-design-range-container__ sized border-masked squared colored no-pressed-color no-hover-color"
        :class="{ bordered: !flat, vertical, flat, disabled }" :data-size="size" :data-border-mask="borderMask"
        :style="colorScheme" @click.self="onClick">
        <div ref="container_ref" class="__sun-design-range-region__" :style="{ '--Percentage': percentage }">
            <div v-if="progress" class="__sun-design-range-progress__"></div>
            <div v-for="tick in tick_percentages" class="__sun-design-range-tick__" :style="{ '--TickPercentage': tick }"
                :key="tick" />
            <label class="__sun-design__ __sun-design-range-nob-container__" :class="{ disabled }"
                @mousedown.self.stop="onMouseDown">
                <button class="__sun-design__ __sun-design-range-nob__ colored bordered" :class="{ active }"
                    @mousedown.stop="onMouseDown" :disabled="disabled" />
            </label>
        </div>
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import { type Size, type BorderMask, type ColorScheme } from '../SunDesignConstants';
import { computed, onBeforeUnmount, ref } from 'vue';
import { useVModel } from '@vueuse/core';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        flat?: boolean,
        active?: boolean,
        disabled?: boolean,
        borderMask?: BorderMask,
        colorScheme?: ColorScheme,
        vertical?: boolean,
        progress?: boolean,
        min: number,
        modelValue: number,
        max: number,
        ticks?: number[],
        tickValueOnly?: boolean,
    }>(),
    {
        size: 'normal',
        flat: false,
        active: true,
        disabled: false,
        borderMask: 15,
        vertical: false,
        progress: true,
        tickValueOnly: false,
    }
);

// emits
const emits = defineEmits<{
    (event: 'update:modelValue', value: number): void,
}>();

const value = useVModel(props, 'modelValue', emits);

// datas
const container_ref = ref<HTMLDivElement | null>(null);
function unlerp(min: number, max: number, value: number) {
    return Math.min(1, Math.max(0, (value - min) / (max - min)));
}
function lerp(min: number, max: number, value: number) {
    return min + (max - min) * value;
}
const percentage = computed(() => unlerp(props.min, props.max, props.modelValue));
const clamped_ticks = computed(() => [...new Set((props.ticks ?? []).filter(t => t >= props.min && t <= props.max))]);
const tick_percentages = computed(() => clamped_ticks.value.map(t => unlerp(props.min, props.max, t)));

const dragging = ref(false);
let last_percentage = 0;
let last_mouse_pos = 0;
let total_range = 0;
function onMouseDown(evt: MouseEvent) {
    if (props.disabled || container_ref.value === null) return;
    last_percentage = percentage.value
    const container_bbox = container_ref.value.getBoundingClientRect();
    if (props.vertical) {
        total_range = container_bbox.height
        last_mouse_pos = evt.clientY;
    }
    else {
        total_range = container_bbox.width
        last_mouse_pos = evt.clientX;
    }
    dragging.value = true;
    window.addEventListener('mousemove', onMouseMove, { capture: true });
    window.addEventListener('mouseup', onMouseUp, { capture: true });
}
function onMouseMove(evt: MouseEvent) {
    let delta;
    if (props.vertical) {
        delta = last_mouse_pos - evt.clientY;
    }
    else {
        delta = evt.clientX - last_mouse_pos;
    }
    const delta_percentage = delta / total_range;
    const val = props.min + (props.max - props.min) * (last_percentage + delta_percentage);
    setValueSafe(val, evt.ctrlKey);
}
function onMouseUp(evt: MouseEvent) {
    dragging.value = false;
    removeDraggingEvents();
}
function removeDraggingEvents() {
    window.removeEventListener('mousemove', onMouseMove, { capture: true });
    window.removeEventListener('mouseup', onMouseUp, { capture: true });
}
function onClick(evt: MouseEvent) {
    if (props.disabled || container_ref.value === null) return;
    let min, max, val;
    const container_bbox = container_ref.value.getBoundingClientRect();
    if (props.vertical) {
        min = container_bbox.y;
        max = min + container_bbox.height;
        val = evt.clientY;
    }
    else {
        min = container_bbox.x;
        max = min + container_bbox.width;
        val = evt.clientX;
    }
    const percentage = Math.min(1, Math.max(0, unlerp(min, max, val)));
    setValueSafe(lerp(props.min, props.max, props.vertical ? 1 - percentage : percentage), evt.ctrlKey);
}

function setValueSafe(val: number, snap: boolean = false) {
    let _val = Math.min(props.max, Math.max(props.min, val));
    if ((props.tickValueOnly || snap) && clamped_ticks.value.length > 0) {
        _val = [...clamped_ticks.value].sort((a, b) => Math.abs(a - _val) - Math.abs(b - _val))[0];
    }
    value.value = _val;
}

onBeforeUnmount(() => {
    removeDraggingEvents();
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

tick-size = 50%

nob-aspect-ratio = 2

nob-padding-small = padding-small
nob-width-small = ((size-small - nob-padding-small * 2) / nob-aspect-ratio)
nob-height-small = 'calc(100% - %s)' % (nob-padding-small * 2)
nob-border-radius-small = border-radius-size-small - nob-padding-small
nob-container-width-small = nob-width-small + nob-padding-small * 2

nob-padding-normal = padding-normal
nob-width-normal = ((size-normal - nob-padding-normal * 2) / nob-aspect-ratio)
nob-height-normal = 'calc(100% - %s)' % (nob-padding-normal * 2)
nob-border-radius-normal = border-radius-size-normal - nob-padding-normal
nob-container-width-normal = nob-width-normal + nob-padding-normal * 2

nob-padding-large = padding-large
nob-width-large = ((size-large - nob-padding-large * 2) / nob-aspect-ratio)
nob-height-large = 'calc(100% - %s)' % (nob-padding-large * 2)
nob-border-radius-large = border-radius-size-large - nob-padding-large
nob-container-width-large = nob-width-large + nob-padding-large * 2

.__sun-design-range-container__
    position: relative
    overflow: hidden

    &[data-size="small"] > .__sun-design-range-region__
        inset: 0 (nob-container-width-small / 2)
        > .__sun-design-range-nob-container__
            width: nob-container-width-small
            height: 100%
            transform: translate(-50%, 0)
            padding: nob-padding-small     
            > .__sun-design-range-nob__
                border-radius: nob-border-radius-small

    &[data-size="normal"] > .__sun-design-range-region__
        inset: 0 (nob-container-width-normal / 2)
        > .__sun-design-range-nob-container__
            width: nob-container-width-normal
            height: 100%
            transform: translate(-50%, 0)
            padding: nob-padding-normal
            > .__sun-design-range-nob__
                border-radius: nob-border-radius-normal
        
    &[data-size="large"] > .__sun-design-range-region__
        inset: 0 (nob-container-width-large / 2)
        > .__sun-design-range-nob-container__
            width: nob-container-width-large
            height: 100%
            transform: translate(-50%, 0)
            padding: nob-padding-large
            > .__sun-design-range-nob__
                border-radius: nob-border-radius-large
    
    // vertical

    &.vertical[data-size="small"] > .__sun-design-range-region__
        inset: (nob-container-width-small / 2) 0
        > .__sun-design-range-nob-container__
            height: nob-container-width-small
            width: 100%
            transform: translate(0, -50%)
            padding: nob-padding-small     
            > .__sun-design-range-nob__
                border-radius: nob-border-radius-small
    
    &.vertical[data-size="normal"] > .__sun-design-range-region__
        inset: (nob-container-width-normal / 2) 0
        > .__sun-design-range-nob-container__
            height: nob-container-width-normal
            width: 100%
            transform: translate(0, -50%)
            padding: nob-padding-normal     
            > .__sun-design-range-nob__
                border-radius: nob-border-radius-normal

    &.vertical[data-size="large"] > .__sun-design-range-region__
        inset: (nob-container-width-large / 2) 0
        > .__sun-design-range-nob-container__
            height: nob-container-width-large
            width: 100%
            transform: translate(0, -50%)
            padding: nob-padding-large     
            > .__sun-design-range-nob__
                border-radius: nob-border-radius-large

.__sun-design-range-region__
    position: absolute
    // background-color: red
    pointer-events: none

.__sun-design-range-progress__
    position: absolute
    background-color: var(--border-color-normal)
    pointer-events: none

    .__sun-design-range-container__.disabled > .__sun-design-range-region__ > &
        background-color: var(--border-color-disabled)

    .__sun-design-range-container__[data-size="small"] > .__sun-design-range-region__ > &
        height: 100%
        width: 'calc(100% + %s)' % (nob-container-width-small)
        right: 'calc((1 - var(--Percentage)) * 100% - %s)' % ((nob-container-width-small / 2))
        bottom: unset

    .__sun-design-range-container__[data-size="normal"] > .__sun-design-range-region__ > &
        height: 100%
        width: 'calc(100% + %s)' % (nob-container-width-normal)
        right: 'calc((1 - var(--Percentage)) * 100% - %s)' % ((nob-container-width-normal / 2))
        bottom: unset

    .__sun-design-range-container__[data-size="large"] > .__sun-design-range-region__ > &
        height: 100%
        width: 'calc(100% + %s)' % (nob-container-width-large)
        right: 'calc((1 - var(--Percentage)) * 100% - %s)' % ((nob-container-width-large / 2))
        bottom: unset

    // vertical

    .__sun-design-range-container__.vertical[data-size="small"] > .__sun-design-range-region__ > &
        width: 100%
        height: 'calc(100% + %s)' % (nob-container-width-small)
        top: 'calc((1 - var(--Percentage)) * 100% - %s)' % ((nob-container-width-small / 2))
        right: unset

    .__sun-design-range-container__.vertical[data-size="normal"] > .__sun-design-range-region__ > &
        width: 100%
        height: 'calc(100% + %s)' % (nob-container-width-normal)
        top: 'calc((1 - var(--Percentage)) * 100% - %s)' % ((nob-container-width-normal / 2))
        right: unset

    .__sun-design-range-container__.vertical[data-size="large"] > .__sun-design-range-region__ > &
        width: 100%
        height: 'calc(100% + %s)' % (nob-container-width-large)
        top: 'calc((1 - var(--Percentage)) * 100% - %s)' % ((nob-container-width-large / 2))
        right: unset

.__sun-design-range-tick__
    position: absolute
    pointer-events: none

    .__sun-design-range-container__.disabled > .__sun-design-range-region__ > &
        border-color: var(--placeholder-color-disabled)

    .__sun-design-range-container__ > .__sun-design-range-region__ > &
        transform: translate(-50%, 0)
        border-left: border-width var(--placeholder-color) solid
        border-top: none
        left: calc(var(--TickPercentage) * 100%)
        top: ((100% - tick-size) / 2)
        bottom: ((100% - tick-size) / 2)
        right: unset

    .__sun-design-range-container__.vertical > .__sun-design-range-region__ > &
        transform: translate(0, -50%)
        border-top: border-width var(--placeholder-color) solid
        border-left: none
        top: calc((1 - var(--TickPercentage)) * 100%)
        left: ((100% - tick-size) / 2)
        right: ((100% - tick-size) / 2)
        bottom: unset

.__sun-design-range-nob-container__
    position: absolute
    // background-color: rgba(0, 255, 0, 0.3)
    box-sizing: border-box
    pointer-events: all

    .__sun-design-range-container__ > .__sun-design-range-region__ > &
        left: calc(var(--Percentage) * 100%)
        bottom: unset

    .__sun-design-range-container__.vertical > .__sun-design-range-region__ > &
        top: calc((1 - var(--Percentage)) * 100%)
        left: unset

.__sun-design-range-nob__
    display: block
    width: 100%;
    height: 100%
    padding: 0
    margin: 0

    &.active:active
        background-color: var(--color-active) !important
    
    &.active:disabled:active
        background-color: var(--color-active-disabled) !important

</style>