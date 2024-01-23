<template>
    <slot />
</template>

<script setup lang="ts">

import { type BoxSize, observeResize, unobserveResize } from '../SunDesignConstants';
import { getCurrentInstance, onMounted, onBeforeUnmount } from 'vue';

// emits
const emits = defineEmits<{
    (event: 'resized', borderBoxSize: BoxSize, contentBoxSize: BoxSize, target: Element): void,
}>();

// datas
let dom: Element | undefined = undefined;
onMounted(() => {
    const proxy = getCurrentInstance()!.proxy!;
    const el = proxy.$el as Element | undefined;
    if (el === undefined) {
        return;
    }
    if (el.nextElementSibling !== el.nextSibling) {
        if (el.nodeType === 3 && el.nodeValue !== '') {
            return;
        }
    }
    if (el.nextElementSibling !== null) {
        dom = el.nextElementSibling;
        observeResize(dom, onResized);
    }
});
onBeforeUnmount(() => {
    if (dom !== undefined) {
        unobserveResize(dom, onResized);
    }
});

// methods
function onResized(entry: ResizeObserverEntry) {
    const { inlineSize: border_width, blockSize: border_height } = entry.borderBoxSize[0];
    const { inlineSize: content_width, blockSize: content_height } = entry.contentBoxSize[0];
    const { width: content_rect_width, height: content_rect_height } = entry.contentRect;
    emits(
        'resized',
        { width: border_width, height: border_height },
        { width: content_width ?? content_rect_width, height: content_height ?? content_rect_height },
        entry.target
    );
}

</script>