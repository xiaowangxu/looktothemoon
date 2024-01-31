<template>
    <div class="__sun-design-tree-list-container__">
        <SunButton ref="button_ref" class="__sun-design-tree-item-container__ no-pressed-color" :size="size"
            :disabled="option.disabled" :active="option.active" :color-scheme="option.colorScheme" flat no-pressed-color
            @click="onClick">
            <SunCheckbox v-if="picking" @click.stop :size="size" :disabled="option.disabled" :checked="option.checked" />
            <div class="__sun-design-tree-drag-zoom__" :class="{ draggable }" :draggable="draggable"
                @dragstart="onDragStart" @dragover="onDragOver" @dragenter="onDragEnter" @dragleave="onDragLeave"
                @drop="onDrop">
                <ChevronRight v-if="folded" class="__sun-design-tree-arrow__" :class="{ 'no-subs': !has_subs }" />
                <ChevronDown v-else class="__sun-design-tree-arrow__" :class="{ 'no-subs': !has_subs }" />

                <slot name="prepand" :option="option" />
                <SunItemButtonEditable ref="itembutton_ref" :label="option.label" :icon="option.icon"
                    :description="option.description" />
            </div>
            <slot name="append" :option="option" />
            <div v-if="dragging_over && dragging_in === 'in'"
                class="__sun-design__ __sun-design-tree-item-dropin-indicator__ bordered" :data-size="size" />
        </SunButton>
        <slot name="suffix" :option="option" />
        <div v-if="dragging_over && dragging_in === 'before'" class="__sun-design-tree-item-drop-indicator__ before" />
        <div v-if="dragging_over && (!has_subs || folded) && dragging_in === 'after'"
            class="__sun-design-tree-item-drop-indicator__ after" />
    </div>
    <div v-if="has_subs" v-show="!folded" class="__sun-design-tree-container__ __sun-design-tree-relation__"
        :class="{ 'no-folder-line': !folderLine }" :style="{ '--Depth': depth + 1 }" :data-size="size"
        :stylew="option.colorScheme">
        <SunTreeItem v-for="item in option.subs" :size="size" :folder-line="folderLine" :option="item" :depth="depth + 1"
            :draggable="draggable" @click="onSubTreeClick" :unfold-delay="unfoldDelay" :picking="picking">
            <template #append="{ option }">
                <slot name="append" :option="option" />
            </template>
            <template #prepand="{ option }">
                <slot name="prepand" :option="option" />
            </template>
            <template #suffix="{ option }">
                <slot name="suffix" :option="option" />
            </template>
        </SunTreeItem>
        <div v-if="dragging_over && !folded && dragging_in === 'after'"
            class="__sun-design-tree-item-drop-indicator__ after indent" />
    </div>
</template>

<script setup lang="ts">

import SunButton from '../button/SunButton.vue';
import SunItemButtonEditable from '../item/SunButtonItemEditable.vue';
import SunCheckbox from '../checkbox/SunCheckbox.vue';
import { ChevronRight, ChevronDown } from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref, watch, nextTick } from 'vue';
import { type Size, type Item, type UID, type TimerCanceller, timer, setDragMessage } from '../SunDesignConstants';

type ItemTreeItem<T extends UID = UID> = Omit<Item<T>, 'shortcut' | 'sub'> & { checked?: boolean, subs?: TreeItem<T>[] };
// type RenderTreeItem<T extends UID = UID> = {
//     uid: T,
//     colorScheme?: ColorScheme,
//     renderButtonContent: Raw<Component<{
//         uid: T,
//     }>>,
//     render: Raw<Component<{
//         uid: T,
//         selected: boolean,
//         click: (uid: T, evt: Event) => void,
//     }>>,
// };
export type TreeItem<T extends UID = UID> = ItemTreeItem<T>; //| RenderTreeItem<T>;

//props
const props = withDefaults(
    defineProps<{
        size?: Size,
        folderLine?: boolean,
        option: TreeItem,
        depth?: number,
        draggable?: boolean,
        unfoldDelay?: number,
        picking?: boolean,
    }>(),
    {
        size: 'normal',
        folderLine: true,
        depth: 0,
        draggable: true,
        unfoldDelay: 500,
        picking: false,
    }
);

// slots
defineSlots<{
    prepand(props: { option: TreeItem }): void,
    append(props: { option: TreeItem }): void,
    suffix(props: { option: TreeItem }): void,
}>();

// emits
const emits = defineEmits<{
    (event: 'click', evt: Event): void,
}>();

// datas
const itembutton_ref = ref<InstanceType<typeof SunItemButtonEditable> | undefined>();
const has_subs = computed(() => props.option.subs !== undefined && props.option.subs.length > 0);
const folded = ref(true);
const dragging_over = ref(false);
const dragging_in = ref<'before' | 'in' | 'after'>('before');
const button_ref = ref<InstanceType<typeof SunButton> | undefined>();
let dragover_unfold_timer: TimerCanceller | undefined = undefined;
const unfold = () => folded.value = false;

