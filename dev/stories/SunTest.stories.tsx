import type { Meta, StoryObj } from '@storybook/vue3';

import SunButton from '../../src/sundesign/button/SunButton.vue';
import SunHoverMenu, { vHoverMenu } from '../../src/sundesign/hovermenu/SunHoverMenu.tsx';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref, type Raw, type Component, type FunctionalComponent, defineComponent } from 'vue';
import SunPanelContainer from '../../src/sundesign/panel/SunPanelContainer.vue';
import { Item } from '../../src/sundesign/SunDesignConstants';
import SunButtonItem from '../../src/sundesign/item/SunButtonItem.vue';
import SunLabelVue from '../../src/sundesign/label/SunLabel.vue';

const meta: Meta<typeof SunButton> = {
    component: SunButton,
};

export default meta;
type Story = StoryObj<typeof SunButton>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Select: Story = {
    decorators: Decorators,
    render: (args) => ({
        components: { SunButton },
        directives: {
            hoverMenu: vHoverMenu,
        },
        setup() {
            function onClick(evt: MouseEvent) {
                console.log('clicked');
            }
            return { args, onClick, a };
        },
        template: `
			<SunButton @click="onClick" v-hover-menu:test.nohover="{ content: a }">HoverMenu0</SunButton>
			<SunButton @click="onClick" v-hover-menu:test.html.label="'<a>更多信息</a></br>Lorem ipsum dolor sit amet consectetur adipisicing elit.</br>Accusantium officiis minus, tempore pariatur hic et nam consequatur fugit, dolorum debitis maiores quam repellat commodi aspernatur sequi quidem ratione cumque eveniet.'">HoverMenu1</SunButton>
		`,
    }),
};

const a: FunctionalComponent<{ item: Item }, { click: (evt: Event) => void }> = (props, context) => {
    return <>
        <SunPanelContainer noPadding={true} style="width: 100%; flex: 1;">
            <SunLabelVue noHorizontalPadding={false}><a href=''>更多信息</a>(Ctrl + 单击)</SunLabelVue>
            {/* <SunButton style="flex: 1;" onClick={(e: MouseEvent) => {
				e.preventDefault();
				context.emit('click', e as any as Event);
			}} colorScheme={props.item.colorScheme} size="small">
				<SunButtonItem label={props.item.label} icon={props.item.icon} />
			</SunButton> */}
        </SunPanelContainer>
    </>
}