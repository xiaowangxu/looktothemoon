import type { Meta, StoryObj } from '@storybook/vue3';

import SunMenuPopup from '../../src/sundesign/menupopup/SunMenuPopup.vue';
import SunContextMenu from '../../src/sundesign/contextmenu/SunContextMenu';
import SunButton from '@/sundesign/button/SunButton.vue';
import SunButtonLike from '@/sundesign/button/SunButtonLike.vue';
import { Search, ChevronRight } from 'lucide-vue-next';

const meta: Meta = {
  component: SunMenuPopup,
};

export default meta;

type Story = StoryObj;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const ContextMenu: Story = {
  render: (args) => ({
    setup() {
      function onContextMenu0(evt: MouseEvent) {
        const contextmenu = new SunContextMenu([
          [
            { label: '剪切', uid: 'copy', icon: 'Scissors', shortcut: 'Ctrl X' },
            { label: '复制', uid: 'cut', icon: 'Copy', shortcut: 'Ctrl C' },
            { label: '粘贴', uid: 'paste', icon: 'Clipboard', shortcut: 'Ctrl V', disabled: true },
          ],
          [
            { label: '全选', uid: 'select-all', icon: 'TextCursorInput', shortcut: 'Ctrl A' },
          ]
        ], evt).await.then((a) => {
          console.log(a);
        });
      }
      function onContextMenu1(evt: MouseEvent) {
        const contextmenu = new SunContextMenu([
          [
            {
              label: '更多', uid: 'more', icon: 'MoreVertical',
              subs: [[
                { label: '剪切', uid: 'copy', icon: 'Scissors', shortcut: 'Ctrl X' },
                { label: '复制', uid: 'cut', icon: 'Copy', shortcut: 'Ctrl C' },
                { label: '粘贴qwertveuihyueghygrgrfygygyugrygrfyufgyug', uid: 'paste', icon: 'Clipboard', shortcut: 'Ctrl V', disabled: true },
              ],]
            },
          ]
        ], evt).await.then((a) => {
          console.log(a);
        });
      }
      function onContextMenu2(evt: MouseEvent) {
        const contextmenu = new SunContextMenu([
          [
            {
              uid: 'test',
              render: (props,) => {
                return <>
                  <SunButtonLike flat noPressedColor onMouseenter={(evt: Event) => props.hover(props.uid, [[
                    {
                      label: '测试',
                      icon: 'Globe',
                      uid: 100,
                    }
                  ]], evt.target!, undefined)}>
                    <Search />
                    <input class="__sun-design__" style="flex: 1; border: none; padding: 0; background-color: transparent; outline: none; width: 0px;" placeholder="查找" />
                    <SunButton size="small" squared><ChevronRight /></SunButton>
                  </SunButtonLike>
                </>;
              }
            },
          ]
        ], evt).await.then((a) => {
          console.log(a);
        });
      }
      return { args, onContextMenu0, onContextMenu1, onContextMenu2 };
    },
    template: `
			<div style="width: 200px; height: 200px; border-style: dashed; bordr-width: 2px; border-color: red;" @contextmenu.prevent.self.stop="onContextMenu0"/>
			<div style="width: 200px; height: 200px; border-style: dashed; bordr-width: 2px; border-color: yellow;" @contextmenu.prevent.self.stop="onContextMenu1">
				<div style="width: 100px; height: 100px; border-style: dashed; bordr-width: 2px; border-color: green;" @contextmenu.prevent.self.stop="onContextMenu2"/>
			</div>
		`,
  }),
};