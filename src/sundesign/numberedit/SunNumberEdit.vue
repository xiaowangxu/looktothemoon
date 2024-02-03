<template>
    <template v-if="!inputing || disabled || !allowInput">
        <SunButton class="__sun-design-numberedit-container__ no-pressed-color"
            :class="{ hover, dragging, 'no-hover-color': dragging }" :size="size" :flat="flat" :color-scheme="colorScheme"
            :border-mask="borderMask" @mousedown="onContainerMouseDown" @click="onClick" :disabled="disabled">
            <button v-if="show_step_button" :disabled="disabled || !show_decrease"
                class="__sun-design__ __sun-design-numberedit-dec__ __sun-design-button-like__ colored"
                :class="{ bordered: !flat, dragging }" :data-size="size" @mousedown.stop @click.stop="decrease">
                <slot name="decrease">
                    <ChevronLeft />
                </slot>
            </button>
            <div class="__sun-design-numberedit-display-container__" :class="{ 'step-button': show_step_button }">
                <span class="__sun-design__ __sun-design-numberedit-display__" :data-size="size">
                    <span v-if="$slots.prefix !== undefined" class="__sun-design-numberedit-prefix__" :class="{ disabled }">
                        <slot name="prefix" />
                    </span>
                    <span class="__sun-design-numberedit-value__">{{ display_value }}</span>
                    <span v-if="$slots.suffix !== undefined" class="__sun-design-numberedit-suffix__" :class="{ disabled }">
                        <slot name="suffix" />
                    </span>
                </span>
            </div>
            <button v-if="show_step_button" :disabled="disabled || !show_increase"
                class="__sun-design__ __sun-design-numberedit-inc__ __sun-design-button-like__ colored"
                :class="{ bordered: !flat, dragging }" :data-size="size" @mousedown.stop @click.stop="increase">
                <slot name="increase">
                    <ChevronRight />
                </slot>
            </button>
        </SunButton>
    </template>
    <template v-else>
        <form class="__sun-design__ __sun-design_numberedit-input-container__ sized colored border-masked"
            :class="{ bordered: !flat, hover }" :data-size="size" :data-border-mask="borderMask"
            @submit.prevent="onSubmit(($event.target as any).label.value)" :style="colorScheme">
            <input ref="input_ref" name="label" class="__sun-design__ __sun-design-numberedit-input__" :class="{
                left: $slots.prefix === undefined && $slots.suffix !== undefined,
                right: $slots.prefix !== undefined && $slots.suffix === undefined,
            }" :value="inputEditFormatValue ? display_input_value : value"
                @blur="onSubmit(($event.target as any).value)" @input="onInput(($event.target as any).value)" />
        </form>
    </template>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunButton from '../button/SunButton.vue';
import { type Size, type BorderMask, type ColorScheme, useInputModel } from '../SunDesignConstants';
import { validateExpression, evalExpression } from './SunNumberEditConstants';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref, watch } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        flat?: boolean,
        borderMask?: BorderMask,
        hover?: boolean,
        disabled?: boolean,
        colorScheme?: ColorScheme,
        stepButton?: boolean,
        allowInput?: boolean,
        allowDrag?: boolean,
        inputEditFormatValue?: boolean,
        displayPercision?: number,
        displayRemoveTailingZeros?: boolean,
        displayFormatter?: (val: number) => string,
        // value
        modelValue: number,
        modelModifiers?: Record<string, boolean>,
        min?: number,
        max?: number,
        step?: number,
        allowLess?: boolean,
        allowGreater?: boolean,
        dragFactor?: number,
        dragFineFactor?: number,
        valueSnapBase?: number,
        valueSnapGap?: number,
    }>(),
    {
        size: 'normal',
        flat: false,
        borderMask: 15,
        hover: false,
        disabled: false,
        stepButton: true,
        allowDrag: true,
        allowInput: true,
        inputEditFormatValue: true,
        displayRemoveTailingZeros: false,
        // value
        allowLess: false,
        allowGreater: false,
        dragFactor: 0.5,
        dragFineFactor: 0.1,
        valueSnapBase: 0,
    }
);

// emits
const emits = defineEmits<{
    (event: 'update:modelValue', value: number): void,
    (event: 'input', val: string): void,
    (event: 'change', val: string): void,
}>();

const { value, setValueOnInput, setValueOnChange } = useInputModel(props, 'modelValue', 'modelModifiers', emits, { emitInput: 'input', emitChange: 'change' });

