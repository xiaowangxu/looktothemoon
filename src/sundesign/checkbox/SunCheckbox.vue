<template>
    <div class="__sun-design__ __sun-design-checkbox-container__ sized" :data-size="size" :style="colorScheme">
        <input type="checkbox" class="__sun-design__ __sun-design-checkbox__ colored" :class="{ bordered: !flat, hover }"
            v-model="value" :disabled="disabled">
        <div class="__sun-design__ __sun-design-checkbox-icon__">
            <slot name="icon">
                <Check v-if="!partial" />
                <Minus v-else />
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import type { Size, ColorScheme } from '../SunDesignConstants';
import { Check, Minus } from 'lucide-vue-next';
import { useVModel } from '@vueuse/core';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        colorScheme?: ColorScheme,
        flat?: boolean,
        hover?: boolean,
        disabled?: boolean,
        modelValue?: boolean,
        partial?: boolean,
    }>(),
    {
        size: 'normal',
        flat: false,
        hover: false,
        disabled: false,
        partial: false,
    }
);

// emits
const emits = defineEmits<{
    (event: 'update:modelValue', val: boolean): void,
}>();

// datas
const value = useVModel(props, 'modelValue', emits);

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-checkbox-container__
    // outline: red 1px solid
    display: flex
    flex-direction: row
    align-items: center
    justify-content: center
    position: relative

    > .__sun-design__.__sun-design-checkbox__
        margin: 0
        border-radius: border-radius-size-small

    &[data-size]
        padding-left: 0
        padding-right: 0
        border-radius: 0
    
    &[data-size="small"]
        min-width: content-size-small
        max-width: content-size-small
        > .__sun-design__.__sun-design-checkbox__
            width: content-size-small
            height: content-size-small
            
    &[data-size="normal"]
        min-width: content-size-normal
        max-width: content-size-normal
        > .__sun-design__.__sun-design-checkbox__
            width: content-size-normal
            height: content-size-normal

    &[data-size="large"]
        min-width: content-size-large
        max-width: content-size-large
        > .__sun-design__.__sun-design-checkbox__
            width: content-size-large
            height: content-size-large

    // icon

    > .__sun-design__.__sun-design-checkbox-icon__
        position: absolute
        width: 100%
        aspect-ratio: 1
        padding: 2px
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden
        pointer-events: none

        > svg, > .__sun-design-icon__
            min-width: 100%
            min-height: 100%
            max-width: 100%
            max-height: 100%
    
    > .__sun-design__.__sun-design-checkbox__
        + .__sun-design__.__sun-design-checkbox-icon__
            display: none

        &:disabled
            &:checked, &:checked:active
                + .__sun-design__.__sun-design-checkbox-icon__
                    color: var(--font-color-active-disabled)

        &:active
            + .__sun-design__.__sun-design-checkbox-icon__
                display: none

        &:checked
            &:active
                + .__sun-design__.__sun-design-checkbox-icon__
                    color: var(--font-color-active-pressed)

            + .__sun-design__.__sun-design-checkbox-icon__
                display: flex
                color: var(--font-color-active)

</style>