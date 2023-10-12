<template>
    <div class="__s__ __s_color__ __s_vseparator__" :style="{ '--SColor': color, ...width_css }"></div>
</template>

<script setup lang="ts">

import { toRef } from 'vue';
import { useHeightDefineCss, type WidthDefineProps } from './SConst';
import './SStyle.css';

// props
const props = withDefaults(
    defineProps<WidthDefineProps & { color?: string }>(),
    {
        color: 'var(--ThemeDisabledBaseColor)',
    }
);
// datas
const width_css = useHeightDefineCss(toRef(props, 'width'), toRef(props, 'minWidth'), toRef(props, 'maxWidth'));

</script>

<style>
.__s_vseparator__ {
    height: var(--SeparatorSize);
}

.__s_vseparator__.__s_color__ {
    background-color: var(--SColorNormal) !important;
}

.__s_flow__>.__s_vseparator__ {
    align-self: stretch;
}
</style>