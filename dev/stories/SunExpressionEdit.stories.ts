import type { Meta, StoryObj } from '@storybook/vue3';

import SunExpressionEdit from '../../src/sundesign/expedit/SunExpressionEdit.vue';
import SunLineEdit from '../../src/sundesign/lineedit/SunLineEdit.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';

const meta: Meta<typeof SunExpressionEdit> = {
    component: SunExpressionEdit,
};

export default meta;
type Story = StoryObj<typeof SunExpressionEdit>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const ExpressionEdit: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunExpressionEdit, SunLineEdit },
        setup() {
            const value = ref('test');
            return { args, value };
        },
        template: `
        <!-- v-model.lazy="value" placeholder="输入文本" -->
			  <SunExpressionEdit v-bind="args"/>
        <SunLineEdit v-bind="args" :model-value="'1+2'"/>
		`,
    }),
    argTypes: {
    },
    args: {
    },
};