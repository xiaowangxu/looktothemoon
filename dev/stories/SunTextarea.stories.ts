import type { Meta, StoryObj } from '@storybook/vue3';

import SunTextarea from '../../src/sundesign/textarea/SunTextarea.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';

const meta: Meta<typeof SunTextarea> = {
    component: SunTextarea,
};

export default meta;
type Story = StoryObj<typeof SunTextarea>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Textarea: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunTextarea },
        setup() {
            const value = ref('test');
            return { args, value };
        },
        template: `
			  <SunTextarea v-bind="args" v-model.lazy="value" placeholder="输入文本"/>
			  <SunTextarea v-model="value" v-bind="args" flat/>
			  <SunTextarea v-bind="args" v-model="value" disabled placeholder="disabled"/>
			  <SunTextarea v-model="value" v-bind="args" disabled placeholder="disabled"/>
		`,
    }),
    argTypes: {
        ...ArgsTypes,
    },
    args: {
        ...Args,
    },
};