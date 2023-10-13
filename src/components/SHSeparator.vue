<template>
    <div class="__s__ __s_color__ __s_hseparator__" :style="{ '--SColor': color, ...height_css }"></div>
</template>

<script setup lang="ts">

import { toRef } from 'vue';
import { useHeightDefineCss, type HeightDefineProps } from './SConst';
import './SStyle.css';

// props
const props = withDefaults(
    defineProps<HeightDefineProps & { color?: string }>(),
    {
        color: 'var(--ThemeDisabledBaseColor)',
    }
);

// datas
const height_css = useHeightDefineCss(toRef(props, 'height'), toRef(props, 'minHeight'), toRef(props, 'maxHeight'));

</script>

<style>
.__s_hseparator__ {
    width: var(--SeparatorSize);
    min-width: var(--SeparatorSize);
}

.__s_hseparator__.__s_color__ {
    background-color: var(--SColorNormal) !important;
}

.__s_flow__>.__s_hseparator__ {
    align-self: stretch;
}
</style>