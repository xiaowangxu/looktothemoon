<template>
    <div class="__sun-design-tree-container__" :data-size="size" :style="{ '--Indent': `${indentSize}px`, '--Depth': 0 }">
        <SunTreeItem v-if="options !== undefined" v-for="option in options" :size="size" :folder-line="folderLine"
            :option="option" :draggable="draggable" :unfold-delay="unfoldDelay" :picking="picking">
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
    </div>
</template>

<script setup lang="ts">

import type { Size } from '../SunDesignConstants';
import SunTreeItem, { type TreeItem } from './SunTreeItem.vue';

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
    }>(),
    {
        size: 'normal',
        indentSize: 20,
        folderLine: true,
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

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

// see './SunTreeItem.vue for all style';

</style>