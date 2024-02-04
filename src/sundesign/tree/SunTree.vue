<template>
    <div class="__sun-design-tree-container__" :data-size="size" :style="{ '--Depth': 0 }">
        <SunTreeItem ref="treeitem_refs" v-if="sorted_options !== undefined" v-for="option in sorted_options"
            :default-fold="defaultFold" :mode="mode" :size="size" :folder-line="folderLine" :option="option"
            :draggable="draggable" :unfold-delay="unfoldDelay" :filter-sort="filterSort" :click-folding="clickFolding"
            @click="onClick" @contextmenu="emits('contextmenu', $event)" @edit="onSubTreeEdit">
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

import { computed, ref, type Raw } from 'vue';
import type { PopupOpenMode, Size, UID } from '../SunDesignConstants';
import SunTreeItem, { type TreeItem } from './SunTreeItem.vue';
import type { SunContextMenuEvent } from '../contextmenu/SunContextMenu';
import { SunTreeOptionsRef } from './SunTreeConstants';

//props
const props = withDefaults(
    defineProps<{
        mode?: PopupOpenMode,
        size?: Size,
        folderLine?: boolean,
        options?: TreeItem[],
        draggable?: boolean,
        unfoldDelay?: number,
        clickFolding?: boolean,
        filterSort?: (options: TreeItem[]) => TreeItem[],
        defaultFold?: boolean,
        activeOptions?: UID[],
    }>(),
    {
        mode: 'visibility',
        size: 'normal',
        folderLine: true,
        draggable: true,
        unfoldDelay: 500,
        clickFolding: true,
        defaultFold: false,
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
    (event: 'edit', data: any, label: string): void,
}>();

// datas
const treeitem_refs = ref<InstanceType<typeof SunTreeItem>[]>([]);
const sorted_options = computed(() => props.options === undefined ? undefined : (props.filterSort === undefined ? props.options : props.filterSort(props.options)));

function onClick(data: any, evt: Event) {
    emits('click', data, evt);
}

function onSubTreeEdit(data: any, label: string) {
    emits('edit', data, label);
}

function toggle(fold: boolean, deep: boolean = false) {
    for (const item of treeitem_refs.value) {
        item.toggle(fold, deep);
    }
}

// exposes
defineExpose({
    toggle,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

// see './SunTreeItem.vue for all style';

</style>