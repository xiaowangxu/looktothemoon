<template>
    <SFlow>
        <SunPanel style="pointer-events: all;">
            <SunPanelContainer>
                <SunButtonMenuPopup ref="sys_option_ref" :options="system_options" squared flat @opened="onOpen(0)"
                    @closed="onClose(0)">
                    <MoonStar />
                </SunButtonMenuPopup>
                <SunButtonMenuPopup ref="file_option_ref" :options="options" flat @opened="onOpen(1)" @closed="onClose(1)">
                    文件
                </SunButtonMenuPopup>
                <SunButtonMenuPopup ref="edit_option_ref" :options="edit_options" flat @opened="onOpen(2)"
                    @closed="onClose(2)">编辑
                </SunButtonMenuPopup>
                <SunButtonMenuPopup ref="view_option_ref" :options="options" flat @opened="onOpen(3)" @closed="onClose(3)">
                    视图
                </SunButtonMenuPopup>
            </SunPanelContainer>
        </SunPanel>
        <SunPanel style="pointer-events: all;" size="small">
            <SunPanelContainer>
                <SunButton size="small" flat squared>
                    <Save />
                </SunButton>
            </SunPanelContainer>
            <SunPanelSeparator />
            <SunPanelContainer>
                <SunButton size="small" flat squared>
                    <Undo2 />
                </SunButton>
                <SunButton size="small" flat squared>
                    <Redo2 />
                </SunButton>
            </SunPanelContainer>
        </SunPanel>
    </SFlow>
</template>

<script setup lang="ts">

import SunButtonMenuPopup from '@/sundesign/buttonpopup/SunButtonMenuPopup.vue';
import SunPanel from '@/sundesign/panel/SunPanel.vue';
import SunPanelContainer from '@/sundesign/panel/SunPanelContainer.vue';
import SunPanelSeparator from '@/sundesign/panel/SunPanelSeparator.vue';
import SunButton from '@/sundesign/button/SunButton.vue';
import SFlow from '@/components/SFlow.vue';
import { Undo2, Redo2, Save, MoonStar } from 'lucide-vue-next';
import { ColorSchemeRed } from '@/sundesign/SunDesignConstants';
import { onBeforeMount, onBeforeUnmount, ref } from 'vue';

const sys_option_ref = ref<InstanceType<typeof SunButtonMenuPopup> | undefined>();
const file_option_ref = ref<InstanceType<typeof SunButtonMenuPopup> | undefined>();
const edit_option_ref = ref<InstanceType<typeof SunButtonMenuPopup> | undefined>();
const view_option_ref = ref<InstanceType<typeof SunButtonMenuPopup> | undefined>();
const menu_list = [sys_option_ref, file_option_ref, edit_option_ref, view_option_ref];

const system_options = ref([
    [
        { label: '欢迎', icon: 'PartyPopper', uid: 'welcome' },
        { label: '命令行工具', icon: 'ChevronRightSquare', uid: 'console', shortcut: 'Ctrl P' },
    ],
    [
        { label: '检查更新', icon: 'Import', uid: 'upgrade' },
        { label: '偏好设置', icon: 'UserCog', uid: 'preference' },
    ],
    [
        { label: '关于', icon: 'Info', uid: 'about' },
        { label: '查看许可证', icon: '', uid: 'license' },
    ],
]);
const edit_options = ref([
    [
        { label: '撤销', icon: 'Undo2', uid: 'undo', shortcut: 'Ctrl Z' },
        { label: '重做', icon: 'Redo2', uid: 'redo', shortcut: 'Ctrl Y' },
    ]
]);
const options = ref([
    [
        {
            uid: 'Profile',
            label: '账户',
            icon: 'User',
            shortcut: 'Ctrl Shift P'
        }, {
            uid: 'Billing',
            label: '钱包',
            icon: 'Wallet',
            shortcut: 'Ctrl B'
        }, {
            uid: 'Setting',
            label: '设置',
            icon: 'Settings',
            shortcut: 'Ctrl S'
        }, {
            uid: 'Keyboard shortcuts',
            label: '快捷键',
            icon: 'Keyboard',
            shortcut: 'Ctrl K'
        }
    ],
    [
        {
            uid: 'Team',
            label: '组织',
            icon: 'Users',
        }, {
            uid: 'Invite Users',
            label: '邀请新成员',
            icon: 'UserPlus',
            subs: [
                [{
                    uid: 'Email',
                    label: 'Email',
                    icon: 'Mail',
                }, {
                    uid: 'Message',
                    label: '信息',
                    icon: 'MessageSquare',
                }],
                [{
                    uid: 'More',
                    label: '更多',
                    icon: 'MoreHorizontal',
                }]
            ]
        }, {
            uid: 'New Team',
            label: '新建组织',
            icon: 'Plus',
            shortcut: 'Shift T'
        }
    ],
    [
        {
            uid: 'GitHub',
            label: 'GitHub',
            icon: 'Github',
        }, {
            uid: 'Support',
            label: '支持',
            icon: 'HelpCircle',
        }, {
            uid: 'API',
            label: 'API',
            icon: 'CloudCog',
            disabled: true,
        }
    ],
    [
        {
            uid: 'Log out',
            label: '登出',
            icon: 'LogOut',
            shortcut: 'Ctrl Shift Q',
            colorScheme: ColorSchemeRed,
        }
    ]
]);

let opened_menu_id: number | undefined = undefined;

function onOpen(id: number) {
    if (opened_menu_id === undefined) {
        opened_menu_id = id;
        window.addEventListener('mousemove', onMouseMove, { capture: true });
    }
}

function onClose(id: number) {
    if (opened_menu_id === id) {
        window.removeEventListener('mousemove', onMouseMove, { capture: true });
        opened_menu_id = undefined;
    }
}

onBeforeUnmount(() => {
    window.removeEventListener('mousemove', onMouseMove, { capture: true });
});

function onMouseMove(evt: MouseEvent) {
    if (opened_menu_id !== undefined) {
        let idx = 0;
        for (const i of menu_list) {
            if (idx === opened_menu_id) {
                idx++;
                continue;
            }
            if (i.value !== undefined && i.value.button?.button) {
                const { x, y, width, height } = i.value.button.button.getBoundingClientRect();
                if (x <= evt.clientX && evt.clientX <= x + width &&
                    y <= evt.clientY && evt.clientY <= y + height
                ) {
                    opened_menu_id = idx;
                    for (const j of menu_list) {
                        if (j === i) {
                            j.value?.toggle(true);
                        }
                        else {
                            j.value?.toggle(false);
                        }
                    }
                    return;
                }
            }
            idx++;
        }
    }
}

</script>