import type { Meta, StoryObj } from '@storybook/vue3';

import SunCheckbox from '../../src/sundesign/checkbox/SunCheckbox.vue';
import SunRadiobox from '../../src/sundesign/checkbox/SunRadiobox.vue';
import SunRadioGroup from '../../src/sundesign/checkbox/SunRadioGroup.vue';
import SunLabel from '../../src/sundesign/label/SunLabel.vue';
import { SizeArgs, SizeArgsTypes, ColorSchemeArgs, ColorSchemeArgsTypes, Decorators } from './SunDesignArgs';
import { Cog } from 'lucide-vue-next';
import { ref, watch } from 'vue';

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
            const checked = ref(false);
            return { args, checked };
        },
        template: `
			  <SunCheckbox v-bind="args" v-model.lazy="checked"/>
			  <SunCheckbox v-bind="args" disabled v-model="checked"/>
			  <SunCheckbox v-bind="args" disabled v-model="checked"/>
			  <label style="display: flex; flex-wrap: nowrap; gap: 4px;">
			  	  <SunCheckbox v-bind="args" v-model="checked">
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
            const checked = ref(false);
            return { args, checked };
        },
        template: `
			  <SunRadiobox v-bind="args" v-model.lazy="checked"/>
			  <SunRadiobox v-bind="args" disabled v-model="checked"/>
			  <SunRadiobox v-bind="args" disabled v-model="checked"/>
			  <label style="display: flex; flex-wrap: nowrap; gap: 4px;">
			  	  <SunRadiobox v-bind="args" v-model="checked">
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

export const RadioGroup: StoryRadiobox = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunRadioGroup, SunRadiobox, SunLabel },
        setup() {
            const checked = ref<string | undefined>();
            return { args, checked };
        },
        template: `
        <div style="display: flex; flex-direction: column; gap: 4px;">
            <SunRadioGroup v-model="checked">
                <label style="display: flex; flex-wrap: nowrap; gap: 6px;">
                    <SunRadiobox v-bind="args" uid="Option A"/>
                    <SunLabel :size="args.size">选项 A</SunLabel>
                </label>
                <label style="display: flex; flex-wrap: nowrap; gap: 6px;">
                    <SunRadiobox v-bind="args" uid="Option B"/>
                    <SunLabel :size="args.size">选项 B 选中后禁用选项 C</SunLabel>
                </label>
                <label style="display: flex; flex-wrap: nowrap; gap: 6px;">
                    <SunRadiobox v-bind="args" uid="Option C" :disabled="checked === 'Option B'"/>
                    <SunLabel :size="args.size">选项 C</SunLabel>
                </label>
			          <label style="display: flex; flex-wrap: nowrap; gap: 6px;">
			      	      <SunRadiobox v-bind="args" uid="Option D"/>
			      	      <SunLabel :size="args.size">选项 D</SunLabel>
			          </label>
            </SunRadioGroup>
            <button @click="checked = undefined">clear</button>
            {{ checked }}
        </div>
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