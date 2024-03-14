<template>
    <SunPanel vertical class="__sun-design-angleedit-panel__" :class="{ disabled: disabled }" :drop-shadow="dropShadow"
        @mousedown.self="onWheelMouseDown" :trap-focus="false">
        <div ref="wheel_ref" class="__sun-design-angleedit-wheel__">
            <div class="__sun-design-angleedit-content-tick__ th0"></div>
            <div class="__sun-design-angleedit-content-tick__ th1"></div>
            <div class="__sun-design-angleedit-content-tick__ th2"></div>
            <div class="__sun-design-angleedit-content-tick__ th3"></div>
            <div class="__sun-design-angleedit-content-tick__ th4"></div>
            <div class="__sun-design-angleedit-content-tick__ th5"></div>
            <div class="__sun-design-angleedit-content-tick__ th6"></div>
            <div class="__sun-design-angleedit-content-tick__ th7"></div>
            <div class="__sun-design-angleedit-content-mask__">
                <SunButtonLike squared flat no-hover-color no-pressed-color :disabled="disabled">
                    <slot :deg="display_deg">
                        {{ display_deg.toFixed(0) }}°
                    </slot>
                </SunButtonLike>
            </div>
        </div>
        <button class="__sun-design__ colored bordered __sun-design-angleedit-content-nob__"
            :class="{ 'drop-shadow': dropShadow }" :style="{ '--Degree': `${display_deg}deg` }"
            @mousedown="onNobMouseDown" @keydown.arrow-left="decrease" @keydown.arrow-right="increase"
            @keydown.arrow-up="increase" @keydown.arrow-down="decrease" :disabled="disabled"></button>
    </SunPanel>
</template>

<script setup lang="ts">

import SunPanel from '../panel/SunPanel.vue';
import SunButtonLike from '../button/SunButtonLike.vue';
import { computed, onBeforeUnmount, ref } from 'vue';
import { useInputModel } from '../SunDesignConstants';

// props
const props = withDefaults(
    defineProps<{
        dropShadow?: boolean,
        disabled?: boolean,
        step?: number,
        min?: number,
        max?: number,
        valueSnapBase?: number,
        valueSnapGap?: number,
        modelValue: number,
        modelModifiers?: Record<string, boolean>,
    }>(),
    {
        dropShadow: false,
        disabled: false,
        step: 0,
        valueSnapBase: 0,
    }
);

// slot
defineSlots<{
    default(props: { deg: number }): void,
}>();

// emits
const emits = defineEmits<{
    (event: 'update:modelValue', value: number): void,
    (event: 'input', value: number): void,
    (event: 'change', value: number): void,
}>();

const { value, setValueOnInput, setValueOnChange } = useInputModel(props, 'modelValue', 'modelModifiers', emits, { emitInput: 'input', emitChange: 'change' });

// datas
const display_deg = computed(() => dragging.value ? dragging_new_deg.value : value.value);

const _dragging_new_deg = ref(0);
const dragging_new_deg = computed({
    get: () => _dragging_new_deg.value,
    set: (v) => {
        _dragging_new_deg.value = formatDegree(v);
    }
});

function normalizeDegree180(ang: number) {
    while (ang < -180) {
        ang += 360;
    }
    while (ang >= 180) {
        ang -= 360;
    }
    return ang;
}
function normalizeDegree360(ang: number) {
    while (ang < 0) {
        ang += 360;
    }
    return ang % 360;
}
function clampDegree(ang: number, min: number, max: number) {
    const n_min = normalizeDegree180(min - ang);
    const n_max = normalizeDegree180(max - ang);
    if (n_min <= 0 && n_max >= 0) return ang;
    if (Math.abs(n_min) < Math.abs(n_max)) return min;
    return max;
}
function formatDegree(val: number) {
    if (props.valueSnapGap !== undefined && props.valueSnapGap !== 0) {
        const g = val - props.valueSnapBase;
        val = props.valueSnapBase + Math.round(g / props.valueSnapGap) * props.valueSnapGap;
    }
    if (props.min !== undefined && props.max !== undefined) {
        val = clampDegree(val, props.min, props.max);
    }
    return normalizeDegree360(val);
}

function increase() {
    if (dragging.value) return;
    const val = formatDegree(value.value + Math.max(1, props.step ?? 0));
    if (val !== value.value) {
        setValueSafe(val, true);
        setValueSafe(val, false);
    }
}
function decrease() {
    if (dragging.value) return;
    const val = formatDegree(value.value - Math.max(1, props.step ?? 0));
    if (val !== value.value) {
        setValueSafe(val, true);
        setValueSafe(val, false);
    }
}

