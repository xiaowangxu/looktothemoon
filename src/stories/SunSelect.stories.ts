import type { Meta, StoryObj } from '@storybook/vue3';

import SunSelect from '../sundesign/select/SunSelect.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ColorSchemeBlue, ColorSchemeGreen } from '@/sundesign/SunDesignConstants';
import { ColorSchemeRed } from '../sundesign/SunDesignConstants';

const meta: Meta<typeof SunSelect> = {
	component: SunSelect,
};

export default meta;
type Story = StoryObj<typeof SunSelect>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Select: Story = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: { SunSelect },
		setup() {
			return { args };
		},
		template: `
			<SunSelect v-bind="args"></SunSelect>
		`,
	}),
	argTypes: {
		...ArgsTypes,
	},
	args: {
		...Args,
		options: [
			[
				{
					asTitle: true,
					label: '分类',
					uid: -1,
				},
				{
					label: '测试',
					icon: 'Globe',
					uid: 0,
				},
				{
					label: 'Test',
					icon: 'Cog',
					description: 'Test 1234567890',
					uid: 1,
				}],
			[{
				asTitle: true,
				label: '分类12',
				uid: -1,
			},{
				label: '测试',
				icon: 'Globe',
				disabled: true,
				uid: 2,
			},
			{
				label: 'Test',
				icon: 'Cog',
				description: 'Test',
				uid: 3,
			},
			{
				label: 'Test',
				icon: 'Trash',
				uid: 4,
				description:'有快捷键哦~~~~~~~',
				shortcut: 'Ctrl B',
			}],
			[{
				asTitle: true,
				label: '分类 ABC',
				uid: -1,
			},{
				label: '测试',
				icon: 'Globe',
				uid: 5,
			},
			{
				label: 'Test',
				icon: 'Cog',
				description: 'Test',
				uid: 6,
			},
			{
				label: 'Test',
				icon: 'Trash',
				uid: 7,
				colorScheme: ColorSchemeRed,
				shortcut: 'Ctrl B',
			}],
			[{
				asTitle: true,
				label: 'hello world',
				uid: -1,
			},{
				label: '测试',
				icon: 'Globe',
				uid: 8,
			},
			{
				label: 'More',
				icon: 'MoreHorizontal',
				colorScheme: ColorSchemeGreen,
				uid: 9,
			},
			{
				label: 'Test',
				colorScheme: ColorSchemeBlue,
				icon: 'Trash',
				uid: 10,
				shortcut: 'Ctrl B',
			}]
		],
		value: 1,
	},
};