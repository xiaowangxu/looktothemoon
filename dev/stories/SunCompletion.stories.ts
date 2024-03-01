import type { Meta, StoryObj } from '@storybook/vue3';

import SunCompletion, { type CompletionItem } from '../../src/sundesign/completion/SunCompletion.vue';
import SunPanelContainer from '../../src/sundesign/panel/SunPanelContainer.vue';
import SunPanelSeparator from '../../src/sundesign/panel/SunPanelSeparator.vue';
import SunButtonItem from '../../src/sundesign/item/SunButtonItem.vue';
import SunButtonLike from '../../src/sundesign/button/SunButtonLike.vue';
import SunScrollContainer from '../../src/sundesign/scrollcontainer/SunScrollContainer.vue';
import { SizeArgs, SizeArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';
import { BoxSize, Item, Rect } from '../../src/sundesign/SunDesignConstants';

const meta: Meta<typeof SunCompletion> = {
    component: SunCompletion,
};

export default meta;
type Story = StoryObj<typeof SunCompletion>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Completion: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: { SunCompletion, SunButtonItem, SunButtonLike, SunPanelContainer, SunScrollContainer, SunPanelSeparator },
        setup() {
            const keyword = ref('');
            const options = ref<CompletionItem[]>([
                {
                    uid: 'length',
                    label: 'length',
                    description: '(property) String.length: number',
                    icon: 'Cuboid',
                },
                {
                    uid: 'id',
                    label: 'id',
                    icon: 'Cuboid',
                },
                {
                    uid: 'toString',
                    label: 'toString',
                    description: '(method) String.toString(): string',
                    icon: 'FunctionSquare',
                },
                {
                    uid: 'toLowerCase',
                    label: 'toLowerCase',
                    description: '(method) String.toLowerCase(): string',
                    icon: 'FunctionSquare',
                },
                {
                    uid: 'toFix',
                    label: 'toFix',
                    description: '(method) String.toFix(): string',
                    icon: 'FunctionSquare',
                },
                {
                    uid: 'trim',
                    label: 'trim',
                    description: '(method) String.trim(): string\nLorem, ipsum dolor sit amet consectetur adipisicing elit. Optio fuga asperiores a, veniam doloremque laborum ut facilis, quos impedit ipsa reprehenderit corrupti vero deserunt sapiente. Autem adipisci, perferendis inventore in ipsum exercitationem illo similique quisquam labore. Cupiditate pariatur alias rerum nulla, accusamus, eveniet minima suscipit ducimus nostrum optio eligendi reiciendis at nesciunt vel tempore! Ratione illo perspiciatis tempora debitis, totam, molestias earum ex libero dolore doloremque hic omnis? Perferendis delectus, quis eaque reiciendis, ducimus cum quia, pariatur facilis voluptate ea quibusdam maiores tenetur voluptatibus rem quam aspernatur nemo debitis modi minus repudiandae in. Totam, quo? Eum maiores minus ipsum iste!',
                    icon: 'FunctionSquare',
                },
                {
                    uid: 'split',
                    label: 'split',
                    description: '(method) String.split(separator: string | RegExp, limit?: number | undefined): string[] (+1 overload)',
                    icon: 'FunctionSquare',
                },
            ]);

            function getPopupRect(contentMinSize: Rect, windowSize: BoxSize): Rect {
                return { x: 15, y: 44, width: 400, height: Math.min(contentMinSize.height, 180) };
            }
            return { args, options, keyword, getPopupRect };
        },
        template: `
        <input v-model="keyword"/>
			  <SunCompletion v-bind="args" :get-popup-rect="getPopupRect" :options="options" :keyword="keyword">
            <template #info>
                <SunPanelSeparator />
                <SunPanelContainer minor no-padding>
                    <SunButtonLike no-hover-color no-pressed-color flat style="width: 100%;">
                        <SunButtonItem label="快捷操作" description="使用上下键切换 / Enter 确认" />
                    </SunButtonLike>
                </SunPanelContainer>
            </template>
            <template #append="{selected}">
                <SunPanelSeparator v-show="selected !== undefined" />
                <SunScrollContainer v-show="selected !== undefined" content-style="width: 100%;" style="flex: 0.6;">
                    <SunPanelContainer>
                        <div v-if="selected">
                            <h3 style="margin: 4px 0px;">{{selected?.label ?? '???'}}</h3>
                            <p style="margin: 0px;">{{selected?.description}}</p>
                        </div>
                    </SunPanelContainer>
                </SunScrollContainer>
            </template>
		</SunCompletion>
		`,
    }),
    argTypes: {
    },
    args: {
    },
};