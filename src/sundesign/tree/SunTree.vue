<template>
    <div class="__sun-design-tree-container__" :data-size="size" :style="{ '--Depth': 0 }">
        <!-- ref="treeitem_refs" -->
        <SunTreeItem v-if="sorted_options !== undefined" v-for="option in sorted_options" :option="option" @click="onClick"
            @contextmenu="onContextMenu" @edit="onEdit" :key="option.uid">
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
    </div>
</template>

<script setup lang="ts">

import { computed, provide, onBeforeUnmount, type ComponentInternalInstance, getCurrentInstance } from 'vue';
import { setDragData, type DragData, type PopupOpenMode, type Size, type UID, setDragImage } from '../SunDesignConstants';
import SunTreeItem, { type TreeItem } from './SunTreeItem.vue';
import type { SunContextMenuEvent } from '../contextmenu/SunContextMenu';
import { SunTreeDroppable, SunTreeInjection, type SunTreeItemDragData, type SunTreeOptions } from './SunTreeConstants';
import { toRef } from '@vueuse/core';

//props
const props = withDefaults(
    defineProps<{
        uid?: UID,
        mode?: PopupOpenMode,
        size?: Size,
        folderLine?: boolean,
        options: SunTreeOptions,
        draggable?: boolean,
        unfoldDelay?: number,
        clickFolding?: boolean,
        filterSort?: (options: TreeItem[]) => TreeItem[],
        canDrop?: (drag_uid: UID, drop_uid: UID) => SunTreeDroppable,
        getDragData?: (drag_uid: UID | UID[]) => DragData[] | undefined,
        defaultFold?: boolean,
        allowDragReorder?: boolean,
        allowDragInLeaf?: boolean,
        redirectLeafToParent?: boolean,
        clickActive?: boolean,
    }>(),
    {
        mode: 'visibility',
        size: 'normal',
        folderLine: true,
        draggable: true,
        unfoldDelay: 500,
        clickFolding: true,
        defaultFold: false,
        allowDragReorder: false,
        allowDragInLeaf: false,
        redirectLeafToParent: true,
        clickActive: true,
    }
);

const uid_component_map: Map<UID, ComponentInternalInstance> = new Map();
function setUIDComponentCache(uid: UID, component: ComponentInternalInstance) {
    uid_component_map.set(uid, component);
}
function deleteUIDComponentCache(uid: UID, component: ComponentInternalInstance) {
    if (uid_component_map.get(uid) === component) {
        uid_component_map.delete(uid);
        return true;
    }
    return false;
}

const uid_folded_map: Map<UID, boolean> = new Map();
function setUIDFoldedCache(uid: UID, folded: boolean | undefined) {
    if (props.options.has(uid)) {
        if (folded !== undefined) {
            uid_folded_map.set(uid, folded);
        }
    }
    else {
        uid_folded_map.delete(uid);
        removeActive(uid);
    }
}
function getUIDFoldedCache(uid: UID) {
    return uid_folded_map.get(uid) ?? props.defaultFold;
}
function onDragStart(uid: UID, evt: DragEvent) {
    if (isActive(uid)) {
        const uids = filterDraggingUIDs([...active_set]);
        const messages = uids.map(u => props.options.get(u)!.label ?? '');
        setDragData(evt, [({ type: 'SunTreeItemDrag', tree: props.uid, uid: uids } as SunTreeItemDragData), ...(props.getDragData?.(uids) ?? [])]);
        setDragImage(evt, messages);
    }
    else {
        setDragData(evt, [({ type: 'SunTreeItemDrag', tree: props.uid, uid: uid } as SunTreeItemDragData), ...(props.getDragData?.(uid) ?? [])]);
        setDragImage(evt, props.options.get(uid)?.label);
    }
}
function _canDrop(drag_uid: UID, drop_uid: UID) {
    if (props.canDrop !== undefined) return props.canDrop(drag_uid, drop_uid);
    if (props.options.ancestor(drop_uid, drag_uid)) return SunTreeDroppable.None;
    const is_self = drag_uid === drop_uid;
    const is_leaf = props.options.get(drop_uid)!.leaf ?? false;
    let droppable = SunTreeDroppable.None;
    if (props.allowDragReorder) {
        droppable |= SunTreeDroppable.Above | SunTreeDroppable.Below;
    }
    const drag_parent = props.options.parent(drag_uid);
    if (!is_leaf || props.allowDragInLeaf) {
        if (!is_self && (drag_parent === undefined || drop_uid !== drag_parent)) {
            droppable |= SunTreeDroppable.In;
        }
    }
    else if (is_leaf && props.redirectLeafToParent) {
        const drop_parent = props.options.parent(drop_uid);
        if (drag_parent !== undefined && drop_parent !== undefined && drag_parent !== drop_parent) {
            droppable |= SunTreeDroppable.Parent;
        }
    }
    return droppable;
}
function filterDraggingUIDs(uids: UID[]) {
    if (uids.length <= 1) return uids;
    const remove = uids.map(_ => false);
    const length = uids.length;
    for (let i = 0; i < length; i++) {
        if (remove[i]) continue;
        const _i = uids[i];
        if (!props.options.has(_i)) {
            remove[i] = true;
            continue;
        }
        for (let j = i + 1; j < length; j++) {
            if (remove[j]) continue;
            const _j = uids[j];
            if (!props.options.has(_j)) {
                remove[j] = true;
                continue;
            }
            if (props.options.ancestor(_j, _i)) {
                // j is i's child
                remove[j] = true;
                continue;
            }
            if (props.options.ancestor(_i, _j)) {
                // i is j's child
                remove[i] = true;
                break;
            }
        }
    }
    return uids.filter((_, idx) => !remove[idx]);
}
function canDrop(drag_uid: UID | UID[], drop_uid: UID) {
    if (drag_uid instanceof Array) {
        let droppable = SunTreeDroppable.All;
        for (const uid of drag_uid) {
            droppable &= _canDrop(uid, drop_uid);
        }
        return droppable;
    }
    else {
        return _canDrop(drag_uid, drop_uid);
    }
}

