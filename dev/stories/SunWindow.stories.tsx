import type { Meta, StoryObj } from '@storybook/vue3';

import SunWindow from '../../src/sundesign/window/SunWindow.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref, type Raw, type Component, type FunctionalComponent, defineComponent } from 'vue';

const meta: Meta<typeof SunWindow> = {
    component: SunWindow,
};

export default meta;
type Story = StoryObj<typeof SunWindow>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Window: Story = {
    decorators: Decorators,
    render: (args) => ({
        components: { SunWindow },
        setup() {
            return { args };
        },
        template: `
			      <SunWindow>
            </SunWindow>
			      <SunWindow>
            </SunWindow>
		`,
    }),
};