// datas
const show_step_button = computed(() => !(props.disabled ?? false) && props.stepButton && props.step !== undefined && props.step !== 0);
const show_increase = computed(() => props.allowGreater || props.max === undefined || value.value < props.max);
const show_decrease = computed(() => props.allowLess || props.min === undefined || value.value > props.min);
const display_input_value = computed(() => { return editableStringFormat(value.value); });
const display_value = computed(() => {
    if (!dragging.value && props.displayFormatter === undefined) return display_input_value.value;
    let val: number;
    if (dragging.value) val = dragging_new_value.value;
    else val = value.value;
    return props.displayFormatter === undefined ? editableStringFormat(val) : props.displayFormatter(val);
});

function editableStringFormat(val: number) {
    let s = props.displayPercision === undefined ? val.toString() : val.toFixed(props.displayPercision)
    if (!props.displayRemoveTailingZeros || !s.includes('.')) return s;
    s = s.replace(/0+$/, '');
    if (s.endsWith('.')) return s.slice(0, -1);
    return s;
}

function formatNumber(val: number) {
    val = Number.isNaN(val) ? 0 : val;
    // snap
    if (props.valueSnapGap !== undefined && props.valueSnapGap !== 0) {
        const g = val - props.valueSnapBase;
        val = props.valueSnapBase + Math.round(g / props.valueSnapGap) * props.valueSnapGap;
    }
    // clamp
    if (!props.allowLess && props.min !== undefined) {
        val = Math.max(props.min, val);
    }
    if (!props.allowGreater && props.max !== undefined) {
        val = Math.min(props.max, val);
    }
    return val;
}

function increase() {
    if (dragging.value) return;
    const val = formatNumber(value.value) + (props.step ?? 0);
    setValueSafe(val, true);
    setValueSafe(val, false);
}
function decrease() {
    if (dragging.value) return;
    const val = formatNumber(value.value) - (props.step ?? 0);
    setValueSafe(val, true);
    setValueSafe(val, false);
}

