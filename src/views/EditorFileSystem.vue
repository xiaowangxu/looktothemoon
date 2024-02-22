<template>
    <!-- <SunPanel style="width: 100%; height: 100%;" vertical>

        <SunPanelContainer gap
            style="align-items: center; padding-right: 10px; background-color: var(--color-normal); flex-shrink: 0;"
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

        <SunPanelSeparator /> -->
        
    <SunPanelResizeContainer style="width: 100%; height: 100%;">
        <template #first>
            <SunPanel container vertical style="width: 100%; height: 100%;">
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
                <SunPanelFoldContainer unfold-style="flex: 1;" label="虚拟文件系统">
                    <template #append>
                        <SunButton size="small" flat squared @click="tree_ref?.toggle(true)">
                            <FoldVertical />
                        </SunButton>
                    </template>
                    <SunScrollContainer content-style="width: 100%;">
                        <SunPanelContainer vertical style="width: 100%;">
                            <!-- :indent="12" :leaf-indent="9" -->
                            <SunTree ref="tree_ref" uid="vfs-tree" :options="fs_options" :filter-sort="(sort as any)"
                                @click="onClick" :click-folding="false" :allow-drag-reorder="false" @edit="onEdit"
                                @drop="onDrop" @contextmenu="onContextMenu">
                            </SunTree>
                        </SunPanelContainer>
                    </SunScrollContainer>
                </SunPanelFoldContainer>
                <SunPanelSeparator />
                <!-- <SunPanelFoldContainer unfold-style="flex-basis: 100px; flex-grow: 0; flex-shrink: 1;">
                    </SunPanelFoldContainer> -->
            </SunPanel>
        </template>
        <template #second>
            <SunPanel container vertical style="height: 100%;">
                <SunScrollContainer style="width: 100%; height: unset;">
                    <SunPanelContainer>
                        <SunBreadcrumb :options="nav_options" :filter-sort="(sort as any)" />
                    </SunPanelContainer>
                </SunScrollContainer>
                <SunPanelSeparator />
                <SunScrollContainer style="width: 100%; flex: 1; height: 0;">
                    <SunPanelContainer>
                        <div style="white-space: pre; font-size: 12px; padding: 10px; font-family: 'fira code';"
                            v-text="data"></div>
                    </SunPanelContainer>
                </SunScrollContainer>
            </SunPanel>
        </template>
        <SunPanelSeparator />
    </SunPanelResizeContainer>

    <!-- </SunPanel> -->
</template>

<script setup lang="ts">

import SunPanel from '@/sundesign/panel/SunPanel.vue';
import SunLineEdit from '@/sundesign/lineedit/SunLineEdit.vue';
import SunPanelContainer from '@/sundesign/panel/SunPanelContainer.vue';
import SunPanelSeparator from '@/sundesign/panel/SunPanelSeparator.vue';
import SunPanelResizeContainer from '@/sundesign/panel/SunPanelResizeContainer.vue';
import SunTree from '@/sundesign/tree/SunTree.vue';
import SunBreadcrumb from '@/sundesign/breadcrumb/SunBreadcrumb.vue';
import SunScrollContainer from '@/sundesign/scrollcontainer/SunScrollContainer.vue';
import SunButtonLike from '@/sundesign/button/SunButtonLike.vue';
import SunButton from '@/sundesign/button/SunButton.vue';
import SunButtonLabel from '@/sundesign/button/SunButtonLabel.vue';
import { X, Maximize, Globe, FoldVertical } from 'lucide-vue-next';
import type { TreeItem } from '@/sundesign/tree/SunTreeItem.vue';
import { FileSystemPath, fspath } from '@/system/filesystem/FileSystemPath';
import { VFSTreeOptionsRef, type FileSystemRefItem } from '@/system/filesystem/FileSystemTreeOptionsRef';
import { nextTick, ref, watch } from 'vue';
import { VFS, VfsMode, type VfsId } from '@/system/filesystem/VirtualFileSystem';
import { type BreadcrumbItem } from '../sundesign/breadcrumb/SunBreadcrumb.vue';
import { FileAccess } from '@/system/filesystem/FileAccess';
import { SunTreeDroppable, type SunTreeOptions } from '@/sundesign/tree/SunTreeConstants';
import type { UID } from '@/sundesign/SunDesignConstants';
import SunContextMenu from '@/sundesign/contextmenu/SunContextMenu';
import SunSelect from '@/sundesign/select/SunSelect.vue';
import SunButtonItem from '@/sundesign/item/SunButtonItem.vue';
import SunPanelFoldContainer from '@/sundesign/panel/SunPanelFoldContainer.vue';

