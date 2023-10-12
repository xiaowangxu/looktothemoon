<template>
    <div ref="track_div_dom" class="__s__ __s_scrollbar__" :class="{ vertical: vertical }"
        :style="{ '--SPercentage': clamped_percent }">
        <div ref="nob_div_dom" v-show="visibility !== 'hidden'" class="__s__ __s_color__ __s_scrollbar_nob__"
            :class="{ hoverparent: visibility === 'hover', dragging: is_dragging }" :style="{ '--SColor': color }"
            @mousedown="on_MouseDown"></div>
    </div>
</template>

<script setup lang="ts">

import { computed, ref } from 'vue';

// props
export type ScrollBarVisibility = 'always' | 'hover' | 'hidden';
const props = withDefaults(
    defineProps<{
        color?: string,
        vertical?: boolean,
        percentage?: number,
        visibility?: ScrollBarVisibility,
        dragFactor?: number,
    }>(),
    {
        color: 'var(--ThemeDisabledBaseColor)',
        vertical: true,
        percentage: 0,
        visibility: 'hover',
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

<style>
.__s_scrollbar__ {
    position: absolute;
    /* background-color: brown; */
    pointer-events: none;
    height: var(--ScrollBarTrackSize);
    bottom: 0;
    left: 0;
    right: 0;
}

.__s_scrollbar__.vertical {
    width: var(--ScrollBarTrackSize);
    height: unset;
    left: unset;
    bottom: 0;
    top: 0;
    right: 0;
}

.__s_scrollbar_nob__ {
    position: absolute;
    pointer-events: all;
    top: var(--ScrollBarTrackStartSize);
    bottom: 0;
    width: 30%;
    height: var(--ScrollBarSize);
    left: calc(70% * var(--SPercentage));
    border-radius: calc(var(--ScrollBarSize) / 2);
    opacity: 1;
}

:hover>*>.__s_scrollbar_nob__.dragging,
.__s_scrollbar_nob__.dragging.hoverparent,
.__s_scrollbar_nob__.dragging {
    opacity: 1;
}

.__s_scrollbar_nob__.hoverparent {
    opacity: 0;
    transition: opacity 0.15s ease-out;
}

:hover>*>.__s_scrollbar_nob__.hoverparent {
    opacity: 1;
    transition: opacity 0.15s ease-out;
}

.__s_scrollbar_nob__.__s_color__:active {
    background-color: var(--SColorHover);
}

.__s_scrollbar__.vertical>.__s_scrollbar_nob__ {
    left: var(--ScrollBarTrackStartSize);
    right: 0;
    height: 30%;
    width: var(--ScrollBarSize);
    top: calc(70% * var(--SPercentage));
}
</style>