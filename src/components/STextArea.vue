<template>
    <textarea ref="textarea_dom" class="__s__ __s_color__ __s_lineedit__" data-s-min-size="normal"
        :style="{ '--SColor': color, '--STextColor': textColor ?? color, textAlign: align_text }" :value="value_model"
        @input="emits('input', $event); on_Input(false);" @change="emits('change', $event); on_Input(true);"
        @focus="emits('focus', $event); on_Focus();" @blur="emits('blur', $event);" />
</template>

<script setup lang="ts">

import './SStyle.css';
import { type Alignment, useTextAligmentCss, useHtmlElementFocusBlur } from './SConst';
import { ref, toRef } from 'vue';
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
const textarea_dom = ref<HTMLInputElement>();
const align_text = useTextAligmentCss(toRef(props, 'alignText'));

// methods
function on_Focus() {
    if (textarea_dom.value) {
        const lineedit = textarea_dom.value;
        if (props.focusSelectAll) {
            lineedit.setSelectionRange(0, lineedit.value.length);
        }
    }
}
function on_Input(lazy: boolean = false) {
    if (props.lazy === lazy && textarea_dom.value) {
        const lineedit = textarea_dom.value;
        value_model.value = lineedit.value;
    }
}
const { focus, blur } = useHtmlElementFocusBlur(textarea_dom);

// exposes
defineExpose({
    textareaElement: textarea_dom,
    focus, blur,
});

</script>

<style></style>