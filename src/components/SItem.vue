<template>
    <slot />
    <div v-memo="[label]"></div>
</template>

<script setup lang="ts">

import { type BasicTypes } from './SConst';

// props
const props = defineProps<{
    label: BasicTypes,
    color?: string,
    disabled?: boolean,
}>();

</script>