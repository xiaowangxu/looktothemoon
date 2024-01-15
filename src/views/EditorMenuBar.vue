<template>
    <SFlow>
        <SPanel style="pointer-events: all;">
            <SFlow gap="0">
                <SPopupMenuButton ref="smenu_file_ref" @mouseenter="on_MenuButtonMouseEntered('file')"
                    @opened="on_MenuOpened('file')" @closed="on_MenuClosed('file')">
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
                <SPopupMenuButton ref="smenu_edit_ref" @mouseenter="on_MenuButtonMouseEntered('edit')"
                    @opened="on_MenuOpened('edit')" @closed="on_MenuClosed('edit')">
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
                        <SSelect style="min-width: 100px; max-width: 100px;">
                            <SItem label="0">
                                <SLabel min-size="unset" color="inherit" width="100%" align-h="center">G0</SLabel>
                            </SItem>
                            <SItem label="1">
                                <SLabel min-size="unset" color="inherit" width="100%" align-h="center">G1</SLabel>
                            </SItem>
                            <SItem label="2">
                                <SLabel min-size="unset" color="inherit" width="100%" align-h="center">G2</SLabel>
                            </SItem>
                        </SSelect>
                    </template>
                </SPopupMenuButton>
                <!-- <SPopupMenuButton ref="smenu_select_ref" @mouseenter="on_MenuButtonMouseEntered('select')"
                    @opened="on_MenuOpened('select')" @closed="on_MenuClosed('select')">
                    <template #button>
                        选择
                    </template>
                    <template #items>
                        <SItem label="取消选择" disabled />
                    </template>
                </SPopupMenuButton> -->
                <SPopupMenuButton ref="smenu_view_ref" @mouseenter="on_MenuButtonMouseEntered('view')"
                    @opened="on_MenuOpened('view')" @closed="on_MenuClosed('view')" @click="on_ViewMenuClicked">
                    <template #button>
                        视图
                    </template>
                    <template #items="{ open, close, triggerSubItemHide }">
                        <SItem label="前视图" description="Num 1" />
                        <SItem label="左视图" description="Num 2" />
                        <SItem label="顶视图" description="Num 3" />
                        <SItem label="更多...">
                            <template #subitems>
                                <SItem label="后视图" />
                                <SItem label="右视图" />
                                <SItem label="底视图" />
                            </template>
                        </SItem>
                        <SVSeparator />
                        <SItem label="75%" uid="75%" />
                        <SItem label="100%" uid="100%" />
                        <SItem label="150%" uid="150%" />
                        <SItem label="200%" uid="200%" />
                        <SActiveArea style="width: 100%; padding: 0 0 0 var(--NormalAdditionalPaddingSize);"
                            @mouseenter="triggerSubItemHide()">
                            <SLabel min-size="normal">自定义</SLabel>
                            <SNumberEdit lazy v-model:value="zoom" @update:value="close()" :precision-digits="0"
                                align-text="start" suffix="%" />
                        </SActiveArea>
                        <SVSeparator />
                        <SItem label="透视" uid="persp">
                            <template #icon>
                                <SFakeRadioBox :value="!camera_type" style="margin-left: 0;" />
                            </template>
                        </SItem>
                        <SItem label="正交" uid="orth">
                            <template #icon>
                                <SFakeRadioBox :value="camera_type" style="margin-left: 0;" />
                            </template>
                        </SItem>
                        <SVSeparator />
                        <SItem label="视图配置">
                            <template #icon>
                                <Cog />
                            </template>
                            <template #subitems>
                                <SItem label="网格">
                                    <template #icon>
                                        <SFakeCheckBox value style="margin-left: 0;" />
                                    </template>
                                </SItem>
                            </template>
                        </SItem>
                    </template>
                </SPopupMenuButton>
            </SFlow>
        </SPanel>
        <SPanel style="pointer-events: all;">
            <SFlow>
                <SButton icon-only flat icon-size="small">
                    <Undo2 />
                </SButton>
                <SButton icon-only flat icon-size="small">
                    <Redo2 />
                </SButton>
            </SFlow>
        </SPanel>
    </SFlow>
</template>

<script setup lang="ts">

import SSelect from '@/components/SSelect';
import SFlow from '@/components/SFlow.vue';
import SButton from '@/components/SButton.vue';
import SPanel from '@/components/SPanel.vue';
import SItem from '@/components/SItem.vue';
import SPopupMenuButton from '@/components/SPopupMenuButton';
import SVSeparator from '@/components/SVSeparator.vue';
import SFakeCheckBox from '@/components/SFakeCheckBox.vue';
import SFakeRadioBox from '@/components/SFakeRadioBox.vue';
import { Cog, Undo2, Redo2 } from 'lucide-vue-next';
import { ref, watch } from 'vue';
import SNumberEdit from '@/components/SNumberEdit.vue';
import SActiveArea from '@/components/SActiveArea.vue';
import SLabel from '@/components/typography/SLabel.vue';

import { signal } from '../app/EditorScene';

// datas
type MenuLabel = 'file' | 'edit' | 'select' | 'view';
const smenu_file_ref = ref<InstanceType<typeof SPopupMenuButton> | null>(null);
const smenu_edit_ref = ref<InstanceType<typeof SPopupMenuButton> | null>(null);
const smenu_select_ref = ref<InstanceType<typeof SPopupMenuButton> | null>(null);
const smenu_view_ref = ref<InstanceType<typeof SPopupMenuButton> | null>(null);
const opened_label = ref<MenuLabel | undefined>(undefined);
watch(opened_label, (new_label) => {
    if (new_label === undefined) return;
    switch (new_label) {
        case 'file': {
            (smenu_file_ref.value as any)?.open();
            (smenu_edit_ref.value as any)?.close();
            (smenu_select_ref.value as any)?.close();
            (smenu_view_ref.value as any)?.close();
            (smenu_file_ref.value as any)?.focus();
            return;
        }
        case 'edit': {
            (smenu_file_ref.value as any)?.close();
            (smenu_edit_ref.value as any)?.open();
            (smenu_select_ref.value as any)?.close();
            (smenu_view_ref.value as any)?.close();
            (smenu_edit_ref.value as any)?.focus();
            return;
        }
        case 'select': {
            (smenu_file_ref.value as any)?.close();
            (smenu_edit_ref.value as any)?.close();
            (smenu_select_ref.value as any)?.open();
            (smenu_view_ref.value as any)?.close();
            (smenu_select_ref.value as any)?.focus();
            return;
        }
        case 'view': {
            (smenu_file_ref.value as any)?.close();
            (smenu_edit_ref.value as any)?.close();
            (smenu_select_ref.value as any)?.close();
            (smenu_view_ref.value as any)?.open();
            (smenu_view_ref.value as any)?.focus();
            return;
        }
    }
});

// methods
function on_MenuOpened(label: MenuLabel) {
    if (opened_label.value === undefined) {
        opened_label.value = label;
    }
}
function on_MenuClosed(label: MenuLabel) {
    if (opened_label.value === label) {
        opened_label.value = undefined;
    }
}
function on_MenuButtonMouseEntered(label: MenuLabel) {
    if (opened_label.value !== undefined) {
        opened_label.value = label;
    }
}

// editor datas
const camera_type = ref<boolean>(false);
const zoom = ref<number>(100);

// methods
function on_ViewMenuClicked(label: any) {
    console.log(label);
    if (label === 'persp') {
        camera_type.value = false;
    }
    else if (label === 'orth') {
        camera_type.value = true;
    }
    signal.trigger(label);
}

</script>