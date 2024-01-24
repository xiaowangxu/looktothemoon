import type { Meta, StoryObj } from '@storybook/vue3';

import SunNumberEdit from '../../src/sundesign/numberedit/SunNumberEdit.vue';
import { Cog } from 'lucide-vue-next';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';

const meta: Meta<typeof SunNumberEdit> = {
	component: SunNumberEdit,
};

export default meta;
type Story = StoryObj<typeof SunNumberEdit>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const NumberEdit: Story = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: { SunNumberEdit, Cog },
		setup() {
			return { args };
		},
		template: `
			<SunNumberEdit v-bind="args" style="width: 150px;" :value="3.12344">
				<template #prefix>
					长度
				</template>
				<template #suffix>
					米(m)
				</template>
			</SunNumberEdit>
			<SunNumberEdit v-bind="args" style="width: 100px;" :value="3.12344">
				<template #suffix>
					后缀
				</template>
			</SunNumberEdit>
			<SunNumberEdit v-bind="args" style="width: 100px;" :value="3.12344">
				<template #prefix>
					前缀
				</template>
			</SunNumberEdit>
			<SunNumberEdit v-bind="args" progress style="width: 150px;" disabled/>
		`,
	}),
	argTypes: {
		...ArgsTypes,
	},
	args: {
		...Args,
	},
};