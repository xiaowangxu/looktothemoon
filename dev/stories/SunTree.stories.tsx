import type { Meta, StoryObj } from '@storybook/vue3';

import SunTree, { type TreeItem } from '../../src/sundesign/tree/SunTree.vue';
import { SunTreeOptionsRef } from '../../src/sundesign/tree/SunTreeConstants';
import SunButton from '../../src/sundesign/button/SunButton.vue';
import SunControlGroup from '../../src/sundesign/controlgroup/SunControlGroup.vue';
import SunControlGroupRow from '../../src/sundesign/controlgroup/SunControlGroupRow.vue';
import { SizeArgs, SizeArgsTypes, Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref, markRaw, type Raw, type Component, defineComponent, watch } from 'vue';
import { ColorSchemeBlue, ColorSchemeRed } from '../../src/sundesign/SunDesignConstants';
import SunIcon from '../../src/sundesign/icon/SunIcon.vue';
import { Coins, Sun } from 'lucide-vue-next';

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
        components: { SunTree, SunButton, SunControlGroupRow, SunControlGroup },
        setup() {
            const tree_data = new SunTreeOptionsRef([
                {
                    uid: 320,
                    label: 'test',
                    icon: 'Figma',
                    description: 'test',
                    subs: [
                        {
                            uid: 3211,
                            icon: 'Cog',
                            colorScheme: ColorSchemeBlue,
                            label: 'sub 0',
                        },
                        {
                            uid: 121,
                            icon: 'Cog',
                            label: 'sub 0',
                        },
                        {
                            uid: 167,
                            icon: 'Cog',
                            label: 'sub 0',
                        },
                        {
                            uid: 13265,
                            icon: 'Cog',
                            label: 'sub 0',
                        },
                        {
                            uid: 13412,
                            icon: 'Cog',
                            label: 'sub 0',
                        },
                        {
                            uid: 45,
                            icon: 'Cog',
                            label: 'sub 0',
                        },
                        {
                            uid: 234,
                            icon: 'Cog',
                            label: 'sub 0',
                        }
                    ]
                },
                {
                    uid: 425,
                    label: 'test',
                    icon: 'Figma',
                    description: 'test',
                    colorScheme: ColorSchemeRed,
                    subs: [
                        {
                            uid: 546531,
                            icon: 'Cog',
                            colorScheme: ColorSchemeBlue,
                            label: 'sub 0',
                        },
                        {
                            uid: 1223,
                            icon: 'Cog',
                            label: 'sub 0',
                            disabled: true,
                        },
                        {
                            uid: 6531,
                            icon: 'Cog',
                            label: 'sub 0',
                            subs: [
                                {
                                    uid: 346,
                                    label: 'test12783gdwegyuerg7834f78',
                                    icon: 'Figma',
                                    description: 'test',
                                    subs: [
                                        {
                                            uid: 5471,
                                            icon: 'Cog',
                                            colorScheme: ColorSchemeBlue,
                                            label: 'sub 0',
                                            leaf: true,
                                        },
                                        {
                                            uid: 561,
                                            icon: 'Cog',
                                            label: 'sub 0',
                                            leaf: true,
                                        },
                                        {
                                            uid: 467,
                                            icon: 'Cog',
                                            label: 'sub 0',
                                            leaf: true,
                                        },
                                        {
                                            uid: 623531,
                                            icon: 'Cog',
                                            label: 'sub 0',
                                            leaf: true,
                                        },
                                    ]
                                }
                            ]
                        },
                        {
                            uid: 541,
                            icon: 'Cog',
                            label: 'sub 0',
                            subs: [
                                {
                                    uid: 65467,
                                    icon: 'Cog',
                                    label: '这是一个测试，这是一个测试，这是一个测试，这是一个测试，这是一个测试',
                                    leaf: true,
                                },
                                {
                                    uid: 176565,
                                    label: 'RenderTreeItem',
                                    leaf: true,
                                    render: (props, ctx) => {
                                        return <>
                                            <Sun />
                                            <span style={{ marginRight: 'auto', textOverflow: 'ellipsis', overflow: 'hidden' }}>这是一个测试，这是一个测试，这是一个测试，这是一个测试，这是一个测试</span>
                                            <div style={{ minWidth: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'red' }}></div>
                                        </>
                                    }
                                },
                                {
                                    uid: 45361,
                                    icon: 'Cog',
                                    label: 'sub 0',
                                }
                            ]
                        },
                        {
                            uid: 123,
                            icon: 'Cog',
                            label: 'sub 0',
                        },
                        {
                            uid: 2341,
                            icon: 'Cog',
                            label: 'sub 0',
                        },
                        {
                            uid: 354631,
                            icon: 'Cog',
                            label: 'sub 0',
                        }
                    ]
                }
            ]);
            watch(tree_data.options, _ => console.log([...tree_data.uid_map.entries()]), { deep: true });
            const tree_ref = ref<InstanceType<typeof SunTree> | undefined>();
            function onClick(data: any, evt: Event) {
                console.log(data, evt);
            }
            function toggle() {
                tree_ref.value?.toggle(true, true);
            }
            function onAppend(option: TreeItem) {
                const uid = option.uid;
                tree_data.push(uid, { uid: Date.now(), label: new Date().toString() });
            }
            function onRemove(option: TreeItem) {
                const uid = option.uid;
                tree_data.delete(uid);
            }
            function onName(option: TreeItem) {
                if (tree_data.has(option.uid)) {
                    tree_data.get(option.uid)!.label += '*';
                }
            }
            return { args, onClick, tree_ref, toggle, tree_data: markRaw(tree_data), onAppend, onRemove, onName };
        },
        template: `
        <button @click="toggle">Fold All</button>
			  <SunTree ref="tree_ref" style="width: 500px;" v-bind="args" :options="tree_data" @click="onClick">
            <template #append="{option}">
                <SunControlGroup>
                    <SunControlGroupRow>
                        <SunButton size="small" squared @click="onRemove(option)">-</SunButton>
                        <SunButton size="small" squared @click="onAppend(option)">+</SunButton>
                        <SunButton size="small" squared @click="onName(option)">N</SunButton>
                    </SunControlGroupRow>
                </SunControlGroup>
            </template>
        </SunTree>
		`,
    }),
    argTypes: {
        ...SizeArgsTypes,
        mode: {
            options: ['instance', 'visibility'],
            control: { type: 'radio' },
        },
        // picking: {
        //     options: ['leaf', 'group', 'instance', 'none'],
        //     mapping: {
        //         leaf: 'leaf',
        //         group: 'group',
        //         instance: 'instance',
        //         none: undefined,
        //     }
        // }
    },
    args: {
        ...SizeArgs,
    }
};