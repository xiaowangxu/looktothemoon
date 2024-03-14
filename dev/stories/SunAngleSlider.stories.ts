import type { Meta, StoryObj } from '@storybook/vue3';

import SunAngleSlider from '../../src/sundesign/slider/SunAngleSlider.vue';
import SunButtonPopupNoScroll from '../../src/sundesign/buttonpopup/SunButtonPopupNoScroll.vue';
import { SizeArgs, SizeArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';

const meta: Meta<typeof SunAngleSlider> = {
    component: SunAngleSlider,
};

export default meta;
type Story = StoryObj<typeof SunAngleSlider>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const AngleSlider: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunAngleSlider, SunButtonPopupNoScroll },
        setup() {
            const deg = ref(0);
            return { args, deg };
        },
        template: `
            <SunAngleSlider v-bind="args" v-model="deg">
            </SunAngleSlider>
            <SunAngleSlider v-bind="args" v-model.lazy="deg">
                <template #default={deg}>{{deg.toFixed(0)}}度</template>
            </SunAngleSlider>
            <SunAngleSlider v-bind="args" disabled v-model="deg">
            </SunAngleSlider>
            <div style="width: 100px;"/>
            <SunButtonPopupNoScroll container panel-style="overflow: visible;" :get-popup-rect="(b, c, w)=>{
                return ({x: b.x+(b.width - c.width) / 2, y: b.y+b.height+6, ...c})
            }">
                <template #button>
                    {{deg.toFixed(2)}}°
                </template>
                <template #popup>
                    <SunAngleSlider v-bind="args" v-model.lazy="deg" drop-shadow/>
                </template>
            </SunButtonPopupNoScroll>
		`,
    }),
    argTypes: {
    },
    args: {
    },
};