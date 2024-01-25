<template>
    <div class="__sun-design__ __sun-design-range2d-container__ sized border-masked squared colored no-pressed-color no-hover-color"
        :class="{ bordered: !flat, flat, disabled }" :data-size="size" :data-border-mask="borderMask" :style="colorScheme"
        @click.self="onClick">
        <div ref="container_ref" class="__sun-design-range2d-region__"
            :style="{ '--PercentageX': percentage_x, '--PercentageY': percentage_y }">
            <div v-for="tick in tick_percentages" class="__sun-design-range2d-tick__"
                :style="{ '--TickPercentageX': tick[0], '--TickPercentageY': tick[1] }" />
            <label class="__sun-design__ __sun-design-range2d-nob-container__" :class="{ disabled }"
                @mousedown.self.stop="onMouseDown">
                <button class="__sun-design__ __sun-design-range2d-nob__ colored bordered" :class="{ active }"
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
type Value2D = [number, number];
const props = withDefaults(
    defineProps<{
        size?: Size,
        flat?: boolean,
        active?: boolean,
        disabled?: boolean,
        borderMask?: BorderMask,
        colorScheme?: ColorScheme,
        min: Value2D,
        modelValue: Value2D,
        max: Value2D,
        ticks?: Value2D[],
        tickValueOnly?: boolean,
    }>(),
    {
        size: 'normal',
        flat: false,
        active: true,
        disabled: false,
        borderMask: 15,
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
const percentage_x = computed(() => unlerp(props.min[0], props.max[0], props.modelValue[0]));
const percentage_y = computed(() => unlerp(props.min[1], props.max[1], props.modelValue[1]));
const clamped_ticks = computed(() => [...new Set((props.ticks ?? []).filter(t => t[0] >= props.min[0] && t[0] <= props.max[0] && t[1] >= props.min[1] && t[1] <= props.max[1]))]);
const tick_percentages = computed(() => clamped_ticks.value.map(t => [unlerp(props.min[0], props.max[0], t[0]), unlerp(props.min[1], props.max[1], t[1])]));

const dragging = ref(false);
let last_percentage_x = 0;
let last_percentage_y = 0;
let last_mouse_pos_x = 0;
let last_mouse_pos_y = 0;
let total_range_x = 0;
let total_range_y = 0;
function onMouseDown(evt: MouseEvent) {
    if (props.disabled || container_ref.value === null) return;
    last_percentage_x = percentage_x.value;
    last_percentage_y = percentage_y.value;
    const container_bbox = container_ref.value.getBoundingClientRect();
    total_range_y = container_bbox.height;
    last_mouse_pos_y = evt.clientY;
    total_range_x = container_bbox.width;
    last_mouse_pos_x = evt.clientX;
    dragging.value = true;
    window.addEventListener('mousemove', onMouseMove, { capture: true });
    window.addEventListener('mouseup', onMouseUp, { capture: true });
}
function onMouseMove(evt: MouseEvent) {
    const delta_y = last_mouse_pos_y - evt.clientY;
    const delta_x = evt.clientX - last_mouse_pos_x;
    const delta_percentage_x = delta_x / total_range_x;
    const delta_percentage_y = delta_y / total_range_y;
    const val_x = props.min[0] + (props.max[0] - props.min[0]) * (last_percentage_x + delta_percentage_x);
    const val_y = props.min[1] + (props.max[1] - props.min[1]) * (last_percentage_y + delta_percentage_y);
    setValueSafe(val_x, val_y, evt.ctrlKey);
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
    const container_bbox = container_ref.value.getBoundingClientRect();
    const min_y = container_bbox.y;
    const max_y = min_y + container_bbox.height;
    const val_y = evt.clientY;
    const min_x = container_bbox.x;
    const max_x = min_x + container_bbox.width;
    const val_x = evt.clientX;
    const percentage_x = Math.min(1, Math.max(0, unlerp(min_x, max_x, val_x)));
    const percentage_y = Math.min(1, Math.max(0, unlerp(min_y, max_y, val_y)));
    setValueSafe(
        lerp(props.min[0], props.max[0], percentage_x),
        lerp(props.min[1], props.max[1], 1 - percentage_y),
        evt.ctrlKey
    );
}

function setValueSafe(val_x: number, val_y: number, snap: boolean = false) {
    let _val_x = Math.min(props.max[0], Math.max(props.min[0], val_x));
    let _val_y = Math.min(props.max[1], Math.max(props.min[1], val_y));
    // if ((props.tickValueOnly || snap) && clamped_ticks.value.length > 0) {
    //     _val = [...clamped_ticks.value].sort((a, b) => Math.abs(a - _val) - Math.abs(b - _val))[0];
    // }
    value.value = [_val_x, _val_y];
}

onBeforeUnmount(() => {
    removeDraggingEvents();
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

tick-size = 0.5

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

.__sun-design-range2d-container__
    position: relative
    overflow: hidden

    &[data-size="small"] > .__sun-design-range2d-region__
        inset: (nob-container-width-small / 2)
        > .__sun-design-range2d-nob-container__
            width: nob-container-width-small
            height: nob-container-width-small
            transform: translate(-50%, -50%)
            padding: nob-padding-small     
            > .__sun-design-range2d-nob__
                border-radius: nob-border-radius-small

    &[data-size="normal"] > .__sun-design-range2d-region__
        inset: (nob-container-width-normal / 2)
        > .__sun-design-range2d-nob-container__
            width: nob-container-width-normal
            height: nob-container-width-normal
            transform: translate(-50%, -50%)
            padding: nob-padding-normal
            > .__sun-design-range2d-nob__
                border-radius: nob-border-radius-normal
        
    &[data-size="large"] > .__sun-design-range2d-region__
        inset: (nob-container-width-large / 2)
        > .__sun-design-range2d-nob-container__
            width: nob-container-width-large
            height: nob-container-width-large
            transform: translate(-50%, -50%)
            padding: nob-padding-large
            > .__sun-design-range2d-nob__
                border-radius: nob-border-radius-large

.__sun-design-range2d-region__
    position: absolute
    // background-color: red
    pointer-events: none

.__sun-design-range2d-tick__
    position: absolute
    pointer-events: none
    border-color: var(--placeholder-color)
    transform: translate(-50%, -50%)
    border: border-width var(--placeholder-color) solid

    .__sun-design-range2d-container__.disabled > .__sun-design-range2d-region__ > &
        border-color: var(--placeholder-color-disabled)

    .__sun-design-range2d-container__ > .__sun-design-range2d-region__ > &
        left: calc(var(--TickPercentageX) * 100%)
        top: calc((1 - var(--TickPercentageY)) * 100%)

    .__sun-design-range2d-container__[data-size="small"] > .__sun-design-range2d-region__ > &
        width: nob-width-small * tick-size
        height: nob-width-small * tick-size
        border-radius: nob-border-radius-small * tick-size
    
    .__sun-design-range2d-container__[data-size="normal"]  > .__sun-design-range2d-region__ > &
        width: nob-width-normal * tick-size
        height: nob-width-normal * tick-size
        border-radius: nob-border-radius-normal * tick-size
    
    .__sun-design-range2d-container__[data-size="large"] > .__sun-design-range2d-region__ > &
        width: nob-width-large * tick-size
        height: nob-width-large * tick-size
        border-radius: nob-border-radius-large * tick-size

.__sun-design-range2d-nob-container__
    position: absolute
    // background-color: rgba(0, 255, 0, 0.3)
    box-sizing: border-box
    pointer-events: all

    .__sun-design-range2d-container__ > .__sun-design-range2d-region__ > &
        left: calc(var(--PercentageX) * 100%)
        top: calc((1 - var(--PercentageY)) * 100%)

.__sun-design-range2d-nob__
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