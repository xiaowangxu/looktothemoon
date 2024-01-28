import type { Meta, StoryObj } from '@storybook/vue3';

import SunTree from '../../src/sundesign/tree/SunTree.vue';
import SunButton from '../../src/sundesign/button/SunButton.vue';
import { SizeArgs, SizeArgsTypes, Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref, type Raw, type Component, defineComponent } from 'vue';
import { ColorSchemeBlue, ColorSchemeRed } from '../../src/sundesign/SunDesignConstants';

const meta: Meta<typeof SunTree> = {
    component: SunTree,
};

export default meta;
type Story = StoryObj<typeof SunTree>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Tree: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunTree, SunButton },
        setup() {
            return { args };
        },
        template: `
			<SunTree style="width: 300px;" v-bind="args">
            <template #append>
                    <SunButton size="small" @click.stop>Test</SunButton>
            </template>
            </SunTree>
		`,
    }),
    argTypes: {
        ...SizeArgsTypes,
    },
    args: {
        ...SizeArgs,
        options: [
            {
                uid: 0,
                label: 'test',
                icon: 'Figma',
                description: 'test',
                subs: [
                    {
                        uid: 1,
                        icon: 'Cog',
                        colorScheme: ColorSchemeBlue,
                        label: 'sub 0',
                    },
                    {
                        uid: 1,
                        icon: 'Cog',
                        label: 'sub 0',
                    },
                    {
                        uid: 1,
                        icon: 'Cog',
                        label: 'sub 0',
                    },
                    {
                        uid: 1,
                        icon: 'Cog',
                        label: 'sub 0',
                    },
                    {
                        uid: 1,
                        icon: 'Cog',
                        label: 'sub 0',
                    },
                    {
                        uid: 1,
                        icon: 'Cog',
                        label: 'sub 0',
                    },
                    {
                        uid: 1,
                        icon: 'Cog',
                        label: 'sub 0',
                    }
                ]
            },
            {
                uid: 0,
                label: 'test',
                icon: 'Figma',
                description: 'test',
                colorScheme: ColorSchemeRed,
                subs: [
                    {
                        uid: 1,
                        icon: 'Cog',
                        colorScheme: ColorSchemeBlue,
                        label: 'sub 0',
                    },
                    {
                        uid: 1,
                        icon: 'Cog',
                        label: 'sub 0',
                    },
                    {
                        uid: 1,
                        icon: 'Cog',
                        label: 'sub 0',
                        subs: [
                            {
                                uid: 0,
                                label: 'test',
                                icon: 'Figma',
                                description: 'test',
                                subs: [
                                    {
                                        uid: 1,
                                        icon: 'Cog',
                                        colorScheme: ColorSchemeBlue,
                                        label: 'sub 0',
                                    },
                                    {
                                        uid: 1,
                                        icon: 'Cog',
                                        label: 'sub 0',
                                    },
                                    {
                                        uid: 1,
                                        icon: 'Cog',
                                        label: 'sub 0',
                                    },
                                    {
                                        uid: 1,
                                        icon: 'Cog',
                                        label: 'sub 0',
                                    },
                                    {
                                        uid: 1,
                                        icon: 'Cog',
                                        label: 'sub 0',
                                    },
                                    {
                                        uid: 1,
                                        icon: 'Cog',
                                        label: 'sub 0',
                                    },
                                    {
                                        uid: 1,
                                        icon: 'Cog',
                                        label: 'sub 0',
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        uid: 1,
                        icon: 'Cog',
                        label: 'sub 0',
                    },
                    {
                        uid: 1,
                        icon: 'Cog',
                        label: 'sub 0',
                    },
                    {
                        uid: 1,
                        icon: 'Cog',
                        label: 'sub 0',
                    },
                    {
                        uid: 1,
                        icon: 'Cog',
                        label: 'sub 0',
                    }
                ]
            }
        ]
    }
};