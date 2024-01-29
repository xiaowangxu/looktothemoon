<template>
    <Teleport :to="teleportTarget" :disabled="teleportDisabled">
        <SunPopupCover ref="cover_ref" v-bind="$attrs" @click="emits('coverClick', $event)" :stop-events="stopEvents && visible">
            <div ref="container_div_dom" class="__sun-design__ __sun-design-popup-container__"
                :class="{ invisible: !visible }" :style="position_style">
                <slot :rect="rect" />
            </div>
        </SunPopupCover>
    </Teleport>
</template>

<script setup lang="ts">

import type { Rect } from '../SunDesignConstants';
import SunPopupCover from './SunPopupCover.vue';
import { computed, ref } from 'vue';

defineOptions({
    inheritAttrs: false,
});

// props
const props = withDefaults(
    defineProps<{
        visible?: boolean,
        rect?: Rect,
        teleportTarget?: string,
        teleportDisabled?: boolean,
        stopEvents?: boolean,
    }>(),
    {
        visible: true,
        rect: undefined,
        teleportTarget: 'body',
        teleportDisabled: false,
        stopEvents: true,
    }
);

// slots
defineSlots<{
    default(props: { rect: Rect | undefined }): void,
}>();

// emits
const emits = defineEmits<{
    (event: 'coverClick', evt: Event): void,
}>();

// datas
const container_div_dom = ref<HTMLDivElement>();
const cover_ref = ref<InstanceType<typeof SunPopupCover> | UnderlyingByteSource>();
const position_style = computed(() => {
    if (props.rect === undefined) return undefined;
    const { x, y, width, height } = props.rect;
    const result: { width: string, height: string, left?: string, top?: string, right?: string, bottom?: string } = { width: `${width}px`, height: `${height}px` };
    // if (x >= 0) 
    result.left = `${x}px`;
    // else result.right = `${x}px`;
    // if (y >= 0) 
    result.top = `${y}px`;
    // else result.bottom = `${y}px`;
    return result;
});

// exposes
defineExpose({
    cover: cover_ref,
});

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