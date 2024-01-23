<template>
    <div class="__sun-design__ __sun-design-range-container__ sized border-masked squared"
        :class="{ bordered: !flat, vertical, flat, disabled }" :data-size="size" :data-border-mask="borderMask"
        :style="{ ...colorScheme, '--Percentage': percentage }">
        <div ref="container_ref" class="__sun-design-range-nob-container__">
            <div v-if="progress" class="__sun-design-range-progress__" />
            <div v-for="tick in tick_percentages" class="__sun-design-range-tick__" :style="{ '--TickPercentage': tick }" />
            <div ref="nob_ref" class="__sun-design__ __sun-design-range-nob__" :tabindex="disabled ? undefined : 0"
                @mousedown="onMouseDown">
                <div class="__sun-design__ colored" :class="{ bordered: !flat, disabled }"
                    style="width: 16px; height: 6px; margin: auto; border-radius: 999px;">
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import { type Size, type BorderMask, type ColorScheme } from '../SunDesignConstants';
import { computed, onBeforeMount, onBeforeUnmount, ref } from 'vue';
import { useVModel } from '@vueuse/core';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        flat?: boolean,
        disabled?: boolean,
        borderMask?: BorderMask,
        colorScheme?: ColorScheme,
        vertical?: boolean,
        progress?: boolean,
        min: number,
        modelValue: number,
        max: number,
        ticks?: number[],
    }>(),
    {
        size: 'normal',
        flat: false,
        disabled: false,
        borderMask: 15,
        vertical: false,
        progress: true,
    }
);

// emits
const emits = defineEmits<{
    (event: 'update:modelValue', value: number): void,
}>();

const value = useVModel(props, 'modelValue', emits);

// datas
const container_ref = ref<HTMLDivElement | null>(null);
const nob_ref = ref<HTMLDivElement | null>(null);
function unlerp(min: number, max: number, value: number) {
    return Math.min(1, Math.max(0, (value - min) / (max - min)));
}
const percentage = computed(() => unlerp(props.min, props.max, props.modelValue));
const tick_percentages = computed(() => [...new Set((props.ticks ?? []).filter(t => t >= props.min && t <= props.max).map(t => unlerp(props.min, props.max, t)))]);

