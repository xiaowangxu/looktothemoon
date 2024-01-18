import type { Meta, StoryObj } from '@storybook/vue3';

import SunPanel from '../sundesign/panel/SunPanel.vue';
import SunLineEdit from '../sundesign/lineedit/SunLineEdit.vue';
import SunPanelContainer from '../sundesign/panel/SunPanelContainer.vue';
import SunPanelSeparator from '../sundesign/panel/SunPanelSeparator.vue';
import SunButton from '../sundesign/button/SunButton.vue';
import SunButtonLike from '../sundesign/button/SunButtonLike.vue';
import SunKeyboard from '@/sundesign/keyboard/SunKeyboard.vue';
import { Search, Undo2, Redo2, Trash, X, Save, ChevronRight, MoreHorizontal } from 'lucide-vue-next';
import { SizeArgs, SizeArgsTypes, Decorators } from './SunDesignArgs';
import { ColorSchemeBlue, ColorSchemeRed } from '@/sundesign/SunDesignConstants';
import SunScrollBar from '../sundesign/scrollcontainer/SunScrollBar.vue';
import { ref } from 'vue';

const meta: Meta<typeof SunPanel> = {
	component: SunPanel,
};

export default meta;
type Story = StoryObj<typeof SunPanel>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Panel: Story = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: { SunPanel, SunButton, SunScrollBar, SunButtonLike, SunLineEdit, SunKeyboard, SunPanelContainer, SunPanelSeparator, Search, Undo2, Redo2, Trash, X, Save, ChevronRight, MoreHorizontal },
		setup() {
			const percentage = ref(0.25);
			return { args, colorSchemeBlue: ColorSchemeBlue, colorSchemeRed: ColorSchemeRed, percentage };
		},
		template: `
			<SunPanel v-bind="args">
				<SunPanelContainer>
					<SunButton flat :color-scheme="colorSchemeBlue"></SunButton>
				</SunPanelContainer>
				<SunPanelSeparator />
				<SunPanelContainer>
					<SunButton flat :color-scheme="colorSchemeRed"></SunButton>
				</SunPanelContainer>
			</SunPanel>
			<SunPanel v-bind="args" size="small">
				<SunPanelContainer>
					<SunButton flat squared size="small"><Save /></SunButton>
					<SunButton flat squared size="small"><Undo2 /></SunButton>
					<SunButton flat squared size="small"><Redo2 /></SunButton>
				</SunPanelContainer>
			</SunPanel>
			<SunPanel v-bind="args">
				<SunPanelContainer>
					<SunButton flat squared><Save /></SunButton>
					<SunButton flat squared><Undo2 /></SunButton>
					<SunButton flat squared><Redo2 /></SunButton>
				</SunPanelContainer>
			</SunPanel>
			<SunPanel v-bind="args" size="large">
				<SunPanelContainer>
					<SunButton flat squared size="large"><Save /></SunButton>
					<SunButton flat squared size="large"><Undo2 /></SunButton>
					<SunButton flat squared size="large"><Redo2 /></SunButton>
				</SunPanelContainer>
			</SunPanel>
			<SunPanel v-bind="args" vertical>
				<SunPanelContainer vertical>
					<SunButton flat></SunButton>
					<SunButton flat :color-scheme="colorSchemeBlue"></SunButton>
					</SunPanelContainer>
				<SunPanelSeparator />
				<SunPanelContainer vertical>
					<SunButton flat></SunButton>
				</SunPanelContainer>
				<SunPanelSeparator />
				<SunPanel v-bind="args" container>
					<SunPanelContainer>
						<SunButton flat :color-scheme="colorSchemeRed"></SunButton>
					</SunPanelContainer>
					<SunPanelSeparator :override-vertical="false"/>
					<SunPanelContainer>
						<SunButton flat></SunButton>
					</SunPanelContainer>
				</SunPanel>
			</SunPanel>
			<SunPanel v-bind="args" vertical style="min-width: 170px;">
				<SunPanelContainer vertical>
					<SunButtonLike no-vertical-padding>
						<Search />
						<SunLineEdit placeholder="查找" flat no-background style="padding-left: 0; padding-right: 0; flex: 1; width: 0;"/>
						<SunButton size="small" squared><X /></SunButton>
					</SunButtonLike>
				</SunPanelContainer>
				<SunPanelSeparator />
				<SunPanelContainer vertical>
					<SunButton flat><Undo2 /><span style="margin-right: auto;">撤销</span><SunKeyboard>Ctrl Z</SunKeyboard></SunButton>
					<SunButton flat disabled><Redo2 /><span style="margin-right: auto;">重做</span><SunKeyboard>Ctrl Y</SunKeyboard></SunButton>
				</SunPanelContainer>
				<SunPanelSeparator />
				<SunPanelContainer vertical>
					<SunButtonLike size="small"><span style="margin-right: auto;">Test</span></SunButtonLike>
				</SunPanelContainer>
				<SunPanelSeparator />
				<SunPanelContainer vertical>
					<SunButton flat><MoreHorizontal /><span style="margin-right: auto;">更多</span><ChevronRight /></SunButton>
				</SunPanelContainer>
				<SunPanelSeparator />
				<SunPanelContainer vertical>
					<SunButton flat :color-scheme="colorSchemeRed"><Trash /><span style="margin-right: auto;">删除</span><SunKeyboard>Del</SunKeyboard></SunButton>
				</SunPanelContainer>
				<SunScrollBar v-bind="args" vertical v-model:percentage="percentage" :drag-factor="1"/>
			</SunPanel>
		`,
	}),
	argTypes: {
		...SizeArgsTypes,
	},
	args: {
		...SizeArgs,
	},
};