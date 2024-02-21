import type { Meta, StoryObj } from '@storybook/vue3';

import SunHSlider from '../../src/sundesign/slider/SunHSlider.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';

const meta: Meta<typeof SunHSlider> = {
    component: SunHSlider,
};

export default meta;
type Story = StoryObj<typeof SunHSlider>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const HSlider: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunHSlider },
        setup() {
            const val = ref(50);
            return { args, val };
        },
        template: `
		        <SunHSlider v-bind="args" style="width: 150px;" v-model="val" @input="v=>console.log('input', v)" @change="v=>console.warn('change', v)"/>
		        <SunHSlider v-bind="args" style="width: 150px;" v-model.lazy="val"/>
		`,
    }),
    argTypes: {
        ...ArgsTypes,
    },
    args: {
        ...Args,
        min: 0,
        max: 100,
        // ticks: [0, 25, 50, 75, 100]
    }
};