const dragging = ref(false);
let last_percentage = 0;
let last_mouse_pos = 0;
let total_range = 0;
function onMouseDown(evt: MouseEvent) {
    if (container_ref.value === null || nob_ref.value === null) return;
    last_percentage = percentage.value
    const container_bbox = container_ref.value.getBoundingClientRect();
    const nob_bbox = nob_ref.value.getBoundingClientRect();
    if (props.vertical) {
        total_range = container_bbox.height - nob_bbox.height;
        last_mouse_pos = evt.clientY;
    }
    else {
        total_range = container_bbox.width - nob_bbox.width;
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
    value.value = Math.min(props.max, Math.max(props.min, val));
}
function onMouseUp(evt: MouseEvent) {
    removeDraggingEvents();
}
function removeDraggingEvents() {
    window.removeEventListener('mousemove', onMouseMove, { capture: true });
    window.removeEventListener('mouseup', onMouseUp, { capture: true });
}

onBeforeUnmount(() => {
    removeDraggingEvents();
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

tick-size = 1px

.__sun-design-range-container__
    --Percentage: 0.75
    position: relative
    padding: 0 !important
    overflow: hidden

    &.bordered
        background-color: var(--color-normal)

        &.disabled
            background-color: var(--color-disabled)

    &[data-size="small"] > .__sun-design-range-nob-container__ 
        > .__sun-design-range-nob__
            width: border-radius-size-small * 2
            height: size-small
            top: 50%
            bottom: 50%
            left: 'calc(var(--Percentage) * (100% - %s))' % (@width)
            right: unset
            transform: translate(0, -50%)
        > .__sun-design-range-tick__
            top: padding-extend-small
            bottom: padding-extend-small
            width: 0
            height: unset
            border-right: solid-border
            transform: translate(-50%);
            left: 'calc(%s + (100% - %s) * var(--TickPercentage))' % (border-radius-size-small border-radius-size-small * 2)
        > .__sun-design-range-progress__
            top: unset
            right: 'calc(%s + (100% - %s) * (1 - var(--Percentage)))' % (border-radius-size-small border-radius-size-small * 2)

    &[data-size="normal"] > .__sun-design-range-nob-container__ 
        > .__sun-design-range-nob__
            width: border-radius-size-normal * 2
            height: size-normal
            top: 50%
            bottom: 50%
            left: 'calc(var(--Percentage) * (100% - %s))' % (@width)
            right: unset
            transform: translate(0, -50%)
        > .__sun-design-range-tick__
            top: padding-extend-normal
            bottom: padding-extend-normal
            width: 0
            height: unset
            border-right: solid-border
            transform: translate(-50%)
            left: 'calc(%s + (100% - %s) * var(--TickPercentage))' % (border-radius-size-normal border-radius-size-normal * 2)
        > .__sun-design-range-progress__
            top: unset
            right: 'calc(%s + (100% - %s) * (1 - var(--Percentage)))' % (border-radius-size-normal border-radius-size-normal * 2)
        
    &[data-size="large"] > .__sun-design-range-nob-container__ 
        > .__sun-design-range-nob__
            width: border-radius-size-large * 2
            height: size-large
            top: 50%
            bottom: 50%
            left: 'calc(var(--Percentage) * (100% - %s))' % (@width)
            right: unset
            transform: translate(0, -50%)
        > .__sun-design-range-tick__
            top: padding-extend-large
            bottom: padding-extend-large
            width: 0
            height: unset
            border-right: solid-border
            transform: translate(-50%);
            left: 'calc(%s + (100% - %s) * var(--TickPercentage))' % (border-radius-size-large border-radius-size-large * 2)
        > .__sun-design-range-progress__
            top: unset
            right: 'calc(%s + (100% - %s) * (1 - var(--Percentage)))' % (border-radius-size-large border-radius-size-large * 2)
    
    &.vertical
        
        &[data-size="small"] > .__sun-design-range-nob-container__ 
            > .__sun-design-range-nob__
                width: size-small
                height: border-radius-size-small * 2
                left: 50%
                right: 50%
                transform: translate(-50%)
                top: unset
                bottom: 'calc(var(--Percentage) * (100% - %s))' % (@height)
            > .__sun-design-range-tick__
                left: padding-extend-small
                right: padding-extend-small
                width: unset
                height: 0
                border-top: solid-border
                transform: translate(0, -50%);
                top: 'calc(%s + (100% - %s) * (1 - var(--TickPercentage)))' % (border-radius-size-small border-radius-size-small * 2)
            > .__sun-design-range-progress__
                right: unset
                top: 'calc(%s + (100% - %s) * (1 - var(--Percentage)))' % (border-radius-size-small border-radius-size-small * 2)
        
        &[data-size="normal"] > .__sun-design-range-nob-container__ 
            > .__sun-design-range-nob__
                width: size-normal
                height: border-radius-size-normal * 2
                left: 50%
                right: 50%
                transform: translate(-50%)
                top: unset
                bottom: 'calc(var(--Percentage) * (100% - %s))' % (@height)
            > .__sun-design-range-tick__
                left: padding-extend-normal
                right: padding-extend-normal
                width: unset
                height: 0
                border-top: solid-border
                transform: translate(0, -50%);
                top: 'calc(%s + (100% - %s) * (1 - var(--TickPercentage)))' % (border-radius-size-normal border-radius-size-normal * 2)
            > .__sun-design-range-progress__
                right: unset
                top: 'calc((100% - %s) * (1 - var(--Percentage)))' % ( border-radius-size-normal * 2)
            
        &[data-size="large"] > .__sun-design-range-nob-container__ 
            > .__sun-design-range-nob__
                width: size-large
                height: border-radius-size-large * 2
                left: 50%
                right: 50%
                transform: translate(-50%)
                top: unset
                bottom: 'calc(var(--Percentage) * (100% - %s))' % (@height)
            > .__sun-design-range-tick__
                left: padding-extend-large
                right: padding-extend-large
                width: unset
                height: 0
                border-top: solid-border
                transform: translate(0, -50%);
                top: 'calc(%s + (100% - %s) * (1 - var(--TickPercentage)))' % (border-radius-size-large border-radius-size-large * 2)
            > .__sun-design-range-progress__
                right: unset
                top: 'calc(%s + (100% - %s) * (1 - var(--Percentage)))' % (border-radius-size-large border-radius-size-large * 2)

.__sun-design-range-nob-container__
    position: absolute
    inset: 0
    
    .__sun-design-range-container__.bordered > &
        // margin: - border-width
    
    border-radius: inherit

.__sun-design-range-progress__
    position: absolute
    width: 100%
    height: 100%
    // border-radius: border-radius-size-normal - border-width
    background-color: var(--color-active)

    .__sun-design-range-container__.disabled > .__sun-design-range-nob-container__ > &
        background-color: var(--color-active-disabled)

.__sun-design-range-tick__
    position: absolute
    border-color: var(--placeholder-color)

    .__sun-design-range-container__.disabled > .__sun-design-range-nob-container__ > &
        border-color: var(--placeholder-color-disabled) !important

.__sun-design-range-nob__
    position: absolute
    display: flex

</style>