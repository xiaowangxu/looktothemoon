<template>
    <div class="__s__ __s_label__" :style="{ alignItems: align_v_css, ...width_css, color: color_css }"
        :data-s-min-size="minSize" :data-s-text-size="textSize">
        <div class="__s_label_container__" :style="{ textAlign: align_h_css }">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">

import { type IconSize, type TextSize, type TypographyProps, useTypoGraphyCss } from '../SConst';

// props
const props = withDefaults(
    defineProps<TypographyProps & {
        textSize?: TextSize,
        minSize?: IconSize | 'unset',
    }>(),
    {
        alignH: 'start',
        alignV: 'center',
        color: 'var(--ThemeDisabledBaseColor)',
        inheritColor: false,
        textSize: 'normal',
        minSize: 'unset',
    }
);

// datas
const { color_css, align_h_css, align_v_css, width_css } = useTypoGraphyCss(props);

</script>

<style>
.__s_label__ {
    display: flex;
    flex-direction: row;
    overflow: hidden;
}

.__s_label_container__ {
    width: 100%;
    height: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
</style>