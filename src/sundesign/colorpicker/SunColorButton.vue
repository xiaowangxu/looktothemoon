<template>
    <SunButton class="__sun-design-color-button__"
        v-hover-menu:__sun-color-button__.label.no-hover.mouse="color_str"
        :style="{ '--Color': color_str, '--PlainColor': plain_color_str }" :size="size" :flat="flat" :active="active"
        :disabled="disabled" :border-mask="borderMask" :hover="hover" :color-scheme="colorScheme" :squared="squared" />
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunButton from '../button/SunButton.vue';
import type { Size, BorderMask, ColorScheme } from '../SunDesignConstants';
import { type ColorData } from './SunColorPickerConstants';
import { computed } from 'vue';
import { vHoverMenu } from '../hovermenu/SunHoverMenu';

// props
const props = withDefaults(
    defineProps<{
        color: Readonly<ColorData>,
        size?: Size,
        flat?: boolean,
        active?: boolean,
        disabled?: boolean,
        borderMask?: BorderMask,
        hover?: boolean,
        colorScheme?: ColorScheme,
        squared?: boolean,
    }>(),
    {
    }
);

// datas
function toHex(num: number, mult: number = 1) {
    return (Math.round(num * mult)).toString(16).padStart(2, '0').toUpperCase();
}
const color_str = computed(() => `#${toHex(props.color[0], 255)}${toHex(props.color[1], 255)}${toHex(props.color[2], 255)}${toHex(props.color[3], 255)}`);
const plain_color_str = computed(() => `#${toHex(props.color[0], 255)}${toHex(props.color[1], 255)}${toHex(props.color[2], 255)}`);

</script>

<style lang="stylus">

.__sun-design-color-button__ {
    position: relative;
    background-color: transparent !important;
	  background-size: 100% 100%, 10px 10px, 10px 10px, 10px 10px, 10px 10px;
	  background-position: 0 0, 0 0, 0 5px, 5px -5px, -5px 0;
    background-image: 'linear-gradient(90deg, var(--PlainColor) 0%, var(--PlainColor) 50%, var(--Color) 50%, var(--Color) 100%), linear-gradient(45deg, var(--placeholder-color-disabled) 25%, transparent 0), linear-gradient(-45deg, var(--placeholder-color-disabled) 25%, transparent 0), linear-gradient(45deg, transparent 75%, var(--placeholder-color-disabled) 0), linear-gradient(-45deg, transparent 75%, var(--placeholder-color-disabled) 0)' % ('');
}

</style>