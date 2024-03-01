<template>
    <SunPanel style="position: fixed; left: 35%; right: 35%; top: 20%;">
        <SunPanelContainer style="flex: 1; padding: 4px 14px;">
            <input v-model="code"
                style="height: 40px; flex: 1; outline: none; background-color: transparent; border: none; font-size: 24px; padding: 0px;" />
        </SunPanelContainer>
    </SunPanel>
    <SunCompletion :get-popup-rect="getPopupRect" :options="options" :keyword="code">
        <template #info>
            <SunPanelSeparator />
            <SunPanelContainer minor no-padding>
                <SunButtonLike no-hover-color no-pressed-color flat style="width: 100%;">
                    <SunButtonItem label="快捷操作" description="使用上下键切换 / Enter 确认" />
                </SunButtonLike>
            </SunPanelContainer>
        </template>
        <template #append="{ selected }">
            <SunPanelSeparator v-show="selected !== undefined" />
            <SunScrollContainer v-show="selected !== undefined" content-style="width: 100%;" style="flex: 0.6;">
                <SunPanelContainer>
                    <div v-if="selected">
                        <h3 style="margin: 4px 0px;">{{ selected?.label ?? '???' }}</h3>
                        <p style="margin: 0px;">{{ selected?.description }}</p>
                    </div>
                </SunPanelContainer>
            </SunScrollContainer>
        </template>
    </SunCompletion>
</template>

<script setup lang="ts">

import SunPanel from '@/sundesign/panel/SunPanel.vue';
import SunPanelContainer from '@/sundesign/panel/SunPanelContainer.vue';
import SunPanelSeparator from '@/sundesign/panel/SunPanelSeparator.vue';
import SunScrollContainer from '@/sundesign/scrollcontainer/SunScrollContainer.vue';
import SunCompletion, { type CompletionItem } from '@/sundesign/completion/SunCompletion.vue';
import SunButtonItem from '@/sundesign/item/SunButtonItem.vue';
import SunButtonLike from '@/sundesign/button/SunButtonLike.vue';
import type { BoxSize, Rect } from '@/sundesign/SunDesignConstants';
import { ref } from 'vue';

const code = ref('');
const options = ref<CompletionItem[]>([
    {
        uid: 'AAA',
        label: 'AAAA AAA AA A ab',
        description: '(property) String.length: number',
        icon: 'Cuboid',
    },
    {
        uid: 'length',
        label: '长度',
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
        label: '转文本',
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
        description: '(method) String.trim(): string',
        icon: 'FunctionSquare',
    },
    {
        uid: 'split',
        label: 'split',
        icon: 'FunctionSquare',
    },
]);

function getPopupRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect {
    return { x: windowSize.width * 0.35, y: windowSize.height * 0.2 + 48 + 10, width: windowSize.width * 0.3, height: Math.min(contentMinSize.height, windowSize.height * 0.35 - 48 - 10) };
}

</script>