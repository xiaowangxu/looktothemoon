import type { Meta, StoryObj } from '@storybook/vue3';

import SunResizeObserver from '../../src/sundesign/scrollcontainer/SunResizeObserver.vue';
import { ref } from 'vue';
import { Decorators } from './SunDesignArgs';

const meta: Meta<typeof SunResizeObserver> = {
    component: SunResizeObserver,
};

export default meta;
type Story = StoryObj<typeof SunResizeObserver>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Textarea: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunResizeObserver },
        setup() {
            const value = ref(true);
            return { args, value };
        },
        template: `
            <button @click="value = !value">switch {{value ? 0 : 1}}</button>
			<SunResizeObserver @resized="(a, b, c)=>console.log(a, b, c)">
                <div v-if="value" style="width: 100px; height: 100px; background-color: tomato; resize: both; overflow: hidden;" key="0"/>
                <div v-else style="width: 100px; height: 100px; background-color: skyblue; resize: both; overflow: hidden;" key="1"/>
            </SunResizeObserver>
		`,
    }),
    argTypes: {
    },
    args: {
    },
};