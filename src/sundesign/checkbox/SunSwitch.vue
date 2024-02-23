<template>
    <div class="__sun-design__ __sun-design-switch-container__ sized" :data-size="size" :style="colorScheme">
        <input type="checkbox" class="__sun-design__ __sun-design-switch__ colored" :class="{ bordered: !flat }"
            :checked="value" :disabled="disabled" @change="onChange">
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import { type Size, type ColorScheme, useInputModel } from '../SunDesignConstants';
import { Check, Minus } from 'lucide-vue-next';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        colorScheme?: ColorScheme,
        flat?: boolean,
        disabled?: boolean,
        modelValue: boolean,
        modelModifiers?: Record<string, boolean>,
    }>(),
    {
        size: 'normal',
        flat: false,
        hover: false,
        disabled: false,
    }
);

// emits
const emits = defineEmits<{
    (event: 'update:modelValue', val: boolean): void,
    (event: 'change', val: boolean): void,
}>();

// datas
const { value, setValueOnChange } = useInputModel(props, 'modelValue', 'modelModifiers', emits, { forceUpdate: true, emitChange: 'change' });

function onChange(evt: Event) {
    setValueOnChange((evt.target as HTMLInputElement).checked);
}

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

width-scale = 1.5
indicator-border-width = 4px
indicator-border-color = var(--border-color)

.__sun-design__.__sun-design-switch-container__
    // outline: red 1px solid
    display: flex
    flex-direction: row
    align-items: center
    justify-content: center
    position: relative

    > .__sun-design__.__sun-design-switch__
        margin: 0
        display: inline-flex
        flex-direction: row
        align-items: center
        justify-content: flex-start

    &[data-size]
        padding-left: 0
        padding-right: 0
        border-radius: 0
    
    &[data-size="small"]
        min-width: content-size-small * width-scale
        max-width: content-size-small
        > .__sun-design__.__sun-design-switch__
            border-radius: (content-size-small / 2)
            width: content-size-small * width-scale
            height: content-size-small
            
    &[data-size="normal"]
        min-width: content-size-normal * width-scale
        max-width: content-size-normal
        > .__sun-design__.__sun-design-switch__
            border-radius: (content-size-normal / 2)
            width: content-size-normal * width-scale
            height: content-size-normal

    &[data-size="large"]
        min-width: content-size-large * width-scale
        max-width: content-size-large
        > .__sun-design__.__sun-design-switch__
            border-radius: (content-size-large / 2)
            width: content-size-large * width-scale
            height: content-size-large

.__sun-design__.__sun-design-switch__
    &::before
        content: ''
        pointer-event: none
        border-radius: 50%
        aspect-ratio: 1
        align-self: stretch
        margin-left: 0
        outline: none
        border: indicator-border-width solid var(--attachment-color)
        background-color: var(--attachment-color)

    &.bordered::before
        border: indicator-border-width solid var(--attachment-color)
        background-color: var(--attachment-color)
        outline: solid-border
    
    &.bordered:disabled::before
        border: indicator-border-width solid var(--attachment-color)
        background-color: var(--attachment-color)
        outline: solid-border-disabled
    
    &.bordered:disabled:checked::before
        border: indicator-border-width solid var(--attachment-color)
        background-color: var(--font-color-active-disabled)
        outline: solid-border-active-disabled

    &:checked::before
        margin-left: auto
        background-color: var(--font-color-active)

    &:disabled:checked::before
        margin-left: auto
        background-color: var(--font-color-active-disabled)

</style>