import type { Meta, StoryObj } from '@storybook/vue3';

import SunCheckbox from '../../src/sundesign/checkbox/SunCheckbox.vue';
import SunRadiobox from '../../src/sundesign/checkbox/SunRadiobox.vue';
import SunLabel from '../../src/sundesign/label/SunLabel.vue';
import { SizeArgs, SizeArgsTypes, ColorSchemeArgs, ColorSchemeArgsTypes, Decorators } from './SunDesignArgs';
import { Cog } from 'lucide-vue-next';

const meta: Meta<typeof SunCheckbox> = {
	component: SunCheckbox,
};

export default meta;
type StoryCheckbox = StoryObj<typeof SunCheckbox>;
type StoryRadiobox = StoryObj<typeof SunRadiobox>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Checkbox: StoryCheckbox = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: { SunCheckbox, SunLabel, Cog },
		setup() {
			return { args };
		},
		template: `
			<SunCheckbox v-bind="args"/>
			<SunCheckbox v-bind="args" disabled/>
			<SunCheckbox v-bind="args" checked disabled/>
			<label style="display: flex; flex-wrap: nowrap; gap: 4px;">
				<SunCheckbox v-bind="args">
					<template #icon>
						<Cog />
					</template>
				</SunCheckbox>
				<SunLabel :size="args.size">Label</SunLabel>
			</label>
		`,
	}),
	argTypes: {
		...SizeArgsTypes,
		...ColorSchemeArgsTypes,
	},
	args: {
		...SizeArgs,
		...ColorSchemeArgs,
	},
};

export const Radiobox: StoryRadiobox = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: { SunRadiobox, SunLabel, Cog },
		setup() {
			return { args };
		},
		template: `
			<SunRadiobox v-bind="args"/>
			<SunRadiobox v-bind="args" disabled/>
			<SunRadiobox v-bind="args" checked disabled/>
			<label style="display: flex; flex-wrap: nowrap; gap: 4px;">
				<SunRadiobox v-bind="args">
					<template #icon>
						<Cog />
					</template>
				</SunRadiobox>
				<SunLabel :size="args.size">Label</SunLabel>
			</label>
		`,
	}),
	argTypes: {
		...SizeArgsTypes,
		...ColorSchemeArgsTypes,
	},
	args: {
		...SizeArgs,
		...ColorSchemeArgs,
	},
};