<template>
    <div id="editor-container" :class="{ opened: !folded }">
        <div id="top-left-panel">
            <EditorMenuBar />
        </div>
        <div id="top-panel">
            <SFlow align-h="center" align-v="start" style="width: 100%; height: 100%;">
                <SunPanel class="pointer-event">
                    <SunPanelContainer>
                        <SunLineEdit />
                    </SunPanelContainer>
                    <SunPanelSeparator />
                    <SunPanelContainer gap>
                        <SunControlGroup>
                            <SunControlGroupRow>
                                <SunButton squared>
                                    <SkipBack />
                                </SunButton>
                                <SunButton squared>
                                    <StepBack />
                                </SunButton>
                                <SunButton squared>
                                    <Play />
                                </SunButton>
                                <SunButton squared>
                                    <StepForward />
                                </SunButton>
                                <SunButton squared>
                                    <SkipForward />
                                </SunButton>
                                <SunLineEdit />
                                <SunButton squared>
                                    <Shuffle />
                                </SunButton>
                            </SunControlGroupRow>
                        </SunControlGroup>
                    </SunPanelContainer>
                    <SunPanelSeparator />
                    <SunPanelContainer gap>
                        <SunButton :color-scheme="ColorSchemeRed">
                            <X />取消
                        </SunButton>
                        <SunButton :color-scheme="ColorSchemeGreen">
                            <Check />确认
                        </SunButton>
                    </SunPanelContainer>
                    <SunPanelContainer>
                        <SSelect v-model:value="select" deselectable style="min-width: 200px; max-width: 200px;">
                            <template #empty>
                                无项目
                            </template>
                            <SItem label="这些是选项" icon="Undo">
                            </SItem>
                            <SItem label="1">
                                <Globe />
                                <SLabel min-size="unset" color="inherit">{{ checkbox ?
                                    '更多...ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890' : '???' }}</SLabel>
                                <SLabel min-size="unset" color="var(--SColorActiveDisabled)" style="flex: 1;" align-h="end">
                                    1234</SLabel>
                            </SItem>
                            <SVSeparator />
                            <SItem label="2">
                                <Workflow />
                                <SLabel min-size="unset" color="inherit">禁用项目</SLabel>
                                <SLabel min-size="unset" color="var(--SColorActiveDisabled)" style="flex: 1;" align-h="end">
                                    Disable Item</SLabel>
                            </SItem>
                            <SItem label="3">
                                <Search />
                                <SLabel min-size="unset" color="inherit">查找</SLabel>
                            </SItem>
                            <SItem label="4" :disabled="select === '2'">
                                <Minus />
                                <SLabel min-size="unset" color="inherit">Flat Active</SLabel>
                            </SItem>
                            <SItem label="5">
                                <Redo2 />
                                <SLabel min-size="unset" color="inherit">更多...</SLabel>
                                <SLabel min-size="unset" color="var(--SColorActiveDisabled)" style="flex: 1;" align-h="end">
                                </SLabel>
                            </SItem>
                            <SVSeparator />
                            <SItem label="6" color="var(--ColorRed)">
                                <Trash />
                                <SLabel min-size="unset" color="inherit">删除</SLabel>
                                <SLabel min-size="unset" color="var(--SColorActiveDisabled)" style="flex: 1;" align-h="end">
                                    Delete
                                </SLabel>
                            </SItem>
                            <SItem label="这是一个测试" description="hahaha" uid="7" color="orange">
                                <template #icon>
                                    <Search />
                                </template>
                            </SItem>
                        </SSelect>
                    </SunPanelContainer>
                </SunPanel>

                <!-- <SPanel class="pointer-event" style="overflow: hidden; padding: 0px;">
                    <SScrollContainer scroll-bar-state-h="hidden" scroll-bar-state-v="hidden">
                        <SFlow padding="var(--GapAndMargin)">
                            <SLineEdit :clearable="false" align-text="start" v-model:value="lineedit" lazy />
                            <SHSeparator />
                            <SActiveArea>
                                <SLabel min-size="normal">长度</SLabel>
                                <SNumberEdit v-model:value="numberedit" suffix=" 毫米" lazy :show-end-zeros="false" />
                            </SActiveArea>
                            <SHSeparator />
                            <SActiveArea>
                                <SLabel min-size="normal">选择器</SLabel>
                                <SSelect v-model:value="select" deselectable style="min-width: 200px; max-width: 200px;">
                                    <template #empty>
                                        无项目
                                    </template>
                                    <SItem label="这些是选项" icon="Undo">
                                    </SItem>
                                    <SItem label="1">
                                        <Globe />
                                        <SLabel min-size="unset" color="inherit">{{ checkbox ?
                                            '更多...ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890' : '???' }}</SLabel>
                                        <SLabel min-size="unset" color="var(--SColorActiveDisabled)" style="flex: 1;"
                                            align-h="end">1234</SLabel>
                                    </SItem>
                                    <SVSeparator />
                                    <SItem label="2">
                                        <Workflow />
                                        <SLabel min-size="unset" color="inherit">禁用项目</SLabel>
                                        <SLabel min-size="unset" color="var(--SColorActiveDisabled)" style="flex: 1;"
                                            align-h="end">Disable Item</SLabel>
                                    </SItem>
                                    <SItem label="3">
                                        <Search />
                                        <SLabel min-size="unset" color="inherit">查找</SLabel>
                                    </SItem>
                                    <SItem label="4" :disabled="select === '2'">
                                        <Minus />
                                        <SLabel min-size="unset" color="inherit">Flat Active</SLabel>
                                    </SItem>
                                    <SItem label="5">
                                        <Redo2 />
                                        <SLabel min-size="unset" color="inherit">更多...</SLabel>
                                        <SLabel min-size="unset" color="var(--SColorActiveDisabled)" style="flex: 1;"
                                            align-h="end"></SLabel>
                                    </SItem>
                                    <SVSeparator />
                                    <SItem label="6" color="var(--ColorRed)">
                                        <Trash />
                                        <SLabel min-size="unset" color="inherit">删除</SLabel>
                                        <SLabel min-size="unset" color="var(--SColorActiveDisabled)" style="flex: 1;"
                                            align-h="end">Delete
                                        </SLabel>
                                    </SItem>
                                    <SItem label="这是一个测试" description="hahaha" uid="7" color="orange">
                                        <template #icon>
                                            <Search />
                                        </template>
                                    </SItem>
                                </SSelect>
                            </SActiveArea>
                            <SHSeparator />
                            <SActiveArea>
                                <SLabel min-size="normal">连续性</SLabel>
                                <SSelect v-model:value="select" style="min-width: 100px; max-width: 100px;">
                                    <SItem label="0">
                                        <Dot />
                                        <SLabel min-size="unset" color="inherit" width="100%" align-h="center">G0</SLabel>
                                    </SItem>
                                    <SItem label="1">
                                        <Tangent />
                                        <SLabel min-size="unset" color="inherit" width="100%" align-h="center">G1</SLabel>
                                    </SItem>
                                    <SItem label="2">
                                        <Radius />
                                        <SLabel min-size="unset" color="inherit" width="100%" align-h="center">G2</SLabel>
                                    </SItem>
                                </SSelect>
                            </SActiveArea>
                            <SHSeparator />
                            <SCheckBox value disabled />
                            <SCheckBox disabled />
                            <SRadioBox />
                            <SRadioBox value disabled />
                            <SRadioBox disabled />
                            <SActiveArea>
                                <SCheckBox v-model:value="checkbox" />
                                <SLabel min-size="normal">Test</SLabel>
                            </SActiveArea>
                            <SButton color="var(--ColorRed)">
                                <X />取消
                            </SButton>
                            <SButton color="var(--ColorGreen)" icon-only>
                                <Check />
                            </SButton>
                        </SFlow>
                    </SScrollContainer>
                </SPanel> -->
            </SFlow>
        </div>
        <div id="top-right-panel">
            <EditorCompass />
        </div>
        <div id="left-panel">
            <SFlow vertical align-h="start" align-v="center" style="width: 100%; height: 100%;">
                <EditorToolBar />
            </SFlow>
        </div>
        <div id="right-panel">
        </div>
    </div>
