<template>
    <SunPanel style="width: 100%; height: 100%;" vertical>

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

        <SunPanelSeparator />

        <SunPanelResizeContainer style="widows: 100%; height: 100%;">
            <template #first>
                <SunPanel container vertical style="width: 100%; height: 100%;">
                    <SunScrollContainer content-style="width: 100%;">
                        <SunPanelContainer vertical style="width: 100%;">
                            <SunTree :options="fs_options" :filter-sort="(sort as any)" @click="onClick"
                                :click-folding="false" @contextmenu="$event.open()" @edit="onEdit">
                            </SunTree>
                        </SunPanelContainer>
                    </SunScrollContainer>
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

    </SunPanel>
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
import { X, AppWindow, Minimize, Maximize, Globe } from 'lucide-vue-next';
import type { TreeItem } from '@/sundesign/tree/SunTreeItem.vue';
import { fspath } from '@/system/filesystem/FileSystemPath';
import { VFSTreeOptionsRef, type FileSystemRefItem } from '@/system/filesystem/FileSystemReactive';
import { computed, ref, watch } from 'vue';
import { VFS, VfsMode, type VfsId } from '@/system/filesystem/VirtualFileSystem';
import { type BreadcrumbItem } from '../sundesign/breadcrumb/SunBreadcrumb.vue';
import { FileAccess } from '@/system/filesystem/FileAccess';

const root_options = VFSTreeOptionsRef.watch(fspath('/'));
const fs_options = computed(() => root_options.value === undefined ? [] : root_options.value.subs);
const nav_options = ref<BreadcrumbItem[]>([]);

watch(fs_options, () => {
    console.log('>>>>>>');
}, { deep: true });

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
    const p = VFS.abspath(vfsid as VfsId).expect();
    const file = new FileAccess(p, VfsMode.Read);
    if (file.is_opened) {
        const str = file.read_String();
        data.value = str ?? 'decode error';
    }
    else {
        data.value = 'open error';
    }
    file.close();
}

function onEdit(data: any, label: string) {
    const path = VFS.abspath(data as VfsId);
    if (path.succeed) {
        VFS.rename(path.expect(), label, true);
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