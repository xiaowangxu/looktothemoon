<template>
    <SunPopup v-if="instance" :visible="visible" :rect="popup_rect" :stop-events="stopEvents" @cover-click="onClickOutside">
        <SunPanel ref="panel_ref" class="__sun-design-menupopup-panel__" :style="panelStyle" bordered vertical dropShadow>
            <SunScrollContainer width="100%" :scrollableIndicators="scrollableIndicators" :scrollBarStateH="scrollBarStateH"
                :scrollBarStateV="scrollBarStateV" :scrollBarVisibility="scrollBarVisibility">
                <SunPanel class="__sun-design-menupopup-panel-container__" container vertical>
                    <template v-for="option in options">
                        <SunPanelContainer vertical style="width: 100%;">
                            <template v-for="item in option">
                                <template v-if="(item as RenderMenuItem).render === undefined">
                                    <SunButton class="__sun-design-select-item__" :size="size" flat
                                        :color-scheme="(item as ItemMenuItem).colorScheme"
                                        @mouseenter="onMouseEnter((item as ItemMenuItem).uid, (item as ItemMenuItem).subs, $event)"
                                        @click="onItemButtonClick((item as ItemMenuItem).uid, (item as ItemMenuItem).subs, $event)">
                                        <SunButtonItem
                                            :item="{ label: (item as ItemMenuItem).label, icon: (item as ItemMenuItem).icon, description: (item as ItemMenuItem).description, shortcut: (item as ItemMenuItem).shortcut, sub: (item as ItemMenuItem).subs !== undefined }" />
                                    </SunButton>
                                </template>
                                <template v-else>
                                    <component :is="(item as RenderMenuItem).render" :uid="item.uid" :hover="onMouseEnter"
                                        :expand="expandSubMenu" :click="onClick" />
                                </template>
                            </template>
                        </SunPanelContainer>
                        <SunPanelSeparator :override-vertical="true" />
                    </template>
                </SunPanel>
            </SunScrollContainer>
        </SunPanel>
    </SunPopup>
    <SunMenuPopup v-if="sub_menu !== undefined" :options="sub_menu" :mode="mode" :size="size" :stop-events="false"
        :prefered-direction="popup_direction" :show-delay="showDelay" :hide-delay="hideDelay" :get-popup-rect="getPopupRect"
        @click="onClick" />
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunPopup from '../popup/SunPopup.vue';
import SunPanel from '../panel/SunPanel.vue';
import SunButton from '../button/SunButton.vue';
import SunButtonItem from '../item/SunButtonItem.vue';
import SunPanelContainer from '../panel/SunPanelContainer.vue';
import SunPanelSeparator from '../panel/SunPanelSeparator.vue';
import SunScrollContainer, { type ScrollBarState } from '../scrollcontainer/SunScrollContainer.vue';
import { type ScrollBarVisibility } from '../scrollcontainer/SunScrollBar.vue';
import { type Item, type Rect, type BoxSize, type PopupOpenMode, type Size, calcMenuPopupRect, type UID, type TimerCanceller, timer } from '../SunDesignConstants';
import { computed, nextTick, onBeforeUnmount, ref, toRef, watch, type Component, type Raw } from 'vue';
import { useWindowSize } from '@vueuse/core';

type ItemMenuItem<T extends UID = UID> = Omit<Item<T>, 'sub'> & { subs?: MenuItem<T>[][] };
type RenderMenuItem<T extends UID = UID> = {
    uid: T,
    render: Raw<Component<{
        uid: T,
        hover: (uid: T, subs: MenuItem<T>[][] | undefined, evt: Event) => void,
        expand: (uid: T, subs: MenuItem<T>[][] | undefined, evt: Event) => void,
        click: (data: any, hasSubMenu: boolean, evt: Event) => void,
    }>>,
};
type MenuItem<T extends UID = UID> = ItemMenuItem<T> | RenderMenuItem<T>;

// props
const props = withDefaults(
    defineProps<{
        mode?: PopupOpenMode,
        visible?: boolean,
        size?: Size,
        options: MenuItem[][],
        preferedDirection?: 0 | 1,
        stopEvents?: boolean,
        panelStyle?: string,
        getPopupRect: (contentMinSize: BoxSize, preferedDirection: 0 | 1, windowSize: BoxSize) => { rect: Rect, direction?: 0 | 1 },
        // popup
        minWidth?: number,
        maxWidth?: number,
        scrollableIndicators?: boolean,
        scrollBarStateH?: ScrollBarState,
        scrollBarStateV?: ScrollBarState,
        scrollBarVisibility?: ScrollBarVisibility,
        //
        showDelay?: number,
        hideDelay?: number,
    }>(),
    {
        mode: 'instance',
        visible: true,
        preferedDirection: 0,
        stopEvents: true,
        scrollableIndicators: true,
        scrollBarStateH: 'adaptive',
        scrollBarStateV: 'adaptive',
        scrollBarVisibility: 'hover-track',
        minWidth: 160,
        maxWidth: 400,
        showDelay: 150,
        hideDelay: 250,
    }
);

