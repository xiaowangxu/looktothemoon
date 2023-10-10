<template>
    <span class="__s__ __s_span__" :class="{ bold, italic, underline }" :style="{ color }" :data-s-text-size="textSize">
        <slot />
    </span>
</template>

<script setup lang="ts">

import { type TextSize } from '../SConst';

// props
interface Props {
    bold?: boolean,
    italic?: boolean,
    underline?: boolean,
    textSize?: TextSize,
    color?: string,
}
const props = withDefaults(
    defineProps<Props>(),
    {
        bold: false,
        italic: false,
        underline: false,
        textSize: 'inherit',
        color: 'inherit',
    }
);

</script>

<style>
.__s_span__.bold {
    font-weight: bold;
}

.__s_span__.italic {
    font-style: italic;
}

.__s_span__.underline {
    text-decoration: underline;
}
</style>