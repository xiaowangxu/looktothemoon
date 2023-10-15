<template>
    <slot :open="open" :close="close" :opened="opened" />
    <SPopupPanel v-if="instance" :rect="popup_rect" v-slot="{ rect }">
        <SScrollContainer ref="sscrollcontainer_ref" width="100%" maxWidth="100%">
            <slot name="items" :rect="rect" />
        </SScrollContainer>
    </SPopupPanel>
</template>

<script setup lang="ts">

import SPopupPanel from '@/components/SPopupPanel.vue';
import SScrollContainer from './SScrollContainer.vue';
import { computed, ref } from 'vue';
import { usePopupPanelMeasureRect, type PopupOpenMode, type BoxSize, type Rect, type Position } from './SConst';
import { useWindowSize } from '@vueuse/core';

// props
const props = withDefaults(
    defineProps<{
        getPopupRect: (contentMinSize: BoxSize, windowSize: BoxSize) => Rect | undefined,
        openMode?: PopupOpenMode,
        useWindowSize?: boolean,
    }>(),
    {
        openMode: 'instance',
        useWindowSize: true,
    }
);

// slots
defineSlots<{
    default(props: { open: () => void, close: () => void, opened: boolean }): void,
    items(props: { rect: Rect | undefined }): void,
}>();

// datas
const { width: window_width, height: window_height } = useWindowSize();
const opened = ref(false);
const instance = computed(() => props.openMode === 'visibility' || opened.value);
const sscrollcontainer_ref = ref<InstanceType<typeof SScrollContainer>>();
const content_size = usePopupPanelMeasureRect(opened, computed(() => sscrollcontainer_ref.value?.contentDomElement), computed(() => props.openMode === 'instance'));
const popup_rect = computed<Rect | undefined>(() => {
    if (content_size.value === undefined) return undefined;
    return props.getPopupRect(content_size.value, props.useWindowSize ? { width: window_width.value, height: window_height.value } : { width: 0, height: 0 });
});

// methods
function open() {
    opened.value = true;
}
function close() {
    opened.value = false;
}

// exposes
defineExpose({
    opened,
    open, close,
});

</script>

<style></style>