// emits
const emits = defineEmits<{
    (event: 'click', data: any, hasSubMenu: boolean, evt: Event): void,
    (event: 'clickOutside', evt: Event): void,
}>();

// datas
const instance = computed(() => props.mode === 'visibility' || props.visible === true);
const opened = computed(() => instance && props.visible === true);
const panel_ref = ref<InstanceType<typeof SunPanel> | undefined>();
const content_min_size = ref<BoxSize>({ width: 0, height: 0 });
const { width: windowWidth, height: windowHeight } = useWindowSize();

const get_panel_content_min_size = () => {
    const div = panel_ref.value?.div;
    if (div !== undefined && props.visible) {
        const _div = (div as HTMLDivElement);
        const style_width = _div.style.width;
        const style_height = _div.style.height;
        _div.style.width = 'min-content';
        _div.style.height = 'min-content';
        const { width, height } = _div.getBoundingClientRect();
        _div.style.width = style_width;
        _div.style.height = style_height;
        content_min_size.value = { width, height };
    }
};

watch([instance, opened, toRef(props, 'options'), panel_ref, toRef(props, 'options')], ([_, opened]) => {
    clearState();
    if (opened) {
        // panel content
        if (props.mode === 'instance') {
            nextTick(get_panel_content_min_size);
        }
        else {
            get_panel_content_min_size();
        }
    }
});

const popup_value = computed(() => {
    const { width, height } = content_min_size.value;
    return props.getPopupRect({ width: Math.max(props.minWidth, Math.min(props.maxWidth, width)), height }, props.preferedDirection, { width: windowWidth.value, height: windowHeight.value });
});

const popup_rect = computed(() => popup_value.value.rect);
const popup_direction = computed(() => popup_value.value.direction ?? props.preferedDirection);

let button_ref: HTMLButtonElement | undefined = undefined;

function getPopupRect(contentMinSize: BoxSize, preferedDirection: 0 | 1, windowSize: BoxSize) {
    const { x, y, width, height } = button_ref!.getBoundingClientRect();
    return calcMenuPopupRect(contentMinSize, { x, y, width, height }, windowSize, preferedDirection,);
}

function clearState() {
    sub_menu.value = undefined;
    button_ref = undefined;
    hover_uid = undefined;
    hover_sub_menu = undefined;
    show_timer?.();
    show_timer = undefined
    hide_timer?.();
    hide_timer = undefined;
}

let hover_uid: UID | undefined = undefined;
let hover_sub_menu: MenuItem[][] | undefined = undefined;
const sub_menu = ref<MenuItem[][] | undefined>();

let show_timer: TimerCanceller | undefined = undefined;
const on_show_time_up = () => {
    sub_menu.value = hover_sub_menu;
    show_timer?.();
    show_timer = undefined;
}
let hide_timer: TimerCanceller | undefined = undefined;
const on_hide_time_up = () => {
    sub_menu.value = undefined;
    button_ref = undefined;
    hide_timer?.();
    hide_timer = undefined;
}

function onMouseEnter(uid: UID, subs: MenuItem[][] | undefined, evt: Event) {
    if (hover_uid === uid) return;
    hover_uid = uid;
    hover_sub_menu = subs;
    if (hover_sub_menu !== undefined) {
        // hovered sub menu
        hide_timer?.();
        hide_timer = undefined;
        button_ref = evt.target as HTMLButtonElement;
        show_timer?.();
        show_timer = timer(on_show_time_up, props.showDelay);
    }
    else {
        show_timer?.();
        show_timer = undefined;
        // leaved sub menu
        if (hide_timer === undefined && sub_menu.value !== undefined) {
            hide_timer = timer(on_hide_time_up, props.hideDelay);
        }
    }
}

function expandSubMenu(uid: UID, subs: MenuItem[][] | undefined, evt: Event): void {
    hover_uid = uid;
    hover_sub_menu = subs;
    show_timer?.();
    show_timer = undefined;
    hide_timer?.();
    hide_timer = undefined;
    if (hover_sub_menu !== undefined) {
        button_ref = evt.target as HTMLButtonElement;
        on_show_time_up();
    }
    else {
        button_ref = undefined;
        on_hide_time_up();
    }
}

function onItemButtonClick(uid: UID, subs: MenuItem[][] | undefined, evt: Event): void {
    expandSubMenu(uid, subs, evt);
    onClick(uid, subs !== undefined, evt);
}

function onClick(data: any, hasSubMenu: boolean, evt: Event) {
    emits('click', data, hasSubMenu, evt);
}

function onClickOutside(evt: Event): void {
    emits('clickOutside', evt);
}

onBeforeUnmount(() => {
    show_timer?.();
    show_timer = undefined
    hide_timer?.();
    hide_timer = undefined;
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-menupopup-panel__
    pointer-events: all
    width: 100%
    height: 100%

</style>