import type { Meta, StoryObj } from '@storybook/vue3';

import SunSelect, { type SelectItem } from '../../src/sundesign/select/SunSelect.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ColorSchemeBlue, ColorSchemeGreen } from '@/sundesign/SunDesignConstants';
import { ColorSchemeRed } from '../../src/sundesign/SunDesignConstants';
import { ref, watch } from 'vue';
import SunColorPickerVue from '@/sundesign/colorpicker/SunColorPicker.vue';
import SunButtonVue from '@/sundesign/button/SunButton.vue';
import { Plus } from 'lucide-vue-next';
import SunPanelContainerVue from '@/sundesign/panel/SunPanelContainer.vue';
import SunLabelVue from '@/sundesign/label/SunLabel.vue';

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
                },
                {
                    label: 'Test',
                    icon: 'Cog',
                    description: 'Test',
                    uid: 3,
                },
                {
                    label: 'Test',
                    icon: 'Trash',
                    uid: 4,
                    description: '有快捷键哦~~~~~~~',
                    shortcut: 'Ctrl B',
                }],
            [
                {
                    label: '测试',
                    icon: 'Globe',
                    uid: 5,
                },
                {
                    label: 'Test',
                    icon: 'Cog',
                    description: 'Test',
                    uid: 6,
                },
                {
                    label: 'Test',
                    icon: 'Trash',
                    uid: 7,
                    colorScheme: ColorSchemeRed,
                    shortcut: 'Ctrl B',
                }],
            [
                {
                    label: '测试',
                    icon: 'Globe',
                    uid: 8,
                },
                {
                    label: 'More',
                    icon: 'MoreHorizontal',
                    colorScheme: ColorSchemeGreen,
                    uid: 9,
                },
                {
                    label: 'Test',
                    colorScheme: ColorSchemeBlue,
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
                            <span style="margin-right: auto;">你好世界</span>
                        </>
                    },
                    render: (props, context) => {
                        return <>
                            <h1 class="__sun-design__ colored sized border-masked" data-size="large" data-border-mask="15" style="margin: 0;" onClick={(evt) => props.click(props.uid, evt)}>Hello World</h1>
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
                    <div class="__sun-design-icon__" style={`background-image: url('https://picsum.photos/id/${props.uid.toString()}/60/60'); background-size: contain;`} />
                    <span style="margin-right: auto;">图片{i}</span>
                </>
            },
            render: (props, context) => {
                return <>
                    <SunButtonVue flat active={props.selected} onClick={(evt) => props.click(props.uid, evt)}>
                        <div style={`width: 60px; height: 60px; background-image: url('https://picsum.photos/id/${props.uid.toString()}/60/60')`} />
                        <span style="margin: 0 auto 0 5px;">图片{i}</span>
                    </SunButtonVue>
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