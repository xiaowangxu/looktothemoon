import type { Meta, StoryObj } from '@storybook/vue3';

import SunNumberEdit from '../../src/sundesign/numberedit/SunNumberEdit.vue';
import { Cog } from 'lucide-vue-next';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';

const meta: Meta<typeof SunNumberEdit> = {
    component: SunNumberEdit,
};

export default meta;
type Story = StoryObj<typeof SunNumberEdit>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const NumberEdit: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunNumberEdit, Cog },
        setup() {
            const val = ref(45);
            return { args, val };
        },
        template: `
			  <SunNumberEdit v-bind="args" style="width: 150px;" v-model="val"  @input="v=>console.log('input', v)" @change="v=>console.warn('change', v)">
			  	  <template #prefix>
			  	  	  长度
			  	  </template>
			  	  <template #suffix>
			  	  	  米(m)
			  	  </template>
			  </SunNumberEdit>
			  <SunNumberEdit v-bind="args" style="width: 100px;" v-model.lazy="val">
			  	  <template #suffix>
			  	  	  后缀
			  	  </template>
			  </SunNumberEdit>
			  <SunNumberEdit v-bind="args" style="width: 100px;" :model-value="val" @input="v => val = v">
			  	  <template #prefix>
			  	  	  前缀
			  	  </template>
			  </SunNumberEdit>
			  <SunNumberEdit v-bind="args" progress style="width: 150px;" v-model="val" disabled/>
        {{val}}
		`,
    }),
    argTypes: {
        ...ArgsTypes,
    },
    args: {
        ...Args,
        min: 0,
        max: 100,
        step: 1,
        displayPercision: 1,
    },
};