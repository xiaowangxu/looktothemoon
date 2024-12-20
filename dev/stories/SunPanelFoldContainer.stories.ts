import type { Meta, StoryObj } from '@storybook/vue3';

import SunPanelFoldContainer from '../../src/sundesign/panel/SunPanelFoldContainer.vue';
import SunPanelFoldContainerGroup from '../../src/sundesign/panel/SunPanelFoldContainerGroup.vue';
import SunPanelContainer from '../../src/sundesign/panel/SunPanelContainer.vue';
import SunPanelSeparator from '../../src/sundesign/panel/SunPanelSeparator.vue';
import SunPanel from '../../src/sundesign/panel/SunPanel.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';

const meta: Meta<typeof SunPanelFoldContainer> = {
    component: SunPanelFoldContainer,
};

export default meta;
type Story = StoryObj<typeof SunPanelFoldContainer>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const PanelFoldContainer: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunPanelFoldContainer, SunPanelFoldContainerGroup, SunPanel, SunPanelContainer, SunPanelSeparator },
        setup() {
            return { args };
        },
        template: `
            <SunPanel vertical style="width: 200px;">
                <SunPanelFoldContainer v-bind="args" label="折叠容器" style="width: 100%;">
                    <div style="width: 100%; height: 400px; background-color: red;"/>
                </SunPanelFoldContainer>
            </SunPanel>
            <SunPanel vertical style="width: 200px;">
                <SunPanelFoldContainer v-bind="args" label="折叠容器1" style="width: 100%;" resizable>
                    <div style="width: 100%; height: 100%; min-height: 24px; background-color: green;"/>
                </SunPanelFoldContainer>
                <SunPanelSeparator/>
                <SunPanelFoldContainer v-bind="args" label="折叠容器2" style="width: 100%;" resizable>
                    <div style="width: 100%; height: 100%; min-height: 24px; background-color: blue;"/>
                </SunPanelFoldContainer>
            </SunPanel>
            
            <SunPanel vertical style="width: 200px;">
                <SunPanelFoldContainerGroup>
                    <SunPanelFoldContainer v-bind="args" label="折叠容器 Group1" style="width: 100%;" initial-fold>
                        <div style="width: 100%; height: 350px; background-color: green;"/>
                    </SunPanelFoldContainer>
                    <SunPanelSeparator/>
                    <SunPanelFoldContainer v-bind="args" label="折叠容器 Group2" style="width: 100%;">
                        <div style="width: 100%; height: 350px; background-color: blue;"/>
                    </SunPanelFoldContainer>
                    <SunPanelSeparator/>
                    <SunPanelFoldContainer v-bind="args" label="折叠容器 Group3" style="width: 100%;" initial-fold>
                        <div style="width: 100%; height: 350px; background-color: orange;"/>
                    </SunPanelFoldContainer>
                </SunPanelFoldContainerGroup>
                <SunPanelSeparator/>
                <SunPanelFoldContainer v-bind="args" label="折叠容器1" style="width: 100%;" resizable>
                    <div style="width: 100%; height: 100%; min-height: 24px; background-color: purple;"/>
                </SunPanelFoldContainer>
            </SunPanel>
        `,
    }),
    argTypes: {
        ...ArgsTypes
    },
    args: {
        ...Args
    },
};