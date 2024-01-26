import type { Meta, StoryObj } from '@storybook/vue3';

import SunLoading from '../../src/sundesign/loading/SunLoading.vue';
import { SizeArgs,SizeArgsTypes, Decorators } from './SunDesignArgs';

const meta: Meta<typeof SunLoading> = {
    component: SunLoading,
};

export default meta;
type Story = StoryObj<typeof SunLoading>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Loading: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunLoading },
        setup() {
            return { args };
        },
        template: `
			      <SunLoading v-bind="args" />
		    `,
    }),
    argTypes: {
        ...SizeArgsTypes,
    },
    args: {
        ...SizeArgs,
    }
};