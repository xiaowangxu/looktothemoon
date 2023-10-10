<template>
    <SLineEdit :color="color" :align-text="alignText" :value="show_text" :focus-select-all="focusSelectAll"
        @focus="emits('focus', $event); on_Focus();" @blur="emits('blur', $event); on_Blur();"
        @input="(evt) => { emits('input', evt); on_Input(evt, false); }"
        @change="(evt) => { emits('change', evt); on_Input(evt, true); }" />
</template>

<script setup lang="ts">

import SLineEdit from './SLineEdit.vue'; import './SStyle.css';
import { type Alignment, fixNumberString } from './SConst';
import { computed, onMounted, ref, watch } from 'vue';
import { useVModel } from '@vueuse/core';

// props
interface Props {
    value?: number,
    min?: number,
    max?: number,
    lazy?: boolean,
    color?: string,
    format?: (value: number) => string,
    alignText?: Alignment,
    focusSelectAll?: boolean,
    prefix?: string,
    suffix?: string,
    fixDigits?: number,
    precisionDigits?: number,
    showEndZeros?: boolean,
}
const props = withDefaults(
    defineProps<Props>(),
    {
        value: 0,
        lazy: false,
        color: 'var(--ThemeDisabledBaseColor)',
        alignText: 'center',
        focusSelectAll: true,
        suffix: ' 毫米',
        fixDigits: 3,
        precisionDigits: 3,
        showEndZeros: true,
    }
);

// emits
const emits = defineEmits<{
    input: [event: Event],
    change: [event: Event],
    focus: [event: Event],
    blur: [event: Event],
    'update:value': [value: number]
}>();

// models
const value_model = useVModel(props, 'value', emits);

// datas
const is_editing = ref(false);
const real_value = ref<number>(0);
const fix_text = computed(() => props.format?.(real_value.value) ?? fixNumberString(real_value.value, props.fixDigits, props.showEndZeros));
const show_text = ref<string>();
const full_text = computed(() => `${props.prefix ?? ''}${fix_text.value}${props.suffix ?? ''}`);
onMounted(() => {
    show_text.value = full_text.value;
});
watch(value_model, () => {
    real_value.value = clamp(value_model.value, props.min, props.max);
    if (is_editing.value) {
        on_Focus();
    }
    else {
        on_Blur();
    }
}, { immediate: true });

// methods
function clamp(n: number, min: number | undefined, max: number | undefined) {
    if (min !== undefined) {
        n = Math.max(min, n);
    }
    if (max !== undefined) {
        n = Math.min(max, n);
    }
    return n;
}
function parse_Number(text: string) {
    // try {
    //     const calc = new Function('global', `with(global) return ${text};`);
    //     const global = { window: null, console: null, document: null };
    //     const value = calc(global);
    //     console.log("value calculated: ", value);
    // }
    // catch {

    // }
    try {
        const value = parseFloat(text);
        if (isNaN(value) || !isFinite(value)) throw new Error('Nan');
        const round_value = parseFloat(value.toFixed(props.precisionDigits));
        return { valid: true, value: clamp(round_value, props.min, props.max) };
    }
    catch {
        return { valid: false, value: 0 };
    }
}
function on_Focus() {
    is_editing.value = true;
    show_text.value = real_value.value.toString();
}
function on_Blur() {
    show_text.value = full_text.value;
    is_editing.value = false;
}
function on_Input(evt: Event, lazy: boolean = false) {
    const text = (evt.target as HTMLInputElement).value;
    if (props.lazy === lazy) {
        const { valid, value } = parse_Number(text);
        console.log(text, real_value.value, valid, value);
        if (valid) {
            real_value.value = value;
            value_model.value = real_value.value;
        }
    }
    if (lazy) {
        (evt.target as HTMLInputElement).blur();
    }
}

</script>

<style></style>