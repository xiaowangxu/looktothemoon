import type { Meta, StoryObj } from '@storybook/vue3';

import SunPanelTabsContainer from '../../src/sundesign/panel/SunPanelTabsContainer.vue';
import SunPanelContainer from '../../src/sundesign/panel/SunPanelContainer.vue';
import SunIcon from '../../src/sundesign/icon/SunIcon.vue';
import SunButton from '../../src/sundesign/button/SunButton.vue';
import SunPanel from '../../src/sundesign/panel/SunPanel.vue';
import { Decorators } from './SunDesignArgs';

const meta: Meta<typeof SunPanelTabsContainer> = {
    component: SunPanelTabsContainer,
};

export default meta;
type Story = StoryObj<typeof SunPanelTabsContainer>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const PanelTabsContainer: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunPanelTabsContainer, SunPanel, SunPanelContainer, SunButton, SunIcon },
        setup() {
            return { args };
        },
        template: `
            <SunPanel vertical style="width: 200px; height: 400px;">
                <SunPanelTabsContainer :tabs="[{uid: '标签容器', label: '标签容器', icon: 'NotebookTabs'}, {uid: 'A', icon: 'AirVent', iconOnly: true}, {uid: 'B', label: 'B', icon: 'BrickWall'}]" initial-tab="A">
                    <template #default={tab}>
                        <SunPanelContainer>
                            <div style="margin: auto;">{{tab}}</div>
                        </SunPanelContainer>
                    </template>
                </SunPanelTabsContainer>
            </SunPanel>
            <SunPanel vertical style="width: 200px; height: 400px;">
                <SunPanelTabsContainer :tabs="[{uid: 'A', label: 'A', icon: 'AirVent'}, {uid: 'B', label: 'B', icon: 'BrickWall'}]" initial-tab="A">
                    <template #append>
                        <SunButton squared flat size="small"><SunIcon name="X"/></SunButton>
                    </template>
                    <template #default={tab}>
                        <SunPanelContainer>
                            <div style="margin: auto;">{{tab}}</div>
                        </SunPanelContainer>
                    </template>
                </SunPanelTabsContainer>
            </SunPanel>
        `,
    }),
    argTypes: {
    },
    args: {
    },
};