//#region wheel
const wheel_ref = ref<HTMLDivElement | null>(null);
let last_wheel_pos_x = 0, last_wheel_pos_y = 0;
const dragging = ref(false);
function onNobMouseDown(evt: MouseEvent) {
    if (props.disabled || wheel_ref.value === null) return;
    const wheel_rect = wheel_ref.value.getBoundingClientRect();
    last_wheel_pos_x = wheel_rect.x + wheel_rect.width / 2;
    last_wheel_pos_y = wheel_rect.y + wheel_rect.height / 2;
    dragging_new_deg.value = value.value
    dragging.value = true;
    window.addEventListener('mousemove', onNobMouseMove, { capture: true });
    window.addEventListener('mouseup', onNobMouseUp, { capture: true });
}
function onNobMouseMove(evt: MouseEvent) {
    const new_pos_x = evt.clientX - last_wheel_pos_x, new_pos_y = evt.clientY - last_wheel_pos_y;
    let _deg = Math.atan2(new_pos_y, new_pos_x) / Math.PI * 180;
    if (evt.shiftKey && props.step > 0) _deg = Math.round(_deg / props.step) * props.step;
    dragging_new_deg.value = _deg;
    setValueSafe(dragging_new_deg.value);
}
function onNobMouseUp(evt: MouseEvent) {
    dragging.value = false;
    removeNobDraggingEvents();
    setValueSafe(dragging_new_deg.value, false);
}
function removeNobDraggingEvents() {
    window.removeEventListener('mousemove', onNobMouseMove, { capture: true });
    window.removeEventListener('mouseup', onNobMouseUp, { capture: true });
}
// wheel container
function onWheelMouseDown(evt: MouseEvent) {
    window.addEventListener('mousemove', onWheelMouseMove, { capture: true });
    window.addEventListener('mouseup', onWheelMouseUp, { capture: true });
}
async function onWheelMouseMove(evt: MouseEvent) {
    dragging_new_deg.value = onWheelClick(evt, true);
    removeWheelEvents();
    onNobMouseDown(evt);
}
function onWheelMouseUp(evt: MouseEvent) {
    onWheelClick(evt, false);
    removeWheelEvents();
}
function onWheelClick(evt: MouseEvent, drag_start: boolean) {
    if (props.disabled || wheel_ref.value === null) return dragging_new_deg.value;
    const wheel_rect = wheel_ref.value.getBoundingClientRect();
    const wheel_center_x = wheel_rect.x + wheel_rect.width / 2, wheel_center_y = wheel_rect.y + wheel_rect.height / 2;
    const new_pos_x = evt.clientX - wheel_center_x, new_pos_y = evt.clientY - wheel_center_y;
    let _deg = Math.atan2(new_pos_y, new_pos_x) / Math.PI * 180;
    if (evt.shiftKey && props.step > 0) _deg = Math.round(_deg / props.step) * props.step;
    const val = formatDegree(_deg);
    if (drag_start) {
        setValueSafe(val);
    }
    else {
        setValueSafe(val);
        setValueSafe(val, false);
    }
    return val;
}
function removeWheelEvents() {
    window.removeEventListener('mousemove', onWheelMouseMove, { capture: true });
    window.removeEventListener('mouseup', onWheelMouseUp, { capture: true });
}
//#endregion

function setValueSafe(val: number, input: boolean = true) {
    if (input) {
        setValueOnInput(val);
    }
    else {
        setValueOnChange(val);
    }
}

onBeforeUnmount(() => {
    removeNobDraggingEvents();
    removeWheelEvents();
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

wheel-width = - border-width / 2 + panel-padding
nob-size = 16px
nob-width = 3px

.__sun-design-angleedit-panel__
    width: 70px
    min-width: 70px
    border-radius: 50% !important
    aspect-ratio: 1
    overflow: visible !important
    position: relative
    padding: panel-padding
    background-color: var(--attachment-color) !important
    &.disabled
        background-color: var(--attachment-color-disabled) !important

.__sun-design-angleedit-wheel__
    width: 100%
    height: 100%
    position: relative
    pointer-events: none

.__sun-design-angleedit-content-nob__
    --Degree: 45deg
    box-sizing: border-box
    width: nob-size
    padding: 0
    margin: 0
    aspect-ratio: 1
    position: absolute
    border-radius: 50%
    left: 'calc(50% + (100% - %s) / 2 * cos(var(--Degree)) - %s)' % (wheel-width nob-size / 2)
    top: 'calc(50% + (100% - %s) / 2 * sin(var(--Degree)) - %s)' % (wheel-width nob-size / 2)
    border: solid-border
    outline: none
    &.drop-shadow
        box-shadow: panel-drop-shadow

.__sun-design-angleedit-content-tick__
    position: absolute
    width: border-width
    background-color: var(--border-color-normal)
    height: 50%
    left: 'calc(50% - %s)' % (border-width / 2)
    transform-origin: 50% 100%
    &.th0
        transform: rotate(0deg)
    &.th1
        transform: rotate(45deg)
    &.th2
        transform: rotate(90deg)
    &.th3
        transform: rotate(135deg)
    &.th4
        transform: rotate(180deg)
    &.th5
        transform: rotate(225deg)
    &.th6
        transform: rotate(270deg)
    &.th7
        transform: rotate(315deg)

.__sun-design-angleedit-content-mask__
    position: absolute
    inset: 8px
    background-color: var(--attachment-color)
    .__sun-design-angleedit-panel__.disabled > .__sun-design-angleedit-wheel__ > &
        background-color: var(--attachment-color-disabled)
    border-radius: 50%
    display: flex
    align-items: center
    justify-content: center

</style>