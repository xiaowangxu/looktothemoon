<template>
    <slot />
</template>

<script setup lang="ts">

import { type LabelTypes } from './SConst';

// props
const props = defineProps<{
    label: LabelTypes,
    color?: string,
    active?: boolean,
    disabled?: boolean,
    description?: string,
    uid?: string | number | symbol | undefined,
}>();

</script>