watch([dragging_over, dragging_in], ([over, within]) => {
    if (over) {
        if (within === 'in') {
            if (dragover_unfold_timer === undefined && has_subs.value && folded.value === true) {
                dragover_unfold_timer = timer(unfold, props.unfoldDelay);
            }
        }
        else {
            clearUnfoldTimer();
        }
    }
    else {
        clearUnfoldTimer();
    }
});

function clearUnfoldTimer() {
    dragover_unfold_timer?.();
    dragover_unfold_timer = undefined;
}
async function onDragStart(evt: DragEvent) {
    setDragMessage(evt, props.option.label);
}
function onDragOver(evt: DragEvent) {
    evt.preventDefault();
    if (!button_ref.value?.button) {
        dragging_in.value = 'before';
        return;
    }
    else {
        const { x, y, width, height } = button_ref.value.button.getBoundingClientRect();
        if (evt.clientY - y < height / 3) {
            dragging_in.value = 'before';
        }
        else if (evt.clientY - y < height / 3 * 2) {
            dragging_in.value = 'in';
        }
        else {
            dragging_in.value = 'after';
        }
    }
}
function onDragEnter(evt: DragEvent) {
    if (dragging_over.value !== true) {
        dragging_over.value = true;
        evt.preventDefault();
    }
}
function onDragLeave(evt: DragEvent) {
    evt.preventDefault();
    if (evt.currentTarget === null) {
        dragging_over.value = false;
    }
    else if (evt.relatedTarget === null || !(evt.currentTarget as HTMLElement).contains(evt.relatedTarget as HTMLElement)) {
        dragging_over.value = false;
    }
}
function onDrop(evt: DragEvent) {
    console.log(">>>>", props.option.uid, dragging_in.value);
    dragging_over.value = false;
    clearUnfoldTimer();
}

function onClick(evt: Event) {
    folded.value = !folded.value;
    emits('click', evt);
}

function onSubTreeClick(evt: Event) {
    emits('click', evt);
}

onBeforeUnmount(() => {
    clearUnfoldTimer();
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

relative-offset-small = padding-extend-small + (content-size-small / 2)
relative-offset-normal = padding-extend-normal + (content-size-normal / 2)
relative-offset-large = padding-extend-large + (content-size-large / 2)

.__sun-design-tree-container__
    display: flex
    flex-direction: column
    gap: (panel-padding / 2)

.__sun-design-tree-list-container__
    display: flex
    flex-direction: row
    flex: 1
    gap: panel-padding
    position: relative
    align-items: center

.__sun-design-tree-item-container__
    display: flex
    flex-direction: row
    gap: panel-padding
    width: 100%
    overflow: hidden
    padding-top: 0px !important
    padding-bottom: 0px !important
    position: relative

    .__sun-design-tree-container__[data-size="small"] > .__sun-design-tree-list-container__ > &
        padding-left: 'calc(var(--Depth) * var(--Indent) + %s)' % (padding-extend-small)
    .__sun-design-tree-container__[data-size="normal"] > .__sun-design-tree-list-container__ > &
        padding-left: 'calc(var(--Depth) * var(--Indent) + %s)' % (padding-extend-normal)
    .__sun-design-tree-container__[data-size="large"] > .__sun-design-tree-list-container__ > &
        padding-left: 'calc(var(--Depth) * var(--Indent) + %s)' % (padding-extend-large)

.__sun-design-tree-drag-zoom__   
    display: inline-flex
    gap: inherit
    flex: 1
    align-self: stretch
    border-radius: inherit
    align-items: center
    overflow: hidden
    width: 0
    &.draggable
        & > *
            pointer-events: none

.__sun-design-tree-arrow__
    &.no-subs
        color: var(--font-color-disabled)

.__sun-design-tree-relation__
    position: relative
    &.no-folder-line::after
        display: none
    &::after
        pointer-events: none
        content: ''
        position: absolute
        height: 100%
        border-left: border-width var(--border-color-normal) solid
    &[data-size="small"]::after
        left: 'calc((var(--Depth) - 1) * var(--Indent) + %s)' % (relative-offset-small - border-width / 2)
    &[data-size="normal"]::after
        left: 'calc((var(--Depth) - 1) * var(--Indent) + %s)' % (relative-offset-normal - border-width / 2)
    &[data-size="large"]::after
        left: 'calc((var(--Depth) - 1) * var(--Indent) + %s)' % (relative-offset-large - border-width / 2)

.__sun-design-tree-item-drop-indicator__
    position absolute
    left: calc(var(--Depth) * var(--Indent))
    right: 0
    &.before
        top: - (panel-padding / 2)
    &.after
        bottom: - (panel-padding / 2)
        &.indent
            left: calc((var(--Depth) - 1) * var(--Indent))
    border-top: border-width var(--placeholder-color) solid
    pointer-events: none

.__sun-design-tree-item-dropin-indicator__
    position absolute
    inset: 0
    left: calc(var(--Depth) * var(--Indent))
    pointer-events: none
    border-color: var(--placeholder-color) !important
    border-width: border-width !important
    border-radius: inherit

</style>