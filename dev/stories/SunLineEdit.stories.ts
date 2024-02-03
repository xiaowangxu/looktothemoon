import type { Meta, StoryObj } from '@storybook/vue3';

import SunLineEdit from '../../src/sundesign/lineedit/SunLineEdit.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';

const meta: Meta<typeof SunLineEdit> = {
    component: SunLineEdit,
};

export default meta;
type Story = StoryObj<typeof SunLineEdit>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const LineEdit: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunLineEdit },
        setup() {
            const value = ref('test');
            return { args, value };
        },
        template: `
			  <SunLineEdit v-bind="args" v-model.lazy="value" placeholder="输入文本"/>
			  <SunLineEdit v-model="value" v-bind="args" flat/>
			  <SunLineEdit v-bind="args" v-model="value" disabled placeholder="disabled"/>
			  <SunLineEdit v-model="value" v-bind="args" disabled placeholder="disabled"/>
		`,
    }),
    argTypes: {
        ...ArgsTypes,
    },
    args: {
        ...Args,
    },
};