<template>
    <SunPanelTabsContainer :tabs="[
        { uid: 'outliner', label: '大纲', icon: 'ListTree' },
        { uid: 'component', label: '组件', icon: 'Component' },
    ]" initial-selected="outliner">
        <!-- <template #append>
            <SunButton size="small" squared><X/></SunButton>
        </template> -->
        <template #default="{ tab }">
            <SunPanel v-show="tab === 'outliner'" container vertical style="flex: 1;">

                <!-- <SunPanelFoldContainer label="场景">
                    <SunPanelContainer vertical>
                        <SunButton v-for="i in 10" flat><SunButtonItem :label="`场景 ${i}`"/></SunButton>
                    </SunPanelContainer>
                </SunPanelFoldContainer>

                <SunPanelSeparator /> -->

                <SunPanelContainer gap style="flex-shrink: 0;">
                    <SunSwitch :model-value="true" size="normal" />
                    <SunButton squared>
                        <Plus />
                    </SunButton>
                    <SunLineEdit style="flex: 1;" :model-value="''" placeholder="查找" />
                    <SunSelect :prefered-direction="1" icon-only selected-icon squared :model-value="2" :options="[[
                        { uid: 0, label: '文件名顺序', icon: 'ArrowDownAZ' },
                        { uid: 1, label: '文件名逆序', icon: 'ArrowUpZA' },
                        { uid: 2, label: '类型', icon: 'ArrowDownWideNarrow' },
                    ]]">
                    </SunSelect>
                </SunPanelContainer>

                <SunPanelSeparator />

                <SunScrollContainer content-style="width: 100%;">
                    <SunPanelContainer vertical>
                        <SunTree ref="tree_ref" uid="outliner-tree" :options="fs_options" :click-folding="false"
                            :allow-drag-reorder="false">
                            <template #append>
                                U
                            </template>
                        </SunTree>
                    </SunPanelContainer>
                </SunScrollContainer>

            </SunPanel>
        </template>
    </SunPanelTabsContainer>
</template>

<script setup lang="ts">

import SunPanelTabsContainer from '@/sundesign/panel/SunPanelTabsContainer.vue';
import SunPanel from '@/sundesign/panel/SunPanel.vue';
import SunSwitch from '@/sundesign/checkbox/SunSwitch.vue';
import SunPanelFoldContainer from '@/sundesign/panel/SunPanelFoldContainer.vue';
import SunScrollContainer from '@/sundesign/scrollcontainer/SunScrollContainer.vue';
import SunPanelSeparator from '@/sundesign/panel/SunPanelSeparator.vue';
import SunPanelContainer from '@/sundesign/panel/SunPanelContainer.vue';
import SunLineEdit from '@/sundesign/lineedit/SunLineEdit.vue';
import SunSelect from '@/sundesign/select/SunSelect.vue';
import SunButton from '@/sundesign/button/SunButton.vue';
import SunIcon from '@/sundesign/icon/SunIcon.vue';
import { Plus, Eye, Lock, X } from 'lucide-vue-next';
import SunTree from '@/sundesign/tree/SunTree.vue';
import type { SunTreeOptions } from '@/sundesign/tree/SunTreeConstants';
import { fspath } from '@/system/filesystem/FileSystemPath';
import { VFSTreeOptionsRef } from '@/system/filesystem/FileSystemTreeOptionsRef';
import SunButtonLike from '@/sundesign/button/SunButtonLike.vue';
import SunControlGroup from '@/sundesign/controlgroup/SunControlGroup.vue';
import SunControlGroupRow from '@/sundesign/controlgroup/SunControlGroupRow.vue';

const fs_options = VFSTreeOptionsRef.watch(fspath('/'), false) as SunTreeOptions;

</script>

<style lang="stylus">

</style>