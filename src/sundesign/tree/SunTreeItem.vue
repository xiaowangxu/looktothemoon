<template>
    <!-- item -->
    <div class="__sun-design-tree-list-container__">
        <SunButtonLike class="__sun-design-tree-item-container__"
            :class="{ 'no-append': $slots.append === undefined, 'leaf': option.leaf ?? false }" :size="size"
            :disabled="option.disabled" :active="option_active" :color-scheme="option.colorScheme" flat
            :hover="option.hover">

            <slot name="prepand" :option="option" />

            <!-- folding button -->
            <SunButton class="__sun-design-tree-fold-button__ no-hover-color no-pressed-color"
                :class="{ leaf: option.leaf ?? false }" flat @click.stop="folded = !folded" :disabled="option.leaf ?? false"
                :size="size">
                <template v-if="option.leaf ?? false">
                </template>
                <template v-else>
                    <ChevronRight v-if="folded" class="__sun-design-tree-arrow__" :class="{ 'no-subs': !has_subs }" />
                    <ChevronDown v-else class="__sun-design-tree-arrow__" :class="{ 'no-subs': !has_subs }" />
                </template>
            </SunButton>

            <!-- picking checkbox -->
            <!-- <SunCheckbox :size="size" /> -->

            <!-- drag area -->
            <SunButton ref="button_ref" class="__sun-design-tree-drag-zoom__ no-hover-color no-pressed-color"
                :class="{ 'no-append': $slots.append !== undefined, 'not-editting': !editting }" flat :size="size"
                :draggable="is_draggable" :disabled="option.disabled" @dragstart="onDragStart" @dragover="onDragOver"
                @dragenter="onDragEnter" @dragleave="onDragLeave" @drop="onDrop" @dragend="onDragEnd" @click="onClick"
                @contextmenu="onContextMenu">
                <SunItemButtonEditable v-if="(option as RenderTreeItem).render === undefined" ref="itembutton_ref"
                    :label="(option as ItemTreeItem).label"
                    :icon="folded ? (option as ItemTreeItem).icon : ((option as ItemTreeItem).unfoldIcon ?? (option as ItemTreeItem).icon)"
                    :description="(option as ItemTreeItem).description" @edit="onEdit" />
                <component v-else :is="(option as RenderTreeItem).render" :item="(option as RenderTreeItem)" />
            </SunButton>

            <!-- append -->
            <slot name="append" :option="option" />

            <div v-if="(droppable & SunTreeDroppable.In) !== 0 || parent_drop_requested"
                class="__sun-design__ __sun-design-tree-item-dropin-indicator__ bordered" :data-size="size" />

        </SunButtonLike>
        <slot name="suffix" :option="option" />
        <div v-if="(droppable & SunTreeDroppable.Above) !== 0" class="__sun-design-tree-item-drop-indicator__ before"
            :data-size="size" />
        <div v-if="(!has_subs || folded) && (droppable & SunTreeDroppable.Below) !== 0"
            class="__sun-design-tree-item-drop-indicator__ after" :data-size="size" />
    </div>
    <!-- sub tree -->
    <div v-if="has_subs && (mode === 'visibility' || !folded)" v-show="!folded"
        class="__sun-design-tree-container__ __sun-design-tree-relation__" :class="{ 'no-folder-line': !folderLine }"
        :style="{ '--Depth': depth + 1 }" :data-size="size">
        <!-- ref="subtree_refs" -->
        <SunTreeItem v-for=" item  in  sorted_subs" v-memo="[item, depth]" :option="item" :depth="depth + 1"
            @click="onSubTreeClick" @contextmenu="onSubTreeContextMenu" @edit="onSubTreeEdit" @drop="onSubTreeDrop"
            :key="item.uid" @request-parent-drop="onRequestParentDrop">
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
        <div v-if="!folded && (droppable & SunTreeDroppable.Below) !== 0"
            class="__sun-design-tree-item-drop-indicator__ after indent" :data-size="size" />
    </div>
</template>

<script setup lang="ts">

