<template>
    <div ref="track_div_dom" class="__sun-design__ __sun-design-scrollbar__"
        :class="{ vertical: vertical, hoverparent: visibility === 'hover', hovertrack: visibility === 'hover-track' }"
        :style="{ '--SPercentage': clamped_percent }">
        <div ref="nob_div_dom" v-show="visibility !== 'hidden'" class="__sun-design__ __sun-design-scrollbar-nob__ colored"
            :class="{ dragging: is_dragging }" @mousedown="on_MouseDown"></div>
    </div>
</template>

<script setup lang="ts">

import { computed, ref } from 'vue';

// props
export type ScrollBarVisibility = 'always' | 'hover' | 'hover-track' | 'hidden';
const props = withDefaults(
    defineProps<{
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
    'update:percentage': [percentage: number],
}>();

// datas
const track_div_dom = ref<HTMLDivElement>();
const nob_div_dom = ref<HTMLDivElement>();
const clamped_percent = computed(() => Math.min(1, Math.max(0, props.percentage)));
const is_dragging = ref(false);
let last_mouse_position = 0;
let last_percentage = 0;

// methods
function on_MouseDown(evt: MouseEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    if (track_div_dom.value === undefined || nob_div_dom.value === undefined) return;
    is_dragging.value = true;
    window.addEventListener('mousemove', on_MouseMove, { capture: true });
    window.addEventListener('mouseup', on_MouseUp, { capture: true });
    last_mouse_position = props.vertical ? evt.clientY : evt.clientX;
    last_percentage = props.percentage;
}
function on_MouseMove(evt: MouseEvent) {
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
function on_MouseUp(evt: MouseEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    window.removeEventListener('mousemove', on_MouseMove, { capture: true });
    window.removeEventListener('mouseup', on_MouseUp, { capture: true });
    is_dragging.value = false;
}

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

scrollbar-panel-border-radius = 5px
scrollbar-track-size = scrollbar-panel-border-radius * 2
scrollbar-nob-border-radius = 3px
scrollbar-nob-size = scrollbar-nob-border-radius * 2
scrollbar-nob-offset = scrollbar-panel-border-radius - scrollbar-nob-border-radius
scrollbar-nob-opacity = 1
scrollbar-track-offset = 8px

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
    left: calc(70% * var(--SPercentage))
    border-radius: scrollbar-nob-border-radius
    opacity: scrollbar-nob-opacity

    .__sun-design__.__sun-design-scrollbar__.vertical>&
        left: scrollbar-nob-offset
        right: 0
        height: 30%
        width: scrollbar-nob-size
        top: calc(70% * var(--SPercentage))

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