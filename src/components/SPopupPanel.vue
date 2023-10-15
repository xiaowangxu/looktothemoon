<template>
    <SPopup class="__s_popuppanel_popup__" :visible="visible" :rect="rect">
        <SPanel class="__s_popuppanel_panel__" :style="{ width, height }">
            <SScrollContainer ref="sscrollcontainer_ref" width="100%" maxWidth="100%">
                <slot :rect="rect" />
            </SScrollContainer>
        </SPanel>
    </SPopup>
</template>

<script setup lang="ts">

import SPopup from '@/components/SPopup.vue';
import SPanel from '@/components/SPanel.vue';
import SScrollContainer from '@/components/SScrollContainer.vue';
import { type Rect } from './SConst';
import { computed, onBeforeUnmount, onUnmounted, watch } from 'vue';

// props
const props = defineProps<{
    rect: Rect | undefined,
}>();

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
const visible = computed(() => props.rect !== undefined);
watch(visible, (v) => {
    if (v) emits('opened');
    else emits('closed');
});
onBeforeUnmount(() => emits('closed'));
const width = computed(() => props.rect === undefined ? undefined : `${props.rect.width}px`);
const height = computed(() => props.rect === undefined ? undefined : `${props.rect.height}px`);

</script>

<style>
.__s_popuppanel_panel__ {
    width: min-content;
    height: min-content;
    pointer-events: all;
    padding: 0;
    overflow: hidden;
    border-radius: var(--NormalRadius);
    overflow: hidden;
}
</style>