<template>
    <svg xmlns="http://www.w3.org/2000/svg" class="__sun-design__ __sun-design-icon__ __sun-design-progress-icon__"
        :class="[animation]" :style="{ '--Percentage': percentage }" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle class="__sun-design-progress-icon-track__" cx="12" cy="12" r="10"></circle>
        <circle class="__sun-design-progress-icon-nob__" :class="{ loading: loading && percentage < 1 }" cx="12" cy="12"
            r="10"></circle>
        <path v-show="showFullfilledIcon && percentage === 1" d="m8 12 3 3 5-5"></path>
    </svg>
</template>

<script setup lang="ts">

import '../SunDesignAnimation.styl';
import { computed } from 'vue';
import { type Animation as AnimationName } from '../SunDesignConstants';

// props
const props = withDefaults(
    defineProps<{
        progress: number,
        animation?: AnimationName,
        loading?: boolean,
        showFullfilledIcon?: boolean,
    }>(),
    {
        loading: false,
        showFullfilledIcon: true,
    }
);

// datas
const percentage = computed(() => Math.min(1, Math.max(0, props.progress)));
const animation = computed(() => props.animation === undefined ? undefined : `__sun-design-animate-${props.animation}__`);

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-progress-icon__
    --Percentage: 0 

.__sun-design-progress-icon-track__
    opacity: icon-secondary-opacity
    pointer-events: none

.__sun-design-progress-icon-nob__
    stroke-dasharray: 63
    stroke-dashoffset: calc(63 * (1 - var(--Percentage, 1)))
    transition: stroke-dashoffset 0.2s ease-out, transform 0.2s linear
    pointer-events: none
    transform: rotate(-90deg)
    transform-origin: 50% 50%

    &.loading
        animation: __sun-design-progress-icon-animate-rotate__ 2s linear infinite;

@keyframes __sun-design-progress-icon-animate-rotate__ {
    from { transform: rotate(-90deg); }
    to { transform: rotate(270deg); }
}

</style>

