import type { Meta, StoryObj } from '@storybook/vue3';

import SunButton from '../sundesign/button/SunButton.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { Search, X } from 'lucide-vue-next';

const meta: Meta<typeof SunButton> = {
	component: SunButton,
};

export default meta;
type Story = StoryObj<typeof SunButton>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Button: Story = {
	decorators: Decorators,
	render: (args) => ({
		components: { SunButton, Search, X },
		setup() {
			return { args };
		},
		template: `
			<SunButton v-bind="args">按钮</SunButton>
			<SunButton v-bind="args"><Search />按钮</SunButton>
			<SunButton v-bind="args"><Search /></SunButton>
			<SunButton v-bind="args" disabled>disabled</SunButton>
			<div style="display: flex; flex-wrap: nowrap;">
				<SunButton v-bind="args" :border-mask="0b1001" style="margin-right: -1px;">查找</SunButton>
				<SunButton v-bind="args" :border-mask="0b0110" squared><X /></SunButton>
			</div>
		`,
	}),
	argTypes: {
		...ArgsTypes,
	},
	args: {
		...Args,
	},
};

export const IconOnly: Story = {
	decorators: Decorators,
	render: (args) => ({
		components: { SunButton, Search },
		setup() {
			return { args };
		},
		template: `
			<SunButton v-bind="args" size="small"><Search /></SunButton>
			<SunButton v-bind="args" size="normal"><Search /></SunButton>
			<SunButton v-bind="args" size="large"><Search /></SunButton>
		`,
	}),
	argTypes: {
		...ArgsTypes,
	},
	args: {
		...Args,
		squared: true,
		equalPadding: true,
	},
};