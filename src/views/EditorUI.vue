<template>
    <div class="canvas-container" :class="{ opened: !folded }">
        <div class="top-left-panel">
            <SFlow>
                <SPanel class="pointer-event">
                    <SFlow gap="0">
                        <SPopupMenuButton>
                            <template #button>
                                文件
                            </template>
                            <template #items>
                                <SItem label="新建文件" />
                                <SVSeparator />
                                <SItem label="保存" description="Ctrl+S" />
                                <SItem label="另存为" />
                                <SVSeparator />
                                <SItem label="退出" color="var(--ColorRed)" />
                            </template>
                        </SPopupMenuButton>
                        <SPopupMenuButton>
                            <template #button>
                                编辑
                            </template>
                            <template #items>
                                <SItem label="撤销" description="Ctrl+Z" disabled>
                                    <template #icon>
                                        <Undo2 />
                                    </template>
                                </SItem>
                                <SItem label="恢复" description="Ctrl+Y">
                                    <template #icon>
                                        <Redo2 />
                                    </template>
                                </SItem>
                                <SVSeparator />
                                <SItem label="剪切" description="Ctrl+X" />
                                <SItem label="复制" description="Ctrl+C" />
                                <SItem label="粘贴" description="Ctrl+V" />
                            </template>
                        </SPopupMenuButton>
                        <SPopupMenuButton>
                            <template #button>
                                选择
                            </template>
                            <template #items>
                                <SItem label="取消选择" disabled />
                            </template>
                        </SPopupMenuButton>
                        <SPopupMenuButton>
                            <template #button>
                                视图
                            </template>
                            <template #items>
                                <SItem label="顶视图" />
                                <SItem label="底视图" />
                                <SItem label="左视图" />
                                <SItem label="右视图" />
                                <SItem label="前视图" />
                                <SItem label="后视图" />
                                <SVSeparator />
                                <SItem label="透视" active />
                                <SItem label="正交" />
                                <SVSeparator />
                                <SItem label="视图配置">
                                    <template #icon>
                                        <Cog />
                                    </template>
                                    <template #subitems>
                                        <SItem label="网格" />
                                    </template>
                                </SItem>
                            </template>
                        </SPopupMenuButton>
                    </SFlow>
                </SPanel>
            </SFlow>
        </div>
        <div class="top-panel">
            <SFlow align-h="center" align-v="start" style="width: 100%; height: 100%;">
                <SPanel class="pointer-event" style="overflow: hidden; padding: 0px;">
                    <SScrollContainer scroll-bar-state-h="hidden" scroll-bar-state-v="hidden">
                        <SFlow padding="var(--GapAndMargin)">
                            <SLineEdit :clearable="false" :align-text="align" v-model:value="lineedit" lazy />
                            <SLineEdit :clearable="false" :align-text="align" value="lineeditq23" disabled lazy
                                text-color="red" />
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
                                    <SItem label="0">
                                        <SLabel min-size="unset" color="inherit">这些是选项
                                        </SLabel>
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
                </SPanel>
            </SFlow>
        </div>
        <div class="top-right-panel">
            <SFlow align-h="end">
                <SPanel class="pointer-event" style="width: 80px; height: 80px; border-radius: 50%;">
                </SPanel>
            </SFlow>
        </div>
        <div class="left-panel">
            <SFlow vertical align-h="start" align-v="center" style="width: 100%; height: 100%;">
                <SPanel class="pointer-event">
                    <SFlow vertical>
                        <SButton icon-only icon-size="medium" flat :active="!folded" @click="folded = !folded;">
                            <PanelLeftInactive />
                        </SButton>
                    </SFlow>
                </SPanel>
                <SPanel class="pointer-event">
                    <SFlow vertical>
                        <SButton icon-only icon-size="medium" flat>
                            <Search />
                        </SButton>
                    </SFlow>
                </SPanel>
                <SPanel class="pointer-event" style="overflow: hidden; padding: 0;">
                    <SScrollContainer scroll-bar-state-h="hidden" scroll-bar-state-v="hidden">
                        <SFlow padding="var(--GapAndMargin)" vertical>
                            <SButton icon-only icon-size="medium">
                                <Globe />
                            </SButton>
                            <SVSeparator />
                            <SButton icon-only icon-size="medium">
                                <Workflow />
                            </SButton>
                            <SButton icon-only icon-size="medium">
                                <Globe />
                            </SButton>
                            <SButton icon-only icon-size="medium">
                                <Search />
                            </SButton>
                            <SButton icon-only icon-size="medium">
                                <Trash />
                            </SButton>
                            <SButton icon-only icon-size="medium">
                                <Globe />
                            </SButton>
                            <SButton icon-only icon-size="medium">
                                <Check />
                            </SButton>
                        </SFlow>
                    </SScrollContainer>
                </SPanel>
            </SFlow>
        </div>
        <div class="right-panel">
            <SFlow vertical align-h="start" align-v="center" style="width: 100%; height: 100%;">
                <SPanel class="pointer-event" style="overflow: hidden; width: 300px; height: 100%; padding: 0px;">
                    <SScrollContainer>
                        <div style="padding: var(--GapAndMargin);">
                            <STitle align-h="center">
                                <SSpan bold italic underline>Typography</SSpan> 排版组件
                            </STitle>
                            <SSubTitle color="var(--ColorRed)" align-h="end">
                                <SSpan bold>Sub Title</SSpan>
                            </SSubTitle>
                            <SParagraph>Lorem ipsum dolor sit amet consectetur adipisicing elit. Soluta facere eos
                                dolores, iusto similique ut optio <SSpan bold text-size="medium" color="var(--ColorGreen)">
                                    <X style="vertical-align: bottom;" />Hello
                                </SSpan>
                                possimus quisquam, unde fugiat magnam sequi id debitis voluptate
                                nobis excepturi aut distinctio consequuntur?
                            </SParagraph>
                            <SSubTitle>
                                <SSpan bold>Sub Title 2</SSpan>
                            </SSubTitle>
                            <SParagraph>Lorem ipsum dolor sit amet consectetur adipisicing elit. Soluta facere eos
                                dolores, iusto similique ut optio <SSpan bold text-size="medium" color="var(--ColorGreen)">
                                    <X style="vertical-align: bottom;" />Hello
                                </SSpan>
                                possimus quisquam, unde fugiat magnam sequi id debitis voluptate
                                nobis excepturi aut distinctio consequuntur?
                            </SParagraph>
                            <SFlow wrap>
                                <SButton icon-only icon-size="medium">
                                    <Globe />Normal
                                </SButton>
                                <SButton icon-only icon-size="medium" active>
                                    <Workflow />active
                                </SButton>
                                <SButton icon-only icon-size="medium" active disabled>
                                    <Globe />active disabled
                                </SButton>
                                <SButton icon-only icon-size="medium" flat>
                                    <Globe />flat
                                </SButton>
                                <SButton icon-only icon-size="medium" flat active>
                                    <Globe />flat active
                                </SButton>
                                <SButton icon-only icon-size="medium" flat active disabled>
                                    <Globe />flat active disabled
                                </SButton>
                                <SButton icon-only icon-size="medium" flat disabled>
                                    <Globe />flat disabled
                                </SButton>
                                <SButton icon-only icon-size="medium" disabled>
                                    <Globe />disabled
                                </SButton>
                                <SButton icon-only icon-size="medium">
                                    <Globe />
                                </SButton>
                            </SFlow>
                        </div>
                    </SScrollContainer>
                </SPanel>
            </SFlow>
        </div>

        <SPopupMenu open :get-popup-rect="(c, w) => { return { x: 200, y: 600, ...c }; }">
            <SItem label="删除" description="Delete" color="var(--ColorRed)">
                <template #icon>
                    <Trash />
                </template>
            </SItem>
            <SItem label="2">
                <Redo2 />
                <SLabel min-size="unset" color="inherit">更多...</SLabel>
                <SLabel min-size="unset" color="var(--SColorActiveDisabled)" style="flex: 1;" align-h="end"></SLabel>
            </SItem>
            <SVSeparator />
            <SItem label="3">
                <template #icon>
                    <Globe />
                </template>
                <template #subitems>
                    <SItem label="4">
                        <template #subitems>
                            123
                        </template>
                    </SItem>
                    <SVSeparator />
                    <SItem label="5"></SItem>
                    <SItem label="6">
                        <template #icon>
                            <Globe />
                        </template>
                        <template #subitems>
                            <SItem label="7"></SItem>
                            <SVSeparator />
                            <SItem label="8">
                                <template #subitems>
                                    <SItem
                                        :label="'删除' + (!checkbox ? '?' : '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')"
                                        color="var(--ColorRed)">
                                        <template #icon>
                                            <Trash />
                                        </template>
                                    </SItem>
                                </template>
                            </SItem>
                        </template>
                    </SItem>
                </template>
            </SItem>
        </SPopupMenu>

    </div>
