<template>
    <div ref="div_ref" class="__sun-design-scrollcontainer__">
        <SunResizeObserver @resized="onContainerResized">
            <div ref="container_div_dom" class="__sun-design-scrollcontainer-container__" :class="{
                'disabled-h': scrollable_disabled_h,
                'disabled-v': scrollable_disabled_v,
            }" @scroll="onScroll">
                <SunResizeObserver @resized="onContentResized">
                    <div ref="content_div_dom" class="__sun-design-scrollcontainer-content__" :style="contentStyle">
                        <slot />
                    </div>
                </SunResizeObserver>
            </div>
        </SunResizeObserver>
        <!-- indicators -->
        <template v-if="scrollableIndicators">
            <template v-if="!scrollable_disabled_h">
                <div v-show="has_more_left" class="__sun-design-scrollcontainer-lindicator__" />
                <div v-show="has_more_right" class="__sun-design-scrollcontainer-rindicator__" />
            </template>
            <template v-if="!scrollable_disabled_v">
                <div v-show="has_more_top" class="__sun-design-scrollcontainer-tindicator__" />
                <div v-show="has_more_bottom" class="__sun-design-scrollcontainer-bindicator__" />
            </template>
        </template>
        <!-- scrollbar -->
        <SunScrollBar v-if="scrollable_visible_h" v-show="is_scrollable_h" :vertical="false"
            :visibility="scrollBarVisibility" class="__s_scrollcontainer_hbar__" :percentage="percentage_h"
            @update:percentage="onHScrolled" @scroll="onHWheel" />
        <SunScrollBar v-if="scrollable_visible_v" v-show="is_scrollable_v" :vertical="true"
            :visibility="scrollBarVisibility" class="__s_scrollcontainer_vbar__" :percentage="percentage_v"
            @update:percentage="onVScrolled" @scroll="onVWheel" />
        <!-- <div
            style="position: absolute; left: 0; top: 0; font-size: 8px; padding: 2px 4px; font-family: consolas; pointer-events: none;">
            h {{ is_scrollable_h ? '*' : '~' }} {{ has_more_left ? '[' : '&nbsp;' }}{{ has_more_right ? ']' : '&nbsp;' }} {{
                value_scrollable_h
            }} / {{ max_scrollable_h }}
            <br />
            v {{ is_scrollable_v ? '*' : '~' }} {{ has_more_top ? '[' : '&nbsp;' }}{{ has_more_bottom ? ']' : '&nbsp;' }} {{
                value_scrollable_v }}
            / {{ max_scrollable_v }}
        </div> -->
    </div>
</template>

<script setup lang="ts">

import { type ComputedRef, type Ref, computed, ref, toRef, watch } from 'vue';
import { type BoxSize } from '../SunDesignConstants';
import SunResizeObserver from './SunResizeObserver.vue';
import SunScrollBar, { type ScrollBarVisibility } from './SunScrollBar.vue';

// props
export type ScrollBarState = 'visible' | 'hidden' | 'adaptive' | 'disabled';
const props = withDefaults(
    defineProps<{
        contentStyle?: string,
        scrollableIndicators?: boolean,
        scrollBarStateH?: ScrollBarState,
        scrollBarStateV?: ScrollBarState,
        scrollBarVisibility?: ScrollBarVisibility,
        overscrollCascade?: boolean,
    }>(),
    {
        scrollableIndicators: true,
        scrollBarStateH: 'adaptive',
        scrollBarStateV: 'adaptive',
        scrollBarVisibility: 'hover-track',
        overscrollCascade: false,
    }
);

// emits
const emits = defineEmits<{
    (event: 'containerResized', boxSize: BoxSize): void,
    (event: 'contentResized', boxSize: BoxSize): void,
}>();

// datas
const div_ref = ref<HTMLDivElement | null>(null);
const container_div_dom = ref<HTMLDivElement | null>(null);
const content_div_dom = ref<HTMLDivElement | null>(null);

const scrollable_disabled_h = computed(() => props.scrollBarStateH === 'disabled');
const scrollable_disabled_v = computed(() => props.scrollBarStateV === 'disabled');
const scrollable_visible_h = computed(() => props.scrollBarStateH !== 'hidden' && props.scrollBarStateH !== 'disabled');
const scrollable_visible_v = computed(() => props.scrollBarStateV !== 'hidden' && props.scrollBarStateV !== 'disabled');

const container_width = ref(0);
const container_height = ref(0);
const content_width = ref(0);
const content_height = ref(0);
watch([container_width, container_height], ([w, h]) => {
    emits('containerResized', { width: w, height: h });
});
watch([content_width, content_height], ([w, h]) => {
    emits('contentResized', { width: w, height: h });
});

const SCROLL_EPSILON = 1;

