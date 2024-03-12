import type { Meta, StoryObj } from '@storybook/vue3';

import SunMultiEdit from '../../src/sundesign/multiedit/SunMultiEdit.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';

const meta: Meta<typeof SunMultiEdit> = {
    component: SunMultiEdit,
};

export default meta;
type Story = StoryObj<typeof SunMultiEdit>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const LineEdit: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunMultiEdit },
        setup() {
            const value = ref('test');
            return { args, value };
        },
        template: `
			  <SunMultiEdit v-bind="args" v-model.lazy="value" placeholder="输入文本"/>
			  <SunMultiEdit v-model="value" v-bind="args" flat/>
			  <SunMultiEdit v-bind="args" v-model="value" disabled placeholder="disabled"/>
			  <SunMultiEdit v-model="value" v-bind="args" disabled placeholder="disabled"/>
		`,
    }),
    argTypes: {
        // ...ArgsTypes,
    },
    args: {
        // ...Args,
    },
};