<template>
    <div ref="div_dom" class="__s__ __s_panel__" :style="{ '--SColor': color }" @mouseenter="emits('mouseenter', $event)"
        @mouseleave="emits('mouseleave', $event)">
        <slot name="default" />
    </div>
</template>

<script setup lang="ts">

import { ref } from 'vue';
import './SStyle.css';

// props
const props = withDefaults(
    defineProps<{
        color?: string
    }>(),
    {
        color: 'var(--ThemeBaseColor)'
    }
);

// emits
const emits = defineEmits<{
    mouseenter: [event: Event],
    mouseleave: [event: Event],
}>();

// datas
const div_dom = ref<HTMLDivElement | null>(null);

// exposes
defineExpose({
    divElement: div_dom,
});

</script>

<style>
.__s_panel__ {
    border-radius: var(--MediumRadius);
    padding: var(--GapAndMargin);
    background-color: var(--SColor);
    box-shadow: var(--ThemeBoxShadow);
    box-sizing: border-box;
}
</style>
