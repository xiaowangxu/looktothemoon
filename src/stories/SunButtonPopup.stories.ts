import type { Meta, StoryObj } from '@storybook/vue3';

import SunControlGroup from '../sundesign/controlgroup/SunControlGroup.vue';
import SunLabel from '../sundesign/label/SunLabel.vue';
import SunControlGroupRow from '../sundesign/controlgroup/SunControlGroupRow.vue';
import SunButtonPopup from '../sundesign/buttonpopup/SunButtonPopup.vue';
import SunButton from '@/sundesign/button/SunButton.vue';
import SunButtonLike from '@/sundesign/button/SunButtonLike.vue';
import SunLineEdit from '@/sundesign/lineedit/SunLineEdit.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import SunPanelContainer from '@/sundesign/panel/SunPanelContainer.vue';
import SunPanelSeparator from '@/sundesign/panel/SunPanelSeparator.vue';
import { calcButtonPopupRect } from '@/sundesign/SunDesignConstants';
import SunNumberEdit from '../sundesign/numberedit/SunNumberEdit.vue'
import SunSelect from '@/sundesign/select/SunSelect.vue';
import SunScrollContainer from '@/sundesign/scrollcontainer/SunScrollContainer.vue';
import { RotateCcw, Pipette, Plus, Hash, Palette, ClipboardCopy, Bookmark } from 'lucide-vue-next';

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
			Palette, ClipboardCopy, SunScrollContainer, SunButtonLike,
			SunSelect, SunLineEdit, SunControlGroup, SunControlGroupRow, SunLabel, RotateCcw, Pipette, Plus, Hash, Bookmark,
			SunButtonPopup, ChevronDown, ChevronUp, SunPanelContainer, SunPanelSeparator, SunButton, SunNumberEdit
		},
		setup() {
			return { args, calcButtonPopupRect };
		},
		template: `
			<SunButtonPopup v-bind="args" squared vertical style="width: 100px;" content-style="width: 100%;">
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