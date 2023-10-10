<template>
    <input ref="lineedit_dom" class="__s__ __s_color__ __s_lineedit__" data-s-min-size="normal"
        :style="{ '--SColor': color, '--STextColor': textColor ?? color, textAlign: align_text }" :value="value_model"
        @input="emits('input', $event); on_Input(false);" @change="emits('change', $event); on_Input(true);"
        @focus="emits('focus', $event); on_Focus();" @blur="emits('blur', $event);">
</template>

<script setup lang="ts">

import './SStyle.css';
import { type Alignment, useTextAligmentCss } from './SConst';
import { nextTick, ref, toRef } from 'vue';
import { useVModel } from '@vueuse/core';

// props
const props = withDefaults(
    defineProps<{
        value?: string,
        lazy?: boolean,
        color?: string,
        textColor?: string,
        alignText?: Alignment,
        focusSelectAll?: boolean,
    }>(),
    {
        value: '',
        lazy: false,
        color: 'var(--ThemeDisabledBaseColor)',
        alignText: 'start',
        focusSelectAll: false,
    }
);

// emits
const emits = defineEmits<{
    input: [event: Event],
    change: [event: Event],
    focus: [event: Event],
    blur: [event: Event],
    'update:value': [value: string],
}>();

// models
const value_model = useVModel(props, 'value', emits);

// datas
const lineedit_dom = ref<HTMLInputElement>();
const align_text = useTextAligmentCss(toRef(props, 'alignText'));

// methods
function on_Focus() {
    if (lineedit_dom.value) {
        const lineedit = lineedit_dom.value;
        if (props.focusSelectAll) {
            nextTick(() => {
                lineedit.setSelectionRange(0, lineedit.value.length);
            });
        }
    }
}
function on_Input(lazy: boolean = false) {
    if (props.lazy === lazy && lineedit_dom.value) {
        const lineedit = lineedit_dom.value;
        value_model.value = lineedit.value;
    }
}

</script>

<style>
.__s_lineedit__ {
    appearance: none;
    text-wrap: nowrap;
    min-width: fit-content;
    border: none;
    border-radius: var(--NormalRadius);
    padding: var(--NormalPaddingSize) calc(var(--NormalPaddingSize) + 4px);
    box-sizing: border-box;

}

.__s_lineedit__.__s_color__ {
    color: var(--STextColor);
}

.__s_lineedit__.__s_color__:hover,
.__s_lineedit__.__s_color__:active {
    background-color: var(--SColorHover);
    color: var(--STextColor);
}

.__s_lineedit__.__s_color__:disabled {
    background-color: var(--ThemeDisabledBGColor);
    color: var(--ThemeDisabledColor);
}
</style>