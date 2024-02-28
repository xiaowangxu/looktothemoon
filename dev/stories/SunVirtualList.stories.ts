import type { Meta, StoryObj } from '@storybook/vue3';

import SunVirtualList from '../../src/sundesign/virtuallist/SunVirtualList.vue';
import SunButton from '../../src/sundesign/button/SunButton.vue';
import SunPanel from '../../src/sundesign/panel/SunPanel.vue';
import SunPanelContainer from '../../src/sundesign/panel/SunPanelContainer.vue';
import { SizeArgs, SizeArgsTypes, Decorators } from './SunDesignArgs';

const meta: Meta<typeof SunVirtualList> = {
    component: SunVirtualList,
};

export default meta;
type Story = StoryObj<typeof SunVirtualList>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const VirtualList: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunVirtualList, SunButton, SunPanel, SunPanelContainer },
        setup() {
            return { args };
        },
        template: `
        <SunPanel style="height: 600px; width: 400px;" >
            <SunVirtualList :count="100000" :item-height="24" :gap="4" :padding-top="4" :padding-bottom="4" style="width: 100%; height: 100%;" content-style="width: 100%;">
                <template #default="{ start, length }">
                    <div style="display: flex; flex-direction: column; gap: 4px; padding: 0px 4px;">
                        <SunButton v-for="i in length" style="width: 100%;">{{ start + i - 1 }}</SunButton>
                    </div>
                </template>
            </SunVirtualList>
        </SunPanel>
        `,
    }),
    argTypes: {
    },
    args: {
    },
};