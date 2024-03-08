<template>
    <SunPanel style="width: 100%; height: 100%;" vertical>
        <SunPanelContainer gap style="align-items: center; padding-right: 10px; background-color: var(--color-normal);"
            @mousedown="onDragMouseDown($event)" @dblclick="emits('maximize', true)">
            <SunButtonLike no-vertical-padding no-hover-color no-pressed-color flat style="flex: 1; min-height: unset;">
                <Globe />
                <SunButtonLabel style="margin-right: auto;">测试窗体 </SunButtonLabel>
            </SunButtonLike>
            <SunButton size="small" squared @mousedown.stop @click="emits('maximize', true)">
                <Maximize />
            </SunButton>
            <SunButton size="small" squared @mousedown.stop>
                <X />
            </SunButton>
        </SunPanelContainer>
        <SunPanelSeparator />
        <SunPanelResizeContainer style="flex: 1;" :initial-percentage="0.2">
            <template #first>
                <SunScrollContainer style="width: 100%; height: 100%;" content-style="width: 100%;">
                    <SunPanelContainer vertical gap>
                        <template v-for="s in 3">
                            <SunLabel size="large" :no-horizontal-padding="false" squared bold>
                                类型区域{{ s }}</SunLabel>
                            <SunButton v-for="i in 10" flat align="start">
                                <AppWindow />
                                <SunButtonLabel style="margin-right: auto;">按钮 {{ i }}</SunButtonLabel>
                            </SunButton>
                        </template>
                        <SunColorPicker :model-value="[1, 0, 0, 1]"></SunColorPicker>
                    </SunPanelContainer>
                </SunScrollContainer>
            </template>
            <template #second>
                <SunPanelResizeContainer vertical style="width: 100%; height: 100%;">
                </SunPanelResizeContainer>
            </template>
        </SunPanelResizeContainer>
    </SunPanel>
</template>

<script setup lang="ts">

import SunPopup from '../../src/sundesign/popup/SunPopup.vue';
import SunButton from '../../src/sundesign/button/SunButton.vue';
import SunButtonLabel from '../../src/sundesign/button/SunButtonLabel.vue';
import SunLabel from '../../src/sundesign/label/SunLabel.vue';
import SunButtonLike from '../../src/sundesign/button/SunButtonLike.vue';
import SunPanel from '../../src/sundesign/panel/SunPanel.vue';
import SunPanelContainer from '../../src/sundesign/panel/SunPanelContainer.vue';
import SunPanelSeparator from '../../src/sundesign/panel/SunPanelSeparator.vue';
import SunPanelResizeContainer from '../../src/sundesign/panel/SunPanelResizeContainer.vue';
import SunScrollContainer from '../../src/sundesign/scrollcontainer/SunScrollContainer.vue';
import SunColorPicker from '../../src/sundesign/colorpicker/SunColorPicker.vue';
import { X, AppWindow, Minimize, Maximize, Globe } from 'lucide-vue-next';
import { type Rect } from '../../src/sundesign/SunDesignConstants';

// emits
const emits = defineEmits<{
    (event: 'drag', evt: MouseEvent): void,
    (event: 'maximize', toggle: boolean): void,
}>();

function onDragMouseDown(evt: MouseEvent) {
    emits('drag', evt);
}

</script>

<style lang="stylus">
</style>