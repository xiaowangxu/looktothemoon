<template>
    <SunIcon v-if="icon !== undefined" class="__sun-design-notification-item-icon__" :name="icon"></SunIcon>
    <div v-if="has_label || has_shortcut || has_description" class="__sun-design-notification-item-vcontainer__">
        <div v-if="has_label || has_shortcut" class="__sun-design-notification-item-hcontainer__">
            <span v-if="has_label" class="__sun-design-notification-item-label__">{{ label }}</span>
            <SunKeyboard v-if="has_shortcut" class="__sun-design-notification-item-shortcut__" :label="shortcut" />
        </div>
        <div v-if="has_description" class="__sun-design-notification-item-hcontainer__">
            <span class="__sun-design-notification-item-description__"> {{ description }} </span>
        </div>
    </div>
    <svg v-if="!hideSub && sub === true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-4 0 20 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="lucide lucide-chevron-right-icon">
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
const has_label = computed(() => props.alwaysShowLabel || props.label !== undefined);
const has_description = computed(() => !props.hideDescription && props.description !== undefined);
const has_shortcut = computed(() => !props.hideShortcut && props.shortcut !== undefined);

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-notification-item-icon__
    align-self: flex-start

.__sun-design-notification-item-vcontainer__
    display: flex
    flex-direction: column
    gap: inherit
    flex-wrap: nowrap
    flex: 1
    overflow: hidden

.__sun-design-notification-item-hcontainer__
    display: flex
    flex-direction: row
    gap: inherit
    flex-wrap: nowrap
    justify-content: space-between
    align-items: center

.__sun-design-notification-item-label__
    text-align: start
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis
    flex-basis: min-content

.__sun-design-notification-item-shortcut__
    flex-basis: 0
    flex-grow: 1
    text-align: end

.__sun-design-notification-item-description__
    text-align: start
    opacity: major-opacity
    overflow: hidden
    white-space: normal
    text-overflow: ellipsis
    min-width: 0px
    flex: 1

    :disabled &, .disabled &
        opacity: major-opacity-disabled

</style>