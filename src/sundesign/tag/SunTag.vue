<template>
    <SunButtonLike class="__sun-design__ __sun-design-tag__" :class="{ 'show-button': showButton }" no-hover-color
        no-pressed-color :squared="squared" :disabled="disabled">
        <slot name="default">
        </slot>
        <SunButton v-if="showButton" class="__sun-design__ __sun-design-tag-button__" flat squared size="small"
            :disabled="disabled" @click="emits('buttonClick')">
            <slot name="button">
                <X />
            </slot>
        </SunButton>
    </SunButtonLike>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunButton from '../button/SunButton.vue';
import SunButtonLike from '../button/SunButtonLike.vue';
import { X } from 'lucide-vue-next';

// props
const props = withDefaults(
    defineProps<{
        showButton?: boolean,
        squared?: boolean,
        disabled?: boolean,
    }>(),
    {
        showButton: true,
        squared: false,
        disabled: false,
    }
);

// emits
const emits = defineEmits<{
    (event: 'buttonClick'): void;
}>();

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-tag-button__
    overflow: hidden
    display: inline-flex
    flex-wrap: nowrap
    justify-content: center
    align-items: center
    text-wrap: nowrap
    border-radius: 50% !important
    padding: 0 !important
    margin-left: auto

.__sun-design-tag__
    border-radius: (size-normal / 2) !important
    &.show-button
        padding-right: padding-normal !important
    padding-top: 0 !important
    padding-bottom: 0 !important

</style>