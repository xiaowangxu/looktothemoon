<template>
    <div class="__sun-design-tree-container__" :data-size="size"
        :style="{ '--Depth': initialDepth, '--Indent': indent === undefined ? undefined : `${indent}px`, '--LeafIndent': leafIndent === undefined ? undefined : `${leafIndent}px` }">
        <!-- ref="treeitem_refs" -->
        <SunTreeItem v-if="sorted_options !== undefined" v-for="option in sorted_options" :option="option" @click="onClick"
            @contextmenu="onContextMenu" @edit="onEdit" :key="option.uid" :depth="initialDepth">
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

import { setDragData, type DragData, type PopupOpenMode, type Size, type UID, setDragImage } from '../SunDesignConstants';
import SunTreeItem, { type TreeItem } from './SunTreeItem.vue';
import { SunTreeDroppable, SunTreeInjection, type SunTreeItemDragData, type SunTreeOptions } from './SunTreeConstants';
import { computed, provide, onBeforeUnmount, type ComponentInternalInstance } from 'vue';
import { toRef } from '@vueuse/core';

//props
const props = withDefaults(
    defineProps<{
        uid?: UID,
        mode?: PopupOpenMode,
        size?: Size,
        folderLine?: boolean,
        indent?: number,
        leafIndent?: number,
        options: SunTreeOptions,
        draggable?: boolean,
        unfoldDelay?: number,
        clickFolding?: boolean,
        filterSort?: (options: TreeItem[]) => TreeItem[],
        canDrop?: (drag_uid: UID, drop_uid: UID) => SunTreeDroppable,
        getDragData?: (drag_uid: UID | UID[]) => DragData[] | undefined,
        defaultFold?: boolean,
        initialDepth?: number,
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
        initialDepth: 0,
        allowDragReorder: false,
        allowDragInLeaf: false,
        redirectLeafToParent: true,
        clickActive: true,
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
    (event: 'click', data: UID, evt: Event): void,
    (event: 'contextmenu', data: UID, evt: Event): void,
    (event: 'edit', data: UID, label: string): void,
    (event: 'drop', drag_uid: UID | UID[], drop_uid: UID, drop_mode: SunTreeDroppable): void,
    (event: 'active', data: UID): void,
    (event: 'deactive', data: UID): void,
}>();

// datas
const sorted_options = computed(() => props.options === undefined ? undefined : (props.filterSort === undefined ? props.options.options.value : props.filterSort(props.options.options.value)));

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
        removeActive(uid, false);
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
        // node from different may have drop_parent === undefined
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
    if (props.options.has(uid) && !active_set.has(uid) && !(props.options.get(uid)!.disabled ?? false)) {
        active_set.add(uid);
        if (uid_component_map.has(uid)) {
            uid_component_map.get(uid)!.exposed!.active(true);
        }
        emits('active', uid);
    }
}
function removeActive(uid: UID, emit: boolean = true) {
    if (active_set.has(uid)) {
        active_set.delete(uid);
        if (emit) {
            emits('deactive', uid);
        }
    }
    if (uid_component_map.has(uid)) {
        uid_component_map.get(uid)!.exposed!.active(false);
    }
    else {
        if (last_non_shift_click === uid) last_non_shift_click = undefined;
        if (last_shift_click === uid) last_shift_click = undefined;
    }
}
function updateActives(uids: UID[]) {
    const _uids = new Set(uids);
    const del = [...active_set].filter(i => !_uids.has(i));
    const add = [..._uids].filter(i => !active_set.has(i));
    for (const d of del) {
        removeActive(d, true);
    }
    for (const a of add) {
        addActive(a);
    }
}
function clearActive() {
    for (const uid of [...active_set]) {
        removeActive(uid);
    }
}

function getIndex(uid: UID) {
    return sorted_options.value?.findIndex(i => i.uid === uid) ?? -1;
}
function getUID(index: number) {
    return sorted_options.value?.[index]?.uid ?? undefined;
}
function getChildrenUIDs(uid: UID, uids: UID[] = []) {
    const subs = props.options.get(uid)?.subs;
    if (subs === undefined) return uids;
    for (const child of subs) {
        uids.push(child.uid);
        getChildrenUIDs(child.uid, uids);
    }
    return uids;
}

