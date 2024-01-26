<template>
    <div class="__sun-design-tree-container__">
        <SunTreeItem v-if="options !== undefined" v-for="option in options" :option="option">
            <template #append="{ option }">
                <slot name="append" :option="option" />
            </template>
        </SunTreeItem>
    </div>
</template>

<script setup lang="ts">

import SunTreeItem, { type TreeItem } from './SunTreeItem.vue';

//props
const props = withDefaults(
    defineProps<{
        options?: TreeItem[]
    }>(),
    {
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