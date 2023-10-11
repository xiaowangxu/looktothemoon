<template>
    <div class="__s__ __s_checkbox_container__">
        <input ref="input_dom" class="__s__ __s_checkbox__ __s_color__" type="checkbox"
            :style="{ '--SColor': color, '--STextColor': checkedColor }" :checked="value_model" :disabled="disabled"
            @input="emits('input', $event);"
            @change="emits('change', $event); value_model = ($event.target as HTMLInputElement).checked;"
            @focus="emits('focus', $event);" @blur="emits('blur', $event);" />
        <div class="__s_checkbox_icon__">
            <slot>
                <Check />
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">

import './SStyle.css';
import { useVModel } from '@vueuse/core';
import { ref } from 'vue';
import { useHtmlElementFocusBlur, type BasicTypes } from './SConst';
import { Check } from 'lucide-vue-next';

// props
const props = withDefaults(
    defineProps<{
        value?: boolean,
        label?: BasicTypes,
        color?: string,
        checkedColor?: string,
        disabled?: boolean
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
.__s_checkbox_container__ {
    width: calc(var(--NormalMinSize) - var(--MediumPaddingSize) * 2);
    min-width: calc(var(--NormalMinSize) - var(--MediumPaddingSize) * 2);
    height: var(--NormalMinSize);
    min-height: var(--NormalMinSize);
    padding: var(--MediumPaddingSize) 0px;
    box-sizing: border-box;
    position: relative;
}

.__s_checkbox__ {
    appearance: none;
    border-radius: var(--SquareRadius);
    margin: 0;
    width: 100%;
    height: 100%;
}

.__s_checkbox_icon__ {
    pointer-events: none;
    position: absolute;
    width: 100%;
    height: 100%;
    inset: 0px;
    box-sizing: border-box;
}

.__s_checkbox_icon__>* {
    width: 100%;
    height: 100%;
}

.__s_checkbox__.__s_color__:active {
    background-color: var(--SColorHover);
}

.__s_checkbox__.__s_color__:checked {
    background-color: var(--STextColorActive);
}

.__s_checkbox__+.__s_checkbox_icon__,
.__s_checkbox__.__s_color__:active+.__s_checkbox_icon__,
.__s_checkbox__.__s_color__:active:disabled+.__s_checkbox_icon__ {
    visibility: hidden;
}

.__s_checkbox__:checked+.__s_checkbox_icon__,
.__s_checkbox__.__s_color__:checked:active+.__s_checkbox_icon__,
.__s_checkbox__.__s_color__:checked:active:disabled+.__s_checkbox_icon__ {
    visibility: visible;
}

.__s_checkbox__:checked+.__s_checkbox_icon__,
.__s_checkbox__:checked:hover+.__s_checkbox_icon__,
.__s_checkbox__.__s_color__:active+.__s_checkbox_icon__ {
    color: var(--ThemeOppositeColor);
}

.__s_checkbox__.__s_color__:focus,
.__s_checkbox__.__s_color__:focus-visible {
    outline-color: var(--SColorFocus);
}

.__s_checkbox__.__s_color__:checked:focus,
.__s_checkbox__.__s_color__:checked:focus-visible {
    outline-color: var(--STextColorFocus);
}

.__s_checkbox__:checked:hover {
    background-color: var(--STextColorActiveHover);
}

.__s_checkbox__.__s_color__:disabled:checked {
    background-color: var(--STextColorActiveDisabled);
}

.__s_checkbox__.__s_color__:disabled {
    background-color: var(--ThemeDisabledBGColor);
}
</style>