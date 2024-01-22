import type { Meta, StoryObj } from '@storybook/vue3';

import SunControlGroup from '../sundesign/controlgroup/SunControlGroup.vue';
import SunControlGroupRow from '../sundesign/controlgroup/SunControlGroupRow.vue';
import SunButton from '../sundesign/button/SunButton.vue';
import SunButtonLike from '../sundesign/button/SunButtonLike.vue';
import SunLineEdit from '../sundesign/lineedit/SunLineEdit.vue';
import SunNumberEdit from '../sundesign/numberedit/SunNumberEdit.vue'
import SunSelect from '@/sundesign/select/SunSelect.vue';
import SunColorPicker from '@/sundesign/colorpicker/SunColorPicker.vue';
import { Decorators } from './SunDesignArgs';
import { StepBack, StepForward, SkipBack, SkipForward, Play } from 'lucide-vue-next';
import { ColorSchemeBlue, ColorSchemeRed, ColorSchemeGreen } from '../sundesign/SunDesignConstants';

const meta: Meta<typeof SunControlGroup> = {
	component: SunControlGroup,
};

export default meta;
type Story = StoryObj<typeof SunControlGroup>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const ControlGroup: Story = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: { SunControlGroup, SunControlGroupRow, SunColorPicker, SunNumberEdit, SunButton, SunButtonLike, SunSelect, SunLineEdit, StepBack, StepForward, SkipBack, SkipForward, Play },
		setup() {
			return { args, ColorSchemeBlue, ColorSchemeRed, ColorSchemeGreen };
		},
		template: `
			<!-- single -->
			<SunControlGroup>
				<SunControlGroupRow>
					<SunButton squared>&nbsp;</SunButton>
				</SunControlGroupRow>
			</SunControlGroup>
			<!-- row two -->
			<SunControlGroup>
				<SunControlGroupRow>
					<SunButton squared>&nbsp;</SunButton>
					<SunButton squared>&nbsp;</SunButton>
				</SunControlGroupRow>
			</SunControlGroup>
			<!-- col two -->
			<SunControlGroup>
				<SunControlGroupRow>
					<SunButton squared>&nbsp;</SunButton>
				</SunControlGroupRow>
				<SunControlGroupRow>
					<SunButton squared>&nbsp;</SunButton>
				</SunControlGroupRow>
			</SunControlGroup>
			<!-- grid two -->
			<SunControlGroup>
				<SunControlGroupRow>
					<SunButton style="width: 70px;">&nbsp;</SunButton>
					<SunButton squared>&nbsp;</SunButton>
				</SunControlGroupRow>
				<SunControlGroupRow>
					<SunLineEdit style="width: 70px;" placeholder="这是文本框"/>
					<SunButton squared>&nbsp;</SunButton>
				</SunControlGroupRow>
			</SunControlGroup>
			<SunControlGroup>
				<SunControlGroupRow>
					<SunButton squared><SkipBack/></SunButton>
					<SunButton squared><StepBack/></SunButton>
					<SunButton squared><Play/></SunButton>
					<SunButton squared><StepForward/></SunButton>
					<SunButton squared><SkipForward/></SunButton>
					<SunNumberEdit :value="256" v-bind="args" suffix="/ 3:44" style="width: 120px;" :step-button="true">
						<template #suffix>
							/ 4:33
						</template>
					</SunNumberEdit>
					<SunColorPicker squared />
					<SunSelect style="max-width: 100px; min-width: 50px;" :options="[
						[
							{
								label: '循环',
								icon: 'Repeat',
								uid: 0,
							},
							{
								label: '单曲循环',
								icon: 'Repeat1',
								uid: 1,
							},
							{
								label: '随机',
								icon: 'Shuffle',
								uid: 2,
							}
						]
					]" :preferedDirection="1"/>
				</SunControlGroupRow>
			</SunControlGroup>
			
			<SunControlGroup>
				<SunControlGroupRow>
					<SunButton squared size="large">1</SunButton>
					<SunButton squared size="large">2</SunButton>
					<SunButton squared size="large">3</SunButton>
					<SunButton squared size="large">4</SunButton>
				</SunControlGroupRow>
				<SunControlGroupRow>
					<SunButton squared size="large">5</SunButton>
					<SunButton squared size="large">6</SunButton>
					<SunButton squared size="large">7</SunButton>
					<SunButton squared size="large">8</SunButton>
				</SunControlGroupRow>
				<SunControlGroupRow>
					<SunButton squared size="large">9</SunButton>
					<SunButton squared size="large">10</SunButton>
					<SunButton squared size="large">11</SunButton>
					<SunButton squared size="large">12</SunButton>
				</SunControlGroupRow>
				<SunControlGroupRow>
					<SunButton squared size="large">13</SunButton>
					<SunButton squared size="large">14</SunButton>
					<SunButton squared size="large">15</SunButton>
					<SunButton squared size="large">16</SunButton>
				</SunControlGroupRow>
			</SunControlGroup>
		`,
	}),
	argTypes: {
	},
	args: {
	},
};