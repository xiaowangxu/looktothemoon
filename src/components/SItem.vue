<template>
    <slot />
</template>

<script setup lang="ts">

import { type LabelTypes } from './SConst';

// props
const props = defineProps<{
    label: LabelTypes,
    color?: string,
    disabled?: boolean,
    description?: string,
}>();

</script>