<template>
    <div class="__sun-design-panel-fold-container__" :style="!folded ? unfoldStyle : undefined">
        <SunButtonLike class="__sun-design-panel-fold-container-button__" :size="size"
            :class="{ append: $slots.append !== undefined, unfolded: !folded, 'hover-show': hoverShowAppend }"
            no-hover-color no-pressed-color flat>
            <SunButton class="__sun-design-panel-fold-container-fold-button__ no-hover-color no-pressed-color" :size="size"
                flat style="flex: 1;" @click="folded = !folded">
                <ChevronRight v-if="folded" />
                <ChevronDown v-else />
                <slot name="item">
                    <SunButtonItem :label="label" />
                </slot>
            </SunButton>
            <div v-show="hoverShowAppend || !folded" v-if="$slots.append !== undefined"
                class="__sun-design-panel-fold-container-append__" :class="{ 'hover-show': hoverShowAppend && folded }">
                <slot name="append" />
            </div>
        </SunButtonLike>
        <div v-show="!folded" class="__sun-design-panel-fold-container-content-container__" :class="{ unfolded: !folded }">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">

import { ref, watch } from 'vue';
import SunButtonLike from '../button/SunButtonLike.vue';
import SunButton from '../button/SunButton.vue';
import SunButtonItem from '../item/SunButtonItem.vue';
import { ChevronDown, ChevronRight } from 'lucide-vue-next';
import type { Size } from '../SunDesignConstants';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        label?: string,
        unfoldStyle?: string,
        initialFold?: boolean,
        hoverShowAppend?: boolean,
    }>(),
    {
        size: 'normal',
        label: '',
        initialFold: false,
        hoverShowAppend: false,
    }
);

// emits
const emits = defineEmits<{
    (event: 'open'): void;
    (event: 'close'): void;
    (event: 'toggle', folded: boolean): void;
}>();

// datas
const folded = ref(props.initialFold);
watch(folded, folded => {
    if (folded) emits('close');
    else emits('open');
    emits('toggle', folded);
}, { flush: 'post' });

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-panel-fold-container__
    display: flex
    flex-direction: column
    overflow: hidden
    flex-wrap: nowrap
    min-height: size-normal

.__sun-design-panel-fold-container-button__
    width: 100%
    justify-content: flex-start !important
    border-radius: 0px !important
    padding-top: 0px !important
    padding-bottom: 0px !important
    padding-left : 0px !important
    padding-right : 0px !important

    &.append.unfolded
        padding-right : padding-extend-normal !important
    
    &.append.hover-show:not(.unfolded):hover,
    &.append.hover-show:not(.unfolded):focus-within
        padding-right : padding-extend-normal !important

    &:has(> .__sun-design-panel-fold-container-fold-button__:hover)
        background-color: var(--color-normal) !important

.__sun-design-panel-fold-container-content-container__
    width: 100%
    flex: 1;
    overflow: hidden

    // &.unfolded
    //     border-top: solid-border

.__sun-design-panel-fold-container-append__
    gap: panel-padding
    flex-direction: row
    flex-wrap: nowrap
    display: flex
    &.hover-show
        display: none

    .__sun-design-panel-fold-container-button__:hover > &.hover-show,
    .__sun-design-panel-fold-container-button__:focus-within > &.hover-show
        display: flex

</style>