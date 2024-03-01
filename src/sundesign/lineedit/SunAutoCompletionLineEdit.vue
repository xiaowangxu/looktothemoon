<template>
    <SunLineEdit ref="lineedit_ref" :model-value="modelValue" @focus="show_completion = true" @blur="onBlur" v-bind="$attrs"
        @update:model-value="onUpdateModelValue" @input="onInput" @change="onChange" />
    <SunCompletion v-if="show_completion" ref="completion_ref" :options="options" :keyword="modelValue"
        :get-popup-rect="getPopupRect" @click-outside="show_completion = false" @confirm="onConfirm">
        <template v-if="$slots.item !== undefined" #item="item">
            <slot name="item" v-bind="item" />
        </template>
        <template v-if="$slots.empty !== undefined" #empty>
            <slot name="empty" />
        </template>
        <template v-if="$slots.info !== undefined" #info>
            <slot name="info"  />
        </template>
        <template v-if="$slots.append !== undefined" #append="append">
            <slot name="append" v-bind="append" />
        </template>
    </SunCompletion>
</template>

<script setup lang="ts">

import SunLineEdit from './SunLineEdit.vue';
import SunCompletion, { type CompletionItem } from '../completion/SunCompletion.vue';
import { ref } from 'vue';
import { calcButtonPopupRect, type BoxSize, type Rect } from '../SunDesignConstants';

// props
const props = withDefaults(
    defineProps<{
        modelValue: string,
        modelModifiers?: Record<string, boolean>,
        options: CompletionItem[],
    }>(),
    {

    }
);

// slots
defineSlots<{
    info(props: {}): void,
    empty(props: {}): void,
    item(props: { item: CompletionItem }): void,
    append(props: { selected: CompletionItem | undefined }): void,
}>();

// emits
const emits = defineEmits<{
    (event: 'update:modelValue', data: string): void,
    (event: 'input', val: string): void,
    (event: 'change', val: string): void,
}>();

// datas
const lineedit_ref = ref<InstanceType<typeof SunLineEdit>>();
const completion_ref = ref<InstanceType<typeof SunCompletion>>();
const show_completion = ref(false);
function getPopupRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect {
    const { x, y, width, height } = (lineedit_ref.value?.input as HTMLInputElement)?.getBoundingClientRect() ?? { x: 0, y: 0, width: 0, height: 0 };
    return calcButtonPopupRect({ x, y, width, height }, contentMinSize, windowSize, 0);
    // return { x: 100, y: 100, width: 400, height: contentMinSize.height };
}

function onBlur(evt: FocusEvent) {
    const rel_target = evt.relatedTarget;
    if (rel_target === null || !(completion_ref.value?.isContainedEvent(rel_target as Node) ?? false)) {
        show_completion.value = false;
        return;
    }
}

function onUpdateModelValue(data: string) {
    emits('update:modelValue', data);
}

function onInput(data: string) {
    show_completion.value = true;
    emits('input', data);
}

function onChange(data: string) {
    emits('change', data);
}

function onConfirm(item: CompletionItem | undefined) {
    if (item === undefined) return;
    onUpdateModelValue(item.label ?? props.modelValue);
    show_completion.value = false;
}

</script>