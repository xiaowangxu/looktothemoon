<template>
    <!-- Outliner -->
    <SPanel style="pointer-events: all;">
        <SFlow vertical>
            <SButton icon-only icon-size="medium" flat :active="outliner_opened"
                @click="outliner_opened = !outliner_opened">
                <PanelLeftInactive />
            </SButton>
            <Teleport to="#popup">
                <div v-show="outliner_opened" style="position: fixed; left: 70px; width: 220px; top: 100px; bottom: 100px;">
                    <SFlow vertical style="width: 100%; height: 100%;">
                        <!-- <SPanel style="width: 100%;">
                            <SFlow>
                                <SButton icon-only @click="outliner_opened = false">
                                    <ChevronLeft />
                                </SButton>
                                <SLineEdit placeholder="查找" style="flex: 1; min-width: 0px;"></SLineEdit>
                                <SPopupMenuButton icon-only :flat="false" :min-width="100" allow-shift-up
                                    @click="on_OutlinerOptionItemClick">
                                    <template #button>
                                        <MoreVertical />
                                    </template>
                                    <template #items>
                                        <SItem uid="sort_default" label="默认排序" icon="FakeRadioBoxActive" />
                                        <SItem uid="sort_name" label="按名称" icon="FakeRadioBox" />
                                        <SItem uid="sort_type" label="按类型" icon="FakeRadioBox" />
                                    </template>
                                </SPopupMenuButton>
                            </SFlow>
                        </SPanel> -->
                        <SPanel style="padding: 0; flex: 1; width: 100%; overflow: hidden;">
                            <SScrollContainer scroll-bar-state-h="hidden" scroll-bar-state-v="hidden" min-width="100%"
                                width="100%">
                                <SFlow vertical gap="0" padding="var(--GapAndMargin)" style="min-width: 100%;">
                                    <OutlinerItem name="道路段123r43rufrgfy43ugfyu4fbyu3tbfyrfdgeyfgtydfety3ft" icon="Puzzle"
                                        first />
                                    <OutlinerItem name="道路段2"
                                        :children="[{ name: '123', children: [{ name: '123道路段123r43rufrgfy43ugfyu4fbyu3tbfyrfdgeyfgtydfety3ft' }, { name: '456' }] }, { name: '456' }]" />
                                    <OutlinerItem name="道路段3" />
                                    <OutlinerItem name="道路段1" icon="Puzzle" />
                                    <OutlinerItem name="道路段2"
                                        :children="[{ name: '123', children: [{ name: '123' }, { name: '456' }] }, { name: '456' }]" />
                                    <OutlinerItem name="道路段3" last />
                                </SFlow>
                            </SScrollContainer>
                        </SPanel>
                    </SFlow>
                </div>
            </Teleport>
        </SFlow>
    </SPanel>
    <!-- Tools -->
    <SunPanel vertical style="overflow: hidden; pointer-events: all; height: 300px;" size="large">
        <SunPanelContainer vertical gap>
            <SunButton squared size="large">
                <Globe />
            </SunButton>
        </SunPanelContainer>
        <SunPanelSeparator />
        <SunPanelContainer vertical gap>
            <SunButton squared size="large">
                <Workflow />
            </SunButton>
            <SunButton squared size="large">
                <Globe />
            </SunButton>
            <SunButton squared size="large">
                <Search />
            </SunButton>
            <SunButton squared size="large">
                <Trash />
            </SunButton>
            <SunButton squared size="large">
                <Globe />
            </SunButton>
            <SunButton squared size="large">
                <Check />
            </SunButton>
        </SunPanelContainer>
    </SunPanel>
</template>

<script setup lang="ts">

import SunButton from '@/sundesign/button/SunButton.vue';
import SunPanel from '@/sundesign/panel/SunPanel.vue';
import SunPanelContainer from '@/sundesign/panel/SunPanelContainer.vue';
import SunPanelSeparator from '@/sundesign/panel/SunPanelSeparator.vue';

import SFlow from '@/components/SFlow.vue';
import SPanel from '@/components/SPanel.vue';
import SButton from '@/components/SButton.vue';
import SScrollContainer from '@/components/SScrollContainer.vue';
import SVSeparator from '@/components/SVSeparator.vue';
import { Check, Workflow, Globe, Search, Trash, PanelLeftInactive, ChevronLeft, Eye, EyeOff, MoreVertical } from 'lucide-vue-next';
import SLineEdit from '@/components/SLineEdit.vue';
import SItem from '@/components/SItem.vue';
import SPopupMenuButton from '@/components/SPopupMenuButton';
import { ref } from 'vue';
import OutlinerItem from '@/views/outliner/OutlinerItem.vue';

const outliner_opened = ref(false);

function on_OutlinerOptionItemClick(key: string) {
    switch (key) {
    }
}

</script>