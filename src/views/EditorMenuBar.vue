<template>
    <div style="display: flex; align-items: flex-start; gap: 8px; pointer-events: none;">
        <SunPanel>
            <SunPanelContainer>
                <SunButtonMenuPopup ref="sys_option_ref" :options="system_options" squared flat>
                    <MoonStar />
                </SunButtonMenuPopup>
                <SunButtonMenuPopup ref="file_option_ref" :options="options" flat>文件</SunButtonMenuPopup>
                <SunButtonMenuPopup ref="edit_option_ref" :options="edit_options" flat>编辑</SunButtonMenuPopup>
                <SunButtonMenuPopup ref="view_option_ref" :options="options" flat>视图</SunButtonMenuPopup>
            </SunPanelContainer>
        </SunPanel>
        <SunPanel size="small">
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
    </div>
</template>

<script setup lang="ts">

import SunButtonMenuPopup from '@/sundesign/buttonpopup/SunButtonMenuPopup.vue';
import SunPanel from '@/sundesign/panel/SunPanel.vue';
import SunPanelContainer from '@/sundesign/panel/SunPanelContainer.vue';
import SunPanelSeparator from '@/sundesign/panel/SunPanelSeparator.vue';
import SunButton from '@/sundesign/button/SunButton.vue';
import { Undo2, Redo2, Save, MoonStar } from 'lucide-vue-next';
import { ColorSchemeRed } from '@/sundesign/SunDesignConstants';
import { ref } from 'vue';

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

</script>