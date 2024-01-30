import type { Meta, StoryObj } from '@storybook/vue3';

import SunButtonLike from '@/sundesign/button/SunButtonLike.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { Search, X } from 'lucide-vue-next';

const meta: Meta<typeof SunButtonLike> = {
    component: SunButtonLike,
};

export default meta;
type Story = StoryObj<typeof SunButtonLike>;

export const ButtonLike: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunButtonLike, Search },
        setup() {
            return { args };
        },
        template: `
			  <SunButtonLike v-bind="args"><Search />ButtonLike to wrap any control</SunButtonLike>
			  <SunButtonLike v-bind="args" squared><Search /></SunButtonLike>
			  <SunButtonLike v-bind="args" no-pressed-color style="width: 100px;">
			  	  <Search />
			  	  <input class="__sun-design__" style="flex: 1; border: none; padding: 0; background-color: transparent; outline: none; width: 0px;" placeholder="查找"/>
			  </SunButtonLike>
		`,
    }),
    argTypes: {
        ...ArgsTypes,
    },
    args: {
        ...Args,
    },
};