import type { Meta, StoryObj } from '@storybook/vue3';

import SunCalculatePopup from '../../src/sundesign/calculatepopup/SunCalculatePopup.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';

const meta: Meta<typeof SunCalculatePopup> = {
	component: SunCalculatePopup,
};

export default meta;
type Story = StoryObj<typeof SunCalculatePopup>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Select: Story = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: { SunCalculatePopup },
		setup() {
			return { args };
		},
		template: `
			<SunCalculatePopup/>
		`,
	}),
};