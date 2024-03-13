import type { Meta, StoryObj } from '@storybook/vue3';

import SunDatePickerContent from '../../src/sundesign/datepickercontent/SunDatePickerContent.vue';
import SunPanel from '../../src/sundesign/panel/SunPanel.vue';
import SunPanelContainer from '../../src/sundesign/panel/SunPanelContainer.vue';
import { SizeArgs, SizeArgsTypes, Decorators } from './SunDesignArgs';

const meta: Meta<typeof SunDatePickerContent> = {
    component: SunDatePickerContent,
};

export default meta;
type Story = StoryObj<typeof SunDatePickerContent>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const DatePickerContent: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunDatePickerContent, SunPanel, SunPanelContainer },
        setup() {

            return { args };
        },
        template: `
        <SunPanel>
            <SunDatePickerContent v-bind="args">
            </SunDatePickerContent>
        </SunPanel>
        <input type="date">
		`,
    }),
    argTypes: {
    },
    args: {
    },
};