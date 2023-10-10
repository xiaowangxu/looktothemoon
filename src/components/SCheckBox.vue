<template>
    <div class="__s__ __s_checkbox_container__">
        <input class="__s__ __s_checkbox__ __s_color__" type="checkbox" :style="{ '--SColor': color }" :value="value_model"
            @input="emits('input', $event);"
            @change="emits('change', $event); value_model = ($event.target as HTMLInputElement).checked;"
            @focus="emits('focus', $event);" @blur="emits('blur', $event);" />
    </div>
</template>

<script setup lang="ts">

import { useVModel } from '@vueuse/core';
import './SStyle.css';

// props
const props = withDefaults(
    defineProps<{
        value?: boolean,
        color?: string,
    }>(),
    {
        value: false,
        color: 'var(--ThemeDisabledBaseColor)',
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

</script>

<style>
.__s_checkbox_container__ {
    width: calc(var(--NormalMinSize) - var(--MediumPaddingSize) * 2);
    min-width: calc(var(--NormalMinSize) - var(--MediumPaddingSize) * 2);
    height: var(--NormalMinSize);
    min-height: var(--NormalMinSize);
    padding: var(--MediumPaddingSize) 0px;
    box-sizing: border-box;
}

.__s_checkbox__ {
    appearance: none;
    border-radius: 50%;
    margin: 0;
    width: 100%;
    height: 100%;
}

.__s_checkbox__.__s_color__:active,
.__s_checkbox__:checked {
    background-color: var(--ThemeOppositeColor);
    border: var(--FocusOutlineWidth) solid var(--SColorActive);
}

.__s_checkbox__:checked:hover {
    background-color: var(--ThemeOppositeColor);
    border-color: var(--SColorActiveHover);
}
</style>