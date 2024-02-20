<template>
    <div class="__sun-design-panel-fold-container__" :style="!folded ? unfoldStyle : undefined">
        <SunButtonLike class="__sun-design-panel-fold-container-button__" :class="{ append: $slots.append !== undefined }"
            no-hover-color no-pressed-color flat>
            <SunButton flat class="__sun-design-panel-fold-container-fold-button__ no-hover-color no-pressed-color"
                style="flex: 1;" @click="folded = !folded">
                <ChevronRight v-if="folded" />
                <ChevronDown v-else />
                <slot name="item">
                    <SunButtonItem :label="label" />
                </slot>
            </SunButton>
            <div v-show="!folded" v-if="$slots.append !== undefined" class="__sun-design-panel-fold-container-append__">
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
import { ChevronDown, ChevronRight, FolderMinus } from 'lucide-vue-next';

// props
const props = withDefaults(
    defineProps<{
        label?: string,
        unfoldStyle?: string,
    }>(),
    {
        label: '',
    }
);

// emits
const emits = defineEmits<{
    (event: 'open'): void;
    (event: 'close'): void;
    (event: 'toggle', folded: boolean): void;
}>();

// datas
const folded = ref(false);
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
    // padding-right : 0px !important

    &.append
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

    // .__sun-design-panel-fold-container-button__:hover > &
    //     display: flex

</style>