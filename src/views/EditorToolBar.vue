<template>
    <!-- Inspector -->
    <SPanel style="pointer-events: all;">
        <SFlow vertical>
            <SButton icon-only icon-size="medium" flat :active="inspector_opened"
                @click="inspector_opened = !inspector_opened">
                <PanelLeftInactive />
            </SButton>
            <Teleport to="#popup">
                <div v-show="inspector_opened"
                    style="position: fixed; left: 70px; width: 230px; top: 100px; bottom: 100px;">
                    <SFlow vertical style="width: 100%; height: 100%;">
                        <SPanel style="width: 100%;">
                            <SFlow>
                                <SButton icon-only @click="inspector_opened = false">
                                    <ChevronLeft />
                                </SButton>
                                <SLineEdit placeholder="查找" style="flex: 1; min-width: 0px;"></SLineEdit>
                                <SPopupMenuButton icon-only :flat="false" :min-width="100" allow-shift-up
                                    @click="on_InspectorOptionItemClick">
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
                        </SPanel>
                        <SPanel style="padding: 0; flex: 1; width: 100%; overflow: hidden;">
                            <SScrollContainer scroll-bar-state-h="hidden" scroll-bar-state-v="hidden" width="100%">
                                <SFlow vertical padding="var(--GapAndMargin)" style="width: 100%;">
                                    <SFlow style="width: 100%;">
                                        <SButton style="flex: 1;" flat>
                                            <EyeOff />1234
                                        </SButton>
                                        <SButton icon-only flat>
                                            <Eye />
                                        </SButton>
                                    </SFlow>
                                    <SFlow style="width: 100%;">
                                        <SButton style="flex: 1;" flat>
                                            <EyeOff />1234
                                        </SButton>
                                        <SButton icon-only flat>
                                            <Eye />
                                        </SButton>
                                    </SFlow>
                                </SFlow>
                            </SScrollContainer>
                        </SPanel>
                    </SFlow>
                </div>
            </Teleport>
        </SFlow>
    </SPanel>
    <!-- Tools -->
    <SPanel style="overflow: hidden; padding: 0; pointer-events: all;">
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
</template>

<script setup lang="ts">

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

const inspector_opened = ref(false);

function on_InspectorOptionItemClick(key: string) {
    switch (key) {
    }
}

</script>