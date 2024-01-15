<template>
    <div class="__sun-design__ __sun-design-label__" :data-size="size">
        <slot />
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import type { Size } from '../SunDesignConstants';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
    }>(),
    {
        size: 'normal',
    }
);

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-label__
    background-color: unset
    color: var(--font-color-normal)
    padding-left: 0
    padding-right: 0
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

</style>