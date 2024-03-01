<template>
    <SunMeasurePopupPanelNoScroll ref="popup_ref" :get-popup-rect="getPopupRect" :stop-events="false" :trap-focus="false"
        @cover-click="onClickOutside" :check-passive-click-outside="checkPassiveClickOutside">

        <SunPanel container vertical style="flex: 1;">
            <SunScrollContainer style="flex: 1;" content-style="width: 100%;" :scroll-bar-visibility="scrollBarVisibility">
                <div ref="button_container_ref" tabindex="-1" class="__sun-design-panel-container__ vertical"
                    style="width: 100%;">
                    <SunButton v-if="length !== 0" v-for="item in list"
                        v-memo="[item, item.uid === selected?.uid, highlight, keyword]" style="width: 100%;" flat
                        class="no-hover-color" :key="item.uid" :hover="item.uid === selected?.uid"
                        :color-scheme="item.colorScheme" @mouseenter="selected = item" @focus="selected = item"
                        @click="onConfirm(item)">
                        <slot name="item" v-memo="[highlight, keyword]" :item="item">
                            <SunIcon v-if="item.icon !== undefined" :name="item.icon" :color="item.iconColor" />
                            <span v-if="item.label !== undefined"
                                class="__sun-design-button-item-label__ __sun-design-completion-label__"
                                :class="{ 'has-description': item.description !== undefined }"
                                v-html="highlight === undefined ? item.label : highlight(item.label, keyword)"></span>
                            <span v-if="item.description !== undefined" class="__sun-design-button-item-description__">{{
                                item.description }}</span>
                        </slot>
                    </SunButton>
                    <slot v-else name="empty">
                        <SunButtonLike flat no-hover-color no-pressed-color>
                            <span style="color: var(--placeholder-color);">无项目</span>
                        </SunButtonLike>
                    </slot>
                </div>
            </SunScrollContainer>
            <template v-if="$slots.info !== undefined">
                <slot name="info" />
            </template>
        </SunPanel>
        <template v-if="$slots.append !== undefined">
            <slot name="append" :selected="selected" />
        </template>

    </SunMeasurePopupPanelNoScroll>
</template>

<script setup lang="ts">

import SunMeasurePopupPanelNoScroll from '../measurepopuppanel/SunMeasurePopupPanelNoScroll.vue';
import SunButton from '../button/SunButton.vue';
import SunButtonLike from '../button/SunButtonLike.vue';
import SunIcon from '../icon/SunIcon.vue';
import SunPanel from '../panel/SunPanel.vue';
import SunScrollContainer from '../scrollcontainer/SunScrollContainer.vue';
import { type BoxSize, type Rect, useHighlightList, type Item, type UID } from '../SunDesignConstants';
import { computed, ref, toRef, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { DefaultCodeFilterSort, DefaultCodeFindSelect, DefaultHighlight } from './SunCompletionConstants';
import type { ScrollBarVisibility } from '../scrollcontainer/SunScrollBar.vue';

export type CompletionItem<T extends UID = UID> = Omit<Item<T>, 'active' | 'disabled' | 'sub' | 'iconOnly' | 'shortcut' | 'sub'> & { iconColor?: string };

// props
const props = withDefaults(
    defineProps<{
        getPopupRect: (contentMinSize: BoxSize, windowSize: BoxSize) => Rect,
        options: (Readonly<CompletionItem>)[],
        keyword?: string,
        filterSort?: ((list: CompletionItem[], keyword?: string) => CompletionItem[]) | null,
        findSelect?: ((list: CompletionItem[], keyword?: string, selected?: UID) => number) | null,
        highlight?: (label: string, keyword?: string) => string,
        scrollBarVisibility?: ScrollBarVisibility,
        appendScrollContainerStyle?: string,
        checkPassiveClickOutside?: boolean,
    }>(),
    {
        appendScrollContainerStyle: 'flex: 0.6;',
        checkPassiveClickOutside: false,
    }
);

// slots
defineSlots<{
    info(props: {}): void,
    empty(props: {}): void,
    item(props: { item: CompletionItem }): void,
    append(props: { selected: CompletionItem | undefined }): void,
}>();

// emits
const emits = defineEmits<{
    (event: 'select', item: CompletionItem | undefined): void,
    (event: 'confirm', data: CompletionItem | undefined): void,
    (event: 'clickOutside', evt: Event): void,
}>();

// datas
const button_container_ref = ref<HTMLDivElement | null>(null);

const popup_ref = ref<InstanceType<typeof SunMeasurePopupPanelNoScroll>>();
const filterSort = computed(() => props.filterSort === null ? undefined : (props.filterSort ?? DefaultCodeFilterSort));
const findSelect = computed(() => props.findSelect === null ? undefined : (props.findSelect ?? DefaultCodeFindSelect));
const highlight = computed(() => props.highlight === null ? undefined : (props.highlight ?? DefaultHighlight));
const { selected, index, list, length } = useHighlightList(toRef(props, 'options'), filterSort, toRef(props, 'keyword'), findSelect);

watch(selected, s => {
    emits('select', s);
}, { immediate: true });

function selectUp() {
    index.value = ((index.value - 1) + length.value) % length.value;
    scrollIntoView(index.value);
}
function selectDown() {
    index.value = (index.value + 1) % length.value;
    scrollIntoView(index.value);
}

function scrollIntoView(index: number) {
    const button = button_container_ref.value?.children[index];
    if (button !== undefined) {
        const container = button_container_ref.value!;
        // container.focus();
        if (index === 0) {
            container.parentElement!.parentElement!.scrollTop = 0;
        }
        else if (index >= length.value - 1) {
            container.parentElement!.parentElement!.scrollTop = container.parentElement!.parentElement!.scrollHeight;
        }
        button.scrollIntoView({ block: 'nearest' });
    }
}

function onConfirm(item: CompletionItem | undefined) {
    emits('confirm', item);
}

function onClickOutside(evt: Event) {
    emits('clickOutside', evt);
}

function onKeyDown(evt: KeyboardEvent) {
    if (evt.key === 'ArrowUp') {
        evt.preventDefault();
        selectUp();
    }
    else if (evt.key === 'ArrowDown') {
        evt.preventDefault();
        selectDown();
    }
    else if (evt.key === 'Enter') {
        evt.preventDefault();
        onConfirm(selected.value);
    }
    else if (evt.key === 'Escape') {
        onClickOutside(evt);
    }
}

onMounted(() => {
    window.addEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyDown);
});

function isContainedEvent(evt: Event | Node) {
    return popup_ref.value?.isContainedEvent(evt) ?? false;
}

watch(length, () => {
    nextTick(() => {
        popup_ref.value?.refreshPopupContentMinSize();
    });
}, { flush: "post" });

// exposes
defineExpose({
    isContainedEvent,
});

</script>

<style lang="stylus">

.__sun-design-completion-label__
    // font-family: Fira Code Medium

.__sun-design-completion__.keyword
    font-weight: bold
    color: var(--focus-color)

</style>