import SunButton from '../button/SunButton.vue';
// import SunCheckbox from '../checkbox/SunCheckbox.vue';
import SunButtonLike from '../button/SunButtonLike.vue';
import SunItemButtonEditable from '../item/SunButtonItemEditable.vue';
import { ChevronRight, ChevronDown } from 'lucide-vue-next';
import { computed, inject, onBeforeUnmount, ref, watch, type Component, type Raw, toRef, onBeforeMount, getCurrentInstance } from 'vue';
import { type Size, type Item, type UID, type TimerCanceller, timer, cachecall, setDragImage, setDragData, type ColorScheme, type PopupOpenMode, getDragData as _getDragData, clearDragData } from '../SunDesignConstants';
import { SunTreeDroppable, SunTreeInjection, type SunTreeItemDragData } from './SunTreeConstants';

// emits
const emits = defineEmits<{
    (event: 'click', data: UID, evt: Event): void,
    (event: 'contextmenu', data: UID, evt: Event): void,
    (event: 'edit', uid: UID, label: string): void,
    (event: 'drop', drag_uid: UID | UID[], drop_uid: UID, drop_mode: SunTreeDroppable): void,
    (event: 'requestParentDrop', drop: boolean): void,
}>();

// inject props
const {
    treeUID,
    size, folderLine, mode, draggable, unfoldDelay, clickFolding, filterSort,
    setUIDComponentCache, deleteUIDComponentCache, setUIDFoldedCache, getUIDFoldedCache,
    onDragStart: _onTreeDragStart, canDrop,
    isActive,
    onClick: onTreeClick, onContextMenu: onTreeContextMenu, onEdit: onTreeEdit, onDrop: onTreeDrop,
} = inject(SunTreeInjection, () => ({
    treeUID: ref(undefined),
    isActive: (_: UID) => false,
    onClick: (data: UID, evt: Event) => emits('click', data, evt),
    onContextMenu: (data: UID, evt: Event) => emits('contextmenu', data, evt),
    onEdit: (data: UID, label: string) => emits('edit', data, label),
    onDrop: (drag_uid: UID | UID[], drop_uid: UID, drop_mode: SunTreeDroppable) => emits('drop', drag_uid, drop_uid, drop_mode),
    size: ref<Size>('normal'),
    folderLine: ref(true),
    mode: ref<PopupOpenMode>('visibility'),
    draggable: ref(true),
    unfoldDelay: ref(500),
    clickFolding: ref(true),
    filterSort: ref(undefined),
}), true);

export type ItemTreeItem<T extends UID = UID> = Omit<Item<T>, 'shortcut' | 'active' | 'sub' | 'iconOnly'> & { unfoldIcon?: string, hover?: boolean, leaf?: boolean, subs?: TreeItem<T>[], initialFold?: boolean };
export type RenderTreeItem<T extends UID = UID> = {
    uid: T,
    label?: string,
    colorScheme?: ColorScheme,
    disabled?: boolean,
    hover?: boolean,
    leaf?: boolean,
    subs?: TreeItem<T>[],
    initialFold?: boolean,
    render: Raw<Component<{ item: RenderTreeItem<T> }>>,
};
export type TreeItem<T extends UID = UID> = ItemTreeItem<T> | RenderTreeItem<T>;

//props
const props = withDefaults(
    defineProps<{
        option: TreeItem,
        depth?: number,
    }>(),
    {
        depth: 0,
    }
);

onBeforeMount(() => {
    setUIDComponentCache?.(props.option.uid, getCurrentInstance()!);
    folded.value = getUIDFoldedCache?.(props.option.uid) ?? false;
    option_active.value = isActive(props.option.uid);
});

watch(toRef(() => props.option.uid), (val, old) => {
    const instance = getCurrentInstance()!;
    if (deleteUIDComponentCache?.(old, instance) ?? false) {
        setUIDComponentCache?.(val, instance);
    }
})

// slots
defineSlots<{
    prepand(props: { option: TreeItem }): void,
    append(props: { option: TreeItem }): void,
    suffix(props: { option: TreeItem }): void,
}>();

