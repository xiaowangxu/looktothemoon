<template>
    <SunIcon v-if="icon !== undefined" :name="icon"></SunIcon>
    <span v-if="alwaysShowLabel || label !== undefined" class="__sun-design-button-item-label__"
        :class="{ 'has-description': has_description }">{{ label }}</span>
    <span v-if="has_description" class="__sun-design-button-item-description__"> {{
        description }} </span>
    <SunKeyboard v-if="!hideShortcut && shortcut !== undefined" :label="shortcut"></SunKeyboard>
    <svg v-if="!hideSub && sub === true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-4 0 20 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon">
        <path d="m9 18 6-6-6-6"></path>
    </svg>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunIcon from '../icon/SunIcon.vue';
import SunKeyboard from '../keyboard/SunKeyboard.vue';
import { computed } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        label?: string,
        icon?: string,
        description?: string,
        shortcut?: string,
        sub?: boolean,
        alwaysShowLabel?: boolean,
        hideDescription?: boolean,
        hideShortcut?: boolean,
        hideSub?: boolean,
    }>(),
    {
        alwaysShowLabel: false,
        hideDescription: false,
        hideShortcut: false,
        hideSub: false,
    }
);

// datas
const has_description = computed(() => !props.hideDescription && props.description !== undefined);

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-button-item-label__
    text-align: start
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis
    flex-grow: 1
    flex-shrink: 1

    &.has-description
        flex-shrink: 1
        flex-grow: 0

.__sun-design-button-item-description__
    text-align: end
    opacity: major-opacity
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis
    flex-shrink: 0
    flex-grow: 1
    flex-basis: 0px
    min-width: 0px

    :disabled &, .disabled &
        opacity: major-opacity-disabled

</style>