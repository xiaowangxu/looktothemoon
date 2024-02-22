<template>
    <component v-if="icon !== undefined" class="__sun-design__ __sun-design-icon__" :is="icon" :color="color"
        :class="{ 'animate-rotate': rotating }" />
    <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
        class="__sun-design__ __sun-design-icon__" :class="{ 'animate-rotate': rotating }">
    </svg>
</template>

<script setup lang="ts">

import { computed, type FunctionalComponent } from 'vue';
import * as icons from "lucide-vue-next";

// props
const props = defineProps<{
    name?: string,
    color?: string,
    rotating?: boolean,
}>();

// data
const icon = computed(() => props.name === undefined || props.name === '' ? undefined : (icons as any)[props.name] as FunctionalComponent | undefined);

</script>

<style>
.__sun-design-icon__.animate-rotate {
    animation: __sun-design-animate-rotate__ 2s linear infinite;
}

@keyframes __sun-design-animate-rotate__ {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>

