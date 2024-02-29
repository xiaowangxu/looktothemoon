import type { Meta, StoryObj } from '@storybook/vue3';

import SunCompletion from '../../src/sundesign/completion/SunCompletion.vue';
import { SizeArgs, SizeArgsTypes, Decorators } from './SunDesignArgs';
import SunScrollBar from '../../src/sundesign/scrollcontainer/SunScrollBar.vue';
import { ref } from 'vue';

const meta: Meta<typeof SunCompletion> = {
	component: SunCompletion,
};

export default meta;
type Story = StoryObj<typeof SunCompletion>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Panel: Story = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: { SunCompletion },
		setup() {
			return { args };
		},
		template: `
			<SunCompletion v-bind="args">
				
			</SunCompletion>
		`,
	}),
	argTypes: {
	},
	args: {
	},
};