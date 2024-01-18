<template>
    <Teleport :to="teleportTarget" :disabled="teleportDisabled">
        <div ref="container_div_dom" class="__sun-design__ __sun-design-popup-container__" :class="{ invisible: !visible }" :style="{
            left: rect?.x ? `${rect?.x}px` : '0', top: rect?.y ? `${rect?.y}px` : '0',
            width: rect?.width ? `${rect?.width}px` : '100%', height: rect?.height ? `${rect?.height}px` : '100%'
        }">
            <slot :rect="rect" />
        </div>
    </Teleport>
</template>

<script setup lang="ts">

import type { Rect } from '../SunDesignConstants';
import { ref } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        visible?: boolean,
        rect?: Rect,
        teleportTarget?: string,
        teleportDisabled?: boolean,
    }>(),
    {
        visible: true,
        rect: undefined,
        teleportTarget: 'body',
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

<style lang="stylus">

.__sun-design-popup-container__
    position: fixed;
    left: 0;
    width: 0px;
    top: 0;
    height: 0px;

    &.invisible
        visibility: hidden;

</style>