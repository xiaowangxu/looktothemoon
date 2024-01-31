import type { Meta, StoryObj } from '@storybook/vue3';

import SunButtonMenuPopup from '../../src/sundesign/buttonpopup/SunButtonMenuPopup.vue';
import SunButtonLike from '@/sundesign/button/SunButtonLike.vue';
import { Search, ChevronRight } from 'lucide-vue-next';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ColorSchemeRed } from '../../src/sundesign/SunDesignConstants';
import { ref, watch } from 'vue';

const meta: Meta<typeof SunButtonMenuPopup> = {
    component: SunButtonMenuPopup,
};

export default meta;
type Story = StoryObj<typeof SunButtonMenuPopup>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const ButtonMenuPopup: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunButtonMenuPopup },
        setup() {
            const value = ref(undefined);
            return { args, value };
        },
        template: `
			  <SunButtonMenuPopup v-bind="args"/>
		`,
    }),
    argTypes: {
        ...ArgsTypes,
    },
    args: {
        ...Args,
        squared: true,
        options: [
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
                    uid: 'test',
                    render: (props,) => {
                        return <>
                            <SunButtonLike flat noPressedColor hover={props.hovered} onMouseenter={(evt: Event) => props.hover(props.uid, undefined, evt.target!, undefined)}>
                                <Search />
                                <input class="__sun-design__" style="flex: 1; border: none; padding: 0; background-color: transparent; outline: none; width: 0px;" placeholder="查找" />
                            </SunButtonLike>
                        </>;
                    }
                },
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
        ]
    },
};