import type { Meta, StoryObj } from '@storybook/vue3';

import SunLineEdit from '../sundesign/lineedit/SunLineEdit.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';

const meta: Meta<typeof SunLineEdit> = {
	component: SunLineEdit,
};

export default meta;
type Story = StoryObj<typeof SunLineEdit>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const LineEdit: Story = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: { SunLineEdit },
		setup() {
			return { args };
		},
		template: `
			<SunLineEdit value="输入文本" v-bind="args"/>
			<SunLineEdit value="输入文本" v-bind="args" flat/>
			<SunLineEdit v-bind="args" disabled placeholder="disabled"/>
			<SunLineEdit value="输入文本 disabled" v-bind="args" disabled placeholder="disabled"/>
		`,
	}),
	argTypes: {
		...ArgsTypes,
	},
	args: {
		...Args,
	},
};