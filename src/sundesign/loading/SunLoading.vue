<template>
    <div class="__sun-design-loading__" :data-size="size" />
</template>

<script setup lang="ts">

import { Size } from "../SunDesignConstants";

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

.__sun-design-loading__
    background-color: var(--placeholder-color)
    animation: __sun-design-loading-animation__ 1.2s infinite ease-in-out

    &[data-size="small"] 
        width: content-size-small
        height: content-size-small

    &[data-size="normal"]
        width: content-size-normal
        height: content-size-normal

    &[data-size="large"] 
        width: content-size-large
        height: content-size-large

@keyframes __sun-design-loading-animation__ {
    0% { 
        transform: perspective(120px) rotateX(0deg) rotateY(0deg);
    } 
    50% { 
        transform: perspective(120px) rotateX(-180.1deg) rotateY(0deg);
    } 
    100% { 
        transform: perspective(120px) rotateX(-180deg) rotateY(-179.9deg);
    }
}

</style>