<template>
    <div class="__s__ __s_sub_title__" :style="{ textAlign: align_h_css }">
        <SSpan text-size="medium" :color="color_css">
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
.__s_sub_title__ {
    padding-top: 0;
    padding-bottom: 0;
}
</style>