const active_set: Set<UID> = new Set();
function isActive(uid: UID) {
    return active_set.has(uid);
}
function addActive(uid: UID) {
    if (uid_component_map.has(uid)) {
        if (!active_set.has(uid)) {
            active_set.add(uid);
        }
        uid_component_map.get(uid)!.exposed!.active(true);
    }
}
function removeActive(uid: UID) {
    console.log(">>>>> remove active", uid);
    if (active_set.has(uid)) {
        active_set.delete(uid);
    }
    if (uid_component_map.has(uid)) {
        uid_component_map.get(uid)!.exposed!.active(false);
    }
}
function clearActive() {
    for (const uid of [...active_set]) {
        removeActive(uid);
    }
}

function onClick(data: UID, evt: Event) {
    if (props.clickActive) {
        if (!((evt as MouseEvent)?.ctrlKey ?? false)) {
            clearActive();
            addActive(data as UID);
        }
        else {
            if (isActive(data)) {
                removeActive(data);
            }
            else {
                addActive(data);
            }
        }
    }
    emits('click', data, evt);
}
function onContextMenu(data: UID, evt: SunContextMenuEvent) {
    emits('contextmenu', data, evt);
}
function onEdit(data: UID, label: string) {
    emits('edit', data, label);
}
function onDrop(drag_uid: UID | UID[], drop_uid: UID, drop_mode: SunTreeDroppable) {
    if (drop_mode === SunTreeDroppable.Parent) {
        const parent = props.options.parent(drop_uid);
        if (parent !== undefined) {
            emits('drop', drag_uid, parent, SunTreeDroppable.In);
        }
    }
    else {
        emits('drop', drag_uid, drop_uid, drop_mode);
    }
}

provide(SunTreeInjection, {
    treeUID: toRef(props, 'uid'),
    setUIDComponentCache,
    deleteUIDComponentCache,
    setUIDFoldedCache,
    getUIDFoldedCache,
    canDrop,
    onDragStart,
    isActive,
    onClick,
    onContextMenu,
    onEdit,
    onDrop,
    folderLine: toRef(props, 'folderLine'),
    size: toRef(props, 'size'),
    mode: toRef(props, 'mode'),
    draggable: toRef(props, 'draggable'),
    unfoldDelay: toRef(props, 'unfoldDelay'),
    clickFolding: toRef(props, 'clickFolding'),
    filterSort: toRef(props, 'filterSort'),
});

// slots
defineSlots<{
    prepand(props: { option: TreeItem }): void,
    append(props: { option: TreeItem }): void,
    suffix(props: { option: TreeItem }): void,
}>();

// emits
const emits = defineEmits<{
    (event: 'click', data: UID, evt: Event): void,
    (event: 'contextmenu', data: UID, evt: SunContextMenuEvent): void,
    (event: 'edit', data: UID, label: string): void,
    (event: 'drop', drag_uid: UID | UID[], drop_uid: UID, drop_mode: SunTreeDroppable): void,
}>();

// datas
const sorted_options = computed(() => props.options === undefined ? undefined : (props.filterSort === undefined ? props.options.options.value : props.filterSort(props.options.options.value)));

function toggle(folded: boolean) {
    for (const item of uid_component_map.values()) {
        item.exposed!.toggle(folded);
    }
    for (const uid of uid_folded_map.keys()) {
        setUIDFoldedCache(uid, folded);
    }
}

function toggleOption(uid: UID, folded: boolean) {
    if (folded === true) {
        setUIDFoldedCache(uid, true);
        if (uid_component_map.has(uid)) {
            uid_component_map.get(uid)!.exposed!.toggle(true);
        }
    }
    else {
        const path = props.options.abspath(uid);
        for (const uid of path) {
            setUIDFoldedCache(uid, false);
            if (uid_component_map.has(uid)) {
                uid_component_map.get(uid)!.exposed!.toggle(false);
            }
        }
    }
}

onBeforeUnmount(() => {
    uid_component_map.clear();
    uid_folded_map.clear();
    active_set.clear();
});

// exposes
defineExpose({
    toggle,
    toggleOption,
    isActive,
    addActive,
    removeActive,
    clearActive,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

// see './SunTreeItem.vue for all style';

</style>