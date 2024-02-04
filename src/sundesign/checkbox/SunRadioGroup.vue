<template>
    <slot />
</template>

<script setup lang="ts">

import { SunRadioGroupInjection } from './SunRadioGroupConstants';
import { provide } from 'vue';
import { useInputModel, type UID } from '../SunDesignConstants';

// props
const props = withDefaults(
    defineProps<{
        modelValue: UID | undefined,
        modelModifiers?: Record<string, boolean>,
    }>(),
    {}
);

// emits
const emits = defineEmits<{
    (event: 'update:modelValue', val: UID | undefined): void,
    (event: 'change', val: UID | undefined): void,
}>();

const { value, setValueOnChange } = useInputModel(props, 'modelValue', 'modelModifiers', emits, { forceUpdate: true, emitChange: 'change' });

provide(SunRadioGroupInjection, {
    value: value,
    toggle(val: UID | undefined) {
        setValueOnChange(val);
    },
});

</script>