type IndexedAbsPathItem = { parent: UID | undefined, uid: UID, index: number };
function getIndexedAbsPath(uid: UID) {
    const p = props.options.abspath(uid);
    const path: IndexedAbsPathItem[] = [];
    for (let i = 0; i < p.length; i++) {
        if (i === 0) {
            const index = getIndex(p[i]);
            if (index === -1) return undefined;
            path.push({ parent: undefined, uid: p[i], index });
        }
        else {
            const component = uid_component_map.get(p[i - 1]);
            if (component === undefined) return undefined;
            const index = component.exposed!.getIndex(p[i]);
            if (index === -1) return undefined;
            path.push({ parent: p[i - 1], uid: p[i], index });
        }
    }
    return path;
}
function compareIndexedAbsPath(a: IndexedAbsPathItem[], b: IndexedAbsPathItem[]) {
    const a_length = a.length, b_length = b.length;
    const length = Math.min(a_length, b_length);
    for (let i = 0; i < length; i++) {
        const _a = a[i].index, _b = b[i].index;
        if (_a < _b) return -1;
        else if (_a > _b) return 1;
    }
    if (a_length < b_length) return -1;
    else if (a_length > b_length) return 1;
    return 0;
}
function getFilterSortSubs(uid: UID | undefined) {
    const subs = uid === undefined ? props.options.options.value : props.options.get(uid)!.subs ?? [];
    return props.filterSort === undefined ? subs : props.filterSort(subs);
}
function getUIDsBetweenIndexedAbsPath(a: IndexedAbsPathItem[], b: IndexedAbsPathItem[]) {
    if (a.length <= 0 || b.length <= 0) return [];
    const result: UID[] = [];
    const a_length = a.length, b_length = b.length;
    let b_start = 0;
    for (let i = 0; i < a_length; i++) {
        const parent = a[i].parent;
        const start = a[i].index;
        const uid = a[i].uid;
        if (i < b_length && parent === b[i].parent) {
            const end = b[i].index;
            b_start = i;
            if (i === a_length - 1) result.push(uid);
            if (start >= end) continue;
            if (i === a_length - 1) result.push(...getChildrenUIDs(uid));
            const subs = getFilterSortSubs(parent);
            result.push(b[i].uid);
            for (let i = start + 1; i < end; i++) {
                if (subs.length > i) {
                    result.push(subs[i].uid);
                    result.push(...getChildrenUIDs(subs[i].uid));
                }
            }
        }
        else {
            const start = a[i].index;
            const subs = getFilterSortSubs(parent);
            for (let i = start + 1; i < subs.length; i++) {
                result.push(subs[i].uid);
                result.push(...getChildrenUIDs(subs[i].uid));
            }
            if (i === a_length - 1) {
                result.push(uid);
                result.push(...getChildrenUIDs(uid));
            }
        }
    }
    for (let i = b_start + 1; i < b_length; i++) {
        const parent = b[i].parent;
        const index = b[i].index;
        const uid = b[i].uid;
        const subs = getFilterSortSubs(parent);
        result.push(uid);
        for (let i = 0; i < index; i++) {
            if (subs.length > i) {
                result.push(subs[i].uid);
                result.push(...getChildrenUIDs(subs[i].uid));
            }
        }
    }
    return result;
}

let last_non_shift_click: UID | undefined = undefined;
let last_shift_click: UID | undefined = undefined;
function onClick(data: UID, evt: Event) {
    if (props.clickActive) {
        const ctrl = (evt as MouseEvent)?.ctrlKey ?? false;
        const shift = (evt as MouseEvent)?.shiftKey ?? false;
        if (!ctrl && !shift) {
            clearActive();
            addActive(data as UID);
            last_non_shift_click = data;
            last_shift_click = undefined;
        }
        else if (ctrl || last_non_shift_click === undefined) {
            if (isActive(data)) {
                removeActive(data, true);
            }
            else {
                addActive(data);
            }
            last_non_shift_click = data;
            last_shift_click = undefined;
        }
        else if (shift) {
            const actives = [...active_set]
            if (actives.length === 0) {
                addActive(data);
                last_non_shift_click = data;
                last_shift_click = undefined;
            }
            else {
                const last = last_non_shift_click;
                if (last !== data) {
                    const actives = new Set([...active_set]);
                    if (last_shift_click !== undefined) {
                        const paths = [last_shift_click, data].map(uid => getIndexedAbsPath(uid)).filter(i => i !== undefined).sort((a, b) => compareIndexedAbsPath(a!, b!));
                        if (paths.length !== 2) return;
                        const uids = getUIDsBetweenIndexedAbsPath(paths[0]!, paths[1]!);
                        for (const uid of uids) {
                            actives.delete(uid);
                        }
                    }
                    const paths = [last, data].map(uid => getIndexedAbsPath(uid)).filter(i => i !== undefined).sort((a, b) => compareIndexedAbsPath(a!, b!));
                    if (paths.length !== 2) return;
                    const uids = getUIDsBetweenIndexedAbsPath(paths[0]!, paths[1]!);
                    for (const uid of uids) {
                        actives.add(uid);
                    }
                    updateActives([...actives]);
                }
                last_shift_click = data;
            }
        }
    }
    emits('click', data, evt);
}
function onContextMenu(data: UID, evt: Event) {
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

function edit(uid: UID) {
    if (uid_component_map.has(uid)) {
        console.log(uid_component_map.get(uid));
        uid_component_map.get(uid)!.exposed!.edit();
    }
}

onBeforeUnmount(() => {
    uid_component_map.clear();
    uid_folded_map.clear();
    active_set.clear();
    last_non_shift_click = undefined;
    last_shift_click = undefined;
});

// exposes
defineExpose({
    toggle,
    toggleOption,
    edit,
    isActive,
    addActive,
    removeActive,
    updateActives,
    clearActive,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

// see './SunTreeItem.vue for all style';

</style>