// datas
const itembutton_ref = ref<InstanceType<typeof SunItemButtonEditable> | undefined>();
const has_subs = computed(() => !(props.option.leaf ?? false) && props.option.subs !== undefined && props.option.subs.length > 0);
const sorted_subs = computed(() => (!has_subs.value || filterSort.value === undefined) ? props.option.subs : filterSort.value(props.option.subs!));
const folded = ref(true);
const option_active = ref(false);
watch(folded, f => setUIDFoldedCache?.(props.option.uid, f));
const button_ref = ref<InstanceType<typeof SunButton> | undefined>();
const is_draggable = computed(() => !editting.value && draggable.value && !(props.option.disabled ?? false));

// drag and drop
const parent_drop_requested = ref(false);
function onRequestParentDrop(request: boolean) {
    parent_drop_requested.value = request;
}

const droppable = ref<SunTreeDroppable>(SunTreeDroppable.None);
watch(droppable, droppable => {
    if ((droppable & SunTreeDroppable.In) !== 0) {
        if (dragover_unfold_timer === undefined && has_subs.value && folded.value === true) {
            dragover_unfold_timer = timer(unfold, unfoldDelay.value);
        }
    }
    else {
        clearUnfoldTimer();
    }
});
watch(() => ((droppable.value & SunTreeDroppable.Parent) !== 0), request => {
    emits('requestParentDrop', request);
});

let dragover_unfold_timer: TimerCanceller | undefined = undefined;
const unfold = () => folded.value = false;
function clearUnfoldTimer() {
    dragover_unfold_timer?.();
    dragover_unfold_timer = undefined;
}

function onDragStart(evt: DragEvent) {
    if (_onTreeDragStart !== undefined) {
        _onTreeDragStart(props.option.uid, evt);
    }
    else {
        setDragData(evt, [({ type: 'SunTreeItemDrag', tree: treeUID.value, uid: props.option.uid } as SunTreeItemDragData)]);
        setDragImage(evt, props.option.label);
    }
}
function onDragEnd() {
    clearDragData();
}

const { call: dragover_candrop, clear: clear_dragover_candrop } = cachecall(checkCanDrop);
function checkCanDrop(drag_uid: UID | UID[], drop_uid: UID) {
    return canDrop?.(drag_uid, drop_uid) ?? SunTreeDroppable.None;
}

let drag_data: UID | UID[] | undefined = undefined;
function onDragOver(evt: DragEvent) {
    const _drag_data = _getDragData<SunTreeItemDragData>(evt, 'SunTreeItemDrag');
    drag_data = _drag_data?.uid;
    const tree = _drag_data?.tree;
    const not_same_tree = tree === undefined || treeUID.value === undefined || tree !== treeUID.value;
    const can_drop = (not_same_tree || drag_data === undefined) ? SunTreeDroppable.None : dragover_candrop(drag_data, props.option.uid);
    if (can_drop === SunTreeDroppable.None) {
        droppable.value = SunTreeDroppable.None;
        return;
    }
    if (!button_ref.value?.button) {
        evt.preventDefault();
        droppable.value = SunTreeDroppable.None;
        return;
    }
    else {
        const above = (can_drop & SunTreeDroppable.Above) !== 0;
        const inside = (can_drop & SunTreeDroppable.In) !== 0;
        const below = (can_drop & SunTreeDroppable.Below) !== 0;
        const parent = (can_drop & SunTreeDroppable.Parent) !== 0;
        const { y, height } = button_ref.value.button.getBoundingClientRect();
        const offset_y = evt.clientY - y;
        if ((above || below) && (inside || parent)) {
            // three
            if (offset_y < height / 3) {
                if (above) {
                    evt.preventDefault();
                    droppable.value = SunTreeDroppable.Above;
                }
            }
            else if (offset_y < height / 3 * 2) {
                if (inside) {
                    evt.preventDefault();
                    droppable.value = SunTreeDroppable.In;
                }
                else if (parent) {
                    evt.preventDefault();
                    droppable.value = SunTreeDroppable.Parent;
                }
            }
            else {
                if (below) {
                    evt.preventDefault();
                    droppable.value = SunTreeDroppable.Below;
                }
            }
        }
        else if (above || below) {
            // two
            if (offset_y < height / 2) {
                if (above) {
                    evt.preventDefault();
                    droppable.value = SunTreeDroppable.Above;
                }
            }
            else {
                if (below) {
                    evt.preventDefault();
                    droppable.value = SunTreeDroppable.Below;
                }
            }
        }
        else if (inside || parent) {
            if (inside) {
                evt.preventDefault();
                droppable.value = SunTreeDroppable.In;
            }
            else if (parent) {
                evt.preventDefault();
                droppable.value = SunTreeDroppable.Parent;
            }
        }
    }
}
function onDragEnter(evt: DragEvent) {
    clear_dragover_candrop();
}
function onDragLeave(evt: DragEvent) {
    droppable.value = SunTreeDroppable.None;
    drag_data = undefined;
    clear_dragover_candrop();
}
function onDrop(evt: DragEvent) {
    const drop_mode = droppable.value;
    const drag_uid = drag_data;
    drag_data = undefined;
    droppable.value = SunTreeDroppable.None;
    clear_dragover_candrop();
    clearUnfoldTimer();
    if (drop_mode !== SunTreeDroppable.None && drag_uid !== undefined) {
        onTreeDrop(drag_uid, props.option.uid, drop_mode);
    }
}

