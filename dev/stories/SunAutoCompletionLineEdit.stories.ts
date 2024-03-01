import type { Meta, StoryObj } from '@storybook/vue3';

import SunAutoCompletionLineEdit from '../../src/sundesign/lineedit/SunAutoCompletionLineEdit.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';
import { CompletionItem } from '../../src/sundesign/completion/SunCompletion.vue';

const meta: Meta<typeof SunAutoCompletionLineEdit> = {
    component: SunAutoCompletionLineEdit,
};

export default meta;
type Story = StoryObj<typeof SunAutoCompletionLineEdit>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const AutoCompletionLineEdit: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunAutoCompletionLineEdit },
        setup() {
            const value = ref('test');
            const options = ref<CompletionItem[]>([
                {
                    uid: 'AAA',
                    label: 'AAAA AAA AA A ab',
                    description: '(property) String.length: number',
                    icon: 'Cuboid',
                },
                {
                    uid: 'length',
                    label: '长度',
                    description: '(property) String.length: number',
                    icon: 'Cuboid',
                },
                {
                    uid: 'id',
                    label: 'id',
                    icon: 'Cuboid',
                },
                {
                    uid: 'toString',
                    label: '转文本',
                    description: '(method) String.toString(): string',
                    icon: 'FunctionSquare',
                },
                {
                    uid: 'toLowerCase',
                    label: 'toLowerCase',
                    description: '(method) String.toLowerCase(): string',
                    icon: 'FunctionSquare',
                },
                {
                    uid: 'toFix',
                    label: 'toFix',
                    description: '(method) String.toFix(): string',
                    icon: 'FunctionSquare',
                },
                {
                    uid: 'trim',
                    label: 'trim',
                    description: '(method) String.trim(): string',
                    icon: 'FunctionSquare',
                },
                {
                    uid: 'split',
                    label: 'split',
                    icon: 'FunctionSquare',
                },
            ]);
            return { args, value, options };
        },
        template: `
			  <SunAutoCompletionLineEdit v-bind="args" v-model="value" placeholder="输入文本" :options="options"/>
		`,
    }),
    argTypes: {
        // ...ArgsTypes,
    },
    args: {
        // ...Args,
    },
};