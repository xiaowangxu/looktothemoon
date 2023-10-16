<template>
    <SButton ref="sbutton_ref" flat :active="opened" @click="opened ? close() : open()">
        <slot name="button" />
    </SButton>
    <SPopupMenu :open="opened" :min-width="minWidth" :open-mode="openMode" :get-popup-rect="get_PopupRect">
        <slot name="items" />
    </SPopupMenu>
</template>

<script setup lang="ts">

import SButton from './SButton.vue';
import SPopupMenu from './SPopupMenu';
import { calcSelectPopupSize, type BoxSize, type Rect, type PopupOpenMode } from './SConst';
import { ref } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        openMode?: PopupOpenMode,
        minWidth?: string,
    }>(),
    {
        openMode: 'instance',
    }
);

// datas
const opened = ref<boolean>(false);
const sbutton_ref = ref<InstanceType<typeof SButton>>();
function open() {
    opened.value = true;
}
function close() {
    opened.value = false;
}

// methods
function get_PopupRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect | undefined {
    if (!sbutton_ref.value?.buttonElement) return undefined;
    const { left, top, width, height } = sbutton_ref.value.buttonElement.getBoundingClientRect();
    return calcSelectPopupSize(contentMinSize, { x: left, y: top, width, height }, windowSize);
}

</script>

<style></style>