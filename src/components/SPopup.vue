<template>
    <Teleport to="#popup" :disabled="teleportDisabled">
        <div class="__s__ __s_popup_cover__" :class="{ invisible: !visible }" v-bind="$attrs">
            <div ref="container_div_dom" class="__s__ __s_popup_container__" :style="{
                left: rect?.x ? `${rect?.x}px` : undefined,
                top: rect?.y ? `${rect?.y}px` : undefined,
                width: rect?.width ? `${rect?.width}px` : undefined,
                height: rect?.height ? `${rect?.height}px` : undefined,
            }">
                <slot :rect="rect" />
            </div>
            <div></div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">

import type { Rect } from './SConst';
import { ref } from 'vue';

// options
defineOptions({
    inheritAttrs: false,
});

// props
const props = withDefaults(
    defineProps<{
        visible?: boolean,
        rect?: Rect,
        teleportDisabled?: boolean,
    }>(),
    {
        visible: true,
        rect: undefined,
        teleportDisabled: false,
    }
);

// slots
defineSlots<{
    default(props: { rect: Rect | undefined }): void,
}>();

// datas
const container_div_dom = ref<HTMLDivElement>();

// methods
function resetForMeasureMinSize() {
    if (container_div_dom.value === undefined) return () => { };
    const dom = container_div_dom.value;
    const width = dom.style.width;
    const height = dom.style.height;
    dom.style.width = '0px';
    dom.style.height = '0px';
    return () => {
        dom.style.width = width;
        dom.style.height = height;
    };
}

// exposes
defineExpose({
    resetForMeasureMinSize,
});

// datas

// methods

</script>

<style>
.__s_popup_cover__ {
    /* outline: 5px solid red;
    outline-offset: -5px; */
    pointer-events: none;
    position: fixed;
    inset: 0px;
}

.__s_popup_cover__.invisible {
    visibility: hidden;
}

.__s_popup_container__ {
    position: absolute;
    left: 0;
    width: 0px;
    top: 0;
    height: 0px;
}
</style>