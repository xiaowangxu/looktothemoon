<template>
    <div class="__sun-design-panel-tabs-container__" :class="{ vertical }">
        <SunScrollContainer class="__sun-design-panel-tabs-container-tabs-container__"
            :scrollable-indicators="scrollableIndicators" :scroll-bar-state-h="scrollBarStateH"
            :scroll-bar-state-v="scrollBarStateV" :scroll-bar-visibility="scrollBarVisibility"
            :content-style="vertical ? 'min-height: 100%; height: auto;' : 'min-width: 100%'"
            :content-class="{ '__sun-design-panel-tabs-container-tabs__': true, vertical, 'no-border': hideBorder, append: $slots.append !== undefined }"
            :data-size="size">
            <SunButtonLike v-for="tab in tabs" class="__sun-design-panel-tabs-container-tab-container__" :size="size"
                no-hover-color no-pressed-color :class="{ selected: tab.uid === selected }">
                <SunButton class="__sun-design-panel-tabs-container-tab__ no-hover-color no-pressed-color" :size="size" flat
                    style="flex: 1;" @click="onClick(tab.uid, $event)" :squared="tab.iconOnly">
                    <SunButtonItem v-if="(tab as RenderTabItem).render === undefined" :label="(tab as ItemTabItem).label"
                        :icon="(tab as ItemTabItem).icon" :description="(tab as ItemTabItem).description" />
                    <component v-else :is="(tab as RenderTabItem).render" :selected="tab.uid === selected" />
                </SunButton>
                <div v-if="$slots.append !== undefined" class="__sun-design-panel-tabs-container-append__"
                    :class="{ hide: !showAppendOnUnselected && tab.uid !== selected }">
                    <slot name="append" :tab="tab.uid" :selected="tab.uid === selected" />
                </div>
            </SunButtonLike>
            <div class="__sun-design-tabs-container-gapper__" />
        </SunScrollContainer>
        <slot :tab="selected" />
    </div>
</template>

<script setup lang="ts">

import { ref, type Raw, type Component, watch } from 'vue';
import SunButtonLike from '../button/SunButtonLike.vue';
import SunButton from '../button/SunButton.vue';
import SunButtonItem from '../item/SunButtonItem.vue';
import SunScrollContainer, { type ScrollBarState } from '../scrollcontainer/SunScrollContainer.vue';
import type { Item, Size, UID } from '../SunDesignConstants';
import type { ScrollBarVisibility } from '../scrollcontainer/SunScrollBar.vue';

type ItemTabItem<T extends UID = UID> = Omit<Item<T>, 'sub' | 'active' | 'colorScheme'>;
type RenderTabItem<T extends UID = UID> = {
    uid: T,
    title?: string,
    disabled?: boolean,
    iconOnly?: boolean,
    render: Raw<Component<{ selected: boolean }>>,
};
export type TabItem<T extends UID = UID> = ItemTabItem<T> | RenderTabItem<T>;

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        tabs: TabItem[],
        initialSelected?: UID,
        vertical?: boolean,
        hideBorder?: boolean,
        showAppendOnUnselected?: boolean,
        scrollableIndicators?: boolean,
        scrollBarStateH?: ScrollBarState,
        scrollBarStateV?: ScrollBarState,
        scrollBarVisibility?: ScrollBarVisibility,
    }>(),
    {
        size: 'normal',
        vertical: false,
        hideBorder: true,
        showAppendOnUnselected: false,
        scrollableIndicators: true,
        scrollBarStateH: 'adaptive',
        scrollBarStateV: 'adaptive',
        scrollBarVisibility: 'hover-track',
    }
);

// slots
defineSlots<{
    default(props: { tab: UID | undefined }): void,
    append(props: { tab: UID | undefined, selected: boolean }): void,
}>();

// emits
const emits = defineEmits<{
    (event: 'switch', tab: UID | undefined): void,
}>();

// datas
const selected = ref(props.initialSelected);
watch(selected, tab => emits('switch', tab));

function onClick(uid: UID, evt: MouseEvent) {
    selected.value = uid;
    (evt.target as HTMLElement).scrollIntoView();
}

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-panel-tabs-container__
    display: flex
    flex-direction: column
    &.vertical
        flex-direction: row
    overflow: hidden
    flex-wrap: nowrap

.__sun-design-panel-tabs-container-tab-container__
    justify-content: flex-start !important
    border-radius: 0px !important
    padding-top: 0px !important
    padding-bottom: 0px !important
    padding-left : 0px !important
    border: none !important
    flex-shrink: 0
    .__sun-design-panel-tabs-container-tabs__:not(.append) > &
        padding-right : 0px !important
    &.selected
        background-color: transparent !important
    &:not(.selected):has(> .__sun-design-panel-tabs-container-tab__:hover)
        background-color: var(--color-hover) !important
    &[data-size="small"]
        height: size-small + panel-padding * 2 + border-width
    &[data-size="normal"]
        height: size-normal + panel-padding * 2 + border-width
    &[data-size="large"]
        height: size-large + panel-padding * 2 + border-width

.__sun-design-panel-tabs-container-append__.hide
    visibility: hidden
    .__sun-design-panel-tabs-container-tab-container__:hover > &
        visibility: unset

.__sun-design-tabs-container-gapper__
    background-color: var(--color-normal)
    border-bottom: solid-border
    border-right: none
    flex-grow: 1
    box-sizing: border-box

    .__sun-design-panel-tabs-container-tabs__.vertical > &
        border-right: solid-border
        border-bottom: none

.__sun-design-panel-tabs-container-tabs__
    height: 100%
    display: flex
    flex-direction: row
    &.vertical
        flex-direction: column
    flex-wrap: nowrap

    > .__sun-design-panel-tabs-container-tab-container__ > .__sun-design-panel-tabs-container-tab__
        flex-shrink: 0
        border: none !important
        align-self: stretch
        &[data-size="small"]
            padding: padding-small + panel-padding padding-extend-small + panel-padding !important
            &.squared
                padding: padding-small + panel-padding + border-width !important
        &[data-size="normal"]
            padding: padding-normal + panel-padding padding-extend-normal + panel-padding !important
            &.squared
                padding: padding-normal + panel-padding + border-width !important
        &[data-size="large"]
            padding: padding-large + panel-padding padding-extend-large + panel-padding !important
            &.squared
                padding: padding-large + panel-padding + border-width !important
    
    &.append > .__sun-design-panel-tabs-container-tab-container__ > .__sun-design-panel-tabs-container-tab__
        &[data-size="small"]
            padding-right: padding-extend-small !important
            &.squared
                padding-right: padding-small !important
        &[data-size="normal"]
            padding-right: padding-extend-normal !important
            &.squared
                padding-right: padding-normal !important
        &[data-size="large"]
            padding-right: padding-extend-large !important
            &.squared
                padding-right: padding-large !important

    > .__sun-design-panel-tabs-container-tab-container__
        border-top: none !important
        border-left: none !important
        border-right: solid-border !important
        border-bottom: solid-border !important
    &.no-border:not(.vertical) > .__sun-design-panel-tabs-container-tab-container__.selected
        border-bottom-color: transparent !important

    &.vertical > .__sun-design-panel-tabs-container-tab-container__
        border-left: none !important
        border-top: none !important
        border-right: solid-border !important
        border-bottom: solid-border !important
     &.vertical.no-border > .__sun-design-panel-tabs-container-tab-container__.selected
        border-right-color: transparent !important

</style>