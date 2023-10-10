<template>
    <div class="__s__ __s_panel__" :style="{ '--SColor': color }">
        <slot name="default" />
    </div>
</template>

<script setup lang="ts">

import './SStyle.css';

// props
const props = withDefaults(
    defineProps<{ color?: string }>(),
    { color: 'var(--ThemeBaseColor)' }
);

</script>

<style>
.__s_panel__ {
    border-radius: var(--MediumRadius);
    padding: var(--GapAndMargin);
    background-color: var(--SColor);
    box-shadow: var(--ThemeBoxShadow);
}
</style>
