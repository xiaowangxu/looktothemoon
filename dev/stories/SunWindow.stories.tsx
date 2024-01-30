import type { Meta, StoryObj } from '@storybook/vue3';

import SunWindow from '../../src/sundesign/window/SunWindow.vue';
import SunButton from '../../src/sundesign/button/SunButton.vue';
import SunScrollContainerVue from '../../src/sundesign/scrollcontainer/SunScrollContainer.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref, type Raw, type Component, type FunctionalComponent, defineComponent } from 'vue';
import { Menu } from 'lucide-vue-next';

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
        components: { SunWindow, SunScrollContainerVue, SunButton, Menu },
        setup() {
            return { args };
        },
        template: `
            <SunWindow></SunWindow>
            <SunWindow borderless>
                <template #default="{drag}">
                    <SunScrollContainerVue style="flex: 1; width: 100%; overflow: hidden;">
                        <div style="width: 600px; height: 600px; background-image: url('https://picsum.photos/600/600');" />
                    </SunScrollContainerVue>
                    <SunButton @mousedown="drag" style="position: absolute; margin: 4px;" squared><Menu /></SunButton>
                </template>
            </SunWindow>
            <SunWindow></SunWindow>
        `,
    }),
};