const is_scrollable_h = computed(() => container_width.value + SCROLL_EPSILON < content_width.value);
const is_scrollable_v = computed(() => container_height.value + SCROLL_EPSILON < content_height.value);
const max_scrollable_h = computed(() => Math.max(0, content_width.value - container_width.value));
const max_scrollable_v = computed(() => Math.max(0, content_height.value - container_height.value));
const value_scrollable_h = ref(0);
const value_scrollable_v = ref(0);

const percentage_h = computed(() => value_scrollable_h.value / (max_scrollable_h.value - SCROLL_EPSILON));
const percentage_v = computed(() => value_scrollable_v.value / (max_scrollable_v.value - SCROLL_EPSILON));
const has_more_right = computed(() => value_scrollable_h.value + SCROLL_EPSILON < max_scrollable_h.value);
const has_more_left = computed(() => value_scrollable_h.value > SCROLL_EPSILON);
const has_more_bottom = computed(() => value_scrollable_v.value + SCROLL_EPSILON < max_scrollable_v.value);
const has_more_top = computed(() => value_scrollable_v.value > SCROLL_EPSILON);

// methods
function onContainerResized(border_size: BoxSize, content_size: BoxSize, target: Element) {
    container_width.value = content_size.width;
    container_height.value = content_size.height;
}
function onContentResized(border_size: BoxSize, content_size: BoxSize, target: Element) {
    content_width.value = content_size.width;
    content_height.value = content_size.height;
}
function onScroll(evt: UIEvent) {
    value_scrollable_h.value = (evt.target as HTMLDivElement).scrollLeft;
    value_scrollable_v.value = (evt.target as HTMLDivElement).scrollTop;
}
function scrollTo(left: number | undefined, top: number | undefined, behavior: ScrollBehavior = 'smooth') {
    container_div_dom.value?.scrollTo({ left, top, behavior });
}
function scrollBy(left: number | undefined, top: number | undefined, behavior: ScrollBehavior = 'smooth') {
    container_div_dom.value?.scrollBy({ left, top, behavior });
}
function onHScrolled(percentage: number) {
    const left = max_scrollable_h.value * percentage;
    if (container_div_dom.value) {
        container_div_dom.value.scrollLeft = left;
    }
}
function onVScrolled(percentage: number) {
    const top = max_scrollable_v.value * percentage;
    if (container_div_dom.value) {
        container_div_dom.value.scrollTop = top;
    }
}
function onHWheel(delta: number) {
    if (container_div_dom.value) {
        scrollTo(container_div_dom.value.scrollLeft + delta, undefined);
    }
}
function onVWheel(delta: number) {
    if (container_div_dom.value) {
        scrollTo(undefined, container_div_dom.value.scrollTop + delta);
    }
}

// exposes
defineExpose({
    div: div_ref,
    container: container_div_dom,
    content: content_div_dom,
    scrollTo,
    scrollBy,
    isScrollableH: is_scrollable_h,
    isScrollableV: is_scrollable_v,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

indicator-size = 20px
indicator-color = rgba(0, 0, 0, 0.1)
indicator-background-r = linear-gradient(90deg, transparent, indicator-color 120%)
indicator-background-l = linear-gradient(-90deg, transparent, indicator-color 120%)
indicator-background-b = linear-gradient(-180deg, transparent, indicator-color 120%)
indicator-background-t = linear-gradient(0deg, transparent, indicator-color 120%)

.__sun-design-scrollcontainer__
    width: 100%
    height: 100%
    position: relative

.__sun-design-scrollcontainer-container__
    width: 100%
    height: 100%
    overflow: scroll
    overscroll-behavior: contain

.__sun-design-scrollcontainer-container__
    &::-webkit-scrollbar
        display: none

    &.disabled-h
        overflow-x: hidden

    &.disabled-v
        overflow-y: hidden

.__sun-design-scrollcontainer-content__
    width: fit-content
    height: fit-content

.__sun-design-scrollcontainer-rindicator__
    position: absolute
    top: 0
    bottom: 0
    right: 0
    width: 'calc(min(100%, %s))' % (indicator-size)
    background: indicator-background-r
    pointer-events: none

.__sun-design-scrollcontainer-lindicator__
    position: absolute
    top: 0
    bottom: 0
    left: 0
    width: 'calc(min(100%, %s))' % (indicator-size)
    background: indicator-background-l
    pointer-events: none

.__sun-design-scrollcontainer-bindicator__
    position: absolute
    left: 0
    right: 0
    bottom: 0
    height: 'calc(min(100%, %s))' % (indicator-size)
    background: indicator-background-b
    pointer-events: none

.__sun-design-scrollcontainer-tindicator__
    position: absolute
    left: 0
    right: 0
    top: 0
    height: 'calc(min(100%, %s))' % (indicator-size)
    background: indicator-background-t
    pointer-events: none

</style>