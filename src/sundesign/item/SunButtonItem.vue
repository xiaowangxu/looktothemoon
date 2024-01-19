<template>
    <SunIcon v-if="item?.icon !== undefined" :name="item?.icon"></SunIcon>
    <span class="__sun-design-button-item-label__" :class="{ 'has-description': has_description }">{{ item?.label }}</span>
    <span v-if="has_description" class="__sun-design-button-item-description__"> {{
        item?.description }} </span>
    <SunKeyboard v-if="!hideShortcut && item?.shortcut !== undefined">{{ item?.shortcut }}</SunKeyboard>
    <ChevronRight v-if="!hideSub && item?.sub === true" />
</template>

<script setup lang="ts">

import { type Item } from '../SunDesignConstants';
import SunIcon from '../icon/SunIcon.vue';
import SunKeyboard from '../keyboard/SunKeyboard.vue';
import { computed } from 'vue';
import { ChevronRight } from 'lucide-vue-next';

// props
const props = withDefaults(
    defineProps<{
        item: Item,
        hideDescription?: boolean,
        hideShortcut?: boolean,
        hideSub?: boolean,
    }>(),
    {
        hideDescription: false,
        hideShortcut: false,
        hideSub: false,
    }
);

// datas
const has_description = computed(() => !props.hideDescription && props.item?.description !== undefined);

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
    color: var(--color-active-disabled)
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis
    flex-shrink: 0
    flex-grow: 1
    flex-basis: 0px
    min-width: 0px

</style>