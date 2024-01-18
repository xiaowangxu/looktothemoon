import type { Meta, StoryObj } from '@storybook/vue3';

import SunPopup from '../sundesign/popup/SunPopup.vue';
import SunPanel from '../sundesign/panel/SunPanel.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';

const meta: Meta<typeof SunPopup> = {
	component: SunPopup,
};

export default meta;
type Story = StoryObj<typeof SunPopup>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Popup: Story = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: { SunPopup, SunPanel },
		setup() {
			return { args };
		},
		template: `
			<SunPopup v-bind="args">
				<SunPanel style="width: 100%; height: 100%;">
				</SunPanel>
			</SunPopup>
		`,
	}),
	argTypes: {
	},
	args: {
		rect:{
			x: 400, y: 10, width: 100, height: 200
		}
	},
};