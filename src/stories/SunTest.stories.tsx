import type { Meta, StoryObj } from '@storybook/vue3';

import SunTest from '../sundesign/button/SunButtonLike.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import SunSelectVue from '@/sundesign/select/SunSelect.vue';
import SunColorPickerVue from '@/sundesign/colorpicker/SunColorPicker.vue';
import { ref, type Raw, type Component, defineComponent } from 'vue';

const meta: Meta<typeof SunTest> = {
	component: SunTest,
};

export default meta;
type Story = StoryObj<typeof SunTest>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Select: Story = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: { SunTest },
		setup() {
			return { args };
		},
		template: `
			<SunTest/>
		`,
	}),
};