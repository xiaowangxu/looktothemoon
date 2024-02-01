<template>
    <div class="__sun-design-tree-list-container__">
        <SunButtonLike class="__sun-design-tree-item-container__ no-pressed-color"
            :class="{ 'no-append': $slots.append === undefined }" :size="size" :disabled="option.disabled"
            :active="option.active" :color-scheme="option.colorScheme" flat no-pressed-color>
            <slot name="prepand" :option="option" />
            <SunButton class="__sun-design-tree-fold-button__ no-hover-color no-pressed-color"
                :class="{ leaf: option.leaf ?? false }" flat @click.stop="folded = !folded"
                :disabled="option.leaf ?? false">
                <template v-if="option.leaf ?? false">
                </template>
                <template v-else>
                    <ChevronRight v-if="folded" class="__sun-design-tree-arrow__" :class="{ 'no-subs': !has_subs }" />
                    <ChevronDown v-else class="__sun-design-tree-arrow__" :class="{ 'no-subs': !has_subs }" />
                </template>
            </SunButton>
            <SunCheckbox v-if="picking" :size="size" :disabled="option.disabled" :checked="option.checked" />
            <!-- drag area -->
            <SunButton ref="button_ref" class="__sun-design-tree-drag-zoom__ no-hover-color no-pressed-color " flat
                :class="{ draggable }" :draggable="!editting && draggable && !(option.disabled ?? false)"
                :disabled="option.disabled" :active="option.active" @dragstart="onDragStart" @dragover="onDragOver"
                @dragenter="onDragEnter" @dragleave="onDragLeave" @drop="onDrop" @click="onClick"
                @contextmenu="onContextMenu">
                <SunItemButtonEditable ref="itembutton_ref" :label="option.label" :icon="option.icon"
                    :description="option.description" @edit="onEdit" />
            </SunButton>
            <slot name="append" :option="option" />
            <div v-if="(option.droppable ?? true) && dragging_over && dragging_in === 'in'"
                class="__sun-design__ __sun-design-tree-item-dropin-indicator__ bordered" :data-size="size" />
        </SunButtonLike>
        <slot name="suffix" :option="option" />
        <div v-if="dragging_over && dragging_in === 'before'" class="__sun-design-tree-item-drop-indicator__ before" />
        <div v-if="dragging_over && (!has_subs || folded) && dragging_in === 'after'"
            class="__sun-design-tree-item-drop-indicator__ after" />
    </div>
    <div v-if="has_subs" v-show="!folded" class="__sun-design-tree-container__ __sun-design-tree-relation__"
        :class="{ 'no-folder-line': !folderLine }" :style="{ '--Depth': depth + 1 }" :data-size="size"
        :stylew="option.colorScheme">
        <SunTreeItem v-for="item in sorted_subs" :size="size" :folder-line="folderLine" :option="item" :depth="depth + 1"
            :draggable="draggable" @click="onSubTreeClick" @contextmenu="emits('contextmenu', $event)" @edit="onSubTreeEdit"
            :unfold-delay="unfoldDelay" :picking="picking" :sort="sort" :click-folding="clickFolding">
            <template v-if="$slots.append" #append="{ option }">
                <slot name="append" :option="option" />
            </template>
            <template v-if="$slots.prepand" #prepand="{ option }">
                <slot name="prepand" :option="option" />
            </template>
            <template v-if="$slots.suffix" #suffix="{ option }">
                <slot name="suffix" :option="option" />
            </template>
        </SunTreeItem>
        <div v-if="dragging_over && !folded && dragging_in === 'after'"
            class="__sun-design-tree-item-drop-indicator__ after indent" />
    </div>
</template>

<script setup lang="ts">

import SunButton from '../button/SunButton.vue';
import SunButtonLike from '../button/SunButtonLike.vue';
import SunItemButtonEditable from '../item/SunButtonItemEditable.vue';
import SunCheckbox from '../checkbox/SunCheckbox.vue';
import { ChevronRight, ChevronDown } from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { type Size, type Item, type UID, type TimerCanceller, timer, setDragMessage } from '../SunDesignConstants';
import { SunContextMenuEvent } from '../contextmenu/SunContextMenu';

type ItemTreeItem<T extends UID = UID> = Omit<Item<T>, 'shortcut' | 'sub'> & { checked?: boolean, leaf?: boolean, droppable?: boolean, subs?: TreeItem<T>[] };
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
        clickFolding?: boolean,
        sort?: (options: TreeItem[]) => TreeItem[],
    }>(),
    {
        size: 'normal',
        folderLine: true,
        depth: 0,
        draggable: true,
        unfoldDelay: 500,
        clickFolding: true,
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
    (event: 'click', data: any, evt: Event): void,
    (event: 'contextmenu', evt: SunContextMenuEvent): void,
    (event: 'edit', uid: any, label: string): void,
}>();

