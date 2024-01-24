<template>
    <input ref="input_ref" class="__sun-design__ __sun-design-lineedit__ colored sized border-masked no-pressed-color"
        :class="{ flat, bordered: !flat, hover }" :disabled="disabled" :data-size="size" :data-border-mask="borderMask"
        :style="colorScheme">
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import type { Size, BorderMask, ColorScheme } from '../SunDesignConstants';
import { ref } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        flat?: boolean,
        borderMask?: BorderMask,
        hover?: boolean,
        disabled?: boolean,
        colorScheme?: ColorScheme,
    }>(),
    {
        size: 'normal',
        flat: false,
        borderMask: 15,
    }
);

// datas
const input_ref = ref<HTMLInputElement | null>(null);

// exposes
defineExpose({
    input: input_ref,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-lineedit__, .__sun-design__.__sun-design-lineedit__.flat

    &:focus-visible
        outline: none
    
</style>