<template>
    <div class="__sun-design__ __sun-design-radiobox-container__ sized" :data-size="size" :style="colorScheme">
        <input type="radio" class="__sun-design__ __sun-design-radiobox__ colored" :class="{ bordered: !flat, hover }"
            :checked="checked" :disabled="disabled" @change="onChange">
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import { type Size, type ColorScheme, useInputModel, type UID } from '../SunDesignConstants';
import { computed, inject } from 'vue';
import { SunRadioGroupInjection } from './SunRadioGroupConstants';

const radiogroup_injection = inject(SunRadioGroupInjection, undefined);

// props
const props = withDefaults(
    defineProps<{
        uid?: UID,
        size?: Size,
        colorScheme?: ColorScheme,
        flat?: boolean,
        hover?: boolean,
        disabled?: boolean,
        modelValue?: boolean,
        modelModifiers?: Record<string, boolean>,
    }>(),
    {
        size: 'normal',
        flat: false,
        hover: false,
        disabled: false,
        modelValue: false,
    }
);

// emits
const emits = defineEmits<{
    (event: 'update:modelValue', val: boolean): void,
    (event: 'change', val: boolean): void,
}>();

// datas
const { value, setValueOnChange } = useInputModel(props, 'modelValue', 'modelModifiers', emits, { forceUpdate: true, emitChange: 'change' });
const checked = computed(() => radiogroup_injection === undefined ? value.value : radiogroup_injection.value.value === props.uid);

function onChange(evt: Event) {
    if (radiogroup_injection === undefined) {
        setValueOnChange((evt.target as HTMLInputElement).checked);
    }
    else {
        radiogroup_injection.toggle(props.uid);
    }
}

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
        &.bordered::before
            inset: 5px - border-width
        &::before
            display: block
            content: ''
            position: absolute
            inset: 5px
            border-radius: 50%

    &[data-size]
        padding-left: 0
        padding-right: 0
        border-radius: 0
    
    &[data-size="small"]
        min-width: content-size-small
        max-width: content-size-small
        > .__sun-design__.__sun-design-radiobox__
            width: content-size-small
            height: content-size-small
            
    &[data-size="normal"]
        min-width: content-size-normal
        max-width: content-size-normal
        > .__sun-design__.__sun-design-radiobox__
            width: content-size-normal
            height: content-size-normal

    &[data-size="large"]
        min-width: content-size-large
        max-width: content-size-large
        > .__sun-design__.__sun-design-radiobox__
            width: content-size-large
            height: content-size-large

    // icon
    
    > .__sun-design__.__sun-design-radiobox__
        &:disabled
            &:checked, &:checked:active
                &::before
                    background-color: var(--font-color-active-disabled)

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