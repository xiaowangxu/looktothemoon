<template>
    <component v-if="name !== ''" class="__sun-design__ __sun-design-icon__" :is="icon" :color="color" />
    <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
        class="__sun-design__ __sun-design-icon__">
    </svg>
</template>

<script setup lang="ts">

import { computed, type FunctionalComponent } from 'vue';
import * as icons from "lucide-vue-next";

// props
const props = defineProps<{
    name: string,
    color?: string,
}>();

// data
const icon = computed(() => props.name === '' ? undefined : (icons as any)[props.name] as FunctionalComponent | undefined);

</script>

