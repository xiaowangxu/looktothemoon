import type { Meta, StoryObj } from '@storybook/vue3';

import SunAngleEditContent from '../../src/sundesign/angleedit/SunAngleEditContent.vue';
import SunPanel from '../../src/sundesign/panel/SunPanel.vue';
import SunPanelContainer from '../../src/sundesign/panel/SunPanelContainer.vue';
import { SizeArgs, SizeArgsTypes, Decorators } from './SunDesignArgs';

const meta: Meta<typeof SunAngleEditContent> = {
    component: SunAngleEditContent,
};

export default meta;
type Story = StoryObj<typeof SunAngleEditContent>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const AngleEditContent: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunAngleEditContent, SunPanel },
        setup() {

            return { args };
        },
        template: `
        <SunPanel style="border-radius: 50%; overflow: visible;">
            <SunAngleEditContent v-bind="args">
            </SunAngleEditContent>
        </SunPanel>
		`,
    }),
    argTypes: {
    },
    args: {
    },
};