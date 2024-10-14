import type { Meta, StoryObj } from '@storybook/vue3';

import SunColorPicker from '../../src/sundesign/colorpicker/SunColorPicker.vue';
import { SizeArgs, SizeArgsTypes, BorderMaskArgs, BorderMaskArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';

const meta: Meta<typeof SunColorPicker> = {
    component: SunColorPicker,
};

export default meta;
type Story = StoryObj<typeof SunColorPicker>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const ColorPicker: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunColorPicker },
        setup() {
            const color = ref([1, 0, 0, 0.5]);
            return { args, color };
        },
        template: `
			  <SunColorPicker v-bind="args" v-model="color" @input="()=>console.log('input')" @change="(v)=>console.log('change', v)" />
			  <SunColorPicker v-bind="args" v-model.lazy="color" />
		`,
    }),
    argTypes: {
        ...SizeArgsTypes,
        ...BorderMaskArgsTypes,
    },
    args: {
        ...SizeArgs,
        ...BorderMaskArgs,
        squared: true,
    },
};