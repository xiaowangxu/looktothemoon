<template>
    <SPopup v-if="instance" :visible="open" :rect="popup_rect" v-slot="{ rect }">
        <SPanel class="__s_popuppanel_panel__" :style="{ width, height }">
            <SScrollContainer ref="sscrollcontainer_ref" width="100%" maxWidth="100%">
                <slot :rect="rect" />
            </SScrollContainer>
        </SPanel>
    </SPopup>
</template>

<script setup lang="ts">

import SPopup from '@/components/SPopup.vue';
import SPanel from './SPanel.vue';
import SScrollContainer from './SScrollContainer.vue';
import { computed, onRenderTriggered, ref, toRef, watch } from 'vue';
import { usePopupPanelMeasureRect, type PopupOpenMode, type BoxSize, type Rect } from './SConst';
import { useWindowSize } from '@vueuse/core';

// props
const props = withDefaults(
    defineProps<{
        open?: boolean,
        getPopupRect: (contentMinSize: BoxSize, windowSize: BoxSize) => Rect | undefined,
        openMode?: PopupOpenMode,
        useWindowSize?: boolean,
    }>(),
    {
        open: false,
        openMode: 'instance',
        useWindowSize: true,
    }
);

// slots
defineSlots<{
    default(props: { rect: Rect | undefined }): void,
}>();

// emits
const emits = defineEmits<{
    opened: [],
    closed: [],
}>();

// datas
watch(toRef(props, 'open'), (v) => {
    if (v) emits('opened');
    else emits('closed');
});
const { width: window_width, height: window_height } = useWindowSize();
const instance = computed(() => props.openMode === 'visibility' || props.open);
const sscrollcontainer_ref = ref<InstanceType<typeof SScrollContainer>>();
const content_size = usePopupPanelMeasureRect(toRef(props, 'open'), computed(() => sscrollcontainer_ref.value?.contentDomElement), computed(() => props.openMode === 'instance'));
const popup_rect = computed<Rect | undefined>(() => {
    if (content_size.value === undefined) return undefined;
    return props.getPopupRect(content_size.value, props.useWindowSize ? { width: window_width.value, height: window_height.value } : { width: 0, height: 0 });
});
const width = computed(() => popup_rect.value === undefined ? undefined : `${popup_rect.value.width}px`);
const height = computed(() => popup_rect.value === undefined ? undefined : `${popup_rect.value.height}px`);


</script>

<style></style>