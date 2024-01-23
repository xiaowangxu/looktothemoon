<template>
    <SunMeasurePopupPanel ref="measurepopuppanel_ref" vertical :mode="mode" :visible="visible"
        class="__sun-design-menupopup-panel__" content-style="width: 100%;" :style="panelStyle" :stop-events="stopEvents"
        :get-popup-rect="getPopupPanelRect" @cover-click="onClickOutside" :scrollableIndicators="scrollableIndicators"
        :scrollBarStateH="scrollBarStateH" :scrollBarStateV="scrollBarStateV" :scrollBarVisibility="scrollBarVisibility">
        <template v-for="option in options">
            <SunPanelContainer vertical style="width: 100%;">
                <template v-for="item in option">
                    <template v-if="(item as RenderMenuItem).render === undefined">
                        <SunButton class="__sun-design-select-item__" :size="size" flat
                            :color-scheme="(item as ItemMenuItem).colorScheme" :active="(item as ItemMenuItem).active"
                            :disabled="(item as ItemMenuItem).disabled"
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
    </SunMeasurePopupPanel>
    <SunMenuPopup v-if="sub_menu !== undefined && visible" :options="sub_menu" :size="size" :stop-events="false"
        :prefered-direction="popup_direction" :show-delay="showDelay" :hide-delay="hideDelay" :get-popup-rect="getPopupRect"
        @click="onClick" />
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
import { type Item, type Rect, type BoxSize, type PopupOpenMode, type Size, calcMenuPopupRect, type UID, type TimerCanceller, type PreferedDirection, timer } from '../SunDesignConstants';
import { onBeforeUnmount, ref, type Component, type Raw, toRef, watch, nextTick } from 'vue';

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
const measurepopuppanel_ref = ref<InstanceType<typeof SunMeasurePopupPanel> | undefined>();
const refresh_content_min_size = () => {
    measurepopuppanel_ref.value?.refreshPopupContentMinSize();
};
watch(toRef(props, 'options'), () => {
    clearState();
    nextTick(refresh_content_min_size);
});

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

let button_ref: HTMLButtonElement | undefined = undefined;

function getPopupRect(contentMinSize: BoxSize, preferedDirection: PreferedDirection, windowSize: BoxSize) {
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