<template>
    <SunButton ref="button_ref" class="__sun-design-buttonpopup-button__" :class="{ active: opened && openActive }"
        :size="size" :flat="flat" :active="active" :disabled="disabled" :borderMask="borderMask" :hover="hover"
        :colorScheme="colorScheme" :squared="squared" @click="opened = !opened" v-bind="$attrs"
        @keydown.tab="onFocusChange">
        <slot name="button" :opened="opened" :toggle="toggle" />
    </SunButton>
    <SunMeasurePopupPanel ref="measurepopuppanel_ref" :mode="mode" :visible="opened" :style="panelStyle"
        :content-style="contentStyle" :vertical="vertical" :dropShadow="dropShadow" :container="container"
        :scrollableIndicators="scrollableIndicators" :scrollBarStateH="scrollBarStateH" :scrollBarStateV="scrollBarStateV"
        :scrollBarVisibility="scrollBarVisibility" :get-popup-rect="getPopupPanelRect" @cover-click="onCoverClick"  @cover-contextmenu="onCoverClick"
        :measureIgnoreMaxHeight="measureIgnoreMaxHeight" :measureIgnoreMinHeight="measureIgnoreMinHeight"
        :measureIgnoreMaxWidth="measureIgnoreMaxWidth" :measureIgnoreMinWidth="measureIgnoreMinWidth"
        @before-measure="emits('beforeMeasure')" @after-measure="emits('afterMeasure')" @trap-focus-out="onTrapFocusOut">
        <slot name="popup" :opened="opened" :toggle="toggle" />
    </SunMeasurePopupPanel>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunMeasurePopupPanel from '../measurepopuppanel/SunMeasurePopupPanel.vue';
import SunButton from '../button/SunButton.vue';
import { type ScrollBarState } from '../scrollcontainer/SunScrollContainer.vue';
import { type ScrollBarVisibility } from '../scrollcontainer/SunScrollBar.vue';
import { type Size, type BorderMask, type ColorScheme, type Rect, type BoxSize, type PopupOpenMode, calcButtonPopupRect, TrapFocusOutEvent } from '../SunDesignConstants';
import { ref, watch, nextTick } from 'vue';

defineOptions({
    inheritAttrs: false,
});

// props
const props = withDefaults(
    defineProps<{
        mode?: PopupOpenMode,
        size?: Size,
        flat?: boolean,
        hover?: boolean,
        active?: boolean,
        disabled?: boolean,
        borderMask?: BorderMask,
        colorScheme?: ColorScheme,
        squared?: boolean,
        // panel
        openActive?: boolean,
        panelStyle?: string,
        vertical?: boolean,
        dropShadow?: boolean,
        container?: boolean,
        contentStyle?: string,
        scrollableIndicators?: boolean,
        scrollBarStateH?: ScrollBarState,
        scrollBarStateV?: ScrollBarState,
        scrollBarVisibility?: ScrollBarVisibility,
        getPopupRect?: (buttonRect: Rect, contentMinSize: BoxSize, windowSize: BoxSize) => Rect,
        measureIgnoreMaxHeight?: boolean,
        measureIgnoreMinHeight?: boolean,
        measureIgnoreMaxWidth?: boolean,
        measureIgnoreMinWidth?: boolean,
    }>(),
    {
        mode: 'instance',
        openActive: true,
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
    button(props: { opened: boolean, toggle: (open: boolean) => void }): void;
    popup(props: { opened: boolean, toggle: (open: boolean) => void }): void;
}>();

// emits
const emits = defineEmits<{
    (event: 'opened'): void,
    (event: 'closed'): void,
    (event: 'clickOutside', evt: Event): void,
    (event: 'beforeMeasure'): void,
    (event: 'afterMeasure'): void,
}>();

// datas
const opened = ref(false);
const emit_opened = () => emits('opened');
watch(opened, (opened) => {
    if (opened) {
        // emits open event after rendered flush
        nextTick(emit_opened);
    }
    else {
        // grab focus
        button_ref.value?.button?.focus();
        // emites close event before render update
        emits('closed');
    }
});
const button_ref = ref<InstanceType<typeof SunButton> | undefined>();
const measurepopuppanel_ref = ref<InstanceType<typeof SunMeasurePopupPanel> | undefined>();

function getPopupPanelRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect {
    const { x, y, width, height } = (button_ref.value?.button as HTMLButtonElement)?.getBoundingClientRect() ?? { x: 0, y: 0, width: 0, height: 0 };
    if (props.getPopupRect !== undefined) return props.getPopupRect({ x, y, width, height }, contentMinSize, windowSize);
    return calcButtonPopupRect({ x, y, width, height }, contentMinSize, windowSize, 0);
}

function toggle(open: boolean) {
    opened.value = open;
}

function onCoverClick(evt: Event) {
    emits('clickOutside', evt);
    if (evt.defaultPrevented) return;
    toggle(false);
}

function onTrapFocusOut(evt: TrapFocusOutEvent) {
    if (button_ref.value?.button) {
        evt.preventDefault();
        button_ref.value.button.focus();
    }
}

function onFocusChange(evt: KeyboardEvent) {
    if (opened.value) {
        evt.preventDefault();
        if (evt.shiftKey) {
            measurepopuppanel_ref.value?.focusLast();
        }
        else {
            measurepopuppanel_ref.value?.focusFirst();
        }
    }
}

function refreshPopupContentMinSize() {
    measurepopuppanel_ref.value?.refreshPopupContentMinSize();
}

// exposes
defineExpose({
    toggle,
    refreshPopupContentMinSize,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-buttonpopup-button__
    // 

</style>