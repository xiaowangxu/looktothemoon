<template>
    <SunPopup v-if="instance" :visible="opened" :rect="popup_rect" :stop-events="stopEvents" @cover-click="onCoverClick">
        <SunPanel ref="panel_ref" class="__sun-design-measurepopuppanel-panel__" v-bind="$attrs" :size="size" bordered
            :vertical="vertical" :dropShadow="dropShadow" :container="container" :trap-focus="trapFocus"
            @trap-focus-out="emits('trapFocusOut', $event)" @mouseenter="emits('mouseenter', $event)"
            @mouseleave="emits('mouseleave', $event)">
            <SunScrollContainer :scrollableIndicators="scrollableIndicators" :scrollBarStateH="scrollBarStateH"
                :scrollBarStateV="scrollBarStateV" :scrollBarVisibility="scrollBarVisibility" :contentStyle="contentStyle">
                <SunPanel class="__sun-design-measurepopuppanel-container__" container :vertical="vertical">
                    <slot :opened="opened" />
                </SunPanel>
            </SunScrollContainer>
        </SunPanel>
    </SunPopup>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import { type Size, type Rect, type BoxSize, type PopupOpenMode, TrapFocusOutEvent } from '../SunDesignConstants';
import SunPopup from '../popup/SunPopup.vue';
import SunPanel from '../panel/SunPanel.vue';
import SunScrollContainer, { type ScrollBarState } from '../scrollcontainer/SunScrollContainer.vue';
import { type ScrollBarVisibility } from '../scrollcontainer/SunScrollBar.vue';
import { useWindowSize } from '@vueuse/core';
import { computed, nextTick, ref, watch } from 'vue';

defineOptions({
    inheritAttrs: false,
});

// props
type MeasureMethod = 'min-content' | 'fit-content' | 'max-content';
const props = withDefaults(
    defineProps<{
        mode?: PopupOpenMode,
        visible?: boolean,
        size?: Size,
        vertical?: boolean,
        dropShadow?: boolean,
        container?: boolean,
        trapFocus?: boolean,
        stopEvents?: boolean,
        contentStyle?: string,
        scrollableIndicators?: boolean,
        scrollBarStateH?: ScrollBarState,
        scrollBarStateV?: ScrollBarState,
        scrollBarVisibility?: ScrollBarVisibility,
        getPopupRect: (contentMinSize: BoxSize, windowSize: BoxSize) => Rect,
        measureIgnoreMaxHeight?: boolean,
        measureIgnoreMinHeight?: boolean,
        measureIgnoreMaxWidth?: boolean,
        measureIgnoreMinWidth?: boolean,
        measureMethodH?: MeasureMethod,
        measureMethodV?: MeasureMethod,
    }>(),
    {
        mode: 'instance',
        trapFocus: true,
        visible: true,
        stopEvents: true,
        dropShadow: true,
        measureIgnoreMaxHeight: false,
        measureIgnoreMinHeight: false,
        measureIgnoreMaxWidth: false,
        measureIgnoreMinWidth: false,
        scrollableIndicators: true,
        scrollBarStateH: 'adaptive',
        scrollBarStateV: 'adaptive',
        scrollBarVisibility: 'hover-track',
    }
);

// slots
defineSlots<{
    default(props: { opened: boolean }): void;
}>();

// emits
const emits = defineEmits<{
    (event: 'beforeMeasure'): void,
    (event: 'afterMeasure'): void,
    (event: 'coverClick', evt: Event): void,
    (event: 'trapFocusOut', evt: TrapFocusOutEvent): void,
    (event: 'mouseenter', evt: MouseEvent): void,
    (event: 'mouseleave', evt: MouseEvent): void,
}>();

// datas
const instance = computed(() => props.mode === 'visibility' || props.visible);
const opened = computed(() => instance.value && props.visible === true);
const panel_ref = ref<InstanceType<typeof SunPanel> | undefined>();

const content_min_size = ref<BoxSize>({ width: 0, height: 0 });
const { width: windowWidth, height: windowHeight } = useWindowSize();
const popup_rect = ref<Rect>({ x: 0, y: 0, width: 0, height: 0 });

const get_panel_content_min_size = () => {
    const div = panel_ref.value?.div;
    if (div !== undefined && opened.value) {
        const _div = (div as HTMLDivElement);
        emits('beforeMeasure');
        const style_width = _div.style.width;
        const style_height = _div.style.height;
        _div.style.width = props.measureMethodH ?? 'max-content';
        _div.style.height = props.measureMethodV ?? 'max-content';
        // ignore
        let max_width, min_width, max_height, min_height;
        if (props.measureIgnoreMaxWidth) { max_width = _div.style.maxWidth; _div.style.maxWidth = ''; }
        if (props.measureIgnoreMinWidth) { min_width = _div.style.minWidth; _div.style.minWidth = ''; }
        if (props.measureIgnoreMaxHeight) { max_height = _div.style.maxHeight; _div.style.maxHeight = ''; }
        if (props.measureIgnoreMinHeight) { min_height = _div.style.minHeight; _div.style.minHeight = ''; }
        const { x, y, width, height } = _div.getBoundingClientRect();
        _div.style.width = style_width;
        _div.style.height = style_height;
        if (props.measureIgnoreMaxWidth) { _div.style.maxWidth = max_width!; }
        if (props.measureIgnoreMinWidth) { _div.style.minWidth = min_width!; }
        if (props.measureIgnoreMaxHeight) { _div.style.maxHeight = max_height!; }
        if (props.measureIgnoreMinHeight) { _div.style.minHeight = min_height!; }
        emits('afterMeasure');
        content_min_size.value = { width, height };
        calcuPopupRect();
    }
};

function calcuPopupRect() {
    popup_rect.value = props.getPopupRect(content_min_size.value, { width: windowWidth.value, height: windowHeight.value });
}

watch(opened, (opened) => {
    if (opened) {
        nextTick(get_panel_content_min_size);
    }
}, { immediate: true });

watch([windowWidth, windowHeight], () => {
    calcuPopupRect();
});

function onCoverClick(evt: Event) {
    emits('coverClick', evt);
}

function refreshPopupContentMinSize() {
    get_panel_content_min_size();
}

function focusTop() {
    panel_ref.value?.focusTop();
}

function focusFirst() {
    panel_ref.value?.focusFirst();
}

function focusLast() {
    panel_ref.value?.focusLast();
}

// exposes
defineExpose({
    refreshPopupContentMinSize,
    focusTop,
    focusFirst,
    focusLast,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-measurepopuppanel-panel__, .__sun-design-measurepopuppanel-container__
    height: 100%
    width: 100%
    pointer-events: initial

</style>