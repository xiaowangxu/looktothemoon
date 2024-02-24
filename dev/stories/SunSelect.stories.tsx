import type { Meta, StoryObj } from '@storybook/vue3';

import SunSelect, { type SelectItem } from '../../src/sundesign/select/SunSelect.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';

const meta: Meta<typeof SunSelect> = {
    component: SunSelect,
};

export default meta;
type Story = StoryObj<typeof SunSelect>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Select: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunSelect },
        setup() {
            const value = ref(undefined);
            return { args, value };
        },
        template: `
        <SunSelect />
			  <SunSelect style="min-width: 280px; max-width: 350px;" v-bind="args" v-model="value">
		    		<template #button-empty>
		    			  <span class="__sun-design-select-empty__">没有选中的东西哦</span>
		    		</template>
		    </SunSelect>
		`,
    }),
    argTypes: {
        ...ArgsTypes,
    },
    args: {
        ...Args,
        options: [
            [
                {
                    label: '测试',
                    icon: 'Globe',
                    uid: 0,
                },
                {
                    label: 'Test',
                    icon: 'Cog',
                    description: 'Test 1234567890',
                    uid: 1,
                }],
            [
                {
                    label: '测试',
                    icon: 'Globe',
                    disabled: true,
                    uid: 2,
                }
            ],
            [
                {
                    uid: '123'
                },
                {
                    icon: 'Cog',
                    uid: 6,
                },
                {
                    uid: '124',
                    icon: '',
                    label: 'Icon Blank'
                },
                {
                    uid: '125',
                    icon: 'Info',
                    description: 'test'
                },
                {
                    uid: '126',
                    description: 'description only'
                },
                {
                    uid: '127',
                    shortcut: 'shortcut only'
                },
                {
                    uid: '128',
                    description: 'description only',
                    shortcut: 'shortcut only'
                },
                {
                    label: 'Test abcdefghijkl',
                    uid: '129',
                    icon: 'Cog',
                    description: 'description',
                    shortcut: 'Ctrl A',
                    disabled: true,
                },
            ],
            [
                {
                    label: 'Test',
                    icon: 'Trash',
                    uid: 7,
                    shortcut: 'Ctrl B',
                },
                {
                    label: 'More',
                    icon: 'MoreHorizontal',
                    uid: 9,
                },
                {
                    label: 'Test',
                    icon: 'Trash',
                    uid: 10,
                    shortcut: 'Ctrl B',
                }
            ],
            [
                {
                    uid: 20,
                    renderButtonContent: (props, context) => {
                        return <>
                            <span style={{ marginRight: 'auto' }}>你好世界</span>
                        </>
                    },
                    render: (props, context) => {
                        return <>
                            <h1>Hello World</h1>
                        </>
                    },
                }
            ],
        ],
    },
};

const images = new Array(6).fill(0).map(
    _ => {
        const i = Math.round(Math.random() * 200);
        return {
            uid: i,
            renderButtonContent: (props, context) => {
                return <>
                    <div className="__sun-design-icon__" style={{ backgroundImage: `url('https://picsum.photos/id/${i.toString()}/60/60')`, backgroundSize: 'contain' }} />
                    <span style={{ marginRight: 'auto' }}>图片{i}</span>
                </>
            },
            render: (props, context) => {
                return <>
                    <div style={{ width: '60px', height: '60px', backgroundImage: `url('https://picsum.photos/id/${i.toString()}/60/60')` }} />
                    <span style={{ margin: '0 auto 0 5px' }}>图片{i}</span>
                </>
            },
        } as SelectItem
    }
);

export const SelectCustomRenderItem: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunSelect },
        setup() {
            const value = ref(undefined);
            return { args, value };
        },
        template: `
			<SunSelect v-bind="args" v-model="value" />
		`,
    }),
    argTypes: {
        ...ArgsTypes,
    },
    args: {
        ...Args,
        options: [
            images,
        ],
    },
};