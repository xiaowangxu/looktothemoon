<template>
    <div class="__s__ __s_flow__" :style="{
        gap: gap,
        padding: padding,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        flexDirection: vertical ? 'column' : 'row',
        alignItems: vertical ? align_h : align_v,
        justifyContent: vertical ? align_v : align_h,
    }">
        <slot name="default" />
    </div>
</template>

<script setup lang="ts">

import './SStyle.css';
import { toRef } from 'vue';
import { type Alignment, useFlexAligmentCss } from './SConst';

// props
const props = withDefaults(
    defineProps<{
        gap?: string,
        padding?: string,
        vertical?: boolean,
        alignH?: Alignment,
        alignV?: Alignment,
        wrap?: boolean,
    }>(),
    {
        gap: 'var(--GapAndMargin)',
        padding: '0',
        vertical: false,
        alignH: 'start',
        alignV: 'start',
        wrap: false,
    }
);

// datas
const align_h = useFlexAligmentCss(toRef(props, 'alignH'));
const align_v = useFlexAligmentCss(toRef(props, 'alignV'));

</script>

<style>
.__s_flow__ {
    display: flex;
}
</style>