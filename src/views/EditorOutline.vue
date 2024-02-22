<template>
    <SunPanelTabsContainer :tabs="[
        { uid: 'outliner', label: '大纲', icon: 'ListTree' },
        { uid: 'component', label: '组件', icon: 'Component' },
    ]" initial-selected="outliner">
        <template #default="{ tab }">
            <SunPanel v-show="tab === 'outliner'" container vertical style="flex: 1;">
                <SunPanelContainer gap>
                    <SunLineEdit style="flex: 1;" :model-value="'test'" />
                    <SunSelect :prefered-direction="1" icon-only selected-icon squared :model-value="2" :options="[[
                        { uid: 0, label: '文件名顺序', icon: 'ArrowDownAZ' },
                        { uid: 1, label: '文件名逆序', icon: 'ArrowUpZA' },
                        { uid: 2, label: '类型', icon: 'ArrowDownWideNarrow' },
                    ]]">
                    </SunSelect>
                </SunPanelContainer>
                <SunPanelSeparator />
                <SunPanelContainer>

                </SunPanelContainer>
            </SunPanel>
        </template>
    </SunPanelTabsContainer>
</template>

<script setup lang="ts">

import SunPanelTabsContainer from '@/sundesign/panel/SunPanelTabsContainer.vue';
import SunPanel from '@/sundesign/panel/SunPanel.vue';
import SunPanelSeparator from '@/sundesign/panel/SunPanelSeparator.vue';
import SunPanelContainer from '@/sundesign/panel/SunPanelContainer.vue';
import SunLineEdit from '@/sundesign/lineedit/SunLineEdit.vue';
import SunSelect from '@/sundesign/select/SunSelect.vue';

</script>