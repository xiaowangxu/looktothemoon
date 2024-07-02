<template>

    <!-- <SunPanelContainer vertical gap style="flex-shrink: 0;">
        <SunPanelContainer gap no-padding>
            <SunControlGroup>
                <SunControlGroupRow>
                    <SunButton squared>
                        <Save />
                    </SunButton>
                    <SunButton squared>
                        <File />
                    </SunButton>
                </SunControlGroupRow>
            </SunControlGroup>
        </SunPanelContainer>
        <SunPanelContainer gap no-padding>
            <SunSelect style="flex: 1;" />
            <SunButton squared></SunButton>
        </SunPanelContainer>
    </SunPanelContainer>

    <SunPanelSeparator /> -->

    <SunScrollContainer style="width: 100%;" content-style="width: 100%;" scroll-bar-visibility="hover-track">

        <SunPanelFoldContainer label="可编辑属性">
            <SunPanelContainer vertical gap style="width: 100%;">
                <!-- <SunInspectorGrid>

                    <SunInspectorRow label="数字输入">
                        <SunNumberEdit :model-value="123" :min="0" :max="200" :step="1" />
                    </SunInspectorRow>

                    <SunInspectorRow label="位置">
                        <SunControlGroup style="flex: 1;">
                            <SunControlGroupRow style="flex: 1;">
                                <SunNumberEdit :model-value="123" :min="0" :max="200" :step="1" style="flex: 1;" />
                            </SunControlGroupRow>
                            <SunControlGroupRow style="flex: 1;">
                                <SunNumberEdit :model-value="123" :min="0" :max="200" :step="1" style="flex: 1;" />
                            </SunControlGroupRow>
                            <SunControlGroupRow style="flex: 1;">
                                <SunNumberEdit :model-value="123" :min="0" :max="200" :step="1" style="flex: 1;" />
                            </SunControlGroupRow>
                        </SunControlGroup>
                    </SunInspectorRow>

                    <SunInspectorRow label="旋转">
                        <SunControlGroup style="flex: 1;">
                            <SunControlGroupRow style="flex: 1;">
                                <SunNumberEdit :model-value="123" :min="0" :max="200" :step="1" style="flex: 1;" />
                                <SunButtonPopupNoScroll squared container panel-style="overflow: visible;">
                                    <template #button>
                                        <CircleSlash />
                                    </template>
                                    <template #popup>
                                        <SunAngleSlider :model-value="123" drop-shadow/>
                                    </template>
                                </SunButtonPopupNoScroll>
                            </SunControlGroupRow>
                        </SunControlGroup>
                    </SunInspectorRow>


                    <SunInspectorRow label="位移">
                        <SunHSlider :model-value="123" :min="0" :max="200" />
                    </SunInspectorRow>

                    <SunInspectorRow label="方向">
                        <SunControlGroup>
                            <SunControlGroupRow>
                                <SunButton squared>1</SunButton>
                                <SunButton squared>2</SunButton>
                                <SunButton squared>3</SunButton>
                            </SunControlGroupRow>
                            <SunControlGroupRow>
                                <SunButton squared>5</SunButton>
                                <SunButton squared>6</SunButton>
                                <SunButton squared>7</SunButton>
                            </SunControlGroupRow>
                            <SunControlGroupRow>
                                <SunButton squared>9</SunButton>
                                <SunButton squared>10</SunButton>
                                <SunButton squared>11</SunButton>
                            </SunControlGroupRow>
                        </SunControlGroup>
                    </SunInspectorRow>

                    <SunInspectorRow label="组">
                        <SunControlGroup style="flex: 1;">
                            <SunControlGroupRow style="flex: 1;">
                                <SunColorPicker :model-value="[1, 1, 0, 0.75]" style="flex: 1;" />
                                <SunSelect style="max-width: 100px; min-width: 50px;" :model-value="0" :options="[
                            [
                                {
                                    label: '循环',
                                    icon: 'Repeat',
                                    uid: 0,
                                },
                                {
                                    label: '单曲循环',
                                    icon: 'Repeat1',
                                    uid: 1,
                                },
                                {
                                    label: '随机',
                                    icon: 'Shuffle',
                                    uid: 2,
                                }
                            ]
                        ]" :preferedDirection="1" />
                            </SunControlGroupRow>
                        </SunControlGroup>
                    </SunInspectorRow>


                    <SunInspectorRow label="">
                        <SunButton>
                            <RefreshCcwDot />更新
                        </SunButton>
                    </SunInspectorRow>

                    <SunInspectorRow label="局部可见">
                        <SunCheckbox :model-value="false" />
                    </SunInspectorRow>

                    <SunInspectorRow label="自定义Hooks">
                        <SunSwitch :model-value="false" />
                    </SunInspectorRow>

                    <SunInspectorRow label="">
                        <SunControlGroup>
                            <SunRadioGroup>
                                <label style="display: flex; flex-wrap: nowrap; gap: 6px;">
                                    <SunRadiobox uid="Option A" />
                                    <SunLabel>选项 A</SunLabel>
                                </label>
                                <label style="display: flex; flex-wrap: nowrap; gap: 6px;">
                                    <SunRadiobox uid="Option B" />
                                    <SunLabel>选项 B</SunLabel>
                                </label>
                                <label style="display: flex; flex-wrap: nowrap; gap: 6px;">
                                    <SunRadiobox uid="Option C" />
                                    <SunLabel>选项 C</SunLabel>
                                </label>
                            </SunRadioGroup>
                        </SunControlGroup>
                    </SunInspectorRow>

                    <SunInspectorRow label="颜色">
                        <SunColorPicker v-model:model-value="color" @input="onChange"/>
                    </SunInspectorRow>

                    <SunInspectorRow label="名称">
                        <SunLineEdit />
                    </SunInspectorRow>

                    <SunInspectorRow label="描述">
                        <SunTextarea style="resize: vertical;" />
                    </SunInspectorRow>

                </SunInspectorGrid> -->
            </SunPanelContainer>
        </SunPanelFoldContainer>

    </SunScrollContainer>

