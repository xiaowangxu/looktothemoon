<template>
    <div class="__sun-design-tree-container__" :data-size="size" :style="{ '--Indent': `${indentSize}px`, '--Depth': 0 }">
        <SunTreeItem v-if="sorted_options !== undefined" v-for="option in sorted_options" :size="size"
            :folder-line="folderLine" :option="option" :draggable="draggable" :unfold-delay="unfoldDelay" :picking="picking"
            :sort="sort" :click-folding="clickFolding" @click="onClick" @contextmenu="emits('contextmenu', $event)"
            @edit="onSubTreeEdit">
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

import { computed } from 'vue';
import type { Size } from '../SunDesignConstants';
import SunTreeItem, { type TreeItem } from './SunTreeItem.vue';
import type { SunContextMenuEvent } from '../contextmenu/SunContextMenu';

//props
const props = withDefaults(
    defineProps<{
        size?: Size,
        indentSize?: number,
        folderLine?: boolean,
        options?: TreeItem[],
        draggable?: boolean,
        unfoldDelay?: number,
        picking?: boolean,
        clickFolding?: boolean,
        sort?: (options: TreeItem[]) => TreeItem[],
    }>(),
    {
        size: 'normal',
        indentSize: 20,
        folderLine: true,
        draggable: true,
        unfoldDelay: 500,
        picking: false,
        clickFolding: true,
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
const sorted_options = computed(() => props.options === undefined ? undefined : (props.sort === undefined ? props.options : props.sort(props.options)));

function onClick(data: any, evt: Event) {
    emits('click', data, evt);
}

function onSubTreeEdit(data: any, label: string) {
    emits('edit', data, label);
}

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

// see './SunTreeItem.vue for all style';

</style>