// click
function onClick(evt: Event) {
    if (editting.value) return;
    onTreeClick(props.option.uid, evt);
    if (evt.defaultPrevented) return;
    if (clickFolding.value) {
        toggle(!folded.value);
    }
}

function onContextMenu(evt: Event) {
    if (editting.value) return;
    onTreeContextMenu(props.option.uid, evt);
}

// edit
const editting = ref(false);
function onEdit(data: string) {
    editting.value = false;
    if (data !== props.option.label) {
        onTreeEdit(props.option.uid, data);
    }
}

function onSubTreeEdit(data: UID, label: string) {
    emits('edit', data, label);
}

function onSubTreeClick(data: UID, evt: Event) {
    emits('click', data, evt);
}

function onSubTreeContextMenu(data: UID, evt: Event) {
    emits('contextmenu', data, evt);
}

function onSubTreeDrop(drag_uid: UID | UID[], drop_uid: UID, drop_mode: SunTreeDroppable) {
    emits('drop', drag_uid, drop_uid, drop_mode);
}

function toggle(fold: boolean) {
    folded.value = fold;
}

function active(active: boolean) {
    option_active.value = active;
}

function edit() {
    if (editting.value) return;
    if (itembutton_ref.value !== undefined) {
        console.log(props.option.uid);
        editting.value = true;
        itembutton_ref.value.edit();
    }
}

function getIndex(uid: UID) {
    return sorted_subs.value?.findIndex(i => i.uid === uid) ?? -1;
}

function getUID(index: number) {
    return sorted_subs.value?.[index] ?? undefined;
}

onBeforeUnmount(() => {
    deleteUIDComponentCache?.(props.option.uid, getCurrentInstance()!);
    setUIDFoldedCache?.(props.option.uid, undefined);
    clearUnfoldTimer();
    drag_data = undefined;
    clear_dragover_candrop();
});

