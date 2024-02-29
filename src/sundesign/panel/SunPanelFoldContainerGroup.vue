<template>
    <slot />
</template>

<script setup lang="ts">

import { SunPanelFoldContainerGroupInjection } from './SunPanelFoldContainerGroupConstants';
import { provide, readonly, ref, watch } from 'vue';

// emits
const emits = defineEmits<{
    (event: 'closed'): void;
    (event: 'opened'): void;
    (event: 'toggle'): void;
}>();

const unfolded_item = ref<number | undefined>();
watch(unfolded_item, (val, last) => {
    if (val === undefined) emits('closed');
    else if (last === undefined) emits('opened');
    emits('toggle');
});

provide(SunPanelFoldContainerGroupInjection, {
    value: readonly(unfolded_item),
    open(uid: number) {
        if (uid === unfolded_item.value) return;
        unfolded_item.value = uid;
    },
    close(uid: number) {
        if (uid === unfolded_item.value) {
            unfolded_item.value = undefined;
        }
    },
});

</script>