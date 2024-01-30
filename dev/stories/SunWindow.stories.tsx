import type { Meta, StoryObj } from '@storybook/vue3';

import SunWindow from '../../src/sundesign/window/SunWindow';
import SunWindowItem from './SunWindowItem.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref, type Raw, type Component, type FunctionalComponent, defineComponent, onBeforeUnmount } from 'vue';

const meta: Meta<typeof SunWindowItem> = {
    component: SunWindowItem,
};

export default meta;
type Story = StoryObj<typeof SunWindowItem>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Window: Story = {
    decorators: Decorators,
    render: (args) => ({
        beforeUnmount() {
            this.win0.close();
            this.win1.close();
            this.win2.close();
        },
        components: {  },
        setup() {
            const win0 = new SunWindow(SunWindowItem);
            const win1 = new SunWindow(SunWindowItem);
            const win2 = new SunWindow(SunWindowItem);
            return { args, win0, win1, win2 };
        },
        template: `
       
        `,
    }),
};