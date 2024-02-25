<template>
    <component v-if="icon !== undefined" class="__sun-design__ __sun-design-icon__" :is="icon" :color="color"
        :class="[animation]" />
    <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
        class="__sun-design__ __sun-design-icon__" :class="[animation]">
    </svg>
</template>

<script setup lang="ts">

import '../SunDesignAnimation.styl';
import { computed, type FunctionalComponent } from 'vue';
import { type Animation as AnimationName } from '../SunDesignConstants';
import * as icons from "lucide-vue-next";

// props
const props = defineProps<{
    name?: string,
    color?: string,
    animation?: AnimationName,
}>();

// data
const icon = computed(() => props.name === undefined || props.name === '' ? undefined : (icons as any)[props.name] as FunctionalComponent | undefined);
const animation = computed(() => props.animation === undefined ? undefined : `__sun-design-animate-${props.animation}__`);

</script>

<style></style>

