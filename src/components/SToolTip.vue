<template>
    <div ref="div_dom" @mouseenter="opened = true" @mouseleave="opened = false">
        <slot />
    </div>
    <SAutoMeasurePopupPanel :open="opened" :open-mode="openMode" :get-popup-rect="get_ToolTipPopupRect">
        <slot name="tooltip">
            <SFlow v-if="toolTip !== undefined" padding="var(--MediumPaddingSize)">
                <SLabel text-size="normal">{{ toolTip }}</SLabel>
            </SFlow>
        </slot>
    </SAutoMeasurePopupPanel>
</template>

<script setup lang="ts">

import { ref } from 'vue';
import SAutoMeasurePopupPanel from './SAutoMeasurePopupPanel.vue';
import SFlow from './SFlow.vue';
import SLabel from './typography/SLabel.vue';
import type { BoxSize, PopupOpenMode, Rect } from './SConst';

// props
const props = withDefaults(
    defineProps<{
        openMode?: PopupOpenMode,
        toolTip?: string,
    }>(),
    {
        openMode: 'instance',
    }
)

// datas
const div_dom = ref<HTMLDivElement | null>(null);
const opened = ref(false);

// methods
function get_ToolTipPopupRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect | undefined {
    if (!div_dom.value) return;
    const { left, right, bottom, top, width, height } = div_dom.value.getBoundingClientRect();
    return { x: right, y: top, ...contentMinSize };
}

</script>

<style></style>