import type { Meta, StoryObj } from '@storybook/vue3';

import SunPanelResizeContainer from '../../src/sundesign/panel/SunPanelResizeContainer.vue';
import SunPanelContainer from '../../src/sundesign/panel/SunPanelContainer.vue';
import SunIcon from '../../src/sundesign/icon/SunIcon.vue';
import SunButton from '../../src/sundesign/button/SunButton.vue';
import SunPanel from '../../src/sundesign/panel/SunPanel.vue';
import { Decorators } from './SunDesignArgs';

const meta: Meta<typeof SunPanelResizeContainer> = {
    component: SunPanelResizeContainer,
};

export default meta;
type Story = StoryObj<typeof SunPanelResizeContainer>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const PanelResizeContainer: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunPanelResizeContainer, SunPanel, SunPanelContainer, SunButton, SunIcon },
        setup() {
            return { args };
        },
        template: `
            <SunPanel vertical style="width: 400px; height: 400px;">
                <SunPanelResizeContainer style="width: 100%; height: 100%;" v-bind="args">
                    <template #first>
                        <SunPanelContainer>
                            <div style="margin: auto;">First</div>
                        </SunPanelContainer>
                    </template>
                    <template #second>
                        <SunPanelContainer>
                            <div style="margin: auto;">Second</div>
                        </SunPanelContainer>
                    </template>
                </SunPanelResizeContainer>
            </SunPanel>
        `,
    }),
    argTypes: {
    },
    args: {
    },
};