// dragging
const dragging = ref(false);
let last_mouse_pos = 0;
let last_value = 0;
let ignore_click = false;
const dragging_new_value = ref(0);
function onMouseDown(evt: MouseEvent) {
    if (!props.allowDrag) return;
    dragging.value = true;
    last_mouse_pos = evt.clientX;
    last_value = formatNumber(value.value);
    dragging_new_value.value = last_value;
    window.addEventListener('mousemove', onMouseMove, { capture: true });
    window.addEventListener('mouseup', onMouseUp, { capture: true });
}
function onMouseMove(evt: MouseEvent) {
    const delta = evt.clientX - last_mouse_pos;
    const d = delta * (evt.ctrlKey ? props.dragFineFactor : props.dragFactor) * (props.step ?? 1);
    const new_drag_value = formatNumber(last_value + d);
    if (new_drag_value === dragging_new_value.value) return;
    dragging_new_value.value = new_drag_value;
    setValueSafe(dragging_new_value.value);
}
function onMouseUp(evt: MouseEvent) {
    dragging.value = false;
    ignore_click = true;
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
function onContainerMouseMove(evt: MouseEvent) {
    removeContainerEvents();
    onMouseDown(evt);
}
function onContainerMouseUp(evt: MouseEvent) {
    onClick(evt);
    removeContainerEvents();
}
function removeContainerEvents() {
    window.removeEventListener('mousemove', onContainerMouseMove, { capture: true });
    window.removeEventListener('mouseup', onContainerMouseUp, { capture: true });
}

function onClick(evt: Event) {
    if (ignore_click) {
        ignore_click = false;
        return;
    }
    if (props.allowInput && !inputing.value) {
        inputing.value = true;
    }
}

// input
const inputing = ref(false);
const input_invalid = ref(false);
const input_ref = ref<HTMLInputElement | null>(null);
watch(input_ref, (input) => {
    if (input !== null) {
        input.focus();
        input.setSelectionRange(0, input.value.length);
    }
});

function onInput(str: string) {
    input_invalid.value = !validateExpression(str, ['x']);
    if (input_invalid.value) {
        input_ref.value?.classList?.add('invalid');
    }
    else {
        input_ref.value?.classList?.remove('invalid');
    }
}
function onSubmit(str: string) {
    if (inputing.value) {
        inputing.value = false;
        input_invalid.value = false;
        const val = evalExpression(str, { x: value.value }, value.value);
        setValueSafe(val, true);
        setValueSafe(val, false);
    }
}

function setValueSafe(val: number, input: boolean = true) {
    const n = formatNumber(val);
    if (input) {
        setValueOnInput(n);
    }
    else {
        setValueOnChange(n);
    }
}

onBeforeUnmount(() => {
    removeContainerEvents();
    removeDraggingEvents();
});

// exposes
defineExpose({
    setValueSafe,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design_numberedit-input-container__
    overflow: hidden
    display: inline-flex
    padding: 0 !important

    &:active
        background-color: var(--color-hover) !important
        color: var(--font-color-normal) !important

    &[data-size="small"] > .__sun-design-numberedit-input__
        padding: 0 padding-extend-small
    
    &[data-size="normal"] > .__sun-design-numberedit-input__
        padding: 0 padding-extend-normal

    &[data-size="large"] > .__sun-design-numberedit-input__
        padding: 0 padding-extend-large

.__sun-design-numberedit-input__
    text-align: center
    min-height: unset
    min-width: 0
    width: 0px
    flex: 1
    border: none
    outline: none
    background-color: transparent
    &.left
        text-align: start
    &.right
        text-align: end
    &.invalid
        text-decoration: underline red

.__sun-design-numberedit-display-container__
    // cursor: text
    display: flex
    flex-direction: row
    flex-wrap: nowrap
    flex: 1
    overflow: hidden
    gap: inherit
    justify-content: center
    align-items: center
    position: relative
    box-sizing: border-box
    align-self: stretch
    --Percentage: 0%

.__sun-design-numberedit-container__
    display: flex
    flex-direction: row
    flex-wrap: nowrap
    position: relative
    padding: 0 !important
    gap: 0 !important

    &:disabled, &.diasbled
        > .__sun-design-numberedit-display-container__
            cursor: not-allowed

    &[data-size="small"] > .__sun-design-numberedit-display-container__
        padding-left: padding-extend-small
        padding-right: padding-extend-small
        gap: gap-small

    &[data-size="normal"] > .__sun-design-numberedit-display-container__
        padding-left: padding-extend-normal
        padding-right: padding-extend-normal
        gap: gap-normal

    &[data-size="large"] > .__sun-design-numberedit-display-container__
        padding-left: padding-extend-large
        padding-right: padding-extend-large
        gap: gap-large

    &:hover, &.dragging
        &[data-size="small"] > .__sun-design-numberedit-display-container__.step-button
            padding-left: gap-small
            padding-right: gap-small
        &[data-size="normal"] > .__sun-design-numberedit-display-container__.step-button
            padding-left: gap-normal
            padding-right: gap-normal
        &[data-size="large"] > .__sun-design-numberedit-display-container__.step-button
            padding-left: gap-large
            padding-right: gap-large
        > .__sun-design-numberedit-dec__, > .__sun-design-numberedit-inc__
            display: inline-flex !important

.__sun-design-numberedit-display__
    flex: 1
    display: flex
    flex-wrap: nowrap
    overflow: hidden
    gap: inherit

.__sun-design-numberedit-dec__, .__sun-design-numberedit-inc__
    display: none !important
    padding: 0px
    border: none
    align-self: stretch
    align-items: center

.__sun-design-numberedit-dec__
    border-top: none !important
    border-left: none !important
    border-bottom: none !important
    // border-top-left-radius: inherit
    // border-bottom-left-radius: inherit
    &.dragging
        pointer-events: none

.__sun-design-numberedit-inc__
    border-top: none !important
    border-right: none !important
    border-bottom: none !important
    // border-top-right-radius: inherit
    // border-bottom-right-radius: inherit
    &.dragging
        pointer-events: none

.__sun-design-numberedit-prefix__
    text-wrap: nowrap
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis
    text-align: start
    color: var(--placeholder-color)
    flex-basis: 100%
    flex-grow: 0
    flex-shrink: 1
    justify-content: flex-start
    &.disabled
        color: var(--placeholder-color-disabled)

.__sun-design-numberedit-value__
    text-align: center
    text-wrap: nowrap
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis
    flex-grow: 1
    flex-shrink: 0

.__sun-design-numberedit-suffix__
    text-wrap: nowrap
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis
    text-align: end
    color: var(--placeholder-color)
    flex-basis: 100%
    flex-grow: 0
    flex-shrink: 1
    justify-content: flex-end
    &.disabled
        color: var(--placeholder-color-disabled)

</style>