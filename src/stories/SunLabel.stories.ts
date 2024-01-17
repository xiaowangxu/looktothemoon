import type { Meta, StoryObj } from '@storybook/vue3';

import SunLabel from '../sundesign/label/SunLabel.vue';
import { SizeArgs, SizeArgsTypes, Decorators } from './SunDesignArgs';

const meta: Meta<typeof SunLabel> = {
	component: SunLabel,
};

export default meta;
type Story = StoryObj<typeof SunLabel>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Label: Story = {
	decorators: Decorators,
	render: (args) => ({
		components: { SunLabel },
		setup() {
			return { args };
		},
		template: `
			<SunLabel v-bind="args">标签文本</SunLabel>
			<SunLabel v-bind="args" style="max-width: 100px;">max:100px 1234567890</SunLabel>
		`,
	}),
	argTypes: {
		...SizeArgsTypes,
	},
	args: {
		...SizeArgs,
	},
};