// exposes
defineExpose({
    toggle,
    active,
    edit,
    getIndex,
    getUID,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

relative-offset-small = padding-extend-small + (content-size-small / 2)
relative-offset-normal = padding-extend-normal + (content-size-normal / 2)
relative-offset-large = padding-extend-large + (content-size-large / 2)
drop-indicator-width = focus-width
drop-indicator-color = focus-color
treeitem-gap = (panel-padding / 2)

.__sun-design-tree-container__
    display: flex
    flex-direction: column
    gap: treeitem-gap

.__sun-design-tree-list-container__
    display: flex
    flex-direction: row
    gap: panel-padding
    position: relative
    align-items: center
    flex: 1

.__sun-design-tree-item-container__
    width: 100%
    overflow: hidden
    padding-top: 0px !important
    padding-bottom: 0px !important
    padding-left: 0px !important
    position: relative
    justify-content: flex-start !important
    &.no-append
        padding-right: 0px !important
    &.leaf
        padding-left: var(--LeafIndent, 0px) !important

.__sun-design-tree-fold-button__
    padding-top: 0px !important
    padding-bottom: 0px !important
    padding-right: 0px !important
    min-width: unset !important
    overflow: unset !important
    color: inherit !important
    cursor: initial !important
    &[data-size="small"]
        padding-left: 'calc(var(--Depth) * var(--Indent, %s) + %s)' % (content-size-small + gap-small  padding-extend-small) !important
        &.leaf
            padding-left: 'calc(var(--Depth) * var(--Indent, %s) + %s)' % (content-size-small + gap-small  padding-extend-small - gap-small) !important
    &[data-size="normal"]
        padding-left: 'calc(var(--Depth) * var(--Indent, %s) + %s)' % (content-size-normal + gap-normal  padding-extend-normal) !important
        &.leaf
            padding-left: 'calc(var(--Depth) * var(--Indent, %s) + %s)' % (content-size-normal + gap-normal padding-extend-normal - gap-normal) !important
    &[data-size="large"]
        padding-left: 'calc(var(--Depth) * var(--Indent, %s) + %s)' % (content-size-large + gap-large  padding-extend-large) !important
        &.leaf
            padding-left: 'calc(var(--Depth) * var(--Indent, %s) + %s)' % (content-size-large + gap-large  padding-extend-large - gap-large) !important

.__sun-design-tree-drag-zoom__
    flex: 1
    border-radius: inherit
    align-items: center
    overflow: hidden
    width: 0
    justify-content: flex-start !important
    padding-left: 0px !important
    color: inherit !important
    &.no-append
        padding-right: 0px !important
    &.not-editting
        & > *
            pointer-events: none

.__sun-design-tree-arrow__.no-subs
    opacity: minor-opacity

.__sun-design-tree-relation__
    position: relative
    &.no-folder-line::after
        display: none
    &::after
        pointer-events: none
        content: ''
        position: absolute
        height: 100%
        border-left: relation-border
    &[data-size="small"]::after
        left: 'calc((var(--Depth) - 1) * var(--Indent, %s) + %s)' % (content-size-small + gap-small  relative-offset-small - relation-width / 2)
    &[data-size="normal"]::after
        left: 'calc((var(--Depth) - 1) * var(--Indent, %s) + %s)' % (content-size-normal + gap-normal  relative-offset-normal - relation-width / 2)
    &[data-size="large"]::after
        left: 'calc((var(--Depth) - 1) * var(--Indent, %s) + %s)' % (content-size-large + gap-large  relative-offset-large - relation-width / 2)
    &:has(> .__sun-design-tree-list-container__ > .__sun-design-tree-item-container__.active)::after
        border-left: relation-border-active

.__sun-design-tree-item-drop-indicator__
    position absolute
    right: 0
    z-index: 1
    &[data-size="small"]
        left: 'calc(var(--Depth) * var(--Indent, %s))' % (content-size-small + gap-small)
    &[data-size="normal"]
        left: 'calc(var(--Depth) * var(--Indent, %s))' % (content-size-normal + gap-normal)
    &[data-size="large"]
        left: 'calc(var(--Depth) * var(--Indent, %s))' % (content-size-large + gap-large)
    &.indent
        &[data-size="small"]
            left: 'calc((var(--Depth) - 1) * var(--Indent, %s))' % (content-size-small + gap-small)
        &[data-size="normal"]
            left: 'calc((var(--Depth) - 1) * var(--Indent, %s))' % (content-size-normal + gap-normal)
        &[data-size="large"]
            left: 'calc((var(--Depth) - 1) * var(--Indent, %s))' % (content-size-large + gap-large)
    &.before
        top: - ((treeitem-gap + drop-indicator-width) / 2)
    &.after
        bottom: - ((treeitem-gap + drop-indicator-width) / 2)
    border-top: drop-indicator-width drop-indicator-color solid
    pointer-events: none

.__sun-design-tree-item-dropin-indicator__
    position absolute
    inset: 0
    &[data-size="small"]
        left: 'calc(var(--Depth) * var(--Indent, %s))' % (content-size-small + gap-small)
    &[data-size="normal"]
        left: 'calc(var(--Depth) * var(--Indent, %s))' % (content-size-normal + gap-normal)
    &[data-size="large"]
        left: 'calc(var(--Depth) * var(--Indent, %s))' % (content-size-large + gap-large)
    pointer-events: none
    border-color: drop-indicator-color !important
    border-width: drop-indicator-width !important
    border-radius: inherit

</style>