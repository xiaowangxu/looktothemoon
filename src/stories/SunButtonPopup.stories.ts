import type { Meta, StoryObj } from '@storybook/vue3';

import SunControlGroup from '../sundesign/controlgroup/SunControlGroup.vue';
import SunLabel from '../sundesign/label/SunLabel.vue';
import SunControlGroupRow from '../sundesign/controlgroup/SunControlGroupRow.vue';
import SunButtonPopup from '../sundesign/buttonpopup/SunButtonPopup.vue';
import SunButton from '@/sundesign/button/SunButton.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import SunPanelContainer from '@/sundesign/panel/SunPanelContainer.vue';
import SunPanelSeparator from '@/sundesign/panel/SunPanelSeparator.vue';
import { calcButtonPopupRect } from '@/sundesign/SunDesignConstants';
import SunNumberEdit from '../sundesign/numberedit/SunNumberEdit.vue'
import { RotateCcw, Pipette, ListPlus } from 'lucide-vue-next';
import { ref, watch, nextTick } from 'vue';

const meta: Meta<typeof SunButtonPopup> = {
	component: SunButtonPopup,
};

export default meta;
type Story = StoryObj<typeof SunButtonPopup>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const ButtonPopup: Story = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: {
			SunControlGroup, SunControlGroupRow, SunLabel, RotateCcw, Pipette, ListPlus,
			SunButtonPopup, ChevronDown, ChevronUp, SunPanelContainer, SunPanelSeparator, SunButton, SunNumberEdit
		},
		setup() {
			const rgb = ref(true);
			const buttonpopup_ref = ref<InstanceType<typeof SunButtonPopup> | undefined>();

			watch([rgb], () => {
				nextTick(() => {
					console.log(buttonpopup_ref?.value);
					buttonpopup_ref?.value?.refreshPopupContentMinSize();
				});
			});

			return { args, calcButtonPopupRect, rgb, buttonpopup_ref };
		},
		template: `
			<SunButtonPopup v-bind="args" squared vertical style="width: 100px;" width="100%">
				<template #button="{ opened }">
					{{ opened }}
				</template>
				<template #popup>
					<SunPanelContainer>
						<SunButton style="width: 100%"></SunButton>
					</SunPanelContainer>
					<SunPanelSeparator :override-vertical="true"/>
					<SunPanelContainer>
						<SunButton style="width: 100%"></SunButton>
					</SunPanelContainer>
				</template>
			</SunButtonPopup>
			<SunButtonPopup v-bind="args" scrollBarVisibility="hover" :scrollableIndicators="false" :get-popup-rect="(buttonRect, contentMinSize, windowSize)=>({x: buttonRect.x, y: buttonRect.y + buttonRect.height + 3, width: 300, height: 300 })" squared size="large">
				<template #button="{ opened }">
					<ChevronDown v-if="!opened" />
					<ChevronUp v-else />
				</template>
				<template #popup>
					<div style="width: 500px; height: 700px; background-image: url('https://picsum.photos/500/700')"/>
				</template>
			</SunButtonPopup>
			<SunButtonPopup ref="buttonpopup_ref" v-bind="args" vertical squared width="100%">
				<template #button="{ opened }">
					<ChevronDown v-if="!opened" />
					<ChevronUp v-else />
				</template>
				<template #popup>
					<SunPanelContainer gap>
						<div style="display: flex; height: 24px; flex: 1;
							background-image: linear-gradient(45deg,#ccc 25%,transparent 0),linear-gradient(-45deg,#ccc 25%,transparent 0),linear-gradient(45deg,transparent 75%,#ccc 0),linear-gradient(-45deg,transparent 75%,#ccc 0);
							background-size: 10px 10px;
							background-position: 0 0,0 5px,5px -5px,-5px 0;
							position: relative;
							overflow: hidden;
							border-radius: 6px;">
								<div style="position: absolute; inset: 0; right: 50%; background: blue;"/>
								<div style="position: absolute; inset: 0; left: 50%; background: rgba(123, 233, 12, 0.5);"/>
						</div>
						<SunButton squared><RotateCcw/></SunButton>
					</SunPanelContainer>
					<SunPanelSeparator override-vertical/>
					<SunPanelContainer gap style="--Color: rgb(0 0 255); min-width: 202px;">
						<template v-if="rgb">
							<div style="min-width: 24px; border-radius: 6px; background: linear-gradient(0deg,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red);"/>
							<div style="width: 100%; aspect-ratio: 1; border-radius: 6px;
								background: linear-gradient(0deg, black, transparent), linear-gradient(90deg, white, var(--Color));"/>
							<div style="min-width: 24px; border-radius: 6px; 
								background-image: linear-gradient(45deg,#ccc 25%,transparent 0),linear-gradient(-45deg,#ccc 25%,transparent 0),linear-gradient(45deg,transparent 75%,#ccc 	0),linear-gradient(-45deg,transparent 75%,#ccc 0);
								background-size: 10px 10px;
								background-position: 0 0,0 5px,5px -5px,-5px 0;
								position: relative;
								overflow: hidden;">
								<div style="position: absolute; inset: 0; background: linear-gradient(0deg, var(--Color), transparent);"/>
							</div>
						</template>
						<div v-else style="width: 100%; aspect-ratio: 2; border-radius: 6px;
							background: linear-gradient(0deg, black, transparent, white), linear-gradient(90deg,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red);"/>
					</SunPanelContainer>
					<SunPanelSeparator override-vertical/>
					<SunPanelContainer gap>
						<SunControlGroup>
							<SunControlGroupRow>
								<SunLabel style="width: 24px; text-align: center;">R</SunLabel>
							</SunControlGroupRow>
							<SunControlGroupRow>
								<SunLabel style="width: 24px; text-align: center;">G</SunLabel>
							</SunControlGroupRow>
							<SunControlGroupRow>
								<SunLabel style="width: 24px; text-align: center;">B</SunLabel>
							</SunControlGroupRow>
							<SunControlGroupRow>
								<SunLabel style="width: 24px; text-align: center;">A</SunLabel>
							</SunControlGroupRow>
						</SunControlGroup>
						<SunControlGroup style="flex: 1;">
							<SunControlGroupRow>
								<SunNumberEdit value="255" style="flex: 1;"/>
							</SunControlGroupRow>
							<SunControlGroupRow>
								<SunNumberEdit value="255" style="flex: 1;"/>
							</SunControlGroupRow>
							<SunControlGroupRow>
								<SunNumberEdit value="255" style="flex: 1;"/>
							</SunControlGroupRow>
							<SunControlGroupRow>
								<SunNumberEdit value="255" style="flex: 1;"/>
							</SunControlGroupRow>
						</SunControlGroup>
						<SunControlGroup>
							<SunControlGroupRow>
								<SunButton squared><Pipette/></SunButton>
							</SunControlGroupRow>
							<SunControlGroupRow>
								<SunButton squared><ListPlus/></SunButton>
							</SunControlGroupRow>
						</SunControlGroup>
					</SunPanelContainer>
					<SunPanelSeparator override-vertical/>
					<SunPanelContainer gap style="flex-wrap: wrap;">
						<SunButton v-for="i in 6" size="small" squared style="
							background-color: transparent;
							background-image: linear-gradient(45deg,#ccc 25%,transparent 0),linear-gradient(-45deg,#ccc 25%,transparent 0),linear-gradient(45deg,transparent 75%,#ccc 0),linear-gradient(-45deg,transparent 75%,#ccc 0);
							background-size: 10px 10px;
							background-position: 0 0,0 5px,5px -5px,-5px 0;
							position: relative;
						">
							<div style="position: absolute; inset: 0; background: rgba(123, 233, 12, 0.5);"/>
						</SunButton>
					</SunPanelContainer>
					</template>
			</SunButtonPopup>
			<SunButtonPopup v-bind="args" squared style="width: 100px;" width="100%" min-width="700px">
				<template #button="{ opened }">
					添加功能组件
				</template>
				<template #popup>
					<SunPanelContainer vertical style="width: 100px;">
						<SunButton flat>功能0</SunButton>
						<SunButton flat>功能0</SunButton>
						<SunButton flat>功能0</SunButton>
						<SunButton flat>功能0</SunButton>
						<SunButton flat>功能0</SunButton>
					</SunPanelContainer>
					<SunPanelSeparator :override-vertical="false"/>
					<SunPanelContainer vertical gap>
						<SunButton></SunButton>
						<SunButtonPopup v-bind="args" style="align-self: flex-start;" squared>
							<template #button="{ opened }">
								<ChevronDown v-if="!opened" />
								<ChevronUp v-else />
							</template>
							<template #popup>
								<div style="width: 500px; height: 700px; background-image: url('https://picsum.photos/500/700')"/>
							</template>
						</SunButtonPopup>
					</SunPanelContainer>
					<SunPanelSeparator :override-vertical="false"/>
					<SunPanelContainer vertical style="width: 100px;">
						<SunButton flat>功能1</SunButton>
						<SunButton flat>功能1</SunButton>
						<SunButton flat>功能1</SunButton>
						<SunButton flat>功能1</SunButton>
						<SunButton flat>功能1</SunButton>
					</SunPanelContainer>
					<SunPanelSeparator :override-vertical="false"/>
					<SunPanelContainer vertical style="width: 200px;">
						<SunButton flat>功能2</SunButton>
						<SunButton flat>功能2</SunButton>
						<SunButton flat>功能2</SunButton>
						<SunButton flat>功能2</SunButton>
						<SunButton flat>功能2</SunButton>
					</SunPanelContainer>
					<SunPanelSeparator :override-vertical="false"/>
					<SunPanelContainer vertical style="width: 300px;">
						<SunButton flat>功能3</SunButton>
						<SunButton flat>功能3</SunButton>
						<SunButton flat>功能3</SunButton>
						<SunButton flat>功能3</SunButton>
						<SunButton flat>功能3</SunButton>
					</SunPanelContainer>
				</template>
			</SunButtonPopup>
		`,
	}),
	argTypes: {
		...ArgsTypes,
		mode: {
			options: ['instance', 'visibility'],
			control: { type: 'radio' },
		}
	},
	args: {
		...Args,
		mode: 'instance',
		bordered: true,
		dropShadow: true,
		scrollableIndicators: true,
		getPopupRect(buttonRect, contentMinSize, windowSize) {
			return calcButtonPopupRect(buttonRect, contentMinSize, windowSize, 0, 3);
		},
	},
};