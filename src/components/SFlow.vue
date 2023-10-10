<template>
    <div class="__s__ __s_flow__" :style="{
        gap: gap,
        flexDirection: vertical ? 'column' : 'row',
        alignItems: vertical ? align_h : align_v,
        justifyContent: vertical ? align_v : align_h,
    }">
        <slot name="default" />
    </div>
</template>

<script setup lang="ts">

import { toRef } from 'vue';
import { type Alignment, useFlexAligmentCss } from './SConst';

// props
const props = withDefaults(
    defineProps<{
        gap?: string,
        vertical?: boolean,
        alignH?: Alignment,
        alignV?: Alignment
    }>(),
    {
        gap: 'var(--GapAndMargin)',
        vertical: false,
        alignH: 'start',
        alignV: 'start',
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