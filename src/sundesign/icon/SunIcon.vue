<template>
    <component class="__sun-design__ __sun-design-icon__" :is="icon" :color="color" />
</template>

<script setup lang="ts">

import { computed } from 'vue';
import * as icons from "lucide-vue-next";

// props
const props = defineProps<{
    name: string,
    color?: string,
}>();

// data
const icon = computed(() => (icons as any)[props.name] as string);

</script>

