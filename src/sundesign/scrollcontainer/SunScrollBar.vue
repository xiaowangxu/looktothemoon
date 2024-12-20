<template>
    <div ref="track_div_dom" class="__sun-design__ __sun-design-scrollbar__"
        :class="{ flat, vertical: vertical, hoverparent: mapped_visibility === 'hover', hovertrack: mapped_visibility === 'hover-track' }"
        :style="{ '--Percentage': clamped_percent, '--NobSizePercentage': nobSizePercentage }">
        <div ref="nob_div_dom" v-show="visibility !== 'hidden'"
            class="__sun-design__ __sun-design-scrollbar-nob__ colored bordered" :class="{ dragging: is_dragging }"
            @mousedown="onMouseDown"></div>
    </div>
</template>

<script setup lang="ts">

import { computed, ref, toRef, watch } from 'vue';
import { timer, type TimerCanceller } from '../SunDesignConstants';

// props
export type ScrollBarVisibility = 'always' | 'hover' | 'hover-track' | 'scrolled' | 'hidden';
const props = withDefaults(
    defineProps<{
        flat?: boolean,
        vertical?: boolean,
        percentage?: number,
        nobSizePercentage: number,
        visibility?: ScrollBarVisibility,
        dragFactor?: number,
        scrolledVisibilityDelay?: number
    }>(),
    {
        vertical: true,
        percentage: 0,
        nobSizePercentage: 0.2,
        visibility: 'hover-track',
        dragFactor: 1,
        scrolledVisibilityDelay: 1000,
    }
);

// emits
const emits = defineEmits<{
    (event: 'update:percentage', percentage: number): void,
    (event: 'scroll', delta: number): void,
}>();

// datas
const mapped_visibility = ref(props.visibility);
watch(mapped_visibility, (newval)=>{
    console.log(newval);
});
let scrolled_timer: TimerCanceller | undefined = undefined;

watch(toRef(props, 'visibility'), (newval) => {
    scrolled_timer?.();
    scrolled_timer = undefined;
    switch (newval) {
        case 'scrolled': {
            mapped_visibility.value = 'hover-track';
            break;
        }
        default: {
            mapped_visibility.value = newval;
            break;
        }
    }
});

const track_div_dom = ref<HTMLDivElement>();
const nob_div_dom = ref<HTMLDivElement>();
const clamped_percent = computed(() => Math.min(1, Math.max(0, props.percentage)));
const is_dragging = ref(false);
let last_mouse_position = 0;
let last_percentage = 0;

const scrolled_delay_finished = () => {
    if (props.visibility === 'scrolled') {
        scrolled_timer = undefined;
        mapped_visibility.value = 'hover-track';
    }
}
watch(toRef(props, 'percentage'), (p) => {
    if (props.visibility !== 'scrolled') return;
    scrolled_timer?.();
    scrolled_timer = timer(scrolled_delay_finished, props.scrolledVisibilityDelay);
    mapped_visibility.value = 'hover';
});

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
    --NobSize: 'clamp(16px, calc(100% * var(--NobSizePercentage, 0.2)), calc(30%))' % ('')
    width: var(--NobSize)
    height: scrollbar-nob-size
    left: calc((100% - var(--NobSize)) * var(--Percentage))
    border-radius: scrollbar-nob-border-radius
    opacity: scrollbar-nob-opacity

    .__sun-design__.__sun-design-scrollbar__.vertical > &
        left: scrollbar-nob-offset
        right: 0
        height: var(--NobSize)
        width: scrollbar-nob-size
        top: calc((100% - var(--NobSize)) * var(--Percentage))

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

</style>