</template>

<script setup lang="ts">

import { type BasicTypes, type Alignment, type BoxSize } from '@/components/SConst';

import EditorMenuBar from './EditorMenuBar.vue';
import EditorToolBar from './EditorToolBar.vue';
import EditorCompass from './EditorCompass.vue';

import SunPanel from '@/sundesign/panel/SunPanel.vue';
import SunPanelContainer from '@/sundesign/panel/SunPanelContainer.vue';
import SunPanelSeparator from '@/sundesign/panel/SunPanelSeparator.vue';
import SunButton from '@/sundesign/button/SunButton.vue';
import SunLineEdit from '@/sundesign/lineedit/SunLineEdit.vue';
import SunControlGroup from '@/sundesign/controlgroup/SunControlGroup.vue';
import SunControlGroupRow from '@/sundesign/controlgroup/SunControlGroupRow.vue';
import { ColorSchemeRed, ColorSchemeGreen } from '@/sundesign/SunDesignConstants';

import SPanel from '@/components/SPanel.vue';
import SButton from '@/components/SButton.vue';
import SLineEdit from '@/components/SLineEdit.vue';
import SNumberEdit from '@/components/SNumberEdit.vue';
import SCheckBox from '@/components/SCheckBox.vue';
import SRadioBox from '@/components/SRadioBox.vue';
import SFlow from '@/components/SFlow.vue';
import { Cog, Tangent, Radius, Dot, X, Check, StepBack, StepForward, SkipBack, SkipForward, Play, Shuffle, Workflow, Globe, Search, Undo2, Redo2, PanelLeftInactive, Minus, Trash, ChevronRight, Baseline } from 'lucide-vue-next';
import { onMounted, ref, watch } from 'vue';
import SSpan from '@/components/typography/SSpan.vue';
import SLabel from '@/components/typography/SLabel.vue';
import STitle from '@/components/typography/STitle.vue';
import SSubTitle from '@/components/typography/SSubTitle.vue';
import SParagraph from '@/components/typography/SParagraph.vue';
import SActiveArea from '@/components/SActiveArea.vue';
import SScrollContainer from '@/components/SScrollContainer.vue';
import SHSeparator from '@/components/SHSeparator.vue';
import SVSeparator from '@/components/SVSeparator.vue';
import SSelect from '@/components/SSelect';
import SItem from '@/components/SItem.vue';
import SPopupMenu from '@/components/SPopupMenu';

