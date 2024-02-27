<template>
    <SunPanelTabsContainer :tabs="[
        { uid: 'outliner', label: '大纲', icon: 'ListTree' },
        { uid: 'component', label: '组件', icon: 'Component' },
    ]" initial-selected="outliner">
        <template #default="{ tab }">
            <SunPanel v-show="tab === 'outliner'" container vertical style="flex: 1;">

                <!-- <SunPanelFoldContainer label="场景">
                    <SunPanelContainer vertical>
                        <SunButton v-for="i in 10" flat><SunButtonItem :label="`场景 ${i}`"/></SunButton>
                    </SunPanelContainer>
                </SunPanelFoldContainer>

                <SunPanelSeparator /> -->

                <SunPanelContainer gap style="flex-shrink: 0;">
                    <SunSwitch v-hover-menu:editor-outliner.no-hover="{ uid: 0, label: '测试', description: 'Test' }"
                        :model-value="true" size="normal" />
                    <SunButton v-hover-menu:editor-outliner.no-hover="{ uid: 0, label: '添加节点', description: '在场景中创建一个新节点' }"
                        squared>
                        <Plus />
                    </SunButton>
                    <SunButton v-hover-menu:editor-outliner.no-hover="{ uid: 0, label: '删除节点' }" squared>
                        <Trash />
                    </SunButton>
                    <SunLineEdit v-hover-menu:editor-outliner.no-hover="{ uid: 0, label: '查找节点' }" style="flex: 1;"
                        :model-value="''" placeholder="查找" />
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
            <SunPanel v-show="tab === 'component'" container vertical style="flex: 1;">
                <SunPanelContainer>
                    <SunColorPicker v-model.lazy="color" squared></SunColorPicker>
                </SunPanelContainer>
            </SunPanel>
        </template>
    </SunPanelTabsContainer>
</template>

<script setup lang="ts">

import SunPanelTabsContainer from '@/sundesign/panel/SunPanelTabsContainer.vue';
import SunPanel from '@/sundesign/panel/SunPanel.vue';
import SunSwitch from '@/sundesign/checkbox/SunSwitch.vue';
import SunScrollContainer from '@/sundesign/scrollcontainer/SunScrollContainer.vue';
import SunPanelSeparator from '@/sundesign/panel/SunPanelSeparator.vue';
import SunPanelContainer from '@/sundesign/panel/SunPanelContainer.vue';
import SunLineEdit from '@/sundesign/lineedit/SunLineEdit.vue';
import SunSelect from '@/sundesign/select/SunSelect.vue';
import SunButton from '@/sundesign/button/SunButton.vue';
import { Plus, Trash } from 'lucide-vue-next';
import SunTree from '@/sundesign/tree/SunTree.vue';
import type { SunTreeOptions } from '@/sundesign/tree/SunTreeConstants';
import { fspath } from '@/system/filesystem/FileSystemPath';
import { VFSTreeOptionsRef } from '@/system/filesystem/FileSystemTreeOptionsRef';
import SunColorPicker from '@/sundesign/colorpicker/SunColorPicker.vue';
import { vHoverMenu } from '@/sundesign/hovermenu/SunHoverMenu';
import type { ColorData } from '@/sundesign/colorpicker/SunColorPickerConstants';
import { ref } from 'vue';

const fs_options = VFSTreeOptionsRef.watch(fspath('/'), false) as SunTreeOptions;
const color = ref<ColorData>([1, 0, 0, 1]);

</script>

<style lang="stylus">

</style>