</template>

<script setup lang="ts">

import { type BasicTypes, type Alignment, type BoxSize } from '@/components/SConst';
import SPanel from '@/components/SPanel.vue';
import SButton from '@/components/SButton.vue';
import SLineEdit from '@/components/SLineEdit.vue';
import SNumberEdit from '@/components/SNumberEdit.vue';
import SCheckBox from '@/components/SCheckBox.vue';
import SRadioBox from '@/components/SRadioBox.vue';
import SFlow from '@/components/SFlow.vue';
import { Cog, Tangent, Radius, Dot, X, Check, Workflow, Globe, Search, Undo2, Redo2, PanelLeftInactive, Minus, Trash, ChevronRight, Baseline } from 'lucide-vue-next';
import { onMounted, ref, watch } from 'vue';
import SSpan from '@/components/Typography/SSpan.vue';
import SLabel from '@/components/Typography/SLabel.vue';
import STitle from '@/components/Typography/STitle.vue';
import SSubTitle from '@/components/Typography/SSubTitle.vue';
import SParagraph from '@/components/Typography/SParagraph.vue';
import SActiveArea from '@/components/SActiveArea.vue';
import SScrollContainer from '@/components/SScrollContainer.vue';
import SHSeparator from '@/components/SHSeparator.vue';
import SVSeparator from '@/components/SVSeparator.vue';
import SSelect from '@/components/SSelect';
import SItem from '@/components/SItem.vue';
import SPopupMenuButton from '@/components/SPopupMenuButton.tsx';
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
.canvas-container {
    pointer-events: none;
    position: fixed;
    inset: 14px;
    left: 14px;
    transition: left 0.2s ease-out;
}

.pointer-event {
    pointer-events: all;
}

.canvas-container.opened {
    left: 200px;
    transition: left 0.2s ease-out;
}

.top-left-panel {
    position: absolute;
    top: 0px;
    left: 0px;
}

.top-panel {
    position: absolute;
    top: 0px;
    left: 300px;
    right: 300px;
}

.top-right-panel {
    position: absolute;
    top: 0px;
    right: 0px;
}

.left-panel {
    position: absolute;
    left: 0px;
    top: 100px;
    bottom: 100px;
}

.right-panel {
    position: absolute;
    right: 0px;
    top: 120px;
    bottom: 120px;
}
</style>@/components/SSelect/SSelect