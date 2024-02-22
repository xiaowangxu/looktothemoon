<template>
    <div class="__sun-design-panel-tabs-container__" :class="{ vertical }">
        <SunScrollContainer class="__sun-design-panel-tabs-container-tabs-container__"
            :content-style="vertical ? 'height: 100%;' : 'height: 100%; min-width: 100%;'" :data-size="size">
            <div class="__sun-design-panel-tabs-container-tabs__" :class="{ vertical, 'no-border': hideBorder }">
                <SunButton v-for="tab in tabs" :size="size" class="__sun-design-panel-tabs-container-tab__"
                    :class="tab.uid === selected ? ['selected', 'flat', 'no-hover-color', 'no-pressed-color'] : undefined"
                    :disabled="tab.disabled" :squared="tab.iconOnly" :title="tab.title" @click="onClick(tab.uid, $event)">
                    <SunButtonItem v-if="(tab as RenderTabItem).render === undefined" :label="(tab as ItemTabItem).label"
                        :icon="(tab as ItemTabItem).icon" :description="(tab as ItemTabItem).description" />
                    <component v-else :is="(tab as RenderTabItem).render" :selected="tab.uid === selected" />
                </SunButton>
                <div class="__sun-design-tabs-container-gapper__" />
            </div>
        </SunScrollContainer>
        <slot :tab="selected" />
    </div>
</template>

<script setup lang="ts">

import { ref, type Raw, type Component, watch } from 'vue';
import SunButton from '../button/SunButton.vue';
import SunButtonItem from '../item/SunButtonItem.vue';
import SunScrollContainer from '../scrollcontainer/SunScrollContainer.vue';
import type { Item, Size, UID } from '../SunDesignConstants';

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
    }>(),
    {
        size: 'normal',
        vertical: false,
        hideBorder: true,
    }
);

// slots
defineSlots<{
    default(props: { tab: UID | undefined }): void,
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

.__sun-design-tabs-container-gapper__
    background-color: var(--color-normal)
    border-bottom: solid-border
    border-right: none
    flex-grow: 1
    flex-shrink: 0
    box-sizing: border-box

    .__sun-design-panel-tabs-container-tabs__.vertical > &
        border-right: solid-border
        border-bottom: none

.__sun-design-panel-tabs-container-tabs-container__
    &[data-size="small"]
        width: 100%
        height: size-small + panel-padding * 2 + border-width
    &[data-size="normal"]
        width: 100%
        height: size-normal + panel-padding * 2 + border-width
    &[data-size="large"]
        width: 100%
        height: size-large + panel-padding * 2 + border-width

    .__sun-design-panel-tabs-container__.vertical > &
        height: 100%
        width: min-content

.__sun-design-panel-tabs-container-tabs__
    height: 100%
    display: flex
    flex-direction: row
    &.vertical
        flex-direction: column
    flex-wrap: nowrap

    > .__sun-design-panel-tabs-container-tab__
        border-radius: 0 !important
        flex-shrink: 0

        &[data-size="small"]
            padding: padding-small + panel-padding padding-extend-small + panel-padding !important
            &.squared
                padding: padding-small + panel-padding !important
        &[data-size="normal"]
            padding: padding-normal + panel-padding padding-extend-normal + panel-padding !important
            &.squared
                padding: padding-normal + panel-padding !important
        &[data-size="large"]
            padding: padding-large + panel-padding padding-extend-large + panel-padding !important
            &.squared
                padding: padding-large + panel-padding !important

    > .__sun-design-panel-tabs-container-tab__
        border-top: none !important
        border-left: none !important
        border-right: solid-border !important
        border-bottom: solid-border !important
    &.no-border:not(.vertical) > .__sun-design-panel-tabs-container-tab__.selected
        border-bottom: none !important

    &.vertical > .__sun-design-panel-tabs-container-tab__
        border-left: none !important
        border-top: none !important
        border-right: solid-border !important
        border-bottom: solid-border !important
     &.vertical.no-border > .__sun-design-panel-tabs-container-tab__.selected
        border-right: none !important

</style>