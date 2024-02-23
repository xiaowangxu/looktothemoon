<template>
    <SunMeasurePopupPanel ref="measurepopuppanel_ref" vertical :mode="mode" :visible="visible"
        class="__sun-design-menupopup-panel__" content-style="width: 100%;" :style="panelStyle" :stop-events="stopEvents"
        :get-popup-rect="getPopupPanelRect" @cover-click="onClickOutside" @cover-contextmenu="onClickOutside"
        :scrollableIndicators="scrollableIndicators" :scrollBarStateH="scrollBarStateH" :scrollBarStateV="scrollBarStateV"
        :scrollBarVisibility="scrollBarVisibility" @trap-focus-out="onTrapFocusOut">
        <template v-for="option, idx in  options ">
            <SunPanelContainer vertical style="width: 100%;">
                <template v-for="item in  option ">
                    <template v-if="(item as RenderMenuItem).render === undefined">
                        <SunButton class="__sun-design-select-item__" :size="size" flat
                            :color-scheme="(item as ItemMenuItem).colorScheme" :active="(item as ItemMenuItem).active"
                            :disabled="(item as ItemMenuItem).disabled"
                            :hover="sub_menu_uid === item.uid && hover_uid === item.uid"
                            @mouseenter="onMouseEnter(item.uid, (item as ItemMenuItem).subs, $event.target, $event.target)"
                            @click="onItemButtonClick(item.uid, (item as ItemMenuItem).subs, (item as ItemMenuItem).clickable, $event)"
                            :key="item.uid">
                            <SunButtonItem :label="(item as ItemMenuItem).label" :icon="(item as ItemMenuItem).icon"
                                :description="(item as ItemMenuItem).description"
                                :shortcut="(item as ItemMenuItem).shortcut"
                                :sub="(item as ItemMenuItem).subs !== undefined" />
                        </SunButton>
                    </template>
                    <template v-else>
                        <component :is="(item as RenderMenuItem).render" :uid="item.uid" :hover="onMouseEnter"
                            :expand="expandSubMenu" :click="onClick" :key="item.uid"
                            :hovered="sub_menu_uid === item.uid && hover_uid === item.uid" />
                    </template>
                </template>
            </SunPanelContainer>
            <SunPanelSeparator v-if="idx < options.length - 1" :override-vertical="true" :key="idx" />
        </template>
    </SunMeasurePopupPanel>
    <SunMenuPopup v-if="sub_menu !== undefined && visible" :options="sub_menu" :size="size" :stop-events="false"
        :prefered-direction="popup_direction" :show-delay="showDelay" :hide-delay="hideDelay" :get-popup-rect="getPopupRect"
        @click="onClick" @click-outside="onSubMenuClickOutSide" />
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunMeasurePopupPanel from '../measurepopuppanel/SunMeasurePopupPanel.vue';
import SunButton from '../button/SunButton.vue';
import SunButtonItem from '../item/SunButtonItem.vue';
import SunPanelContainer from '../panel/SunPanelContainer.vue';
import SunPanelSeparator from '../panel/SunPanelSeparator.vue';
import { type ScrollBarState } from '../scrollcontainer/SunScrollContainer.vue';
import { type ScrollBarVisibility } from '../scrollcontainer/SunScrollBar.vue';
import { type Item, type Rect, type BoxSize, type PopupOpenMode, type Size, calcMenuPopupRect, type UID, type TimerCanceller, type PreferedDirection, timer, TrapFocusOutEvent } from '../SunDesignConstants';
import { onBeforeUnmount, ref, type Component, type Raw, toRef, watch } from 'vue';

type ItemMenuItem<T extends UID = UID> = Omit<Item<T>, 'sub'> & { subs?: MenuItem<T>[][], clickable?: boolean };
type RenderMenuItem<T extends UID = UID> = {
    uid: T,
    render: Raw<Component<{
        uid: T,
        hovered: boolean,
        hover: (uid: T, subs: MenuItem<T>[][] | undefined, expand_target: HTMLElement | Rect, focus_target: HTMLElement | undefined) => void,
        expand: (uid: T, subs: MenuItem<T>[][] | undefined, expand_target: HTMLElement | Rect, focus_target: HTMLElement | undefined) => void,
        click: (data: any, hasSubMenu: boolean, evt: Event) => void,
    }>>,
};
export type MenuItem<T extends UID = UID> = ItemMenuItem<T> | RenderMenuItem<T>;

// props
const props = withDefaults(
    defineProps<{
        mode?: PopupOpenMode,
        visible?: boolean,
        size?: Size,
        options: MenuItem[][],
        preferedDirection?: PreferedDirection,
        stopEvents?: boolean,
        panelStyle?: string,
        getPopupRect: (contentMinSize: BoxSize, preferedDirection: PreferedDirection, windowSize: BoxSize) => { rect: Rect, direction?: PreferedDirection },
        minWidth?: number,
        maxWidth?: number,
        scrollableIndicators?: boolean,
        scrollBarStateH?: ScrollBarState,
        scrollBarStateV?: ScrollBarState,
        scrollBarVisibility?: ScrollBarVisibility,
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
        scrollBarVisibility: 'hover',
        minWidth: 180,
        maxWidth: 460,
        showDelay: 150,
        hideDelay: 250,
    }
);

// emits
const emits = defineEmits<{
    (event: 'trapFocusOut', evt: TrapFocusOutEvent): void,
    (event: 'click', data: any, hasSubMenu: boolean, evt: Event): void,
    (event: 'clickOutside', evt: Event): void,
}>();

