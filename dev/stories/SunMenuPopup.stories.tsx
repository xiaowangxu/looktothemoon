import type { Meta, StoryObj } from '@storybook/vue3';

import SunMenuPopup from '../../src/sundesign/menupopup/SunMenuPopup.vue';
import SunButton from '@/sundesign/button/SunButton.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ColorSchemeBlue, ColorSchemeGreen, ColorSchemeRed, calcButtonPopupRect, type UID } from '@/sundesign/SunDesignConstants';
import { ref } from 'vue';
import SunButtonLike from '@/sundesign/button/SunButtonLike.vue';
import SunLineEdit from '@/sundesign/lineedit/SunLineEdit.vue';
import { Search, X } from 'lucide-vue-next';

const meta: Meta<typeof SunMenuPopup> = {
  component: SunMenuPopup,
};

export default meta;
type Story = StoryObj<typeof SunMenuPopup>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const MenuPopup: Story = {
  decorators: Decorators,
  tags: ['autodocs'],
  render: (args) => ({
    components: { SunMenuPopup, SunButton },
    setup() {
      const opened = ref(false);
      function onOpenClick() {
        opened.value = true;
      }
      function onClickOutside() {
        opened.value = false;
      }
      function onClick(data: any, hasSubMenu: boolean, evt: Event) {
        console.log(data, evt);
        if (!hasSubMenu)
          onClickOutside();
      }
      return { args, opened, onClick, onOpenClick, onClickOutside };
    },
    template: `
			<SunButton @click="onOpenClick">打开MenuPopup</SunButton>
			<SunMenuPopup v-bind="args" :visible="opened" @click="onClick" @click-outside="onClickOutside"/>
		`,
  }),
  argTypes: {
    mode: {
      options: ['instance', 'visibility'],
      control: { type: 'radio' }
    }
  },
  args: {
    // ...Args,
    mode: 'instance',
    getPopupRect(contentMinSize, preferedDirection, windowSize) {
      return { rect: calcButtonPopupRect({ x: Math.random() * windowSize.width, y: Math.random() * windowSize.height, width: 0, height: 0 }, contentMinSize, windowSize, 0, 0) };
    },
    options: [
      [
        {
          uid: 123,
          render: (props, context) => {
            const button_ref = ref<HTMLInputElement | null>(null);
            return <>
              <SunButtonLike flat noPressedColor onMouseenter={(evt: MouseEvent) => props.hover(props.uid, [[
                {
                  label: '测试',
                  icon: 'Globe',
                  uid: 100,
                }
              ]], (evt.target as any as HTMLElement), button_ref.value ?? undefined)}>
                <Search />
                <input ref={button_ref} class="__sun-design__" style="flex: 1; border: none; padding: 0; background-color: transparent; outline: none; width: 0px;" placeholder="查找" />
                <SunButton size="small" squared><X /></SunButton>
              </SunButtonLike>
            </>
          }
        },
      ],
      [
        {
          label: '测试',
          icon: 'Globe',
          uid: 0,
        },

        {
          label: 'Test',
          icon: 'Cog',
          description: 'Test',
          uid: 1,
          subs: [
            [
              {
                label: '测试',
                icon: 'Globe',
                uid: 11,
              },
              {
                label: 'Test',
                icon: 'Cog',
                description: 'Test fegth5r5ft564d435tfred3f54',
                uid: 6,
                subs: [
                  [
                    {
                      label: '测试',
                      icon: 'Globe',
                      uid: 12,
                    },
                    {
                      label: 'Test',
                      icon: 'Cog',
                      description: 'Test fegth5r5ft564d435tfred3f54',
                      uid: 13,
                    },
                    {
                      label: 'Test',
                      icon: 'Trash',
                      uid: 14,
                      colorScheme: ColorSchemeRed,
                      shortcut: 'Ctrl B',
                    }
                  ],
                ]
              },
              {
                label: 'Test',
                icon: 'Trash',
                uid: 15,
                colorScheme: ColorSchemeRed,
                shortcut: 'Ctrl B',
              }
            ],
          ]
        }
      ],
      [
        {
          label: '测试',
          icon: 'Globe',
          disabled: true,
          uid: 2,
        },
        {
          label: 'Test',
          icon: 'Cog',
          description: 'Test',
          uid: 3,
          colorScheme: ColorSchemeRed,
        },
        {
          label: 'Test',
          icon: 'Trash',
          uid: 4,
          description: '有子菜单',
          subs: [
            [
              {
                label: 'A',
                icon: 'Globe',
                uid: 16,
                colorScheme: ColorSchemeGreen,
              },
              {
                label: 'B',
                icon: 'Cog',
                description: 'Test fegth5r5ft564d435tfred3f54',
                uid: 17,
              },
              {
                label: 'C',
                icon: 'Trash',
                uid: 18,
                shortcut: 'Ctrl B',
              }
            ],
          ]
        }
      ],
      [
        {
          label: '测试',
          icon: 'Globe',
          uid: 8,
        },
        {
          label: 'More',
          icon: 'MoreHorizontal',
          colorScheme: ColorSchemeGreen,
          active: true,
          uid: 9,
        },
        {
          label: 'Test',
          colorScheme: ColorSchemeBlue,
          icon: 'Trash',
          uid: 10,
          shortcut: 'del',
        }
      ],
    ],
  },
};