<template>
    <SunButton ref="button_ref" class="__sun-design-buttonpopup-button__" :class="{ opened }" :size="size" :flat="flat"
        :bordered="bordered" :active="active" :borderMask="borderMask" :hover="hover" :colorScheme="colorScheme"
        :rounded="rounded" :squared="squared" @click="opened = !opened" v-bind="$attrs">
        <slot name="button" :opened="opened" :toggle="toggle" />
    </SunButton>
    <SunPopup v-if="instance" :visible="opened" :rect="popup_rect" @cover-click="onCoverClick">
        <SunPanel ref="panel_ref" class="__sun-design-buttonpopup-panel__" :size="size" bordered :vertical="vertical"
            :dropShadow="dropShadow" :container="container">
            <!-- :data-buttonpopup-size="size" -->
            <SunScrollContainer :minWidth="minWidth" :maxWidth="maxWidth" :width="width" :minHeight="minHeight"
                :maxHeight="maxHeight" :height="height" :scrollableIndicators="scrollableIndicators"
                :scrollBarStateH="scrollBarStateH" :scrollBarStateV="scrollBarStateV" :scrollBarVisibility="scrollBarVisibility">
                <SunPanel class="__sun-design-buttonpopup-panel-container__" container :vertical="vertical">
                    <slot name="popup" :opened="opened" :toggle="toggle" />
                </SunPanel>
            </SunScrollContainer>
        </SunPanel>
    </SunPopup>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import { type Size, type BorderMask, type ColorScheme, type Rect, type BoxSize, type PopupOpenMode } from '../SunDesignConstants';
import SunButton from '../button/SunButton.vue';
import SunPopup from '../popup/SunPopup.vue';
import { computed, ref, watch, nextTick } from 'vue';
import SunPanel from '../panel/SunPanel.vue';
import SunScrollContainer, { type ScrollBarState } from '../scrollcontainer/SunScrollContainer.vue';
import { type ScrollBarVisibility } from '../scrollcontainer/SunScrollBar.vue';
import { useWindowSize } from '@vueuse/core';

// props
const props = withDefaults(
    defineProps<{
        mode?: PopupOpenMode,
        // button
        size?: Size,
        flat?: boolean,
        bordered?: boolean,
        active?: boolean,
        borderMask?: BorderMask,
        hover?: boolean,
        colorScheme?: ColorScheme,
        rounded?: boolean,
        squared?: boolean,
        // panel
        vertical?: boolean,
        dropShadow?: boolean,
        container?: boolean,
        // popup
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
        getPopupRect: (buttonRect: Rect, contentMinSize: BoxSize, windowSize: BoxSize) => Rect,
    }>(),
    {
        mode: 'instance',
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
    (event: 'coverClick', evt: Event): void,
}>();

// datas
const opened = ref(false);
const instance = computed(() => props.mode === 'visibility' || opened.value);
const button_ref = ref<InstanceType<typeof SunButton> | undefined>();
const panel_ref = ref<InstanceType<typeof SunPanel> | undefined>();

const button_rect = ref<Rect>({ x: 0, y: 0, width: 0, height: 0 });
const content_min_size = ref<BoxSize>({ width: 0, height: 0 });
const { width: windowWidth, height: windowHeight } = useWindowSize();

const get_panel_content_min_size = () => {
    const div = panel_ref.value?.div;
    if (div !== undefined) {
        const style_width = (div as HTMLDivElement).style.width;
        const style_height = (div as HTMLDivElement).style.height;
        (div as HTMLDivElement).style.width = 'min-content';
        (div as HTMLDivElement).style.height = 'min-content';
        const { x, y, width, height } = (div as HTMLDivElement).getBoundingClientRect();
        (div as HTMLDivElement).style.width = style_width;
        (div as HTMLDivElement).style.height = style_height;
        content_min_size.value.width = width;
        content_min_size.value.height = height;
    }
};

watch([opened], ([opened]) => {
    if (opened) {
        // button
        const button = button_ref.value?.button;
        if (button !== undefined) {
            const { x, y, width, height } = (button as HTMLButtonElement).getBoundingClientRect();
            button_rect.value.x = x;
            button_rect.value.y = y;
            button_rect.value.width = width;
            button_rect.value.height = height;
        }
        // panel content
        if (props.mode === 'instance') {
            nextTick(get_panel_content_min_size);
        }
        else {
            get_panel_content_min_size();
        }
    }
    if (opened) emits('opened');
    else emits('closed');
});

const popup_rect = computed<Rect>(() => {
    return props.getPopupRect(button_rect.value, content_min_size.value, { width: windowWidth.value, height: windowHeight.value }); // { x: 16, y: 44, width: content_min_size.value.width, height: content_min_size.value.height };
});

function toggle(open: boolean) {
    opened.value = open;
}

function onCoverClick(evt: Event) {
    emits('coverClick', evt);
    if (evt.defaultPrevented) return;
    toggle(false);
}

// exposes
defineExpose({
    toggle,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-buttonpopup-button__
    &.opened
        // 

.__sun-design__.__sun-design-buttonpopup-panel__
    height: 100%
    width: 100%
    
    // &[data-buttonpopup-size="small"]
    //     border-radius: border-radius-size-small !important

    // &[data-buttonpopup-size="normal"]
    //     border-radius: border-radius-size-normal !important

    // &[data-buttonpopup-size="large"]
    //     border-radius: border-radius-size-large !important

.__sun-design-buttonpopup-panel-container__
    width: 100%
    height: 100%

</style>