</template>

<script setup lang="ts">

import SunPanel from '../sundesign/panel/SunPanel.vue';
import SunPanelContainer from '../sundesign/panel/SunPanelContainer.vue';
import SunPanelSeparator from '../sundesign/panel/SunPanelSeparator.vue'
import SunPanelFoldContainer from '@/sundesign/panel/SunPanelFoldContainer.vue';
import SunScrollContainer from '@/sundesign/scrollcontainer/SunScrollContainer.vue';
import SunButton from '../sundesign/button/SunButton.vue';
import SunInspectorGrid from '../sundesign/inspectorgrid/SunInspectorGrid.vue';
import SunInspectorRow from '../sundesign/inspectorgrid/SunInspectorRow.vue';
import SunNumberEdit from '../sundesign/numberedit/SunNumberEdit.vue';
import SunAngleSlider from '../sundesign/slider/SunAngleSlider.vue';
import SunCheckbox from '../sundesign/checkbox/SunCheckbox.vue';
import SunRadiobox from '../sundesign/checkbox/SunRadiobox.vue';
import SunSwitch from '../sundesign/checkbox/SunSwitch.vue';
import SunRadioGroup from '../sundesign/checkbox/SunRadioGroup.vue';
import SunLabel from '../sundesign/label/SunLabel.vue';
import SunColorPicker from '../sundesign/colorpicker/SunColorPicker.vue';
import SunLineEdit from '../sundesign/lineedit/SunLineEdit.vue';
import SunTextarea from '../sundesign/textarea/SunTextarea.vue';
import SunSelect from '../sundesign/select/SunSelect.vue';
import SunControlGroup from '../sundesign/controlgroup/SunControlGroup.vue';
import SunControlGroupRow from '../sundesign/controlgroup/SunControlGroupRow.vue';
import SunHSlider from '@/sundesign/slider/SunHSlider.vue';
import SunButtonPopupNoScroll from '@/sundesign/buttonpopup/SunButtonPopupNoScroll.vue';
import { RefreshCcwDot, Save, File, CircleSlash } from 'lucide-vue-next';
import { ref } from 'vue';
import type { ColorData } from '@/sundesign/colorpicker/SunColorPickerConstants';

const color = ref<ColorData>([1.0, 0.0, 0.0, 1.0]);

function onChange(color: ColorData) {
    (window as any).set_Color.trigger(color);
}

</script>