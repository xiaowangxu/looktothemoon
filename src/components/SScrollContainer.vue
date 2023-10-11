<template>
    <SResizeObserver @resized="on_ContainerResized">
        <div class="__s__ __s_scrollcontainer_container__" :style="{ padding: padding }"
            :class="{ scrollh: is_scrollable_h, scrollv: is_scrollable_v }">
            <SResizeObserver @resized="on_ContentResized">
                <div class="__s__ __s_scrollcontainer_content__">
                    <slot />
                </div>
            </SResizeObserver>
            <div v-show="is_scrollable_v" class="__s__ __s_scrollcontainer_vbar__">
                <div class="__s__ __s_scrollcontainer_vbar_thumb__"></div>
            </div>
            <div v-show="is_scrollable_h" class="__s__ __s_scrollcontainer_hbar__">
                <div class="__s__ __s_scrollcontainer_hbar_thumb__"></div>
            </div>
        </div>
    </SResizeObserver>
</template>

<script setup lang="ts">

import { computed, ref } from 'vue';
import type { BoxSize } from './SConst';
import SResizeObserver from './SResizeObserver.vue';

// props
const props = withDefaults(
    defineProps<{
        padding?: string,
    }>(),
    {
        padding: '0',
    }
);

// datas
const container_width = ref(0);
const container_height = ref(0);
const content_width = ref(0);
const content_height = ref(0);
const is_scrollable_h = computed(() => container_width.value < content_width.value);
const is_scrollable_v = computed(() => container_height.value < content_height.value);

// methods
function on_ContainerResized(border_size: BoxSize, content_size: BoxSize, target: Element) {
    console.log(border_size);
    container_width.value = content_size.width;
    container_height.value = content_size.height;
}
function on_ContentResized(border_size: BoxSize, content_size: BoxSize, target: Element) {
    content_width.value = content_size.width;
    content_height.value = content_size.height;
}

// exposes
defineExpose({
    isScrollableH: is_scrollable_h,
    isScrollableV: is_scrollable_v,
});

</script>

<style>
.__s_scrollcontainer_container__ {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
}

.__s_scrollcontainer_content__ {
    width: fit-content;
}

/* v */
.__s_scrollcontainer_vbar__ {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: var(--ScrollBarTotalWidth);
    /* background-color: red; */
}

.__s_scrollcontainer_container__.scrollv.scrollh>.__s_scrollcontainer_vbar__ {
    bottom: var(--ScrollBarTotalWidth);
}

.__s_scrollcontainer_vbar_thumb__ {
    position: absolute;
    left: var(--ScrollBarOffset);
    height: 30%;
    top: 0%;
    width: var(--ScrollBarWidth);
    border-radius: calc(var(--ScrollBarWidth) / 2);
    background-color: var(--ThemeDisabledColor);
    /* opacity: 0; */
    transition: opacity 0.25s ease-out;
}

.__s_scrollcontainer_vbar__:hover>.__s_scrollcontainer_vbar_thumb__ {
    opacity: 1;
    transition: opacity 0.15s ease-out;
}

/* h */
.__s_scrollcontainer_hbar__ {
    position: absolute;
    left: 0;
    bottom: 0;
    right: 0;
    height: var(--ScrollBarTotalWidth);
    /* background-color: red; */
}

.__s_scrollcontainer_container__.scrollv.scrollh>.__s_scrollcontainer_hbar__ {
    right: var(--ScrollBarTotalWidth);
}

.__s_scrollcontainer_hbar_thumb__ {
    position: absolute;
    top: var(--ScrollBarOffset);
    width: 30%;
    left: 0%;
    height: var(--ScrollBarWidth);
    border-radius: calc(var(--ScrollBarWidth) / 2);
    background-color: var(--ThemeDisabledColor);
    /* opacity: 0; */
    transition: opacity 0.25s ease-out;
}

.__s_scrollcontainer_hbar__:hover>.__s_scrollcontainer_hbar_thumb__ {
    opacity: 1;
    transition: opacity 0.15s ease-out;
}
</style>