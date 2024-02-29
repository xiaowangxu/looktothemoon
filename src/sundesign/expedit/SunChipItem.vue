<template>
    <div class="__sun-design-chip-item-container__">
        <SunIcon v-if="icon !== undefined" :name="icon" class="__sun-design-chip-item-icon__"></SunIcon>
        <span v-if="label !== undefined">{{ label }}</span>
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunIcon from '../icon/SunIcon.vue';

// props
const props = withDefaults(
    defineProps<{
        label?: string,
        icon?: string,
    }>(),
    {
    }
);


</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-chip-item-icon__
    width: 16px
    height: 16px
    align-self: center

.__sun-design-chip-item-container__
    white-space: no-wrap
    vertical-align: baseline
    display: inline-flex
    background-color: var(--border-color-normal)
    border-radius: 4px
    padding: 0px 3px
    margin: 0px 2px
    gap: 2px
    align-items: baseline

    :disabled &, .disabled &
        background-color: var(--border-color-disabled)

</style>