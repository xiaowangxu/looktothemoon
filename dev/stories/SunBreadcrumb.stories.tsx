import type { Meta, StoryObj } from '@storybook/vue3';

import SunBreadcrumb from '../../src/sundesign/breadcrumb/SunBreadcrumb.vue';
import { SizeArgs, SizeArgsTypes, Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref, type Raw, type Component, defineComponent, markRaw } from 'vue';

const meta: Meta<typeof SunBreadcrumb> = {
    component: SunBreadcrumb,
};

export default meta;
type Story = StoryObj<typeof SunBreadcrumb>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Breadcrumb: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunBreadcrumb },
        setup() {
            return { args };
        },
        template: `
			  <SunBreadcrumb v-bind="args">
        </SunBreadcrumb>
		`,
    }),
    argTypes: {
        ...SizeArgsTypes,
    },
    args: {
        ...SizeArgs,
        options: [
            {
                item: {
                    icon: 'FolderRoot',
                    uid: 'root',
                    iconOnly: true,
                },
            },
            {
                item: {
                    label: 'sys',
                    icon: 'FolderKey',
                    uid: 'sys',
                },
                siblings: [
                    {
                        label: 'sys',
                        icon: 'FolderKey',
                        uid: 'sys'
                    },
                    {
                        label: 'proc',
                        icon: 'FolderKey',
                        uid: 'proc',
                        disabled: true,
                    },
                    {
                        label: 'user',
                        icon: 'Folder',
                        uid: 'user'
                    }
                ]
            },
            {
                item: {
                    label: 'geometries',
                    icon: 'Box',
                    uid: 'geometries',
                    active: true,
                },
                siblings: [
                    {
                        label: 'materials',
                        icon: 'Brush',
                        uid: 'materials'
                    },
                    {
                        label: 'geometries',
                        icon: 'Box',
                        uid: 'geometries'
                    },
                    {
                        label: 'textures',
                        icon: 'Image',
                        uid: 'textures'
                    }
                ]
            },
            {
                item: {
                    label: 'monkey.lttmbin',
                    icon: 'File',
                    uid: 'monkey.lttmbin',
                    disabled: true
                },
            },
            {
                item: {
                    label: 'Header',
                    icon: 'Code2',
                    uid: 'monkey.lttmbin/header',
                },
                siblings: [
                    {
                        label: 'Header',
                        icon: 'Code2',
                        uid: 'monkey.lttmbin/header',
                    },
                    {
                        label: 'Body',
                        icon: 'Cuboid',
                        uid: 'monkey.lttmbin/body',
                    }
                ]
            },
            {
                item: {
                    uid: 100,
                    render: (props, ctx) => {
                        return <>
                            <span style={{ fontFamily: "consolas", fontWeight: 'bold' }}><span style={{ color: '#bd60bd' }}>func</span> <span style={{ color: '#216ff3' }}>main</span>()</span>
                        </>
                    }
                },
                siblings: [{
                    uid: 100,
                    render: (props, ctx) => {
                        return <>
                            <span style={{ fontFamily: "consolas", fontWeight: 'bold', marginRight: 'auto' }}><span style={{ color: '#bd60bd' }}>func</span> <span style={{ color: '#216ff3' }}>main</span>()</span>
                        </>
                    }
                },
                {
                    label: 'Body',
                    icon: 'Cuboid',
                    uid: 'monkey.lttmbin/body',
                },
                {
                    uid: 200,
                    render: (props, ctx) => {
                        return <>
                            <span style={{ fontFamily: "consolas", fontWeight: 'bold', marginRight: 'auto' }}><span style={{ color: '#bd60bd' }}>func</span> <span style={{ color: '#216ff3' }}>add</span>(): <span style={{ color: '#6ff321' }}>number</span></span>
                        </>
                    }
                }]
            },
            {
                item: {
                    label: 'Header',
                    icon: 'Code2',
                    uid: 'monkey.lttmbin/header',
                },
                hideItem: true,
                siblings: [
                    {
                        label: 'Header',
                        icon: 'Code2',
                        uid: 'monkey.lttmbin/header',
                    },
                    {
                        label: 'Body',
                        icon: 'Cuboid',
                        uid: 'monkey.lttmbin/body',
                    }
                ]
            },
        ]
    }
};