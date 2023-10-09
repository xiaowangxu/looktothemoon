<template>
    <div class="__s__ __s_flow__" :style="{
        gap: gap,
        flexDirection: vertial ? 'column' : 'row',
        alignItems: vertial ? halign : valign,
        justifyContent: vertial ? valign : halign,
    }">
        <slot name="default" />
    </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { Alignment } from './SConst';
const props = withDefaults(
    defineProps<{ gap?: string, vertial?: boolean, alignH?: Alignment, alignV?: Alignment }>(),
    { gap: 'var(--GapAndMargin)', vertial: false, alignH: Alignment.Start, alignV: Alignment.Start }
);
const halign = computed(() => {
    switch (props.alignH) {
        case Alignment.Start: return 'flex-start';
        case Alignment.Center: return 'center';
        case Alignment.End: return 'flex-end';
    }
});
const valign = computed(() => {
    switch (props.alignV) {
        case Alignment.Start: return 'flex-start';
        case Alignment.Center: return 'center';
        case Alignment.End: return 'flex-end';
    }
});
</script>
<style>
.__s_flow__ {
    display: flex;
}
</style>