const folded = ref(true);
const align = ref<Alignment>('end');
const lineedit = ref('hahaha');
const numberedit = ref(123);
const checkbox = ref(false);
const select = ref<BasicTypes | undefined>(undefined);

const button_ref = ref<InstanceType<typeof SButton>>();

// watch(lineedit, (newval, oldval) => {
//     console.log(newval, oldval);
// });
// watch(numberedit, (newval, oldval) => {
//     console.log(newval, oldval);
// });
// watch(checkbox, (newval, oldval) => {
//     console.log(newval, oldval);
// });

function resized(borderBoxSize: BoxSize, contentBoxSize: BoxSize, target: Element) {
    console.log("container resized!", contentBoxSize);
}

function resized2(borderBoxSize: BoxSize, contentBoxSize: BoxSize, target: Element) {
    console.log("content resized!", borderBoxSize);
}

</script>

<style scoped>
#editor-container {
    pointer-events: none;
    position: fixed;
    inset: 14px;
    left: 14px;
    transition: left 0.2s ease-out;
}

.pointer-event {
    pointer-events: all;
}

#editor-container.opened {
    left: 200px;
    transition: left 0.2s ease-out;
}

#top-left-panel {
    position: absolute;
    top: 0px;
    left: 0px;
}

#top-panel {
    position: absolute;
    top: 0px;
    left: 300px;
    right: 300px;
}

#top-right-panel {
    position: absolute;
    top: 0px;
    right: 0px;
}

#left-panel {
    position: absolute;
    left: 0px;
    top: 100px;
    bottom: 100px;
}

#right-panel {
    position: absolute;
    right: 0px;
    top: 120px;
    bottom: 120px;
}
</style>