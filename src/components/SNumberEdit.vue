<template>
    <SLineEdit ref="slineedit_ref" :color="color" :text-color="textColor" :align-text="alignText" :value="show_text"
        :focus-select-all="false" @focus="emits('focus', $event); on_Focus();" @blur="emits('blur', $event); on_Blur();"
        @input="(evt) => { emits('input', evt); on_Input(evt, false); }"
        @change="(evt) => { emits('change', evt); on_Input(evt, true); }" />
</template>

<script setup lang="ts">

import SLineEdit from './SLineEdit.vue'; import './SStyle.css';
import { type Alignment, fixNumberString, useComponentRefFocusBlur } from './SConst';
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { useVModel } from '@vueuse/core';

// props
interface Props {
    value?: number,
    min?: number,
    max?: number,
    lazy?: boolean,
    color?: string,
    textColor?: string,
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
        fixDigits: 3,
        precisionDigits: 3,
        showEndZeros: false,
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

// datas
const slineedit_ref = ref<InstanceType<typeof SLineEdit>>();
const is_editing = ref(false);
const real_value = ref<number>(0);
const fix_text = computed(() => props.format?.(real_value.value) ?? fixNumberString(real_value.value, props.fixDigits, props.showEndZeros));
const show_text = ref<string>();
onMounted(() => {
    show_text.value = full_text.value;
});
const full_text = computed(() => `${props.prefix ?? ''}${fix_text.value}${props.suffix ?? ''}`);

// models
const value_model = useVModel(props, 'value', emits);
watch(value_model, () => {
    real_value.value = clamp(value_model.value, props.min, props.max);
}, { immediate: true });

// methods
function clamp(n: number, min: number | undefined, max: number | undefined, round_to_precision: boolean = true) {
    if (min !== undefined) {
        n = Math.max(min, n);
    }
    if (max !== undefined) {
        n = Math.min(max, n);
    }
    return round_to_precision ? parseFloat(n.toFixed(props.precisionDigits)) : n;
}
function parse_Number(text: string) {
    try {
        const value = parseFloat(text);
        if (isNaN(value) || !isFinite(value)) throw new Error('Nan');
        return { valid: true, value: clamp(value, props.min, props.max) };
    }
    catch {
        return { valid: false, value: 0 };
    }
}
function on_Focus() {
    is_editing.value = true;
    show_text.value = real_value.value.toString();
    if (props.focusSelectAll) {
        nextTick(() => {
            if (slineedit_ref.value && slineedit_ref.value.inputElement) {
                const input_element = slineedit_ref.value.inputElement;
                input_element.setSelectionRange(0, input_element.value.length);
            }
        });
    }
}
function on_Blur() {
    show_text.value = full_text.value;
    is_editing.value = false;
}
function on_Input(evt: Event, lazy: boolean = false) {
    const text = (evt.target as HTMLInputElement).value;
    if (props.lazy === lazy) {
        const { valid, value } = parse_Number(text);
        // console.log(text, real_value.value, valid, value);
        if (valid) {
            real_value.value = value;
            value_model.value = real_value.value;
            show_text.value = text;
        }
    }
    if (lazy) {
        (evt.target as HTMLInputElement).blur();
    }
}
const { focus, blur } = useComponentRefFocusBlur<typeof SLineEdit>(slineedit_ref);

// exposes
defineExpose({
    inputElement: computed(() => slineedit_ref.value?.inputElement),
    focus, blur,
});

</script>

<style></style>