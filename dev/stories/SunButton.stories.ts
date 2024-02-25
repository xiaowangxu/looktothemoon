import type { Meta, StoryObj } from '@storybook/vue3';

import SunButton from '../../src/sundesign/button/SunButton.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { Search, X } from 'lucide-vue-next';
import SunIcon from '../../src/sundesign/icon/SunIcon.vue';

const meta: Meta<typeof SunButton> = {
    component: SunButton,
};

export default meta;
type Story = StoryObj<typeof SunButton>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Button: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunButton, Search, X, SunIcon },
        setup() {
            return { args };
        },
        template: `
			  <SunButton v-bind="args">按钮</SunButton>
			  <SunButton v-bind="args"><Search />按钮</SunButton>
			  <SunButton v-bind="args" squared><Search /></SunButton>
			  <SunButton v-bind="args" disabled>disabled</SunButton>
			  <SunButton v-bind="args"><SunIcon name="Loader2" animation="rotate"/>按钮</SunButton>
			  <SunButton v-bind="args">前往<SunIcon name="ArrowRight" animation="slide-r"/></SunButton>
			  <SunButton v-bind="args">新变化<SunIcon name="Bell" animation="ring" /></SunButton>
			  <div style="display: flex; flex-wrap: nowrap;">
			  	  <SunButton v-bind="args" :border-mask="0b1001" style="margin-right: -1px;">查找</SunButton>
			  	  <SunButton v-bind="args" :border-mask="0b0110" squared><X /></SunButton>
			  </div>
      `,
    }),
    argTypes: {
        ...ArgsTypes,
    },
    args: {
        ...Args,
    },
};

export const IconOnly: Story = {
    decorators: Decorators,
    render: (args) => ({
        components: { SunButton, Search, SunIcon },
        setup() {
            return { args };
        },
        template: `
			<SunButton v-bind="args" size="small" squared><SunIcon name="Loader" animation="rotate" /></SunButton>
			<SunButton v-bind="args" size="normal" squared><SunIcon name="Loader" animation="rotate" /></SunButton>
			<SunButton v-bind="args" size="normal" squared><SunIcon name="Loader" animation="blink" /></SunButton>
			<SunButton v-bind="args" size="large" squared><SunIcon name="Vibrate" animation="shake" /></SunButton>
			<SunButton v-bind="args" size="large" squared><SunIcon name="Loader" animation="rotate" /></SunButton>
			<SunButton v-bind="args" size="large" squared><SunIcon name="Bell" animation="ring" /></SunButton>
		`,
    }),
    argTypes: {
        ...ArgsTypes,
    },
    args: {
        ...Args,
    },
};