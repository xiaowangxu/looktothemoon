import type { Meta, StoryObj } from '@storybook/vue3';

import SunTag from '@/sundesign/tag/SunTag.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { Search, Save } from 'lucide-vue-next';

const meta: Meta<typeof SunTag> = {
    component: SunTag,
};

export default meta;
type Story = StoryObj<typeof SunTag>;

export const Tag: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunTag, Search, Save },
        setup() {
            return { args };
        },
        template: `
			  <SunTag v-bind="args"><Search />ButtonLike to wrap any control</SunTag>
			  <SunTag v-bind="args" :show-button="false"><Save /></SunTag>
			  <SunTag v-bind="args" no-pressed-color style="width: 100px;">
			  	  <Search />
			  	  <input class="__sun-design__" style="flex: 1; border: none; padding: 0; background-color: transparent; outline: none; width: 0px;" placeholder="查找"/>
			  </SunTag>
		`,
    }),
    argTypes: {
        ...ArgsTypes,
    },
    args: {
        ...Args,
    },
};