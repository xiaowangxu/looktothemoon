import type { Meta, StoryObj } from '@storybook/vue3';

import SunControlGroup from '../sundesign/controlgroup/SunControlGroup.vue';
import SunControlGroupRow from '../sundesign/controlgroup/SunControlGroupRow.vue';
import SunButton from '../sundesign/button/SunButton.vue';
import SunLineEdit from '../sundesign/lineedit/SunLineEdit.vue';
import SunSelect from '@/sundesign/select/SunSelect.vue';
import { Decorators } from './SunDesignArgs';
import { StepBack, StepForward, SkipBack, SkipForward, Play } from 'lucide-vue-next';

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
		components: { SunControlGroup, SunControlGroupRow, SunButton, SunSelect, SunLineEdit, StepBack, StepForward, SkipBack, SkipForward, Play },
		setup() {
			return { args };
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
					<SunButton squared>&nbsp;</SunButton>
					<SunButton squared>&nbsp;</SunButton>
				</SunControlGroupRow>
				<SunControlGroupRow>
					<SunButton squared>&nbsp;</SunButton>
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
					<SunLineEdit />		
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
					<SunButton style="flex: 1;" size="small">5</SunButton>
					<SunButton style="flex: 1;" size="small">6</SunButton>
					<SunButton style="flex: 1;" size="small">7</SunButton>
					<SunButton style="flex: 1;" size="small">8</SunButton>
				</SunControlGroupRow>
				<SunControlGroupRow>
					<SunButton squared size="large">9</SunButton>
					<SunButton squared size="large">10</SunButton>
					<SunButton squared size="large">11</SunButton>
					<SunButton squared size="large">12</SunButton>
				</SunControlGroupRow>
				<SunControlGroupRow>
					<SunButton style="flex: 1;" size="normal">13</SunButton>
					<SunButton style="flex: 1;" size="normal">14</SunButton>
					<SunButton style="flex: 1;" size="normal">15</SunButton>
					<SunButton style="flex: 1;" size="normal">16</SunButton>
				</SunControlGroupRow>
			</SunControlGroup>
		`,
	}),
	argTypes: {
	},
	args: {
	},
};