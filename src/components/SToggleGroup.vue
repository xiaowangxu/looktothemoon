<template>
    <div class="__s__ __s_checkradiogroup__">
        <slot :toggle="toggle" />
    </div>
</template>

<script setup lang="ts">

import { onMounted, ref } from 'vue';
import { useVModel } from '@vueuse/core';
import type { BasicTypes } from './SConst';

// props
const props = withDefaults(
    defineProps<{
        value?: BasicTypes,
    }>(),
    {}
);

// emits
const emits = defineEmits<{
    'update:value': [value: BasicTypes],
}>();

// datas
const boxes_ref = ref<[]>();
onMounted(() => {
    console.log(boxes_ref.value);
})

// models
const value_model = useVModel(props, "value", emits);

// slots
defineSlots<{
    default(props: { toggle: typeof toggle }): void,
}>();

// methods
function toggle(checked: boolean, label: BasicTypes) {
    if (checked) {
        value_model.value = label;
    }
}

</script>

<style></style>