// datas
const itembutton_ref = ref<InstanceType<typeof SunItemButtonEditable> | undefined>();
const has_subs = computed(() => !(props.option.leaf ?? false) && props.option.subs !== undefined && props.option.subs.length > 0);
const sorted_subs = computed(() => (!has_subs.value || props.sort === undefined) ? props.option.subs : props.sort(props.option.subs!));
const folded = ref(false);
const dragging_over = ref(false);
const dragging_in = ref<'before' | 'in' | 'after'>('before');
const button_ref = ref<InstanceType<typeof SunButton> | undefined>();
const editting = ref(false);
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
    if (!button_ref.value?.button) {
        evt.preventDefault();
        dragging_in.value = 'before';
        return;
    }
    else {
        const { x, y, width, height } = button_ref.value.button.getBoundingClientRect();
        if (evt.clientY - y < height / 3) {
            evt.preventDefault();
            dragging_in.value = 'before';
        }
        else if (evt.clientY - y < height / 3 * 2) {
            dragging_in.value = 'in';
            if (props.option.droppable ?? true) {
                evt.preventDefault();
            }
        }
        else {
            evt.preventDefault();
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
    emits('click', props.option.uid, evt);
    if (evt.defaultPrevented) return;
    if (props.clickFolding) {
        folded.value = !folded.value;
    }
}
function onContextMenu(evt: MouseEvent) {
    const ctx_menu = new SunContextMenuEvent(evt);
    ctx_menu.addOptions([{
        label: '重命名',
        uid: 'rename',
        icon: 'TextCursorInput',
    }], (data) => {
        if (data === 'rename') {
            if (itembutton_ref.value !== undefined) {
                editting.value = true;
                itembutton_ref.value.edit();
            }
        }
    })
    emits('contextmenu', ctx_menu);
}
function onEdit(data: string) {
    editting.value = false;
    if (data !== props.option.label) {
        emits('edit', props.option.uid, data);
    }
}

function onSubTreeEdit(data: any, label: string) {
    emits('edit', data, label);
}

function onSubTreeClick(data: any, evt: Event) {
    emits('click', data, evt);
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
    padding-left: 0px !important
    position: relative
    justify-content: flex-start !important
    &.no-append
        padding-right: 0px !important

.__sun-design-tree-fold-button__
    padding-top: 0px !important
    padding-bottom: 0px !important
    padding-right: 0px !important
    min-width: unset !important
    overflow: unset !important
    color: inherit !important
    cursor: initial !important
    .__sun-design-tree-container__[data-size="small"] > .__sun-design-tree-list-container__ > .__sun-design-tree-item-container__ > &
        padding-left: 'calc(var(--Depth) * var(--Indent) + %s)' % (padding-extend-small)
    .__sun-design-tree-container__[data-size="normal"] > .__sun-design-tree-list-container__ > .__sun-design-tree-item-container__ > &
        padding-left: 'calc(var(--Depth) * var(--Indent) + %s)' % (padding-extend-normal)
    .__sun-design-tree-container__[data-size="large"] > .__sun-design-tree-list-container__ > .__sun-design-tree-item-container__ > &
        padding-left: 'calc(var(--Depth) * var(--Indent) + %s)' % (padding-extend-large)
    .__sun-design-tree-container__[data-size="small"] > .__sun-design-tree-list-container__ > .__sun-design-tree-item-container__ > &.leaf
        padding-left: 'calc(var(--Depth) * var(--Indent) + %s)' % (padding-extend-small - panel-padding)
    .__sun-design-tree-container__[data-size="normal"] > .__sun-design-tree-list-container__ > .__sun-design-tree-item-container__ > &.leaf
        padding-left: 'calc(var(--Depth) * var(--Indent) + %s)' % (padding-extend-normal - panel-padding)
    .__sun-design-tree-container__[data-size="large"] > .__sun-design-tree-list-container__ > .__sun-design-tree-item-container__ > &.leaf
        padding-left: 'calc(var(--Depth) * var(--Indent) + %s)' % (padding-extend-large - panel-padding)

.__sun-design-tree-drag-zoom__   
    display: inline-flex
    gap: inherit
    flex: 1
    align-self: stretch
    border-radius: inherit
    align-items: center
    overflow: hidden
    width: 0
    justify-content: flex-start !important
    padding-left: 0px !important
    padding-right: 0px !important
    color: inherit !important
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