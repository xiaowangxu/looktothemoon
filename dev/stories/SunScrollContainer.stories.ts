import type { Meta, StoryObj } from '@storybook/vue3';

import SunScrollContainer from '../../src/sundesign/scrollcontainer/SunScrollContainer.vue';
import SunButton from '../../src/sundesign/button/SunButton.vue';
import SunPanel from '../../src/sundesign/panel/SunPanel.vue';
import SunPanelContainer from '../../src/sundesign/panel/SunPanelContainer.vue';
import SunPanelSeparator from '../../src/sundesign/panel/SunPanelSeparator.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';

const meta: Meta<typeof SunScrollContainer> = {
	component: SunScrollContainer,
};

export default meta;
type Story = StoryObj<typeof SunScrollContainer>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const ScrollContainer: Story = {
	decorators: Decorators,
	tags: ['autodocs'],
	render: (args) => ({
		components: { SunScrollContainer, SunButton, SunPanel, SunPanelContainer, SunPanelSeparator },
		setup() {
			return { args };
		},
		template: `
			<SunPanel style="height: 200px; overflow: hidden;" vertical>
				<SunScrollContainer v-bind="args" content-style="width: 100px;">
					<SunPanelContainer vertical gap>
						<SunButton>AAA</SunButton>
						<SunButton>BBB</SunButton>
						<SunButton>CCC</SunButton>
						<SunButton>DDD</SunButton>
						<SunButton>EEE</SunButton>
						<SunButton>FFF</SunButton>
						<SunButton>GGG</SunButton>
						<SunButton>HHH</SunButton>
						<SunButton>III</SunButton>
						<SunButton>JJJ</SunButton>
						<SunButton>KKK</SunButton>
					</SunPanelContainer>
					<SunPanelSeparator />
					<SunPanelContainer vertical gap>
						<SunButton>LLL</SunButton>
						<SunButton>MMM</SunButton>
						<SunButton>NNN</SunButton>
						<SunButton>OOO</SunButton>
						<SunButton>PPP</SunButton>
						<SunButton>QQQ</SunButton>
						<SunButton>RRR</SunButton>
						<SunButton>SSS</SunButton>
						<SunButton>TTT</SunButton>
						<SunButton>UUU</SunButton>
						<SunButton>VVV</SunButton>
					</SunPanelContainer>
				</SunScrollContainer>
			</SunPanel>
			<SunPanel style="width: 200px; overflow: hidden;">
				<SunScrollContainer v-bind="{...args}">
					<SunPanel container>
						<SunPanelContainer>
							<SunButton squared flat>1</SunButton>
							<SunButton squared flat>2</SunButton>
						</SunPanelContainer>
						<SunPanelSeparator />
						<SunPanelContainer>
							<SunButton squared flat>3</SunButton>
							<SunButton squared flat>4</SunButton>
						</SunPanelContainer>
						<SunPanelSeparator />
						<SunPanelContainer>
							<SunButton squared flat>5</SunButton>
							<SunButton squared flat>6</SunButton>
						</SunPanelContainer>
						<SunPanelSeparator />
						<SunPanelContainer>
							<SunButton squared flat>7</SunButton>
							<SunButton squared flat>8</SunButton>
						</SunPanelContainer>
						<SunPanelSeparator />
						<SunPanelContainer>
							<SunButton squared flat>9</SunButton>
							<SunButton squared flat>10</SunButton>
						</SunPanelContainer>
					</SunPanel>
				</SunScrollContainer>
			</SunPanel>
			<SunPanel style="width: 300px; height: 300px; overflow: hidden;" size="large">
				<SunScrollContainer v-bind="{...args, width: undefined, height: undefined, scrollBarVisibility: 'hover', scrollableIndicators: false }">
					<div style="width: 500px; height: 700px; background-image: url('https://picsum.photos/500/700')"/>
				</SunScrollContainer>
			</SunPanel>
		`,
	}),
	argTypes: {
		scrollBarStateH: {
			options: ['visible', 'hidden', 'adaptive', 'disabled'],
			control: { type: 'radio' }
		},
		scrollBarStateV: {
			options: ['visible', 'hidden', 'adaptive', 'disabled'],
			control: { type: 'radio' }
		},
		scrollBarVisibility: {
			options: ['always', 'hover', 'hover-track', 'hidden'],
			control: { type: 'radio' },
		},
	},
	args: {
		scrollableIndicators: true,
	},
};