const props = defineProps<{
    root?: string,
    containRoot?: boolean,
}>();

const tree_ref = ref<InstanceType<typeof SunTree> | undefined>();
const fs_options = VFSTreeOptionsRef.watch(fspath(props.root ?? '/'), props.containRoot ?? false) as SunTreeOptions;
const nav_options = ref<BreadcrumbItem[]>([]);

function sort(options: FileSystemRefItem[]) {
    return [...options].sort((a, b) => {
        const _a = (a.label ?? '').toLocaleLowerCase(), _b = (b.label ?? '').toLocaleLowerCase();
        if (_a < _b) return -1;
        if (_a > _b) return 1;
        return 0;
    }) as TreeItem[];
}

const data = ref('');
function onClick(vfsid: any, evt: Event) {
    nav_options.value = VFSTreeOptionsRef.get_Breadcrumb(vfsid as VfsId);
    // const p = VFS.abspath(vfsid as VfsId).expect();
    // const file = new FileAccess(p, VfsMode.Read);
    // if (file.is_opened) {
    //     const str = file.read_String();
    //     data.value = str ?? 'decode error';
    // }
    // else {
    //     data.value = 'open error';
    // }
    // file.close();
}

function onContextMenu(data: UID, evt: Event) {
    evt.preventDefault();
    const p = VFS.abspath(data as VfsId).expect();
    if (!p.is_valid) return;
    const is_folder = VFS.is_Directory(p);
    new SunContextMenu([
        [
            {
                label: '新建文件夹',
                uid: 'new_folder',
                icon: 'Folder',
            }
        ],
        [
            {
                label: '重命名...',
                uid: 'rename',
                icon: 'TextCursorInput',
            },
            {
                label: '删除',
                uid: 'delete',
                icon: 'Trash',
            }
        ]
    ], evt as MouseEvent).signal_click.connect(async (action) => {
        switch (action) {
            case 'new_folder': {
                const vfsid = VFS.touch(FileSystemPath.merge(p, fspath('./新建文件夹'))).expect();
                console.log('touch', vfsid);
                setTimeout(() => {
                    // await nextTick();
                    tree_ref.value?.toggleOption(vfsid, false);
                    console.log('toggle', vfsid);
                    // await nextTick();
                    tree_ref.value?.edit(vfsid);
                    console.log('rename', vfsid);
                }, 0);
                break;
            }
            case 'rename': {
                tree_ref.value?.edit(data);
                break;
            }
            case 'delete': {
                VFS.remove(p);
            }
        }
    });
}

function onEdit(data: UID, label: string) {
    const path = VFS.abspath(data as VfsId);
    if (path.succeed) {
        VFS.rename(path.expect(), label, true);
    }
}

function onDrop(drag: UID | UID[], drop: UID, mode: SunTreeDroppable) {
    if (mode === SunTreeDroppable.In) {
        const srcs = drag instanceof Array ? drag : [drag];
        const p_dst = VFS.abspath(drop as VfsId).expect();
        for (const src of srcs) {
            const p_src = VFS.abspath(src as VfsId).expect();
            VFS.move(p_src, p_dst);
        }
    }
}

// emits
const emits = defineEmits<{
    (event: 'drag', evt: MouseEvent): void,
    (event: 'maximize', toggle: boolean): void,
}>();

function onDragMouseDown(evt: MouseEvent) {
    emits('drag', evt);
}

</script>

<style></style>