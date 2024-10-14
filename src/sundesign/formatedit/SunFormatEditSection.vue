<template>
    <span ref="input_span_ref"
        class="__sun-design__ __sun-design-formatedit-section__ __sun-design-formatedit-section-input__" contenteditable
        @keydown="onInputKeyDown" @mousedown="clicked = true" @focus="onInputFocused" @blur="onInputBlur"
        @input="onInput">{{
            value }}</span>
    <span v-if="$slots.default !== undefined" @click="click">
        <slot name="default"></slot>
    </span>
</template>

<script setup lang="ts">

import { useInputModel } from '../SunDesignConstants';
import '../SunDesignStyle.styl';
import { ref } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        focusAll?: boolean,
        // value
        modelValue: string,
        modelModifiers?: Record<string, boolean>,
        format?: (old_value: string, new_value: string) => string,
    }>(),
    {
        focusAll: true,
    }
);

// emits
const emits = defineEmits<{
    (event: 'update:modelValue', value: string): void,
    (event: 'input', val: string): void,
    (event: 'change', val: string): void,
}>();

const input_span_ref = ref<HTMLSpanElement | null>(null);
const clicked = ref(false);

const { value, startInput, setValueOnInput, setValueOnChange } = useInputModel(props, 'modelValue', 'modelModifiers', emits, { emitInput: 'input', emitChange: 'change', forceChangeEqualityCheck: true });

// methods
function click() {
    if (document.activeElement !== input_span_ref.value) {
        focusAll();
    }
}

function onInputKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const children = [...(event.target as HTMLSpanElement).parentElement!.children].filter(c => c.classList.contains('__sun-design-formatedit-section__'));
        const index = children.indexOf((event.target as HTMLSpanElement));
        if (index < 0 || index >= children.length - 1) {
            (event.target as HTMLSpanElement).blur();
        }
        else {
            focusAll(children[index + 1] as HTMLSpanElement);
        }
    }
}

function onInput(event: Event) {
    const new_value = input_span_ref.value?.textContent ?? '';
    let format_value = new_value;
    if (props.format !== undefined) {
        format_value = props.format(value.value, new_value);
    }
    setValueOnInput(format_value);
}

function onInputFocused(event: FocusEvent) {
    if (!clicked.value || props.focusAll) {
        focusAll();
    }
    clicked.value = false;
    startInput();
}

function onInputBlur() {
    document.getSelection()?.removeAllRanges();
    const new_value = input_span_ref.value?.textContent ?? '';
    let format_value = new_value;
    if (props.format !== undefined) {
        format_value = props.format(value.value, new_value);
        if (input_span_ref.value !== null) {
            input_span_ref.value.textContent = format_value;
        }
    }
    setValueOnChange(format_value);
}

function focusAll(node: HTMLSpanElement | undefined = undefined) {
    const input = node ?? input_span_ref.value as (HTMLSpanElement | null);
    if (input === null) return;
    const range = new Range();
    range.selectNodeContents(input);
    document.getSelection()?.removeAllRanges();
    document.getSelection()?.addRange(range);
}

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-formatedit-section__
    font-size: inherit
    padding: 0px padding-normal
    border-radius: border-radius-size-small
    &:focus
        color: font-color-active
        background-color: color-active
    
.__sun-design-formatedit-section-input__
    font-size: inherit
    outline: none

</style>