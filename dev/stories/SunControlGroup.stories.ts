import type { Meta, StoryObj } from '@storybook/vue3';

import SunControlGroup from '../../src/sundesign/controlgroup/SunControlGroup.vue';
import SunControlGroupRow from '../../src/sundesign/controlgroup/SunControlGroupRow.vue';
import SunButton from '../../src/sundesign/button/SunButton.vue';
import SunButtonLike from '../../src/sundesign/button/SunButtonLike.vue';
import SunLineEdit from '../../src/sundesign/lineedit/SunLineEdit.vue';
import SunNumberEdit from '../../src/sundesign/numberedit/SunNumberEdit.vue'
import SunSelect from '@/sundesign/select/SunSelect.vue';
import SunColorPicker from '@/sundesign/colorpicker/SunColorPicker.vue';
import { Decorators } from './SunDesignArgs';
import { StepBack, StepForward, SkipBack, SkipForward, Play } from 'lucide-vue-next';
import { ref } from 'vue';

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
            const progress = ref(0);
            const time = ref(0);
            return { args, progress, time };
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
					<SunNumberEdit v-model="time" v-bind="args" style="width: 140px;" progress :min="0" :max="224" :step="1" :value-snap-gap="0.01" :display-percision="2" display-remove-tailing-zeros :display-formatter="v => \`\$\{Math.trunc(v / 60).toFixed(0).padStart(2, '0')\}:\$\{Math.trunc(v % 60).toFixed(0).padStart(2, '0')\}.\$\{(v % 1).toFixed(2).slice(2)\}\`" v-model="progress">
						<template #suffix>
							/ 3:44
						</template>
					</SunNumberEdit>
				</SunControlGroupRow>
			</SunControlGroup>

            {{time}}
			
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