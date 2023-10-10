<template>
    <div class="__s__ __s_title__" :style="{ color: color_css, textAlign: align_h_css }">
        <SSpan text-size="large">
            <slot />
        </SSpan>
    </div>
</template>

<script setup lang="ts">

import { useTypoGraphyCss, type TypographyProps } from '../SConst';
import SSpan from './SSpan.vue';

// props
const props = defineProps<TypographyProps>();

// datas
const { color_css, align_h_css } = useTypoGraphyCss(props);

</script>

<style>
.__s_title__ {
    margin-top: var(--LargePaddingSize);
    margin-bottom: var(--LargePaddingSize);
}
</style>