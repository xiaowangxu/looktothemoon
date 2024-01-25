import type { Meta, StoryObj } from '@storybook/vue3';

import SunRange from '../../src/sundesign/range/SunRange2D.vue';
import { Cog } from 'lucide-vue-next';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';

const meta: Meta<typeof SunRange> = {
  component: SunRange,
};

export default meta;
type Story = StoryObj<typeof SunRange>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Range: Story = {
  decorators: Decorators,
  tags: ['autodocs'],
  render: (args) => ({
    components: { SunRange, Cog },
    setup() {
      const val = ref([0, 0]);
      return { args, val };
    },
    template: `
			<SunRange v-bind="args" style="width: 150px; height: 150px;" v-model="val"/>
		`,
  }),
  argTypes: {
    ...ArgsTypes,
  },
  args: {
    ...Args,
    min: [0, 0],
    max: [100, 100],
    ticks: [[0, 0], [50, 50], [100, 100]]
  }
};