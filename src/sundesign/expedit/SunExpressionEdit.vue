<template>
    <SunButtonLike class="__sun-design-exp-edit-container__" no-pressed-color :size="size" :disabled="disabled"
        :border-mask="borderMask" :flat="flat" :hover="hover" :color-scheme="colorScheme">
        <div v-once ref="inputdiv_ref" class="__sun-design-exp-edit-exp-container__" :contenteditable="!disabled"
            spellcheck="false" autocomplete="off" @input="onInput" @paste.prevent @blur="onBlur" draggable="false" disabled>
        </div>
    </SunButtonLike>
    <!-- <Teleport v-if="can_teleport" :to="inputdiv_ref">
        <span v-for="token in tokens" :data-token="token.type">{{ token.label }}</span>
    </Teleport> -->
</template>

<script setup lang="ts">

import SunButtonLike from '../button/SunButtonLike.vue';
import { type ExpressionToken, DefaultLexMethod } from './SunExpressionEditConstants';
import { type Size, type BorderMask, type ColorScheme, useInputModel } from '../SunDesignConstants';
import { ref, computed } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        flat?: boolean,
        borderMask?: BorderMask,
        hover?: boolean,
        disabled?: boolean,
        colorScheme?: ColorScheme,
        // value
        modelValue: string,
        modelModifiers?: Record<string, boolean>,
    }>(),
    {
        size: 'normal',
        flat: false,
        borderMask: 15,
    }
);

// datas
const inputdiv_ref = ref<HTMLDivElement | null>(null);
const can_teleport = computed(() => inputdiv_ref.value !== null);

// const tokens = ref<ExpressionToken[]>([]);

function getPos(node: HTMLElement, offset: number, root: HTMLDivElement) {
    if (node === root) return offset;
    if (node.parentNode !== root) node = node.parentNode as HTMLElement;
    let count = 0;
    let sibling = node.previousSibling;
    while (sibling) {
        count += sibling.textContent?.length ?? 0;
        sibling = sibling.previousSibling;
    }
    return count + offset;
}

function onInput(evt: Event) {
    const selection = document.getSelection();
    const div = (evt.target as HTMLDivElement);
    if (div && selection) {
        const str = div.textContent ?? '';
        const range = selection.getRangeAt(0);
        const start_container = range.startContainer, start_offset = range.startOffset;
        const end_container = range.endContainer, end_offset = range.endOffset;
        const start = getPos(start_container as HTMLElement, start_offset, div);
        const end = getPos(end_container as HTMLElement, end_offset, div);
        div.innerHTML = '';
        const tokens = tokenize(str);
        let new_start_container: HTMLSpanElement | undefined;
        let new_start_offset: number = 0;
        let new_end_container: HTMLSpanElement | undefined;
        let new_end_offset: number = 0;
        for (const token of tokens) {
            const span = document.createElement('span');
            span.classList.add('__sun-design-exp-edit-token__');
            span.textContent = token.label;
            span.dataset.token = token.type;
            div.appendChild(span);
            if (new_start_container === undefined && token.offset + token.length >= start) {
                new_start_container = span;
                new_start_offset = start - token.offset;
            }
            if (new_end_container === undefined && token.offset + token.length >= end) {
                new_end_container = span;
                new_end_offset = end - token.offset;
            }
        }
        const new_range = new Range();
        if (new_start_container) {
            new_range.setStart(new_start_container, new_start_offset);
        }
        if (new_end_container) {
            new_range.setEnd(new_end_container, new_end_offset);
        }
        selection.removeAllRanges();
        selection.addRange(new_range);
    }
}

function onBlur(evt: Event) {
    if (evt.target) {
        document.getSelection()?.removeAllRanges();
        (evt.target as HTMLDivElement).scrollLeft = 0;
    }
}

function tokenize(str: string) {
    return DefaultLexMethod(str);
}

</script>

<style lang="stylus">

.__sun-design-exp-edit-container__
    overflow: hidden
    width: 150px

    &.disabled
        pointer-events: none

.__sun-design-exp-edit-exp-container__
    display: inline-block
    flex: 1
    overflow: hidden
    outline: none
    align-self: stretch
    user-select: none

    > span
        display: inline-block

.__sun-design-exp-edit-token__
    &[data-token="plain"]
        // 
    &[data-token="operator"]
        color: #2196F3
    &[data-token="brace"]
        color: #BDBDBD
    &[data-token="@"]
        content: '@DATA'
        border-radius: 4px
        background-color: var(--border-color-disabled)
        padding: 0px 2px
        margin: 0px 2px

</style>