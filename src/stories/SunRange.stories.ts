import type { Meta, StoryObj } from '@storybook/vue3';

import SunRange from '../sundesign/range/SunRange.vue';
import { Cog } from 'lucide-vue-next';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';

const meta: Meta<typeof SunRange> = {
	component: SunRange,
};

export default meta;
type Story = StoryObj<typeof SunRange>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Range: Story = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: { SunRange, Cog },
		setup() {
			return { args };
		},
		template: `
			<SunRange v-bind="args" style="width: 150px;" />
			<SunRange v-bind="args" style="height: 150px;" vertical />
		`,
	}),
	argTypes: {
		...ArgsTypes,
	},
	args: {
		...Args,
		min: 0,
		max: 100,
		modelValue: 37,
		ticks: [25, 50, 75]
	}
};