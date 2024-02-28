<template>
    <SunScrollContainer class="__sun-design-virtual-list-scroll-container__" @scroll="onScroll"
        @container-resized="onContainerResized">
        <div class="__sun-design-virtual-list-total-height__" :style="{ height: `${total_height}px` }">
            <div class="__sun-design-virtual-list-container__"
                :style="{ height: `${wrap_height}px`, 'margin-top': `${top_height}px` }">
                <slot :start="visible_start" :length="visible_length" />
            </div>
        </div>
    </SunScrollContainer>
</template>

<script setup lang="ts">

import SunScrollContainer from '../scrollcontainer/SunScrollContainer.vue';
import { ref, computed, watch } from 'vue';
import { type BoxSize } from '../SunDesignConstants';

// props
const props = withDefaults(
    defineProps<{
        count: number,
        itemHeight: number,
        gap?: number,
        paddingTop?: number,
        paddingBottom?: number,
    }>(),
    {
        gap: 0,
        paddingTop: 0,
        paddingBottom: 0,
    }
);

// slots
defineSlots<{
    default(props: { start: number, length: number }): void;
}>();

// datas
const total_height = computed(() => (props.count === 0 ? 0 : (props.count * (props.itemHeight + props.gap) - props.gap)) + props.paddingTop + props.paddingBottom);
const viewport_height = ref(0);
const wrap_count = computed(() => Math.ceil(viewport_height.value / (props.itemHeight + props.gap) + 1));
const wrap_height = computed(() => wrap_count.value * (props.itemHeight + props.gap));
const scroll_top = ref(0);
const top_height = computed(() => scroll_top.value - (scroll_top.value) % (props.itemHeight + props.gap) + props.paddingTop);
const visible_start = computed(() => Math.floor((scroll_top.value) / (props.itemHeight + props.gap)));
const visible_length = computed(() => Math.min(wrap_count.value, props.count - visible_start.value));
function onContainerResized(boxSize: BoxSize) {
    viewport_height.value = boxSize.height;
}
function onScroll(left: number, top: number, width: number, height: number) {
    scroll_top.value = top;
}

</script>

<style lang="stylus">

.__sun-design-virtual-list-scroll-container__
    // overflow: visible !important

.__sun-design-virtual-list-total-height__
    overflow-y: hidden

.__sun-design-virtual-list-container__
    // background: red
    margin-top: 0px

</style>