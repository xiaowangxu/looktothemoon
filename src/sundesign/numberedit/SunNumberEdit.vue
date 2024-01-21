<template>
    <template v-if="!inputing || disabled || !allowInput">
        <SunButton class="__sun-design-numberedit-container__" :size="size" :flat="flat" :bordered="bordered"
            :color-scheme="colorScheme" :border-mask="borderMask" @click="onInputClick" :disabled="disabled">
            <button v-if="stepButton"
                class="__sun-design__ __sun-design-numberedit-dec__ __sun-design-button-like__ colored"
                :class="{ bordered: bordered && !flat }" :data-size="size" @click.stop="() => { console.log('dec') }"
                :disabled="disabled">
                <ChevronLeft />
            </button>
            <div class="__sun-design-numberedit-display-container__"
                :class="{ progress: progress, 'step-button': stepButton }">
                <span class="__sun-design__ __sun-design-numberedit-display__" :data-size="size">
                    <span v-if="$slots.prefix !== undefined" class="__sun-design-numberedit-prefix__" :class="{ disabled }">
                        <slot name="prefix" />
                    </span>
                    <span class="__sun-design-numberedit-value__">{{ value }}</span>
                    <span v-if="$slots.suffix !== undefined" class="__sun-design-numberedit-suffix__" :class="{ disabled }">
                        <slot name="suffix" />
                    </span>
                </span>
            </div>
            <button v-if="stepButton"
                class="__sun-design__ __sun-design-numberedit-inc__ __sun-design-button-like__ colored"
                :class="{ bordered: bordered && !flat }" :data-size="size" @click.stop="() => { console.log('inc') }"
                :disabled="disabled">
                <ChevronRight />
            </button>
        </SunButton>
    </template>
    <template v-else>
        <form class="__sun-design__ __sun-design_numberedit-input-container__ sized colored"
            :class="{ bordered: bordered && !flat }" :data-size="size" @submit.prevent="inputing = false"
            :style="colorScheme">
            <SunLineEdit ref="input_ref" class="__sun-design-numberedit-input__" :class="{
                left: $slots.prefix === undefined && $slots.suffix !== undefined,
                right: $slots.prefix !== undefined && $slots.suffix === undefined
            }" :value="value" :size="size" :flat="flat" :bordered="false" :style="colorScheme" :disabled="disabled"
                :color-scheme="colorScheme" @blur="inputing = false" />
        </form>
    </template>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunButton from '../button/SunButton.vue';
import SunLineEdit from '../lineedit/SunLineEdit.vue';
import type { Size, BorderMask, ColorScheme } from '../SunDesignConstants';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { ref, watch } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        flat?: boolean,
        bordered?: boolean,
        borderMask?: BorderMask,
        disabled?: boolean,
        colorScheme?: ColorScheme,
        // 
        value?: number,
        progress?: boolean,
        stepButton?: boolean,
        allowInput?: boolean,
    }>(),
    {
        size: 'normal',
        flat: false,
        bordered: true,
        borderMask: 15,
        disabled: false,
        value: 0,
        progress: false,
        stepButton: true,
        allowInput: true,
    }
);

// datas
const inputing = ref(false);
const input_ref = ref<InstanceType<typeof SunLineEdit> | undefined>();

watch([input_ref], ([input]) => {
    const _input = input?.input;
    if (_input !== undefined) {
        _input.focus();
        _input.setSelectionRange(0, _input.value.length);
    }
});

function onInputClick() {
    if (props.allowInput && !inputing.value) {
        inputing.value = true;
    }
}

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design_numberedit-input-container__
    padding: 0 !important
    background-color: unset !important
    overflow: hidden
    position: relative

.__sun-design-numberedit-input__
    position: absolute
    text-align: center
    width: 100%
    height: 100%
    min-height: unset !important
    border-radius: 0 !important

    &.left
        text-align: start

    &.right
        text-align: end

.__sun-design__.__sun-design-numberedit-container__, .__sun-design__.__sun-design-numberedit-container__.flat
    &:active
        background-color: var(--color-hover)
        color: var(--font-color-normal)
        
    &:disabled, &.disabled
        background-color: var(--color-disabled)
        color: var(--font-color-disabled)

.__sun-design-numberedit-display-container__
    cursor: text
    display: flex
    flex-direction: row
    flex-wrap: nowrap
    flex: 1
    overflow: hidden
    gap: inherit
    justify-content: center
    align-items: center
    position: relative
    box-sizing: border-box
    align-self: stretch
    --Percentage: 50%

    &.progress
        background: linear-gradient(90deg, var(--border-color-normal) var(--Percentage), transparent var(--Percentage))

.__sun-design-numberedit-container__
    display: flex
    flex-direction: row
    flex-wrap: nowrap
    position: relative
    padding-top: 0 !important
    padding-bottom: 0 !important
    padding-left: 0 !important
    padding-right: 0 !important
    gap: 0 !important

    &:disabled, &.diasbled
        > .__sun-design-numberedit-display-container__
            cursor: not-allowed
            &.progress
                background: linear-gradient(90deg, var(--border-color-disabled) var(--Percentage), transparent var(--Percentage))

    > .__sun-design-numberedit-display-container__
        cursor: text

    &[data-size="small"] > .__sun-design-numberedit-display-container__
        padding-left: padding-extend-small
        padding-right: padding-extend-small
        gap: gap-small

    &[data-size="normal"] > .__sun-design-numberedit-display-container__
        padding-left: padding-extend-normal
        padding-right: padding-extend-normal
        gap: gap-normal

    &[data-size="large"] > .__sun-design-numberedit-display-container__
        padding-left: padding-extend-large
        padding-right: padding-extend-large
        gap: gap-large

    &:hover
        &[data-size="small"] > .__sun-design-numberedit-display-container__.step-button
            padding-left: gap-small
            padding-right: gap-small
        &[data-size="normal"] > .__sun-design-numberedit-display-container__.step-button
            padding-left: gap-normal
            padding-right: gap-normal
        &[data-size="large"] > .__sun-design-numberedit-display-container__.step-button
            padding-left: gap-large
            padding-right: gap-large
        > .__sun-design-numberedit-dec__, > .__sun-design-numberedit-inc__
            display: inline-flex !important

.__sun-design-numberedit-display__
    flex: 1
    display: flex
    flex-wrap: nowrap
    overflow: hidden
    gap: inherit

.__sun-design-numberedit-dec__, .__sun-design-numberedit-inc__
    display: none !important
    padding: 0px
    border: none
    align-self: stretch
    align-items: center

.__sun-design-numberedit-dec__
    border-top: none !important
    border-left: none !important
    border-bottom: none !important

.__sun-design-numberedit-inc__
    border-top: none !important
    border-right: none !important
    border-bottom: none !important

.__sun-design-numberedit-prefix__
    text-wrap: nowrap
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis
    text-align: start
    color: var(--placeholder-color)
    flex-basis: 100%
    flex-grow: 0
    flex-shrink: 1
    justify-content: flex-start

    &.disabled
        color: var(--placeholder-color-disabled)

.__sun-design-numberedit-value__
    text-align: center
    text-wrap: nowrap
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis
    flex-grow: 1
    flex-shrink: 0

.__sun-design-numberedit-suffix__
    text-wrap: nowrap
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis
    text-align: end
    color: var(--placeholder-color)
    flex-basis: 100%
    flex-grow: 0
    flex-shrink: 1
    justify-content: flex-end

    &.disabled
        color: var(--placeholder-color-disabled)

</style>