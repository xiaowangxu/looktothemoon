<template>
    <div ref="track_div_dom" class="__sun-design__ __sun-design-scrollbar__"
        :class="{ flat, vertical: vertical, hoverparent: visibility === 'hover', hovertrack: visibility === 'hover-track' }"
        :style="{ '--Percentage': clamped_percent }" @wheel="onWheel">
        <div ref="nob_div_dom" v-show="visibility !== 'hidden'"
            class="__sun-design__ __sun-design-scrollbar-nob__ colored bordered" :class="{ dragging: is_dragging }"
            @mousedown="onMouseDown"></div>
    </div>
</template>

<script setup lang="ts">

import { computed, ref } from 'vue';

// props
export type ScrollBarVisibility = 'always' | 'hover' | 'hover-track' | 'hidden';
const props = withDefaults(
    defineProps<{
        flat?: boolean,
        vertical?: boolean,
        percentage?: number,
        visibility?: ScrollBarVisibility,
        dragFactor?: number,
    }>(),
    {
        vertical: true,
        percentage: 0,
        visibility: 'hover-track',
        dragFactor: 1,
    }
);

// emits
const emits = defineEmits<{
    (event: 'update:percentage', percentage: number): void,
    (event: 'scroll', delta: number): void,
}>();

// datas
const track_div_dom = ref<HTMLDivElement>();
const nob_div_dom = ref<HTMLDivElement>();
const clamped_percent = computed(() => Math.min(1, Math.max(0, props.percentage)));
const is_dragging = ref(false);
let last_mouse_position = 0;
let last_percentage = 0;

// methods
function onMouseDown(evt: MouseEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    if (track_div_dom.value === undefined || nob_div_dom.value === undefined) return;
    is_dragging.value = true;
    window.addEventListener('mousemove', onMouseMove, { capture: true });
    window.addEventListener('mouseup', onMouseUp, { capture: true });
    last_mouse_position = props.vertical ? evt.clientY : evt.clientX;
    last_percentage = props.percentage;
}

function onMouseMove(evt: MouseEvent) {
    if (!is_dragging || track_div_dom.value === undefined || nob_div_dom.value === undefined) return
    const height = props.vertical ? track_div_dom.value?.offsetHeight : track_div_dom.value?.offsetWidth;
    const nob_height = props.vertical ? nob_div_dom.value?.offsetHeight : nob_div_dom.value?.offsetWidth;
    const scroll_height = Math.max(0, height - nob_height);
    const mouse_position = props.vertical ? evt.clientY : evt.clientX;
    const delta = (mouse_position - last_mouse_position) * props.dragFactor;
    const delta_percentage = scroll_height === 0 ? 0 : delta / scroll_height;
    const new_percentage = Math.max(0, Math.min(1, last_percentage + delta_percentage));
    emits('update:percentage', new_percentage);
}

function onMouseUp(evt: MouseEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    window.removeEventListener('mousemove', onMouseMove, { capture: true });
    window.removeEventListener('mouseup', onMouseUp, { capture: true });
    is_dragging.value = false;
}

function onWheel(evt: WheelEvent) {
    evt.preventDefault();
    emits('scroll', evt.deltaY);
}

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

scrollbar-panel-border-radius = 5px
scrollbar-track-size = scrollbar-panel-border-radius * 2
scrollbar-nob-border-radius = 2.5px
scrollbar-nob-size = scrollbar-nob-border-radius * 2
scrollbar-nob-offset = 2.5px // scrollbar-panel-border-radius - scrollbar-nob-border-radius
scrollbar-nob-opacity = 1
scrollbar-track-offset = 7px

.__sun-design__.__sun-design-scrollbar__
    position: absolute
    height: scrollbar-track-size
    bottom: 0
    left: scrollbar-track-offset
    right: scrollbar-track-offset
    // background-color: red

    &.vertical
        width: scrollbar-track-size
        height: unset
        left: unset
        bottom: scrollbar-track-offset
        top: scrollbar-track-offset
        right: 0

    &.hovertrack
        pointer-events: all

.__sun-design__.__sun-design-scrollbar-nob__
    position: absolute
    pointer-events: all
    top: scrollbar-nob-offset
    bottom: 0
    width: 30%
    height: scrollbar-nob-size
    left: calc(70% * var(--Percentage))
    border-radius: scrollbar-nob-border-radius
    opacity: scrollbar-nob-opacity

    .__sun-design__.__sun-design-scrollbar__.vertical>&
        left: scrollbar-nob-offset
        right: 0
        height: 30%
        width: scrollbar-nob-size
        top: calc(70% * var(--Percentage))

    :hover>.hoverparent>&.dragging,
    .hovertrack:hover>&.dragging,
    .hoverparent>&.dragging,
    .hovertrack>&.dragging,
    &.dragging
        opacity: scrollbar-nob-opacity
        transition: none

    .hovertrack>&, .hoverparent>& 
        opacity: 0
        transition: opacity 0.15s ease-out

    :hover>.hoverparent>&, .hovertrack:hover>&
        opacity: scrollbar-nob-opacity
        transition: opacity 0.15s ease-out
    
    &:active 
        background-color: var(--color-hover) !important

</style>