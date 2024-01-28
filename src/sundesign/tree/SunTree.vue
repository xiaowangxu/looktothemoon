<template>
    <div class="__sun-design-tree-container__" :data-size="size" :style="{ '--Indent': `${indentSize}px`, '--Depth': 0 }">
        <SunTreeItem v-if="options !== undefined" v-for="option in options" :size="size" :folder-line="folderLine"
            :option="option">
            <template #append="{ option }">
                <slot name="append" :option="option" />
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
    }>(),
    {
        size: 'normal',
        indentSize: 20,
        folderLine: true,
    }
);

// slots
defineSlots<{
    append(props: { option: TreeItem }): void,
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