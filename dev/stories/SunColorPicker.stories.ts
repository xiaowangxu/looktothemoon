import type { Meta, StoryObj } from '@storybook/vue3';

import SunColorPicker from '../../src/sundesign/colorpicker/SunColorPicker.vue';
import { SizeArgs, SizeArgsTypes, BorderMaskArgs, BorderMaskArgsTypes, Decorators } from './SunDesignArgs';

const meta: Meta<typeof SunColorPicker> = {
	component: SunColorPicker,
};

export default meta;
type Story = StoryObj<typeof SunColorPicker>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const ColorPicker: Story = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: { SunColorPicker },
		setup() {
			return { args };
		},
		template: `
			<SunColorPicker v-bind="args" />
		`,
	}),
	argTypes: {
		...SizeArgsTypes,
		...BorderMaskArgsTypes,
	},
	args: {
		...SizeArgs,
		...BorderMaskArgs,
		squared: true,
	},
};