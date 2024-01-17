import type { Meta, StoryObj } from '@storybook/vue3';

import SunScrollBar from '../sundesign/scrollbar/SunScrollBar.vue';
import SunPanel from '../sundesign/panel/SunPanel.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';

const meta: Meta<typeof SunScrollBar> = {
	component: SunScrollBar,
};

export default meta;
type Story = StoryObj<typeof SunScrollBar>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const ScrollBar: Story = {
	decorators: Decorators,
	render: (args) => ({
		components: { SunScrollBar, SunPanel },
		setup() {
			const percentage = ref(0.25);
			const percentage2 = ref(0.25);
			return { args, percentage, percentage2 };
		},
		template: `
			<SunPanel size="small" style="width: 400px; height: 200px; position: relative;">
				<SunScrollBar v-bind="args" :vertical="false" v-model:percentage="percentage" :drag-factor="1"/>
				<SunScrollBar v-bind="args" vertical v-model:percentage="percentage2" :drag-factor="1"/>
			</SunPanel>
			<SunPanel size="normal" style="width: 400px; height: 200px; position: relative;">
				<SunScrollBar v-bind="args" :vertical="false" v-model:percentage="percentage" :drag-factor="1"/>
				<SunScrollBar v-bind="args" vertical v-model:percentage="percentage2" :drag-factor="1"/>
			</SunPanel>
			<SunPanel size="large" style="width: 400px; height: 200px; position: relative;">
				<SunScrollBar v-bind="args" :vertical="false" v-model:percentage="percentage" :drag-factor="1"/>
				<SunScrollBar v-bind="args" vertical v-model:percentage="percentage2" :drag-factor="1"/>
			</SunPanel>
		`,
	}),
	argTypes: {
		visibility: {
			options: ['always', 'hover', 'hover-track', 'hidden'],
			control: { type: 'radio' },
		},
	},
	args: {
		dragFactor: 1,
		visibility: 'always',
	},
};