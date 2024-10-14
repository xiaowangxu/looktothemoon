import type { Meta, StoryObj } from '@storybook/vue3';

import SunFormatEdit from '@/sundesign/formatedit/SunFormatEdit.vue';
import SunFormatEditSection from '@/sundesign/formatedit/SunFormatEditSection.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { Search, Save } from 'lucide-vue-next';
import { ref, watch } from 'vue';

const meta: Meta<typeof SunFormatEdit> = {
    component: SunFormatEdit,
};

export default meta;
type Story = StoryObj<typeof SunFormatEdit>;

export const Tag: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunFormatEdit, SunFormatEditSection, Search, Save },
        setup() {
            const year = ref("2024");
            watch(year, (n, o)=>{
                console.log(n, o);
            });
            return { args, year };
        },
        template: `
			  <SunFormatEdit v-bind="args">
                <SunFormatEditSection v-model.lazy="year" @input="()=>console.log('input')" @change="()=>console.log('change')" :format="(a, b)=> b.substring(0, 4).padEnd(4, '0')">年</SunFormatEditSection>
                <SunFormatEditSection model-value="5">月</SunFormatEditSection>
                <SunFormatEditSection model-value="16">日</SunFormatEditSection>
                <SunFormatEditSection model-value="12"></SunFormatEditSection>
                :
                <SunFormatEditSection model-value="24"></SunFormatEditSection>
              </SunFormatEdit>
		`,
    }),
    argTypes: {
        ...ArgsTypes,
    },
    args: {
        ...Args,
    },
};