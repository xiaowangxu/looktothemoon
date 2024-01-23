<template>
    <div class="__sun-design__ __sun-design-radiobox-container__ sized" :data-size="size" :style="colorScheme">
        <input type="radio" class="__sun-design__ __sun-design-radiobox__ colored" :class="{ bordered: !flat, hover }"
            :checked="checked" :disabled="disabled">
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import type { Size, ColorScheme } from '../SunDesignConstants';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        colorScheme?: ColorScheme,
        flat?: boolean,
        hover?: boolean,
        disabled?: boolean,
        checked?: boolean,
    }>(),
    {
        size: 'normal',
        flat: false,
        hover: false,
        disabled: false,
        checked: false,
    }
);

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-radiobox-container__
    // outline: red 1px solid
    display: flex
    flex-direction: row
    align-items: center
    justify-content: center
    position: relative

    > .__sun-design__.__sun-design-radiobox__
        margin: 0
        position: relative
        border-radius: 50%
        &::before
            display: block
            content: ''
            position: absolute
            inset: 4px
            border-radius: 50%

    &[data-size]
        padding-left: 0
        padding-right: 0
        border-radius: 0
    
    &[data-size="small"]
        max-width: content-size-small
        > .__sun-design__.__sun-design-radiobox__
            width: content-size-small
            height: content-size-small
            
    &[data-size="normal"]
        max-width: content-size-normal
        > .__sun-design__.__sun-design-radiobox__
            width: content-size-normal
            height: content-size-normal

    &[data-size="large"]
        max-width: content-size-large
        > .__sun-design__.__sun-design-radiobox__
            width: content-size-large
            height: content-size-large

    // icon
    
    > .__sun-design__.__sun-design-radiobox__
        &:disabled
            &:checked, &:checked:active
                &::before
                    background-color: var(--font-color-active)

        &:active
            + .__sun-design__.__sun-design-radiobox-icon__
                display: none

        &:checked
            &:active
                &::before
                    background-color: var(--font-color-active-pressed)

            &::before
                background-color: var(--font-color-active)

</style>