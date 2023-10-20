<template>
    <slot />
</template>

<script setup lang="ts">

import { type LabelTypes, type UID } from './SConst';

export type Item = {
    label: LabelTypes,
    color?: string,
    active?: boolean,
    disabled?: boolean,
    description?: string,
    uid?: UID,
    icon?: string,
};

// props
const props = defineProps<{
    label: LabelTypes,
    color?: string,
    active?: boolean,
    disabled?: boolean,
    description?: string,
    uid?: UID,
    icon?: string,
}>();

</script>