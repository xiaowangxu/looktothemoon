import type { Meta, StoryObj } from '@storybook/vue3';

import SunKeyboard from '../../src/sundesign/keyboard/SunKeyboard.vue';
import { Decorators } from './SunDesignArgs';

const meta: Meta<typeof SunKeyboard> = {
	component: SunKeyboard,
};

export default meta;
type Story = StoryObj<typeof SunKeyboard>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Keyboard: Story = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: { SunKeyboard },
		setup() {
			return { args };
		},
		template: `
			<SunKeyboard v-bind="args">A</SunKeyboard>
			<SunKeyboard v-bind="args">文本</SunKeyboard>
			<SunKeyboard v-bind="args">Ctrl Shift C</SunKeyboard>
		`,
	}),
	argTypes: {
	},
	args: {
	},
};