// datas
const measurepopuppanel_ref = ref<InstanceType<typeof SunMeasurePopupPanel> | undefined>();
const refresh_content_min_size = () => {
    measurepopuppanel_ref.value?.refreshPopupContentMinSize();
};
watch(toRef(props, 'options'), () => {
    clearState();
    refresh_content_min_size();
}, { flush: 'post' });

const popup_direction = ref<PreferedDirection>(0);
function getPopupPanelRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect {
    const { width, height } = contentMinSize;
    const { rect, direction } = props.getPopupRect(
        { width: Math.max(props.minWidth, Math.min(props.maxWidth, width)), height },
        props.preferedDirection, windowSize);
    popup_direction.value = direction ?? props.preferedDirection;
    return rect;
}
watch(toRef(props, 'visible'), (visible) => {
    if (!visible) clearState();
});
let expand_ref: HTMLElement | Rect | undefined = undefined;
let button_ref: HTMLElement | undefined = undefined;

function getPopupRect(contentMinSize: BoxSize, preferedDirection: PreferedDirection, windowSize: BoxSize) {
    let x: number = 0, y: number = 0, width: number = 0, height: number = 0;
    if (expand_ref instanceof HTMLElement) {
        const { x: _x, y: _y, width: _width, height: _height } = expand_ref.getBoundingClientRect();
        x = _x;
        y = _y;
        width = _width;
        height = _height;
    }
    else if (expand_ref !== undefined) {
        x = expand_ref.x;
        y = expand_ref.y;
        width = expand_ref.width;
        height = expand_ref.height;
    }
    return calcMenuPopupRect(contentMinSize, { x, y, width, height }, windowSize, preferedDirection,);
}

function clearState() {
    sub_menu.value = undefined;
    sub_menu_uid.value = undefined;
    expand_ref = undefined;
    button_ref = undefined;
    hover_uid.value = undefined;
    hover_sub_menu = undefined;
    show_timer?.();
    show_timer = undefined
    hide_timer?.();
    hide_timer = undefined;
}

const hover_uid = ref<UID | undefined>();
let hover_sub_menu: MenuItem[][] | undefined = undefined;
const sub_menu = ref<MenuItem[][] | undefined>();
const sub_menu_uid = ref<UID | undefined>();

let show_timer: TimerCanceller | undefined = undefined;
const on_show_time_up = () => {
    sub_menu.value = hover_sub_menu;
    sub_menu_uid.value = hover_sub_menu === undefined ? undefined : hover_uid.value;
    show_timer?.();
    show_timer = undefined;
}
let hide_timer: TimerCanceller | undefined = undefined;
const on_hide_time_up = () => {
    sub_menu.value = undefined;
    sub_menu_uid.value = undefined;
    button_ref = undefined;
    hide_timer?.();
    hide_timer = undefined;
}

function onMouseEnter(uid: UID, subs: MenuItem[][] | undefined, expand_target: HTMLElement | Rect | undefined, focus_target: HTMLElement | undefined) {
    if (hover_uid.value === uid) return;
    hover_uid.value = uid;
    hover_sub_menu = subs;
    if (hover_sub_menu !== undefined) {
        // hovered sub menu
        hide_timer?.();
        hide_timer = undefined;
        expand_ref = expand_target;
        button_ref = focus_target;
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

function expandSubMenu(uid: UID, subs: MenuItem[][] | undefined, expand_target: HTMLElement | Rect | undefined, focus_target: HTMLElement | undefined): void {
    hover_uid.value = uid;
    hover_sub_menu = subs;
    show_timer?.();
    show_timer = undefined;
    hide_timer?.();
    hide_timer = undefined;
    if (hover_sub_menu !== undefined) {
        expand_ref = expand_target;
        button_ref = focus_target;
        on_show_time_up();
    }
    else {
        button_ref = undefined;
        on_hide_time_up();
    }
}

function onItemButtonClick(uid: UID, subs: MenuItem[][] | undefined, clickable: boolean | undefined, evt: Event): void {
    expandSubMenu(uid, subs, evt.target as HTMLElement, evt.target as HTMLElement);
    if (subs === undefined || clickable === true) {
        onClick(uid, subs !== undefined, evt);
    }
}

function onSubMenuClickOutSide() {
    const last_button = button_ref;
    clearState();
    if (last_button) {
        last_button?.focus();
    }
    else {
        measurepopuppanel_ref.value?.focusTop();
    }
}

function onClick(data: any, hasSubMenu: boolean, evt: Event) {
    emits('click', data, hasSubMenu, evt);
}

function onClickOutside(evt: Event): void {
    emits('clickOutside', evt);
}

function onTrapFocusOut(evt: TrapFocusOutEvent) {
    emits('trapFocusOut', evt);
}

function focusTop() {
    measurepopuppanel_ref.value?.focusTop();
}

function focusFirst() {
    measurepopuppanel_ref.value?.focusFirst();
}

function focusLast() {
    measurepopuppanel_ref.value?.focusLast();
}

onBeforeUnmount(() => {
    show_timer?.();
    show_timer = undefined
    hide_timer?.();
    hide_timer = undefined;
});

// exposes
defineExpose({
    focusTop,
    focusFirst,
    focusLast,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-menupopup-panel__
    pointer-events: all
    width: 100%
    height: 100%

</style>