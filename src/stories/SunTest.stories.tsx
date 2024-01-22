import type { Meta, StoryObj } from '@storybook/vue3';

import SunTest from '../sundesign/test/SunTest.vue';
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
			return { args, b };
		},
		template: `
			<SunTest :render="b"/>
		`,
	}),
};

const a: Raw<Component<{ id: number }>> = (props, context) => {
	console.log(props, context);
	return <>
		<span>!!!!!{props.id}</span>
	</>
};

const b: Raw<Component> = defineComponent({
	props: {
		id: {
			type: Number,
		}
	},
	setup(props, ctx) {
		return () => <>
			?{props.id}?
		</>
	},
});