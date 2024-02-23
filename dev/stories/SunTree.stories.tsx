import type { Meta, StoryObj } from '@storybook/vue3';

import SunTree, { type TreeItem } from '../../src/sundesign/tree/SunTree.vue';
import { SunSubTreeOptionsRef, SunTreeDroppable, SunTreeOptionsRef } from '../../src/sundesign/tree/SunTreeConstants';
import SunButton from '../../src/sundesign/button/SunButton.vue';
import SunControlGroup from '../../src/sundesign/controlgroup/SunControlGroup.vue';
import SunControlGroupRow from '../../src/sundesign/controlgroup/SunControlGroupRow.vue';
import { SizeArgs, SizeArgsTypes, Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref, markRaw, type Raw, type Component, defineComponent, watch } from 'vue';
import { UID } from '../../src/sundesign/SunDesignConstants';
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
            const tree_data = new SunTreeOptionsRef<TreeItem>([
                {
                    uid: 320,
                    label: 'test',
                    icon: 'Figma',
                    description: 'test',
                    subs: [
                        {
                            uid: 3211,
                            icon: 'Cog',
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
                    uid: 3223434450,
                    label: 'test',
                    icon: 'Figma',
                    description: 'test',
                    subs: [
                        {
                            uid: 32114461,
                            icon: 'Cog',
                            label: 'sub 0',
                        },

                    ]
                },
                {
                    uid: 425,
                    label: 'test',
                    icon: 'Figma',
                    description: 'test',
                    subs: [
                        {
                            uid: 546531,
                            icon: 'Cog',
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
            const tree_ref = ref<InstanceType<typeof SunTree> | undefined>();
            function onClick(data: any, evt: Event) {
                console.log("clicked >>", data);
                tree_ref.value?.addActive(1223);
            }
            function toggle(folded: boolean) {
                tree_ref.value?.toggle(folded);
            }
            function onAppend(option: TreeItem) {
                const uid = option.uid;
                tree_data.push(uid, {
                    uid: Date.now(), label: new Date().toString(), subs: [{
                        label: '0',
                        uid: `${new Date().toString()}-0`,
                        leaf: true,
                    }, {
                        label: '1',
                        uid: `${new Date().toString()}-1`,
                        leaf: true,
                    }]
                });
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
            const uid = 346;
            function foldOption() {
                tree_ref.value?.toggleOption(uid, true);
            }
            function unfoldOption() {
                tree_ref.value?.toggleOption(uid, false);
            }
            function onDrop(drag: UID | UID[], drop: UID, mode: SunTreeDroppable) {
                console.log(drag, drop, mode);
            }
            return { args, onClick, tree_ref, toggle, tree_data, onAppend, onRemove, onName, foldOption, unfoldOption, onDrop };
        },
        template: `
        
			  <SunTree ref="tree_ref" style="width: 500px;" v-bind="args" uid="tree" :options="tree_data" @click="onClick" @drop="onDrop">
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
        <button @click="toggle(true)">Fold All</button>
        <button @click="toggle(false)">unFold</button>
        <button @click="foldOption">Fold 346</button>
        <button @click="unfoldOption">unFold 346</button>
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
        clickFolding: false,
    }
};