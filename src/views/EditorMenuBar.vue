<template>
    <div style="display: flex; align-items: flex-start; gap: 8px;">
        <SunPanel :trap-focus="false">
            <SunPanelContainer>
                <SunButtonMenuPopup ref="sys_option_ref" :options="system_options" squared flat>
                    <svg xmlns="http://www.w3.org/2000/svg" id="a" viewBox="7 7 34 34">
                        <rect fill="#404040" x="23.41" y="19.41" width="4" height="12" rx="2" ry="2"
                            transform="translate(-10.53 25.41) rotate(-45)" />
                        <rect fill="#68abdf" x="24.12" y="11.22" width="4" height="10" rx="2" ry="2"
                            transform="translate(-3.82 23.22) rotate(-45)" />
                        <rect fill="#99c47a" x="17.05" y="7.15" width="4" height="4" rx="2" ry="2"
                            transform="translate(-.89 16.15) rotate(-45)" />
                        <rect fill="#ffc66d" x="12.45" y="7.95" width="4" height="13" rx="2" ry="2"
                            transform="translate(-5.99 14.45) rotate(-45)" />
                        <rect fill="#ff6470" x="12.1" y="16" width="4" height="16" rx="2" ry="2"
                            transform="translate(-12.84 17) rotate(-45)" />
                        <rect fill="#404040" x="22.31" y="26.38" width="4" height="12" rx="2" ry="2"
                            transform="translate(6.5 68.74) rotate(-117)" />
                        <rect fill="#404040" x="28.6" y="29.58" width="4" height="12" rx="2" ry="2"
                            transform="translate(66.38 65.94) rotate(171)" />
                        <rect fill="#404040" x="33.58" y="24.6" width="4" height="12" rx="2" ry="2"
                            transform="translate(71.37 .24) rotate(99)" />
                        <rect fill="#404040" x="30.38" y="18.31" width="4" height="12" rx="2" ry="2"
                            transform="translate(14.57 -12.05) rotate(27)" />
                    </svg>
                </SunButtonMenuPopup>
            </SunPanelContainer>
            <SunPanelSeparator />
            <SunPanelContainer>
                <SunButtonMenuPopup ref="file_option_ref" :options="options" flat>文件</SunButtonMenuPopup>
                <SunButtonMenuPopup ref="edit_option_ref" :options="edit_options" flat>编辑</SunButtonMenuPopup>
                <SunButtonMenuPopup ref="view_option_ref" :options="options" flat>视图</SunButtonMenuPopup>
            </SunPanelContainer>
        </SunPanel>
        <SunPanel size="small" :trap-focus="false">
            <SunPanelContainer>
                <SunButton v-hover-menu:editor-undo-redo.no-hover="{ uid: 0, label: '保存', shortcut: 'Ctrl S' }" size="small" flat squared>
                    <Save />
                </SunButton>
            </SunPanelContainer>
            <SunPanelSeparator />
            <SunPanelContainer>
                <SunButton v-hover-menu:editor-undo-redo.no-hover="{ uid: 0, label: '撤销', shortcut: 'Ctrl Z' }"
                    size="small" flat squared>
                    <Undo2 />
                </SunButton>
                <SunButton v-hover-menu:editor-undo-redo.no-hover="{ uid: 0, label: '重做', shortcut: 'Ctrl Y' }"
                    size="small" flat squared>
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
import { Undo2, Redo2, Save } from 'lucide-vue-next';
import { vHoverMenu } from '@/sundesign/hovermenu/SunHoverMenu';
import { ref } from 'vue';

// const sys_option_ref = ref<InstanceType<typeof SunButtonMenuPopup> | undefined>();
// const file_option_ref = ref<InstanceType<typeof SunButtonMenuPopup> | undefined>();
// const edit_option_ref = ref<InstanceType<typeof SunButtonMenuPopup> | undefined>();
// const view_option_ref = ref<InstanceType<typeof SunButtonMenuPopup> | undefined>();

// const sys_option_opened = ref(false);
// const file_option_opened = ref(false);
// const edit_option_opened = ref(false);
// const view_option_opened = ref(false);

// const has_opened = computed(() => sys_option_opened.value || file_option_opened.value || edit_option_opened.value || view_option_opened.value);

// function toggle(target: InstanceType<typeof SunButtonMenuPopup> | undefined) {
//     if (!has_opened.value) return;
//     sys_option_ref.value?.toggle(sys_option_ref.value === target);
//     file_option_ref.value?.toggle(file_option_ref.value === target);
//     edit_option_ref.value?.toggle(edit_option_ref.value === target);
//     view_option_ref.value?.toggle(view_option_ref.value === target);
// }

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
        }
    ]
]);

</script>