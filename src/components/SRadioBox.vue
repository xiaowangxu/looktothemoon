<template>
    <div class="__s__ __s_radiobox_container__">
        <input ref="input_dom" class="__s__ __s_radiobox__ __s_color__" type="radio"
            :style="{ '--SColor': color, '--STextColor': checkedColor }" :checked="value_model" :disabled="disabled"
            @input="emits('input', $event);"
            @change="emits('change', $event); value_model = ($event.target as HTMLInputElement).checked;"
            @focus="emits('focus', $event);" @blur="emits('blur', $event);" />
    </div>
</template>

<script setup lang="ts">

import './SStyle.css';
import { useVModel } from '@vueuse/core';
import { useHtmlElementFocusBlur, type BasicTypes } from './SConst';
import { ref } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        value?: boolean,
        label?: BasicTypes,
        color?: string,
        checkedColor?: string,
        disabled?: boolean,
    }>(),
    {
        value: false,
        color: 'var(--ThemeDisabledBaseColor)',
        checkedColor: 'var(--ThemeColor)',
        disabled: false,
    }
);

// emits
const emits = defineEmits<{
    input: [event: Event],
    change: [event: Event],
    focus: [event: Event],
    blur: [event: Event],
    'update:value': [value: boolean],
}>();

// datas
const input_dom = ref<HTMLInputElement>();

// models
const value_model = useVModel(props, 'value', emits);

// methods
const { focus, blur } = useHtmlElementFocusBlur(input_dom);

// exposes
defineExpose({
    inputElement: input_dom,
    focus, blur,
});

</script>

<style>
.__s_radiobox_container__ {
    width: calc(var(--NormalMinSize) - var(--MediumPaddingSize) * 2);
    min-width: calc(var(--NormalMinSize) - var(--MediumPaddingSize) * 2);
    height: var(--NormalMinSize);
    min-height: var(--NormalMinSize);
    padding: var(--MediumPaddingSize) 0px;
    box-sizing: border-box;
}

.__s_radiobox__ {
    appearance: none;
    border-radius: 50%;
    margin: 0;
    width: 100%;
    height: 100%;
}

.__s_radiobox__.__s_color__:active {
    background-color: var(--SColorHover);
}

.__s_radiobox__.__s_color__:active:disabled {
    background-color: var(--ThemeDisabledBGColor);
}

.__s_radiobox__:checked,
.__s_radiobox__:checked:hover {
    background-color: var(--ThemeOppositeColor);
    border: calc((var(--NormalMinSize) - var(--MediumPaddingSize) * 2) / 4) solid var(--STextColorActive);
}

.__s_radiobox__.__s_color__:checked:focus,
.__s_radiobox__.__s_color__:checked:focus-visible {
    outline-color: var(--STextColorFocus);
}

.__s_radiobox__:checked:disabled,
.__s_radiobox__:checked:active:disabled {
    background-color: var(--ThemeOppositeColor);
    border: calc((var(--NormalMinSize) - var(--MediumPaddingSize) * 2) / 4) solid var(--STextColorActiveDisabled);
}
</style>