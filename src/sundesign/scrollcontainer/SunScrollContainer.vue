<template>
    <div class="__s_scrollcontainer__" :class="{
        scrollh: scrollable_visible_h && is_scrollable_h,
        scrollv: scrollable_visible_v && is_scrollable_v
    }">
        <SunResizeObserver @resized="on_ContainerResized">
            <div ref="container_div_dom" class="__s__ __s_scrollcontainer_container__" :class="{
                disabledh: scrollable_disabled_h,
                disabledv: scrollable_disabled_v,
            }" @scroll="on_Scroll">
                <SunResizeObserver @resized="on_ContentResized">
                    <div ref="content_div_dom" class="__s__ __s_scrollcontainer_content__"
                        :style="{ ...content_width_css, ...content_height_css }">
                        <slot />
                    </div>
                </SunResizeObserver>
            </div>
        </SunResizeObserver>
        <template v-if="scrollableIndicators">
            <template v-if="!scrollable_disabled_h">
                <div v-show="has_more_left" class="__s__ __s_scrollcontainer_lindicator__" />
                <div v-show="has_more_right" class="__s__ __s_scrollcontainer_rindicator__" />
            </template>
            <template v-if="!scrollable_disabled_v">
                <div v-show="has_more_top" class="__s__ __s_scrollcontainer_tindicator__" />
                <div v-show="has_more_bottom" class="__s__ __s_scrollcontainer_bindicator__" />
            </template>
        </template>
        <SunScrollBar v-if="scrollable_visible_h" v-show="is_scrollable_h" :vertical="false"
            :visibility="scrollBarVisibility" class="__s__ __s_scrollcontainer_hbar__" :percentage="percentage_h"
            @update:percentage="on_HScrolled" />
        <SunScrollBar v-if="scrollable_visible_v" v-show="is_scrollable_v" :vertical="true"
            :visibility="scrollBarVisibility" class="__s__ __s_scrollcontainer_vbar__" :percentage="percentage_v"
            @update:percentage="on_VScrolled" />
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

import { ComputedRef, Ref, computed, ref, toRef, watch } from 'vue';
import { type BoxSize, type Size } from '../SunDesignConstants';
import SunResizeObserver from './SunResizeObserver.vue';
import SunScrollBar, { type ScrollBarVisibility } from './SunScrollBar.vue';

// props
type ScrollBarState = 'visible' | 'hidden' | 'adaptive' | 'disabled';
const props = withDefaults(
    defineProps<{
        minWidth?: string,
        maxWidth?: string,
        width?: string,
        minHeight?: string,
        maxHeight?: string,
        height?: string,
        scrollableIndicators?: boolean,
        scrollBarStateH?: ScrollBarState,
        scrollBarStateV?: ScrollBarState,
        scrollBarVisibility?: ScrollBarVisibility,
        contentWidth?: string,
        contentHeight?: string,
    }>(),
    {
        scrollableIndicators: true,
        scrollBarStateH: 'adaptive',
        scrollBarStateV: 'adaptive',
        scrollBarVisibility: 'hover-track',
        width: 'fit-content',
        height: 'fit-content',
    }
);

// emits
const emits = defineEmits<{
    containerResized: [boxSize: BoxSize],
    contentResized: [boxSize: BoxSize],
}>();

// datas
const container_div_dom = ref<HTMLDivElement>();
const content_div_dom = ref<HTMLDivElement>();

function useWidthDefineCss(
    width: Ref<string | undefined>,
    min_width: Ref<string | undefined>,
    max_width: Ref<string | undefined>
): ComputedRef<{ width?: string, minWidth?: string, maxWidth?: string }> {
    return computed(() => {
        const result: { width?: string, minWidth?: string, maxWidth?: string } = {};
        if (width.value !== undefined) {
            result.width = width.value;
        }
        if (min_width.value !== undefined) {
            result.minWidth = min_width.value;
        }
        if (max_width.value !== undefined) {
            result.maxWidth = max_width.value;
        }
        return result;
    });
}

function useHeightDefineCss(
    height: Ref<string | undefined>,
    min_height: Ref<string | undefined>,
    max_height: Ref<string | undefined>
): ComputedRef<{ height?: string, minHeight?: string, maxHeight?: string }> {
    return computed(() => {
        const result: { height?: string, minHeight?: string, maxHeight?: string } = {};
        if (height.value !== undefined) {
            result.height = height.value;
        }
        if (min_height.value !== undefined) {
            result.minHeight = min_height.value;
        }
        if (max_height.value !== undefined) {
            result.maxHeight = max_height.value;
        }
        return result;
    });
}

const content_width_css = useWidthDefineCss(toRef(props, 'width'), toRef(props, 'minWidth'), toRef(props, 'maxWidth'));
const content_height_css = useHeightDefineCss(toRef(props, 'height'), toRef(props, 'minHeight'), toRef(props, 'maxHeight'));
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
function on_ContainerResized(border_size: BoxSize, content_size: BoxSize, target: Element) {
    container_width.value = content_size.width;
    container_height.value = content_size.height;
}
function on_ContentResized(border_size: BoxSize, content_size: BoxSize, target: Element) {
    content_width.value = content_size.width;
    content_height.value = content_size.height;
}
function on_Scroll(evt: UIEvent) {
    value_scrollable_h.value = (evt.target as HTMLDivElement).scrollLeft;
    value_scrollable_v.value = (evt.target as HTMLDivElement).scrollTop;
}
function scrollTo(left: number | undefined, top: number | undefined, behavior: ScrollBehavior = 'smooth') {
    container_div_dom.value?.scrollTo({ left, top, behavior });
}
function scrollBy(left: number | undefined, top: number | undefined, behavior: ScrollBehavior = 'smooth') {
    container_div_dom.value?.scrollBy({ left, top, behavior });
}
function on_HScrolled(percentage: number) {
    const left = max_scrollable_h.value * percentage;
    if (container_div_dom.value) {
        container_div_dom.value.scrollLeft = left;
    }
}
function on_VScrolled(percentage: number) {
    const top = max_scrollable_v.value * percentage;
    if (container_div_dom.value) {
        container_div_dom.value.scrollTop = top;
    }
}

// exposes
defineExpose({
    containerDomElement: container_div_dom,
    contentDomElement: content_div_dom,
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

.__s_scrollcontainer__ {
    --LargeRadius: 10px;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    position: relative;
}

.__s_scrollcontainer_container__ {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: scroll;
}

.__s_scrollcontainer_container__::-webkit-scrollbar {
    display: none;
}

.__s_scrollcontainer_container__.disabledh {
    overflow-x: hidden;
}

.__s_scrollcontainer_container__.disabledv {
    overflow-y: hidden;
}

.__s_scrollcontainer_content__ {
    width: fit-content;
}

.__s_scrollcontainer_rindicator__ {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 'calc(min(100%, %s))' % (indicator-size);
    background: indicator-background-r;
    pointer-events: none;
}

.__s_scrollcontainer_lindicator__ {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 'calc(min(100%, %s))' % (indicator-size);
    background: indicator-background-l;
    pointer-events: none;
}

.__s_scrollcontainer_bindicator__ {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 'calc(min(100%, %s))' % (indicator-size);
    background: indicator-background-b;
    pointer-events: none;
}

.__s_scrollcontainer_tindicator__ {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 'calc(min(100%, %s))' % (indicator-size);
    background: indicator-background-t;
    pointer-events: none;
}
</style>